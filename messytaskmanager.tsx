// MessyTaskManager.tsx (for demo purposes only)
import { useState, useEffect, useCallback } from 'react'

export default function MessyTaskManager() {
    const [tasks, setTasks] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [filter, setFilter] = useState('all')
    const [input, setInput] = useState('')

    // Tons of handlers
    const handleAddTask = useCallback(async (title) => {
        setLoading(true)
        try {
            const response = await fetch('/api/tasks', {
                method: 'POST',
                body: JSON.stringify({ title }),
                headers: { 'Content-Type': 'application/json' }
            })
            const data = await response.json()
            setTasks(prev => [...prev, data])
        } catch (err) {
            setError(err.message)
        } finally {
            setLoading(false)
        }
    }, [])

    const handleComplete = useCallback(async (id) => {
        // More complex logic...
    }, [tasks])

    const handleFilter = useCallback((type) => {
        // More state management...
    }, [])

    // Complex conditional rendering
    return (
        <div>
            {loading && <Spinner />}
            {error && <ErrorMessage />}
            {/* Lots more JSX... */}
        </div>
    )
}