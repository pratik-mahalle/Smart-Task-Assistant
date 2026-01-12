/**
 * Natural Language Input Component
 * 
 * The main input area where users type their commands.
 * This is where the "magic" of natural language interaction happens
 * from the user's perspective.
 * 
 * Features:
 * - Large, inviting input area
 * - Example commands on hover/focus
 * - Loading state while agent processes
 * - Submit on Enter (Shift+Enter for newline)
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Send, Sparkles, Loader2 } from 'lucide-react';

interface InputAreaProps {
    onSubmit: (message: string) => void;
    isLoading?: boolean;
    placeholder?: string;
}

/**
 * Example commands to show users what they can do
 * These rotate through to give users ideas
 */
const EXAMPLE_COMMANDS = [
    'add buy groceries as high priority',
    'show me what\'s urgent',
    'mark task 1 as complete',
    'create a work task: review PR',
    'delete the last task',
    'show completed tasks',
    'add 3 tasks for the sprint',
    'what do I need to do today?',
];

export function InputArea({ onSubmit, isLoading = false, placeholder }: InputAreaProps) {
    const [value, setValue] = useState('');
    const [exampleIndex, setExampleIndex] = useState(0);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Rotate through examples every 3 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setExampleIndex((prev) => (prev + 1) % EXAMPLE_COMMANDS.length);
        }, 3000);

        return () => clearInterval(interval);
    }, []);

    // Handle form submission
    const handleSubmit = (e?: React.FormEvent) => {
        e?.preventDefault();

        const trimmed = value.trim();
        if (!trimmed || isLoading) return;

        onSubmit(trimmed);
        setValue('');

        // Keep focus on input for quick follow-up commands
        inputRef.current?.focus();
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: React.KeyboardEvent) => {
        // Submit on Enter (without Shift)
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit();
        }
    };

    // Dynamic placeholder
    const dynamicPlaceholder = placeholder || `Try: "${EXAMPLE_COMMANDS[exampleIndex]}"`;

    return (
        <form onSubmit={handleSubmit} className="relative">
            <div
                className={`
          relative bg-white rounded-2xl border-2 shadow-lg
          transition-all duration-200
          ${isLoading ? 'border-purple-300' : 'border-gray-200 focus-within:border-purple-400'}
        `}
            >
                {/* Decorative sparkle icon */}
                <div className="absolute left-4 top-4 text-purple-400">
                    <Sparkles className="w-5 h-5" />
                </div>

                {/* Main textarea */}
                <textarea
                    ref={inputRef}
                    value={value}
                    onChange={(e) => setValue(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder={dynamicPlaceholder}
                    disabled={isLoading}
                    rows={2}
                    className="
            w-full pl-12 pr-14 py-4 text-gray-900
            bg-transparent resize-none
            focus:outline-none
            placeholder:text-gray-400
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                />

                {/* Submit button */}
                <button
                    type="submit"
                    disabled={!value.trim() || isLoading}
                    className={`
            absolute right-3 bottom-3
            p-2.5 rounded-xl
            transition-all duration-200
            ${value.trim() && !isLoading
                            ? 'bg-purple-600 text-white hover:bg-purple-700 shadow-md'
                            : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }
          `}
                    aria-label="Send message"
                >
                    {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                        <Send className="w-5 h-5" />
                    )}
                </button>
            </div>

            {/* Hint text */}
            <p className="text-xs text-gray-400 mt-2 text-center">
                Press Enter to send • Shift+Enter for new line
            </p>
        </form>
    );
}

// ============================================================================
// Agent Response Display
// ============================================================================

interface AgentResponseProps {
    message?: string;
    isLoading?: boolean;
}

/**
 * Shows the agent's response message
 * Has a nice animation when the message changes
 */
export function AgentResponse({ message, isLoading }: AgentResponseProps) {
    if (isLoading) {
        return (
            <div className="flex items-center gap-2 text-purple-600 animate-pulse">
                <Loader2 className="w-4 h-4 animate-spin" />
                <span className="text-sm">Thinking...</span>
            </div>
        );
    }

    if (!message) return null;

    return (
        <div className="text-sm text-gray-600 bg-purple-50 rounded-lg px-4 py-3 animate-fade-in">
            <span className="font-medium text-purple-600">🤖 </span>
            {message}
        </div>
    );
}

// ============================================================================
// Quick Command Buttons
// ============================================================================

interface QuickCommandsProps {
    onCommand: (command: string) => void;
    disabled?: boolean;
}

/**
 * Shortcut buttons for common actions
 * Great for mobile users or quick operations
 */
export function QuickCommands({ onCommand, disabled }: QuickCommandsProps) {
    const commands = [
        { label: '+ Add Task', command: 'add a new task' },
        { label: '🔥 Urgent', command: 'show urgent tasks' },
        { label: '✓ Complete', command: 'mark task 1 as done' },
        { label: '🗑 Clear Done', command: 'delete all completed tasks' },
    ];

    return (
        <div className="flex flex-wrap gap-2">
            {commands.map((cmd) => (
                <button
                    key={cmd.label}
                    onClick={() => onCommand(cmd.command)}
                    disabled={disabled}
                    className="
            px-3 py-1.5 text-xs font-medium
            bg-gray-100 text-gray-600 rounded-lg
            hover:bg-gray-200 transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
          "
                >
                    {cmd.label}
                </button>
            ))}
        </div>
    );
}
