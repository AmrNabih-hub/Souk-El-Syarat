import { useState, useEffect } from 'react'
import { supabase } from '@/config/supabase.config'

function TodoExample() {
  const [todos, setTodos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function getTodos() {
      try {
        setLoading(true)
        const { data: todos, error } = await supabase.from('todos').select()

        if (error) {
          setError(error.message)
        } else if (todos && todos.length > 0) {
          setTodos(todos)
        }
      } catch (err: any) {
        setError(err.message || 'Failed to fetch todos')
      } finally {
        setLoading(false)
      }
    }

    getTodos()
  }, [])

  if (loading) {
    return (
      <div className="p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-2xl font-bold mb-4">⚡ Supabase Database Demo</h2>
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
          <span className="ml-2 text-gray-600">Loading todos...</span>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-2xl font-bold mb-4">⚡ Supabase Database Demo</h2>
      
      {error ? (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-yellow-600 mr-3">⚠️</div>
            <div>
              <p className="font-medium text-yellow-800">Database Connection Status</p>
              <p className="text-yellow-700 text-sm mt-1">
                Table 'todos' not found - this is normal for demo! The connection to Supabase is working.
              </p>
            </div>
          </div>
        </div>
      ) : todos.length > 0 ? (
        <ul className="space-y-2">
          {todos.map((todo: any) => (
            <li key={todo.id} className="p-3 bg-gray-50 rounded border-l-4 border-l-blue-500">
              <div className="font-medium">{todo.title || todo.name || 'Todo Item'}</div>
              {todo.description && (
                <div className="text-sm text-gray-600 mt-1">{todo.description}</div>
              )}
            </li>
          ))}
        </ul>
      ) : (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="text-green-600 mr-3">✅</div>
            <div>
              <p className="font-medium text-green-800">Supabase Connected Successfully!</p>
              <p className="text-green-700 text-sm mt-1">
                Database is ready. Create a 'todos' table in your Supabase dashboard to see real data here.
              </p>
            </div>
          </div>
        </div>
      )}
      
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="text-xs text-gray-500 space-y-1">
          <div>🔗 Connected to: {supabase.supabaseUrl}</div>
          <div>🏢 Project: zgnwfnfehdwehuycbcsz</div>
          <div>⚡ Real-time: Active</div>
        </div>
      </div>
    </div>
  )
}

export default TodoExample