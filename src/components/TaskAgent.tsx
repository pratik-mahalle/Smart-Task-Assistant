/**
 * Task Agent Component
 * 
 * This is the "brain" component that:
 * 1. Manages task state
 * 2. Communicates with the agent API
 * 3. Coordinates between input and display
 * 
 * A2UI Integration Note:
 * While this demo shows the concept of an agent-driven UI,
 * a full A2UI implementation would send declarative UI messages
 * that get rendered by the a2ui-react renderer. For simplicity
 * and reliability, we use a hybrid approach where Claude decides
 * what actions to take, and React handles the rendering.
 * 
 * This is actually a recommended pattern for beginners because:
 * - React's state management is familiar
 * - Debugging is easier
 * - UI responsiveness is guaranteed
 * - The "agent" aspect focuses on NL understanding
 */

'use client';

import React, { useState, useCallback } from 'react';
import { TaskList, TaskStats, FilterPills } from './TaskUI';
import { InputArea, AgentResponse } from './InputArea';
import {
    calculateStats,
    filterTasks,
    createDemoState,
    getFilterDescription,
    completeTask as completeTaskUtil,
    uncompleteTask as uncompleteTaskUtil,
    deleteTask as deleteTaskUtil,
} from '@/lib/task-utils';
import type { TaskState, AgentResponse as AgentResponseType } from '@/lib/types';

// ============================================================================
// Main Agent Component
// ============================================================================

export function TaskAgent() {
    // Initialize with demo data so users can immediately see how it works
    const [state, setState] = useState<TaskState>(createDemoState);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    /**
     * Send a message to the agent API
     * This is the core interaction point
     */
    const sendMessage = useCallback(async (message: string) => {
        setIsLoading(true);
        setError(null);

        // Optimistically clear any previous agent message
        setState((prev) => ({ ...prev, agentMessage: undefined }));

        try {
            console.log('[TaskAgent] Sending message:', message);

            const response = await fetch('/api/agent', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    message,
                    currentState: state,
                }),
            });

            const data: AgentResponseType = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Something went wrong');
            }

            // Update state with agent's changes
            setState(data.state);

            console.log('[TaskAgent] State updated:', data.state);
        } catch (err) {
            console.error('[TaskAgent] Error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Failed to process request';
            setError(errorMessage);

            // Show error in agent message area
            setState((prev) => ({
                ...prev,
                agentMessage: `⚠️ ${errorMessage}`,
            }));
        } finally {
            setIsLoading(false);
        }
    }, [state]);

    /**
     * Direct actions for task completion/deletion
     * These bypass the agent for faster response
     */
    const handleComplete = useCallback((taskId: string) => {
        setState((prev) => {
            const task = prev.tasks.find((t) => t.id === taskId);
            if (!task) return prev;

            // Toggle completion
            const newState = task.completed
                ? uncompleteTaskUtil(prev, taskId)
                : completeTaskUtil(prev, taskId);

            return {
                ...newState,
                agentMessage: task.completed
                    ? `Marked "${task.title}" as active`
                    : `Completed "${task.title}" ✓`,
            };
        });
    }, []);

    const handleDelete = useCallback((taskId: string) => {
        setState((prev) => {
            const task = prev.tasks.find((t) => t.id === taskId);
            if (!task) return prev;

            return {
                ...deleteTaskUtil(prev, taskId),
                agentMessage: `Deleted "${task.title}"`,
            };
        });
    }, []);

    /**
     * Filter change handler
     * Also fast-path that doesn't need the agent
     */
    const handleFilterChange = useCallback((filter: string | undefined) => {
        setState((prev) => ({
            ...prev,
            filter,
            agentMessage: filter
                ? `Filtering: ${getFilterDescription(filter)}`
                : 'Showing all tasks',
        }));
    }, []);

    // Calculate derived data
    const filteredTasks = filterTasks(state.tasks, state.filter);
    const stats = calculateStats(state.tasks);

    return (
        <div className="max-w-2xl mx-auto px-4 py-8 min-h-screen flex flex-col">
            {/* Header */}
            <header className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">
                    Smart Task Assistant
                </h1>
                <p className="text-gray-500">
                    Manage your tasks with natural language
                </p>
            </header>

            {/* Stats Overview */}
            <section className="mb-6">
                <TaskStats {...stats} />
            </section>

            {/* Filter Pills */}
            <section className="mb-4">
                <FilterPills
                    activeFilter={state.filter}
                    onFilterChange={handleFilterChange}
                />
            </section>

            {/* Current filter indicator */}
            {state.filter && (
                <div className="mb-4 text-sm text-gray-500 flex items-center justify-between">
                    <span>{getFilterDescription(state.filter)}</span>
                    <button
                        onClick={() => handleFilterChange(undefined)}
                        className="text-purple-600 hover:underline"
                    >
                        Clear filter
                    </button>
                </div>
            )}

            {/* Task List */}
            <section className="flex-grow mb-6">
                <TaskList
                    tasks={filteredTasks}
                    onComplete={handleComplete}
                    onDelete={handleDelete}
                />

                {/* Show count if filtered */}
                {state.filter && filteredTasks.length !== state.tasks.length && (
                    <p className="text-xs text-gray-400 text-center mt-4">
                        Showing {filteredTasks.length} of {state.tasks.length} tasks
                    </p>
                )}
            </section>

            {/* Agent Response */}
            <section className="mb-4">
                <AgentResponse
                    message={state.agentMessage}
                    isLoading={isLoading}
                />
            </section>

            {/* Error Display */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                    {error}
                </div>
            )}

            {/* Input Area */}
            <section className="sticky bottom-4">
                <InputArea
                    onSubmit={sendMessage}
                    isLoading={isLoading}
                />
            </section>

            {/* Footer with example commands */}
            <footer className="mt-8 text-center text-xs text-gray-400">
                <p className="mb-2">Try these commands:</p>
                <div className="flex flex-wrap justify-center gap-2">
                    {[
                        'add buy milk',
                        'mark task 1 done',
                        'show urgent',
                        'delete last task',
                    ].map((cmd) => (
                        <button
                            key={cmd}
                            onClick={() => sendMessage(cmd)}
                            disabled={isLoading}
                            className="
                px-2 py-1 bg-gray-100 rounded text-gray-600
                hover:bg-gray-200 transition-colors
                disabled:opacity-50
              "
                        >
                            {cmd}
                        </button>
                    ))}
                </div>
            </footer>
        </div>
    );
}
