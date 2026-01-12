/**
 * Agent API Route
 * 
 * This is where the magic happens! This endpoint:
 * 1. Receives natural language input from the user
 * 2. Sends it to an LLM (Anthropic Claude OR OpenAI) with our task management tools
 * 3. Processes the LLM's tool calls to modify task state
 * 4. Returns the updated state with a response message
 * 
 * Architecture note: We use the LLM as a "reasoning engine" rather than
 * generating the UI directly. The LLM decides WHAT to do, and our code
 * actually does it. This is more predictable and easier to debug.
 * 
 * API Flexibility: Supports both Anthropic and OpenAI APIs.
 * - If ANTHROPIC_API_KEY is set, uses Claude
 * - If only OPENAI_API_KEY is set, uses OpenAI as fallback
 */

import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import OpenAI from 'openai';
import { TASK_TOOLS, AGENT_SYSTEM_PROMPT } from '@/lib/agent-tools';
import {
    createTask,
    addTask,
    completeTask,
    uncompleteTask,
    deleteTask,
    findTaskByIdentifier,
    createFilter,
} from '@/lib/task-utils';
import type { TaskState, AddTaskParams, TaskActionParams, FilterParams, Priority } from '@/lib/types';

// ============================================================================
// API Client Initialization
// ============================================================================

type APIProvider = 'anthropic' | 'openai';

let anthropicClient: Anthropic | null = null;
let openaiClient: OpenAI | null = null;

/**
 * Determines which API to use based on available keys.
 * Validates key format to avoid using placeholder/invalid keys.
 */
function getAPIProvider(): { provider: APIProvider; client: Anthropic | OpenAI } {
    const anthropicKey = process.env.ANTHROPIC_API_KEY?.trim();
    const openaiKey = process.env.OPENAI_API_KEY?.trim();

    // Validate Anthropic key format (should start with sk-ant)
    const isValidAnthropicKey = anthropicKey &&
        anthropicKey.startsWith('sk-ant') &&
        anthropicKey.length > 20;

    // Validate OpenAI key format (should start with sk-)
    const isValidOpenAIKey = openaiKey &&
        openaiKey.startsWith('sk-') &&
        openaiKey.length > 20;

    // Check for Anthropic first (preferred for A2UI demo)
    if (isValidAnthropicKey) {
        if (!anthropicClient) {
            anthropicClient = new Anthropic({ apiKey: anthropicKey });
        }
        return { provider: 'anthropic', client: anthropicClient };
    }

    // Fall back to OpenAI
    if (isValidOpenAIKey) {
        if (!openaiClient) {
            openaiClient = new OpenAI({ apiKey: openaiKey });
        }
        return { provider: 'openai', client: openaiClient };
    }

    // Provide helpful error message
    let errorMsg = 'No valid API key configured. ';
    if (anthropicKey && !isValidAnthropicKey) {
        errorMsg += 'Anthropic key should start with "sk-ant". ';
    }
    if (openaiKey && !isValidOpenAIKey) {
        errorMsg += 'OpenAI key should start with "sk-". ';
    }
    errorMsg += 'Please update your .env.local file.';

    throw new Error(errorMsg);
}

/**
 * OpenAI-compatible tool definitions
 * These match the Anthropic tools but in OpenAI's format
 */
const OPENAI_TOOLS: OpenAI.Chat.Completions.ChatCompletionTool[] = [
    {
        type: 'function',
        function: {
            name: 'add_task',
            description: 'Add a new task to the task list. Extract the task title, priority level, and category from the user\'s input. Default priority is "medium" if not specified.',
            parameters: {
                type: 'object',
                properties: {
                    title: {
                        type: 'string',
                        description: 'The task title or description',
                    },
                    priority: {
                        type: 'string',
                        enum: ['low', 'medium', 'high'],
                        description: 'Priority level. Default to "medium" if not clear.',
                    },
                    category: {
                        type: 'string',
                        description: 'Optional category like "work", "personal", "shopping".',
                    },
                },
                required: ['title'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'complete_task',
            description: 'Mark a task as complete. Identify the task by its number (1-based index) or by matching part of the title.',
            parameters: {
                type: 'object',
                properties: {
                    taskIdentifier: {
                        type: 'string',
                        description: 'Task number (1-based) or part of the task title to match',
                    },
                },
                required: ['taskIdentifier'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'uncomplete_task',
            description: 'Mark a completed task as active again. Identify the task by its number or title.',
            parameters: {
                type: 'object',
                properties: {
                    taskIdentifier: {
                        type: 'string',
                        description: 'Task number (1-based) or part of the task title to match',
                    },
                },
                required: ['taskIdentifier'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'delete_task',
            description: 'Delete a task from the list. Identify the task by its number or by matching part of the title. Use "last" for the most recently added task.',
            parameters: {
                type: 'object',
                properties: {
                    taskIdentifier: {
                        type: 'string',
                        description: 'Task number (1-based), "last" for most recent, or part of the task title',
                    },
                },
                required: ['taskIdentifier'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'filter_tasks',
            description: 'Filter the task list to show only certain tasks. Supports filtering by priority, completion status, category, or showing all.',
            parameters: {
                type: 'object',
                properties: {
                    filterType: {
                        type: 'string',
                        enum: ['priority', 'completed', 'active', 'category', 'all'],
                        description: 'What to filter by',
                    },
                    filterValue: {
                        type: 'string',
                        description: 'Value to filter for. For priority: "high"/"medium"/"low". For category: the category name.',
                    },
                },
                required: ['filterType'],
            },
        },
    },
];

// ============================================================================
// API Route Handler
// ============================================================================

/**
 * POST /api/agent
 * 
 * Request body:
 * {
 *   message: string,      // User's natural language input
 *   currentState: TaskState  // Current task state
 * }
 * 
 * Response:
 * {
 *   success: boolean,
 *   state: TaskState,
 *   error?: string
 * }
 */
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { message, currentState } = body as {
            message: string;
            currentState: TaskState;
        };

        // Validate input
        if (!message || typeof message !== 'string') {
            return NextResponse.json(
                { success: false, state: currentState, error: 'Message is required' },
                { status: 400 }
            );
        }

        // Get API client
        let apiProvider: APIProvider;
        let client: Anthropic | OpenAI;

        try {
            const result = getAPIProvider();
            apiProvider = result.provider;
            client = result.client;
            console.log(`[Agent] Using ${apiProvider} API`);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'API configuration error';
            return NextResponse.json(
                { success: false, state: currentState, error: errorMessage },
                { status: 500 }
            );
        }

        // Build context about current tasks
        const taskContext = buildTaskContext(currentState);
        console.log('[Agent] User message:', message);

        // Call the appropriate API
        let updatedState: TaskState;

        if (apiProvider === 'anthropic') {
            updatedState = await callAnthropicAPI(client as Anthropic, message, taskContext, currentState);
        } else {
            updatedState = await callOpenAIAPI(client as OpenAI, message, taskContext, currentState);
        }

        return NextResponse.json({
            success: true,
            state: updatedState,
        });

    } catch (error) {
        console.error('[Agent] Error:', error);

        // Handle specific API errors
        if (error instanceof Anthropic.APIError) {
            if (error.status === 401) {
                return NextResponse.json(
                    { success: false, state: null, error: 'Invalid Anthropic API key. Please check your .env.local' },
                    { status: 401 }
                );
            }
            if (error.status === 429) {
                return NextResponse.json(
                    { success: false, state: null, error: 'Rate limit exceeded. Please try again in a moment.' },
                    { status: 429 }
                );
            }
        }

        const errorMessage = error instanceof Error ? error.message : 'Something went wrong';
        return NextResponse.json(
            { success: false, state: null, error: errorMessage },
            { status: 500 }
        );
    }
}

// ============================================================================
// Anthropic API Handler
// ============================================================================

async function callAnthropicAPI(
    client: Anthropic,
    message: string,
    taskContext: string,
    currentState: TaskState
): Promise<TaskState> {
    const response = await client.messages.create({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 1024,
        system: AGENT_SYSTEM_PROMPT,
        tools: TASK_TOOLS,
        messages: [
            {
                role: 'user',
                content: `${taskContext}\n\nUser request: ${message}`,
            },
        ],
    });

    console.log('[Agent] Anthropic response:', JSON.stringify(response.content, null, 2));

    // Process response
    let updatedState = { ...currentState };
    const actionsTaken: string[] = [];
    let agentTextResponse = '';

    for (const block of response.content) {
        if (block.type === 'text') {
            agentTextResponse = block.text;
        } else if (block.type === 'tool_use') {
            const result = processToolCall(
                block.name,
                block.input as Record<string, unknown>,
                updatedState
            );
            updatedState = result.state;
            if (result.action) {
                actionsTaken.push(result.action);
            }
        }
    }

    if (!agentTextResponse && actionsTaken.length > 0) {
        agentTextResponse = actionsTaken.join('. ') + '.';
    }

    return {
        ...updatedState,
        agentMessage: agentTextResponse || 'Done!',
    };
}

// ============================================================================
// OpenAI API Handler
// ============================================================================

async function callOpenAIAPI(
    client: OpenAI,
    message: string,
    taskContext: string,
    currentState: TaskState
): Promise<TaskState> {
    const response = await client.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
            {
                role: 'system',
                content: AGENT_SYSTEM_PROMPT,
            },
            {
                role: 'user',
                content: `${taskContext}\n\nUser request: ${message}`,
            },
        ],
        tools: OPENAI_TOOLS,
        tool_choice: 'auto',
    });

    console.log('[Agent] OpenAI response:', JSON.stringify(response.choices[0], null, 2));

    // Process response
    let updatedState = { ...currentState };
    const actionsTaken: string[] = [];
    let agentTextResponse = '';

    const choice = response.choices[0];

    // Check for text response
    if (choice.message.content) {
        agentTextResponse = choice.message.content;
    }

    // Check for tool calls
    if (choice.message.tool_calls) {
        for (const toolCall of choice.message.tool_calls) {
            if (toolCall.type === 'function') {
                const args = JSON.parse(toolCall.function.arguments);
                const toolResult = processToolCall(
                    toolCall.function.name,
                    args,
                    updatedState
                );
                updatedState = toolResult.state;
                if (toolResult.action) {
                    actionsTaken.push(toolResult.action);
                }
            }
        }
    }

    if (!agentTextResponse && actionsTaken.length > 0) {
        agentTextResponse = actionsTaken.join('. ') + '.';
    }

    return {
        ...updatedState,
        agentMessage: agentTextResponse || 'Done!',
    };
}

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Builds context about current tasks for the LLM
 * This helps the LLM understand "task 2" or "the last task"
 */
function buildTaskContext(state: TaskState): string {
    if (state.tasks.length === 0) {
        return 'Current tasks: None (empty list)';
    }

    const taskList = state.tasks.map((task, index) => {
        const status = task.completed ? '✓' : '○';
        const priority = task.priority.toUpperCase()[0]; // H, M, L
        const category = task.category ? ` [${task.category}]` : '';
        return `${index + 1}. ${status} ${task.title} (${priority})${category}`;
    }).join('\n');

    let context = `Current tasks (${state.tasks.length} total):\n${taskList}`;

    if (state.filter) {
        context += `\n\nActive filter: ${state.filter}`;
    }

    return context;
}

/**
 * Processes a tool call from the LLM and returns updated state
 * 
 * This is the "executor" that actually modifies task state.
 * The LLM decides what to do, this function does it.
 */
function processToolCall(
    toolName: string,
    input: Record<string, unknown>,
    state: TaskState
): { state: TaskState; action: string | null } {
    console.log(`[Agent] Processing tool: ${toolName}`, input);

    switch (toolName) {
        case 'add_task': {
            const params = input as unknown as AddTaskParams;
            const task = createTask(
                params.title,
                (params.priority as Priority) || 'medium',
                params.category || ''
            );
            const newState = addTask(state, task);
            return {
                state: newState,
                action: `Added "${task.title}"`,
            };
        }

        case 'complete_task': {
            const params = input as unknown as TaskActionParams;
            const task = findTaskByIdentifier(state.tasks, params.taskIdentifier);

            if (!task) {
                return {
                    state: {
                        ...state,
                        agentMessage: `Couldn't find a task matching "${params.taskIdentifier}"`,
                    },
                    action: null,
                };
            }

            if (task.completed) {
                return {
                    state: {
                        ...state,
                        agentMessage: `"${task.title}" is already complete`,
                    },
                    action: null,
                };
            }

            return {
                state: completeTask(state, task.id),
                action: `Completed "${task.title}"`,
            };
        }

        case 'uncomplete_task': {
            const params = input as unknown as TaskActionParams;
            const task = findTaskByIdentifier(state.tasks, params.taskIdentifier);

            if (!task) {
                return {
                    state: {
                        ...state,
                        agentMessage: `Couldn't find a task matching "${params.taskIdentifier}"`,
                    },
                    action: null,
                };
            }

            if (!task.completed) {
                return {
                    state: {
                        ...state,
                        agentMessage: `"${task.title}" is already active`,
                    },
                    action: null,
                };
            }

            return {
                state: uncompleteTask(state, task.id),
                action: `Marked "${task.title}" as active`,
            };
        }

        case 'delete_task': {
            const params = input as unknown as TaskActionParams;
            const task = findTaskByIdentifier(state.tasks, params.taskIdentifier);

            if (!task) {
                return {
                    state: {
                        ...state,
                        agentMessage: `Couldn't find a task matching "${params.taskIdentifier}"`,
                    },
                    action: null,
                };
            }

            return {
                state: deleteTask(state, task.id),
                action: `Deleted "${task.title}"`,
            };
        }

        case 'filter_tasks': {
            const params = input as unknown as FilterParams;
            const filter = createFilter(params.filterType, params.filterValue);

            return {
                state: { ...state, filter },
                action: filter ? `Filtering by ${params.filterType}` : 'Showing all tasks',
            };
        }

        default:
            console.warn(`[Agent] Unknown tool: ${toolName}`);
            return { state, action: null };
    }
}
