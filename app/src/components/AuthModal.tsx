import React, { useState } from 'react'
import { X, Mail, Lock, User, Loader } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from './ui/Card'
import { Button } from './ui/Button'
import { Input } from './ui/Input'
import { useAppStore } from '../store/appStore'
import { loginAPI, registerAPI, getCurrentUserAPI } from '../lib/api'

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
  const { setAccessToken, setCurrentUser } = useAppStore()

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
      const token = await loginAPI({
        username: loginData.username,
        password: loginData.password,
      })

      if (!token?.access_token) {
        throw new Error('No access token returned')
      }

      setAccessToken(token.access_token)

      // Fetch and store current user details
      try {
        const user = await getCurrentUserAPI()
        setCurrentUser(user)
      } catch (userErr) {
        console.warn('Unable to fetch current user after login', userErr)
      }

      onClose()
      setLoginData({ username: '', password: '' })
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Login failed. Please try again.'
      setError(message)
      console.error('Login error:', err)
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
      await registerAPI({
        email: registerData.email,
        password: registerData.password,
        full_name: registerData.full_name,
      })

      const token = await loginAPI({
        username: registerData.email,
        password: registerData.password,
      })

      if (!token?.access_token) {
        throw new Error('No access token returned')
      }

      setAccessToken(token.access_token)

      // Fetch and store current user details
      try {
        const user = await getCurrentUserAPI()
        setCurrentUser(user)
      } catch (userErr) {
        console.warn('Unable to fetch current user after register', userErr)
      }

      onClose()
      setRegisterData({ email: '', password: '', full_name: '', confirmPassword: '' })
    } catch (err: any) {
      const message = err?.response?.data?.detail || 'Registration failed. Please try again.'
      setError(message)
      console.error('Registration error:', err)
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xl z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md bg-black/40 border border-white/5 backdrop-blur-2xl shadow-2xl">
        <CardHeader className="flex flex-row items-center justify-between border-b border-white/5 pb-4">
          <CardTitle className="text-white font-bold tracking-tight">
            {mode === 'login' ? 'Sign In' : 'Create Account'}
          </CardTitle>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors p-1 hover:bg-white/5 rounded-lg"
          >
            <X size={20} />
          </button>
        </CardHeader>

        <CardContent className="pt-6 space-y-5">
          {error && (
            <div className="p-3 bg-red-950/50 border border-red-700/50 backdrop-blur-sm rounded-lg text-red-200 text-sm">
              {error}
            </div>
          )}

          {mode === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-slate-50 placeholder-slate-500"
                    value={loginData.username}
                    onChange={(e) =>
                      setLoginData({ ...loginData, username: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 text-slate-50 placeholder-slate-500"
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
                className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105 border-0"
                isLoading={loading}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>

              <div className="relative py-2">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-white/10"></div>
                </div>
                <div className="relative flex justify-center text-xs">
                  <span className="px-2 bg-black/40 text-slate-400">
                    Don't have an account?
                  </span>
                </div>
              </div>

              <Button
                type="button"
                className="w-full bg-white/10 hover:bg-white/20 text-slate-50 font-semibold border border-white/10 py-2 transition-all"
                onClick={() => setMode('register')}
              >
                Create Account
              </Button>
            </form>
          ) : (
            <form onSubmit={handleRegister} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Full Name
                </label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="text"
                    placeholder="John Doe"
                    className="pl-10 bg-white/5 border-white/10 text-slate-50 placeholder-slate-500"
                    value={registerData.full_name}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, full_name: e.target.value })
                    }
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Email
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="email"
                    placeholder="your@email.com"
                    className="pl-10 bg-white/5 border-white/10 text-slate-50 placeholder-slate-500"
                    value={registerData.email}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, email: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 text-slate-50 placeholder-slate-500"
                    value={registerData.password}
                    onChange={(e) =>
                      setRegisterData({ ...registerData, password: e.target.value })
                    }
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-2 uppercase tracking-wide">
                  Confirm Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-3 text-slate-500" />
                  <Input
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 text-slate-50 placeholder-slate-500"
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
                className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-2 shadow-[0_0_15px_rgba(16,185,129,0.3)] transition-all hover:scale-105 border-0"
                isLoading={loading}
              >
                {loading ? 'Creating account...' : 'Create Account'}
              </Button>

              <Button
                type="button"
                className="w-full bg-white/10 hover:bg-white/20 text-slate-50 font-semibold border border-white/10 py-2 transition-all"
                onClick={() => setMode('login')}
              >
                Back to Sign In
              </Button>
            </form>
          )}

          <p className="text-xs text-slate-500 text-center mt-6 leading-relaxed">
            ⚠️ Demo authentication. Use demo credentials for testing.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
