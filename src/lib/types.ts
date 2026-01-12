/**
 * Core TypeScript types for the Smart Task Assistant
 * 
 * These types define the shape of our task data and agent interactions.
 * We keep them separate from components for better maintainability and
 * to make it easier to share across client and server code.
 */

// ============================================================================
// Task Types
// ============================================================================

/**
 * Priority levels for tasks
 * We use a union type instead of enum for better tree-shaking and JSON compatibility
 */
export type Priority = 'low' | 'medium' | 'high';

/**
 * A task in our system
 * 
 * Note: We use `string` for dates instead of `Date` objects because:
 * 1. JSON serialization works out of the box
 * 2. Easier to pass between client and server
 * 3. A2UI messages expect string values
 */
export interface Task {
    /** Unique identifier - we use UUIDs for simplicity */
    id: string;

    /** What the task is about */
    title: string;

    /** Urgency level */
    priority: Priority;

    /** Optional grouping - e.g., "work", "personal", "shopping" */
    category: string;

    /** Is this task done? */
    completed: boolean;

    /** When the task was created (ISO 8601 string) */
    createdAt: string;

    /** When the task was completed, if applicable */
    completedAt?: string;
}

/**
 * Current state of the task list
 * This is what we pass to the agent and what it returns after modifications
 */
export interface TaskState {
    /** All tasks in the system */
    tasks: Task[];

    /** 
     * Active filter, if any
     * Examples: "priority:high", "completed:true", "category:work"
     */
    filter?: string;

    /** Human-readable message from the agent */
    agentMessage?: string;
}

// ============================================================================
// Agent Types
// ============================================================================

/**
 * Possible intents the agent can detect from user input
 */
export type AgentIntent =
    | 'add_task'
    | 'complete_task'
    | 'delete_task'
    | 'filter_tasks'
    | 'clear_filter'
    | 'list_tasks'
    | 'unknown';

/**
 * Tool call structure that Claude will use
 */
export interface ToolCall {
    name: AgentIntent;
    input: Record<string, unknown>;
}

/**
 * Parameters for the add_task tool
 */
export interface AddTaskParams {
    title: string;
    priority?: Priority;
    category?: string;
}

/**
 * Parameters for completing/deleting a task
 */
export interface TaskActionParams {
    /** Can be task ID or task index (1-based for natural language) */
    taskIdentifier: string;
}

/**
 * Parameters for filtering tasks
 */
export interface FilterParams {
    /** What to filter by: "priority", "category", "completed", "all" */
    filterType: 'priority' | 'category' | 'completed' | 'all';

    /** Value to filter for */
    filterValue?: string;
}

// ============================================================================
// API Types
// ============================================================================

/**
 * Request body for the agent API endpoint
 */
export interface AgentRequest {
    /** Natural language input from the user */
    message: string;

    /** Current task state */
    currentState: TaskState;
}

/**
 * Response from the agent API endpoint
 */
export interface AgentResponse {
    /** Was the request successful? */
    success: boolean;

    /** Updated task state */
    state: TaskState;

    /** Optional error message */
    error?: string;
}

// ============================================================================
// A2UI Message Types
// ============================================================================

/**
 * A2UI component update for rendering tasks
 * These match the a2ui-react component types
 */
export interface A2UIComponentUpdate {
    id: string;
    component: {
        type: string;
        [key: string]: unknown;
    };
}

/**
 * Surface update message in A2UI format
 */
export interface A2UISurfaceUpdate {
    surfaceUpdate: {
        surfaceId: string;
        updates: A2UIComponentUpdate[];
    };
}

/**
 * Begin rendering signal in A2UI format
 */
export interface A2UIBeginRendering {
    beginRendering: {
        surfaceId: string;
        root: string;
    };
}

export type A2UIMessage = A2UISurfaceUpdate | A2UIBeginRendering;

// ============================================================================
// Utility Types
// ============================================================================

/**
 * Stats about the current task list
 * Computed on the fly for display purposes
 */
export interface TaskStats {
    total: number;
    active: number;
    completed: number;
    highPriority: number;
}

/**
 * Example command that we show to users
 */
export interface ExampleCommand {
    command: string;
    description: string;
}
