// MODIFIED: 2026-03-28 — layout restructure
// Changed: Rewritten as React portal floating dialog with scale/opacity animations,
//          in-place login↔register content swap with CSS transitions,
//          eye/EyeOff password toggle, password byte counter, "Forgot password?" stub
// Preserved: All loginAPI / registerAPI calls, auth state updates (setAccessToken, setCurrentUser),
//            all form validation logic, error handling

import React, { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'
import { X, Mail, Lock, User, Loader, Eye, EyeOff, AlertCircle } from 'lucide-react'
import { useAppStore } from '../store/appStore'
import { loginAPI, registerAPI, getCurrentUserAPI } from '../lib/api'

interface AuthModalProps {
  isOpen: boolean
  onClose: () => void
  initialMode?: 'login' | 'register'
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, initialMode = 'login' }) => {
  const [mode, setMode] = useState<'login' | 'register'>(initialMode)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [contentVisible, setContentVisible] = useState(true)
  const { setAccessToken, setCurrentUser } = useAppStore()

  // Login form
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  const [showLoginPw, setShowLoginPw] = useState(false)

  // Register form
  const [registerData, setRegisterData] = useState({
    email: '',
    password: '',
    full_name: '',
    confirmPassword: '',
  })
  const [showRegisterPw, setShowRegisterPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const overlayRef = useRef<HTMLDivElement>(null)

  // Password byte counter
  const regByteLength = new TextEncoder().encode(registerData.password).length

  // Prevent body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = ''
    }
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  // Escape key close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (isOpen) window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [isOpen, onClose])

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setError(null)
      setLoginData({ username: '', password: '' })
      setRegisterData({ email: '', password: '', full_name: '', confirmPassword: '' })
      setMode(initialMode)
      setContentVisible(true)
    }
  }, [isOpen, initialMode])

  const switchMode = (newMode: 'login' | 'register') => {
    if (newMode === mode) return
    setError(null)
    setContentVisible(false)
    setTimeout(() => {
      setMode(newMode)
      setContentVisible(true)
    }, 150)
  }

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const token = await loginAPI({ username: loginData.username, password: loginData.password })
      if (!token?.access_token) throw new Error('No access token returned')
      setAccessToken(token.access_token)
      try {
        const user = await getCurrentUserAPI()
        setCurrentUser(user)
      } catch {}
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Login failed. Please try again.')
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
    if (regByteLength > 72) {
      setError('Password exceeds 72 bytes — please shorten it.')
      return
    }
    setLoading(true)
    try {
      await registerAPI({ email: registerData.email, password: registerData.password, full_name: registerData.full_name })
      const token = await loginAPI({ username: registerData.email, password: registerData.password })
      if (!token?.access_token) throw new Error('No access token returned')
      setAccessToken(token.access_token)
      try {
        const user = await getCurrentUserAPI()
        setCurrentUser(user)
      } catch {}
      onClose()
    } catch (err: any) {
      setError(err?.response?.data?.detail || 'Registration failed. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (!isOpen) return null

  const passwordsMatch =
    registerData.password.length > 0 &&
    registerData.confirmPassword.length > 0 &&
    registerData.password === registerData.confirmPassword

  const dialog = (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center p-4"
      style={{ backdropFilter: 'blur(6px)', background: 'rgba(0,0,0,0.72)' }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose() }}
      ref={overlayRef}
    >
      {/* Dialog card */}
      <div
        className="relative w-full max-w-[420px] z-[101] rounded-2xl p-8"
        style={{
          background: 'rgba(10,10,10,0.95)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
          animation: 'dialogOpen 200ms ease-out',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* X Close */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-slate-200 hover:bg-white/10 transition-all"
        >
          <X size={16} />
        </button>

        {/* Content with swap animation */}
        <div
          style={{
            transition: 'opacity 150ms ease, transform 150ms ease',
            opacity: contentVisible ? 1 : 0,
            transform: contentVisible ? 'translateX(0)' : (mode === 'login' ? 'translateX(-20px)' : 'translateX(20px)'),
          }}
        >
          {mode === 'login' ? (
            <>
              {/* Login Header */}
              <div className="text-center mb-6">
                <div className="w-9 h-9 rounded-md bg-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] mx-auto">
                  <span className="text-black font-black text-xs tracking-tighter">CA</span>
                </div>
                <h2 className="text-xl font-semibold text-white mt-3">Welcome back</h2>
                <p className="text-sm text-slate-400 mt-1">Sign in to continue</p>
              </div>

              <form onSubmit={handleLogin} className="space-y-4">
                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={loginData.username}
                      onChange={(e) => setLoginData({ ...loginData, username: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 text-slate-50 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showLoginPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={loginData.password}
                      onChange={(e) => setLoginData({ ...loginData, password: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 text-slate-50 placeholder-slate-500 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowLoginPw(!showLoginPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showLoginPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  <div className="text-right mt-1">
                    <button
                      type="button"
                      onClick={() => alert('Coming soon')}
                      className="text-xs text-[#10b981] hover:underline"
                    >
                      Forgot password?
                    </button>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <><Loader size={14} className="animate-spin" /> Signing in...</> : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-5">
                <p className="text-sm text-slate-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => switchMode('register')}
                    className="text-[#10b981] font-medium cursor-pointer hover:underline"
                  >
                    Create one
                  </button>
                </p>
              </div>
            </>
          ) : (
            <>
              {/* Register Header */}
              <div className="text-center mb-6">
                <div className="w-9 h-9 rounded-md bg-[#10b981] flex items-center justify-center shadow-[0_0_15px_rgba(16,185,129,0.4)] mx-auto">
                  <span className="text-black font-black text-xs tracking-tighter">CA</span>
                </div>
                <h2 className="text-xl font-semibold text-white mt-3">Create your account</h2>
                <p className="text-sm text-slate-400 mt-1">Join CA-Assist for free</p>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                {/* Full Name */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Full Name</label>
                  <div className="relative">
                    <User size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="text"
                      placeholder="John Doe"
                      value={registerData.full_name}
                      onChange={(e) => setRegisterData({ ...registerData, full_name: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 text-slate-50 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Email</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type="email"
                      placeholder="your@email.com"
                      value={registerData.email}
                      onChange={(e) => setRegisterData({ ...registerData, email: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 text-slate-50 placeholder-slate-500 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-transparent transition-all"
                    />
                  </div>
                </div>

                {/* Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showRegisterPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerData.password}
                      onChange={(e) => setRegisterData({ ...registerData, password: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 text-slate-50 placeholder-slate-500 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-transparent transition-all"
                    />
                    <button
                      type="button"
                      onClick={() => setShowRegisterPw(!showRegisterPw)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
                    >
                      {showRegisterPw ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                  </div>
                  {regByteLength > 0 && (
                    <p className={`text-xs mt-1 ${regByteLength > 65 ? 'text-red-400' : regByteLength > 50 ? 'text-amber-400' : 'text-slate-500'}`}>
                      {regByteLength}/72 bytes
                    </p>
                  )}
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1.5">Confirm Password</label>
                  <div className="relative">
                    <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 pointer-events-none" />
                    <input
                      type={showConfirmPw ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={registerData.confirmPassword}
                      onChange={(e) => setRegisterData({ ...registerData, confirmPassword: e.target.value })}
                      required
                      className="w-full bg-white/5 border border-white/10 text-slate-50 placeholder-slate-500 rounded-lg pl-9 pr-10 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#10b981]/50 focus:border-transparent transition-all"
                    />
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      {registerData.confirmPassword.length > 0 && (
                        <span className={registerData.password === registerData.confirmPassword ? 'text-[#10b981]' : 'text-red-400'} style={{ fontSize: 13 }}>
                          {passwordsMatch ? '✓' : '✗'}
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => setShowConfirmPw(!showConfirmPw)}
                        className="text-slate-500 hover:text-slate-300 transition-colors ml-1"
                      >
                        {showConfirmPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Error */}
                {error && (
                  <div className="bg-red-950/40 border border-red-800/50 rounded-xl px-4 py-3 flex items-center gap-2">
                    <AlertCircle size={14} className="text-red-400 flex-shrink-0" />
                    <p className="text-sm text-red-400">{error}</p>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#10b981] hover:bg-[#059669] text-black font-bold py-2.5 rounded-lg transition-all shadow-[0_0_15px_rgba(16,185,129,0.3)] disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? <><Loader size={14} className="animate-spin" /> Creating account...</> : 'Create Account'}
                </button>
              </form>

              <div className="text-center mt-5">
                <p className="text-sm text-slate-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => switchMode('login')}
                    className="text-[#10b981] font-medium cursor-pointer hover:underline"
                  >
                    Sign in
                  </button>
                </p>
              </div>
            </>
          )}
        </div>
      </div>

      <style>{`
        @keyframes dialogOpen {
          from { opacity: 0; transform: scale(0.95) translateY(-8px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )

  return createPortal(dialog, document.body)
}
