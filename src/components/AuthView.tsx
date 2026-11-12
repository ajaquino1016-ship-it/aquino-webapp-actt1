import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  ShieldCheck,
  Lock,
  Mail,
  User,
  ArrowRight,
  Eye,
  EyeOff,
  Sun,
  Moon,
  Sparkles,
  CheckCircle2,
  FolderLock,
  FileCheck2,
} from 'lucide-react';

export function AuthView() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInDemoUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Freelance Designer');
  const [showPassword, setShowPassword] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!email || !password) {
      setErrorMsg('Please enter both your email address and password.');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('Password should be at least 6 characters.');
      return;
    }

    if (mode === 'signup' && !displayName.trim()) {
      setErrorMsg('Please enter your full name or studio title.');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'signin') {
        await signInWithEmail(email, password);
      } else {
        await signUpWithEmail(email, password, displayName, role);
      }
    } catch (err: unknown) {
      const anyErr = err as { code?: string; message?: string };
      if (anyErr?.code === 'auth/invalid-credential' || anyErr?.code === 'auth/wrong-password' || anyErr?.code === 'auth/user-not-found') {
        setErrorMsg('Invalid email or password. Please verify your credentials or create an account.');
      } else if (anyErr?.code === 'auth/email-already-in-use') {
        setErrorMsg('An account with this email already exists. Try signing in instead.');
      } else if (anyErr?.code === 'auth/weak-password') {
        setErrorMsg('Please choose a stronger password (at least 6 characters).');
      } else {
        setErrorMsg(anyErr?.message || 'Authentication failed. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInDemoUser();
    } catch (err: unknown) {
      console.error(err);
      setErrorMsg('Demo sign-in failed. Please try signing up with an email and password.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setErrorMsg(null);
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: unknown) {
      const anyErr = err as { code?: string };
      if (anyErr?.code !== 'auth/popup-closed-by-user') {
        setErrorMsg('Google sign-in was cancelled or encountered an error.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 transition-colors duration-200">
      {/* Dark Red Brand Hero Panel */}
      <div className="lg:w-5/12 bg-gradient-to-br from-[#450a0a] via-[#5c0e18] to-[#7f1d1d] text-white p-8 lg:p-12 flex flex-col justify-between relative overflow-hidden border-b lg:border-b-0 lg:border-r border-red-950/60 shadow-2xl">
        {/* Subtle decorative geometric backdrop */}
        <div className="absolute -right-20 -bottom-20 w-80 h-80 rounded-full bg-red-600/10 blur-3xl pointer-events-none" />
        <div className="absolute -left-10 -top-10 w-60 h-60 rounded-full bg-rose-500/10 blur-2xl pointer-events-none" />

        {/* Top Header */}
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center shadow-lg text-white">
                <ShieldCheck className="w-6 h-6 text-red-200" />
              </div>
              <div>
                <span className="text-2xl font-extrabold tracking-tight text-white flex items-center gap-1">
                  AVault
                  <span className="w-2 h-2 rounded-full bg-red-400 inline-block ml-0.5 animate-pulse" />
                </span>
                <p className="text-xs uppercase tracking-widest text-red-200 font-medium">Client File Portal</p>
              </div>
            </div>

            <button
              onClick={toggleTheme}
              aria-label="Toggle theme"
              className="p-2.5 rounded-lg bg-white/10 hover:bg-white/20 border border-white/15 text-red-100 transition"
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            >
              {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-8 lg:mt-16 space-y-4">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-red-900/60 border border-red-500/30 text-red-100">
              <FolderLock className="w-3.5 h-3.5 text-red-300" />
              Engineered for Freelancers & Creatives
            </span>
            <h1 className="text-3xl lg:text-4xl font-bold tracking-tight text-white leading-tight">
              Let your clients securely upload, review, and retrieve files.
            </h1>
            <p className="text-sm lg:text-base text-red-100/90 leading-relaxed max-w-md">
              No lost email attachments or chaotic link trees. AVault gives you a branded client portal with dedicated project isolation and instant downloads.
            </p>
          </div>
        </div>

        {/* Value Points */}
        <div className="relative z-10 my-8 space-y-3.5 pt-6 border-t border-red-800/60">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs lg:text-sm font-semibold text-white">Dedicated Client File Isolation</p>
              <p className="text-xs text-red-200/80">Every file is protected with Firestore security rules per user vault.</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <FileCheck2 className="w-5 h-5 text-red-300 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs lg:text-sm font-semibold text-white">Full Fidelity Binary Downloads</p>
              <p className="text-xs text-red-200/80">Original file preservation with quick visual thumbnail previews.</p>
            </div>
          </div>
        </div>

        {/* Footer Note */}
        <div className="relative z-10 pt-4 text-xs text-red-200/60 flex items-center justify-between">
          <span>AVault v2.4 Enterprise Portal</span>
          <span className="flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-red-300" /> AES-256 Client Security
          </span>
        </div>
      </div>

      {/* Auth Form Area */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          {/* Card Container */}
          <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-xl border border-slate-200/80 dark:border-slate-800 p-8 sm:p-10 transition-colors">
            {/* Header Switch */}
            <div className="mb-6 text-center">
              <h2 className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                {mode === 'signin' ? 'Sign In to AVault' : 'Create an Account'}
              </h2>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
                {mode === 'signin'
                  ? 'Enter your credentials to access your client portal'
                  : 'Start sharing deliverables with your clients today'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="flex p-1 bg-slate-100 dark:bg-slate-800/80 rounded-xl mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-white dark:bg-slate-900 text-red-950 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Sign In
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('signup');
                  setErrorMsg(null);
                }}
                className={`flex-1 py-2 text-xs sm:text-sm font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-white dark:bg-slate-900 text-red-950 dark:text-white shadow-sm'
                    : 'text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-white'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs sm:text-sm flex items-start gap-2.5 animate-fadeIn">
                <span className="text-red-500 font-bold shrink-0">!</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Demo Button for effortless testing */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50/70 dark:bg-red-950/30 hover:bg-red-100/70 dark:hover:bg-red-950/60 text-red-900 dark:text-red-200 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition cursor-pointer shadow-sm disabled:opacity-50"
              >
                <Sparkles className="w-4 h-4 text-red-600 dark:text-red-400" />
                <span>One-Click Demo Account (Alex Rivera)</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-5">
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
              <span className="flex-shrink mx-3 text-xs uppercase font-medium tracking-wider text-slate-400 dark:text-slate-500">
                Or continue with email
              </span>
              <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Your Full Name or Studio
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Jordan Lee / Studio Apex"
                        className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 focus:border-red-800 transition"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                      Your Role
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 focus:border-red-800 transition text-slate-700 dark:text-slate-200"
                    >
                      <option value="Freelance Designer">Freelance Designer</option>
                      <option value="Design Studio / Agency">Design Studio / Agency</option>
                      <option value="Brand Identity Consultant">Brand Identity Consultant</option>
                      <option value="Web & UI/UX Developer">Web & UI/UX Developer</option>
                      <option value="Freelance Photographer/Videographer">Freelance Photographer/Videographer</option>
                      <option value="Client Reviewer">Client Reviewer</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 focus:border-red-800 transition text-slate-900 dark:text-slate-100"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold uppercase tracking-wider text-slate-600 dark:text-slate-400 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-red-800/40 focus:border-red-800 transition text-slate-900 dark:text-slate-100"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-3 px-4 rounded-xl bg-gradient-to-r from-red-800 to-red-900 hover:from-red-900 hover:to-red-950 text-white font-semibold text-sm shadow-md hover:shadow-lg transition flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create an Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google Login Option */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/60 text-slate-700 dark:text-slate-200 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="#4285F4"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="#34A853"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  />
                  <path
                    fill="#EA4335"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  />
                </svg>
                <span>Continue with Google</span>
              </button>
            </div>

            {/* Bottom prompt */}
            <div className="mt-6 text-center text-xs text-slate-500 dark:text-slate-400">
              {mode === 'signin' ? (
                <span>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                    }}
                    className="text-red-700 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                  >
                    Create an Account
                  </button>
                </span>
              ) : (
                <span>
                  Already have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signin');
                      setErrorMsg(null);
                    }}
                    className="text-red-700 dark:text-red-400 font-semibold hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
