/**
 * Utility functions for task management
 * 
 * These pure functions handle task state manipulation.
 * Why pure functions? They're easier to test, debug, and reason about.
 * Plus, they work seamlessly with React's immutable state patterns.
 */

import { v4 as uuidv4 } from 'uuid';
import type { Task, TaskState, TaskStats, Priority } from './types';

// ============================================================================
// Task Creation & Modification
// ============================================================================

/**
 * Creates a new task with defaults
 * 
 * @example
 * const task = createTask('Buy groceries', 'high', 'personal');
 */
export function createTask(
    title: string,
    priority: Priority = 'medium',
    category: string = ''
): Task {
    return {
        id: uuidv4(),
        title: title.trim(),
        priority,
        category: category.trim(),
        completed: false,
        createdAt: new Date().toISOString(),
    };
}

/**
 * Adds a task to the state
 * Returns a new state object (immutable update)
 */
export function addTask(state: TaskState, task: Task): TaskState {
    return {
        ...state,
        tasks: [...state.tasks, task],
    };
}

/**
 * Marks a task as complete
 * @param taskId - The ID of the task to complete
 */
export function completeTask(state: TaskState, taskId: string): TaskState {
    return {
        ...state,
        tasks: state.tasks.map((task) =>
            task.id === taskId
                ? { ...task, completed: true, completedAt: new Date().toISOString() }
                : task
        ),
    };
}

/**
 * Marks a task as incomplete (undoes completion)
 */
export function uncompleteTask(state: TaskState, taskId: string): TaskState {
    return {
        ...state,
        tasks: state.tasks.map((task) =>
            task.id === taskId
                ? { ...task, completed: false, completedAt: undefined }
                : task
        ),
    };
}

/**
 * Removes a task from the state
 */
export function deleteTask(state: TaskState, taskId: string): TaskState {
    return {
        ...state,
        tasks: state.tasks.filter((task) => task.id !== taskId),
    };
}

// ============================================================================
// Task Lookup
// ============================================================================

/**
 * Finds a task by identifier
 * The identifier can be:
 * - A 1-based index (e.g., "2" for the second task)
 * - "last" for the most recently added task
 * - A partial title match (case-insensitive)
 * 
 * This is the magic that lets users say "mark task 2 as done" or
 * "delete the groceries task" naturally.
 */
export function findTaskByIdentifier(
    tasks: Task[],
    identifier: string
): Task | undefined {
    const normalized = identifier.toLowerCase().trim();

    // Try as 1-based index first
    const index = parseInt(normalized, 10);
    if (!isNaN(index) && index >= 1 && index <= tasks.length) {
        return tasks[index - 1];
    }

    // "last" refers to the most recently added
    if (normalized === 'last' || normalized === 'last task') {
        return tasks.length > 0 ? tasks[tasks.length - 1] : undefined;
    }

    // "first" refers to the first task
    if (normalized === 'first' || normalized === 'first task') {
        return tasks.length > 0 ? tasks[0] : undefined;
    }

    // Try partial title match (case-insensitive)
    return tasks.find((task) =>
        task.title.toLowerCase().includes(normalized)
    );
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Applies a filter to tasks
 * 
 * Filter format examples:
 * - "priority:high" → show only high priority
 * - "completed:true" → show only completed
 * - "category:work" → show only work category
 * - undefined or "all" → show everything
 */
export function filterTasks(tasks: Task[], filter?: string): Task[] {
    if (!filter || filter === 'all') {
        return tasks;
    }

    // Parse filter string
    const [filterType, filterValue] = filter.split(':');

    switch (filterType.toLowerCase()) {
        case 'priority':
            return tasks.filter((task) => task.priority === filterValue);

        case 'completed':
            const showCompleted = filterValue === 'true';
            return tasks.filter((task) => task.completed === showCompleted);

        case 'active':
            return tasks.filter((task) => !task.completed);

        case 'category':
            return tasks.filter((task) =>
                task.category.toLowerCase() === filterValue?.toLowerCase()
            );

        default:
            return tasks;
    }
}

/**
 * Creates a filter string from parameters
 */
export function createFilter(
    filterType: string,
    filterValue?: string
): string | undefined {
    if (filterType === 'all') {
        return undefined;
    }

    if (filterType === 'active') {
        return 'completed:false';
    }

    if (filterType === 'completed') {
        return 'completed:true';
    }

    if (filterType === 'priority' && filterValue) {
        return `priority:${filterValue.toLowerCase()}`;
    }

    if (filterType === 'category' && filterValue) {
        return `category:${filterValue.toLowerCase()}`;
    }

    return undefined;
}

// ============================================================================
// Statistics
// ============================================================================

/**
 * Calculates stats about the task list
 * Used for the dashboard display
 */
export function calculateStats(tasks: Task[]): TaskStats {
    return {
        total: tasks.length,
        active: tasks.filter((t) => !t.completed).length,
        completed: tasks.filter((t) => t.completed).length,
        highPriority: tasks.filter((t) => t.priority === 'high' && !t.completed).length,
    };
}

// ============================================================================
// Initial State
// ============================================================================

/**
 * Creates an empty initial state
 */
export function createInitialState(): TaskState {
    return {
        tasks: [],
        filter: undefined,
        agentMessage: undefined,
    };
}

/**
 * Creates a demo state with sample tasks
 * Useful for testing and showing users what the app can do
 */
export function createDemoState(): TaskState {
    const now = new Date();

    return {
        tasks: [
            {
                id: uuidv4(),
                title: 'Review pull request',
                priority: 'high',
                category: 'work',
                completed: false,
                createdAt: new Date(now.getTime() - 3600000).toISOString(), // 1 hour ago
            },
            {
                id: uuidv4(),
                title: 'Buy groceries',
                priority: 'medium',
                category: 'personal',
                completed: false,
                createdAt: new Date(now.getTime() - 7200000).toISOString(), // 2 hours ago
            },
            {
                id: uuidv4(),
                title: 'Schedule dentist appointment',
                priority: 'low',
                category: 'personal',
                completed: true,
                createdAt: new Date(now.getTime() - 86400000).toISOString(), // 1 day ago
                completedAt: new Date(now.getTime() - 43200000).toISOString(), // 12 hours ago
            },
        ],
        filter: undefined,
        agentMessage: 'Welcome! Try saying "add a task" or "what\'s urgent?"',
    };
}

// ============================================================================
// Display Helpers
// ============================================================================

/**
 * Gets a human-readable description of the current filter
 */
export function getFilterDescription(filter?: string): string {
    if (!filter) return 'All Tasks';

    const [filterType, filterValue] = filter.split(':');

    switch (filterType) {
        case 'priority':
            return `${filterValue?.charAt(0).toUpperCase()}${filterValue?.slice(1)} Priority`;
        case 'completed':
            return filterValue === 'true' ? 'Completed Tasks' : 'Active Tasks';
        case 'category':
            return `Category: ${filterValue?.charAt(0).toUpperCase()}${filterValue?.slice(1)}`;
        default:
            return 'All Tasks';
    }
}

/**
 * Formats a relative time string
 * e.g., "2 hours ago", "yesterday"
 */
export function formatRelativeTime(isoString: string): string {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays}d ago`;

    return date.toLocaleDateString();
}
