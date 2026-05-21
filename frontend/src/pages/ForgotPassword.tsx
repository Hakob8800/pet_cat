import { useState } from 'react'
import { Link } from 'react-router-dom'
import { forgotPassword } from '../api/client'

export default function ForgotPassword() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setError('')
    try {
      await forgotPassword(email)
      setSubmitted(true)
    } catch {
      setError('Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold mb-2 text-center">Forgot Password</h1>

        {submitted ? (
          <div className="text-center">
            <div className="text-green-600 bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              If an account with that email exists, you'll receive a password reset link shortly.
            </div>
            <Link to="/login" className="text-blue-600 hover:underline text-sm">
              Back to Login
            </Link>
          </div>
        ) : (
          <>
            <p className="text-gray-600 text-sm text-center mb-6">
              Enter your email address and we'll send you a link to reset your password.
            </p>

            {error && (
              <div className="bg-red-100 text-red-700 p-3 rounded mb-4 text-sm">{error}</div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full p-3 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 text-white py-3 rounded hover:bg-blue-700 transition disabled:opacity-50"
              >
                {loading ? 'Sending...' : 'Send Reset Link'}
              </button>
            </form>

            <p className="mt-4 text-center text-sm text-gray-600">
              <Link to="/login" className="text-blue-600 hover:underline">
                Back to Login
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  )
}
