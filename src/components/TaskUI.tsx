/**
 * Task Display Component
 * 
 * This component handles the visual representation of tasks.
 * It's intentionally "dumb" - just displays what it's given.
 * All business logic (completing, deleting) happens through callbacks.
 * 
 * Design philosophy: We use Tailwind for styling to keep things
 * simple and consistent. Priority colors are defined in our
 * tailwind.config.ts for easy theming.
 */

import React from 'react';
import type { Task, Priority } from '@/lib/types';
import { formatRelativeTime } from '@/lib/task-utils';
import { Check, Trash2, Circle, Clock } from 'lucide-react';

// ============================================================================
// Priority Badge
// ============================================================================

interface PriorityBadgeProps {
    priority: Priority;
}

/**
 * Visual indicator for task priority
 * Uses semantic colors: red for urgent, amber for medium, green for low
 */
export function PriorityBadge({ priority }: PriorityBadgeProps) {
    const styles: Record<Priority, string> = {
        high: 'bg-red-100 text-red-700 border-red-200',
        medium: 'bg-amber-100 text-amber-700 border-amber-200',
        low: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    };

    const labels: Record<Priority, string> = {
        high: 'High',
        medium: 'Med',
        low: 'Low',
    };

    return (
        <span
            className={`
        inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium
        border ${styles[priority]}
      `}
        >
            {labels[priority]}
        </span>
    );
}

// ============================================================================
// Category Tag
// ============================================================================

interface CategoryTagProps {
    category: string;
}

/**
 * Optional category indicator
 * Uses a subtle gray style to not compete with priority
 */
export function CategoryTag({ category }: CategoryTagProps) {
    if (!category) return null;

    return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs text-gray-500 bg-gray-100">
            {category}
        </span>
    );
}

// ============================================================================
// Single Task Item
// ============================================================================

interface TaskItemProps {
    task: Task;
    index: number;
    onComplete?: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
}

/**
 * Individual task display
 * 
 * Accessibility note: We use proper button elements for actions
 * and include aria-labels for screen readers.
 */
export function TaskItem({ task, index, onComplete, onDelete }: TaskItemProps) {
    return (
        <div
            className={`
        group flex items-start gap-3 p-4 bg-white rounded-xl border
        transition-all duration-200 hover:shadow-md
        ${task.completed ? 'opacity-60 bg-gray-50' : 'border-gray-200'}
      `}
        >
            {/* Task number indicator */}
            <div className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-xs text-gray-400 font-mono">
                {index + 1}
            </div>

            {/* Completion toggle */}
            <button
                onClick={() => onComplete?.(task.id)}
                className={`
          flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center
          transition-all duration-200
          ${task.completed
                        ? 'bg-emerald-500 border-emerald-500 text-white'
                        : 'border-gray-300 hover:border-emerald-400 text-transparent hover:text-emerald-400'
                    }
        `}
                aria-label={task.completed ? 'Mark as incomplete' : 'Mark as complete'}
            >
                <Check className="w-3.5 h-3.5" />
            </button>

            {/* Task content */}
            <div className="flex-grow min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span
                        className={`
              text-sm font-medium
              ${task.completed ? 'line-through text-gray-400' : 'text-gray-900'}
            `}
                    >
                        {task.title}
                    </span>
                    <PriorityBadge priority={task.priority} />
                    <CategoryTag category={task.category} />
                </div>

                {/* Metadata row */}
                <div className="flex items-center gap-2 mt-1 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>
                        {task.completed && task.completedAt
                            ? `Completed ${formatRelativeTime(task.completedAt)}`
                            : `Added ${formatRelativeTime(task.createdAt)}`
                        }
                    </span>
                </div>
            </div>

            {/* Delete button */}
            <button
                onClick={() => onDelete?.(task.id)}
                className="
          flex-shrink-0 opacity-0 group-hover:opacity-100
          p-2 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50
          transition-all duration-200
        "
                aria-label="Delete task"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </div>
    );
}

// ============================================================================
// Task List
// ============================================================================

interface TaskListProps {
    tasks: Task[];
    onComplete?: (taskId: string) => void;
    onDelete?: (taskId: string) => void;
}

/**
 * List container for tasks
 * Handles empty state with helpful message
 */
export function TaskList({ tasks, onComplete, onDelete }: TaskListProps) {
    if (tasks.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                <Circle className="w-12 h-12 mb-3 opacity-50" />
                <p className="text-sm font-medium">No tasks yet</p>
                <p className="text-xs mt-1">Try saying &quot;add a task&quot; below</p>
            </div>
        );
    }

    return (
        <div className="space-y-2">
            {tasks.map((task, index) => (
                <TaskItem
                    key={task.id}
                    task={task}
                    index={index}
                    onComplete={onComplete}
                    onDelete={onDelete}
                />
            ))}
        </div>
    );
}

// ============================================================================
// Stats Display
// ============================================================================

interface TaskStatsProps {
    total: number;
    active: number;
    completed: number;
    highPriority: number;
}

/**
 * Quick stats overview
 * Shows key metrics at a glance
 */
export function TaskStats({ total, active, completed, highPriority }: TaskStatsProps) {
    return (
        <div className="grid grid-cols-4 gap-3">
            <StatCard label="Total" value={total} color="gray" />
            <StatCard label="Active" value={active} color="blue" />
            <StatCard label="Done" value={completed} color="emerald" />
            <StatCard label="Urgent" value={highPriority} color="red" />
        </div>
    );
}

interface StatCardProps {
    label: string;
    value: number;
    color: 'gray' | 'blue' | 'emerald' | 'red';
}

function StatCard({ label, value, color }: StatCardProps) {
    const colorStyles: Record<string, string> = {
        gray: 'bg-gray-50 text-gray-600',
        blue: 'bg-blue-50 text-blue-600',
        emerald: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
    };

    return (
        <div className={`${colorStyles[color]} rounded-xl p-3 text-center`}>
            <div className="text-2xl font-bold">{value}</div>
            <div className="text-xs opacity-75">{label}</div>
        </div>
    );
}

// ============================================================================
// Filter Pills
// ============================================================================

interface FilterPillsProps {
    activeFilter?: string;
    onFilterChange: (filter: string | undefined) => void;
}

/**
 * Quick filter buttons
 * These are shortcuts for common filter operations
 */
export function FilterPills({ activeFilter, onFilterChange }: FilterPillsProps) {
    const filters = [
        { label: 'All', value: undefined },
        { label: '🔥 Urgent', value: 'priority:high' },
        { label: '📋 Active', value: 'completed:false' },
        { label: '✓ Done', value: 'completed:true' },
    ];

    return (
        <div className="flex gap-2 overflow-x-auto pb-2">
            {filters.map((filter) => (
                <button
                    key={filter.label}
                    onClick={() => onFilterChange(filter.value)}
                    className={`
            px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap
            transition-all duration-200
            ${activeFilter === filter.value
                            ? 'bg-gray-900 text-white shadow-md'
                            : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                        }
          `}
                >
                    {filter.label}
                </button>
            ))}
        </div>
    );
}
