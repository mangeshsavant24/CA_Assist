import React, { useState } from 'react'
import { X, Mail, Lock, User, Loader } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useAppStore } from '../store/appStore'
import apiClient from '../lib/api'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
}

interface LoginResponse {
  access_token: string
  token_type: string
  expires_in: number
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
  const [mode, setMode] = useState<'login' | 'register'>('login')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const { setAccessToken } = useAppStore()

  // Login form state
  const [loginData, setLoginData] = useState({
    username: '',
    password: '',
  })

  // Register form state
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    full_name: '',
    confirmPassword: '',
  })

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      // Mock successful login directly for frontend demo Demo without hitting backend
      await new Promise(resolve => setTimeout(resolve, 800))
      
      setAccessToken('mock_jwt_access_token_demo_mode')
      onClose()
      setLoginData({ username: '', password: '' })
    } catch (err: any) {
      setError('Login failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    if (registerData.password !== registerData.confirmPassword) {
      setError('Passwords do not match')
      return
    }

    setLoading(true)

    try {
      // Mock Auto-login after registration
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      setAccessToken('mock_jwt_access_token_demo_mode')
      onClose()
      setRegisterData({ email: '', password: '', full_name: '', confirmPassword: '' })
    } catch (err: any) {
      setError('Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-slate-900 border-slate-700">
        <CardHeader className="flex flex-row items-center justify-between border-b border-slate-700">
          <CardTitle>
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-50 transition-colors"
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="pt-6">
          {error && (
            <div className="mb-4 p-3 bg-red-950 border border-red-700 rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={loginData.password}
                    onChange={(e) =>
                      setLoginData({ ...loginData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-slate-700"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-slate-900 text-slate-400">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => setMode('register')}
              >
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Full Name
                </label>
                <div className="relative">
                  <User size={18} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    className="pl-10"
                    value={registerData.full_name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, full_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Email
                </label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-200 mb-2">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10"
                    value={registerData.confirmPassword}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, confirmPassword: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full"
                isLoading={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <Button
                type="button"
                variant="outline"
                size="md"
                className="w-full"
                onClick={() => setMode('login')}
              >
                Back to Sign In
              </Button>
            </form>
          )}

          <p className="text-xs text-slate-500 text-center mt-4">
            ⚠️ This is a demo authentication system. Use demo credentials for testing.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
