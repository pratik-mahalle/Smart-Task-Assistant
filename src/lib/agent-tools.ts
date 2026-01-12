/**
 * Agent tools definition
 * 
 * This file defines the tools that Claude can use to interact with tasks.
 * Each tool follows the Anthropic tool format and includes:
 * - A clear name and description
 * - Input schema with required/optional parameters
 * 
 * Best Practice: Keep tools focused and single-purpose.
 * Instead of a generic "manage_task" tool, we have specific tools
 * for each action. This makes it easier for the LLM to choose correctly.
 */

import Anthropic from '@anthropic-ai/sdk';

/**
 * Tool definitions for the task management agent
 * 
 * These are passed to Claude when making API calls. Claude will choose
 * which tool(s) to call based on the user's input.
 */
export const TASK_TOOLS: Anthropic.Tool[] = [
    {
        name: 'add_task',
        description: `Add a new task to the task list. Extract the task title, priority level, and category from the user's input. Default priority is "medium" if not specified. If the user wants to add multiple tasks, call this tool multiple times.`,
        input_schema: {
            type: 'object',
            properties: {
                title: {
                    type: 'string',
                    description: 'The task title or description',
                },
                priority: {
                    type: 'string',
                    enum: ['low', 'medium', 'high'],
                    description: 'Priority level. Default to "medium" if not clear from context.',
                },
                category: {
                    type: 'string',
                    description: 'Optional category like "work", "personal", "shopping". Infer from context if possible, otherwise leave empty.',
                },
            },
            required: ['title'],
        },
    },
    {
        name: 'complete_task',
        description: 'Mark a task as complete. Identify the task by its number (1-based index) or by matching part of the title. If the user says "mark task 2 as done" or "complete the groceries task", find the matching task.',
        input_schema: {
            type: 'object',
            properties: {
                taskIdentifier: {
                    type: 'string',
                    description: 'Task number (1-based, like "2" for the second task) or part of the task title to match',
                },
            },
            required: ['taskIdentifier'],
        },
    },
    {
        name: 'uncomplete_task',
        description: 'Mark a completed task as active again. Identify the task by its number or title.',
        input_schema: {
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
    {
        name: 'delete_task',
        description: 'Delete a task from the list. Identify the task by its number or by matching part of the title. Use phrases like "the last task" to mean the most recently added one.',
        input_schema: {
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
    {
        name: 'filter_tasks',
        description: 'Filter the task list to show only certain tasks. Supports filtering by priority (high, medium, low), completion status, category, or showing all tasks.',
        input_schema: {
            type: 'object',
            properties: {
                filterType: {
                    type: 'string',
                    enum: ['priority', 'completed', 'active', 'category', 'all'],
                    description: 'What to filter by',
                },
                filterValue: {
                    type: 'string',
                    description: 'Value to filter for. For priority: "high"/"medium"/"low". For completed/active: not needed. For category: the category name.',
                },
            },
            required: ['filterType'],
        },
    },
];

/**
 * System prompt for the agent
 * 
 * This is crucial for getting good behavior from Claude. Notice:
 * - Clear role definition
 * - Specific instructions on how to handle different scenarios
 * - Tone guidance (conversational but concise)
 */
export const AGENT_SYSTEM_PROMPT = `You are a friendly task management assistant that helps users organize their work through natural language.

Your job is to understand what the user wants to do and use the appropriate tools to help them.

## Guidelines

1. **Be action-oriented**: When the user asks to add a task, add it. Don't ask for confirmation unless something is genuinely ambiguous.

2. **Infer intelligently**: 
   - "urgent" or "ASAP" → high priority
   - "when you get a chance" or "eventually" → low priority
   - Keywords like "work", "code", "meeting" → category: work
   - Keywords like "groceries", "laundry", "doctor" → category: personal

3. **Handle references naturally**:
   - "task 2" → second task in the list
   - "the groceries one" → find task containing "groceries"
   - "last task" → most recently added task
   - "all high priority tasks" → filter to priority:high

4. **Multiple items**: If the user says "add 3 tasks: A, B, and C", call add_task three times.

5. **Filter understanding**:
   - "what's urgent?" → filter to high priority
   - "show completed" → filter to completed
   - "show everything" → clear all filters
   - "what do I need to do?" → filter to active (incomplete) tasks

6. **Be conversational in your response but concise**. After taking action, briefly confirm what you did. Don't over-explain.

7. **If the request is unclear**, ask a clarifying question rather than guessing wrong.

## Current Task Context

The user's current tasks will be provided. Reference them when needed to resolve "task 2" or title matches.`;
