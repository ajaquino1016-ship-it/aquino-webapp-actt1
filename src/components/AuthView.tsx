import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import {
  Leaf,
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
  Utensils,
} from 'lucide-react';

export function AuthView() {
  const { signInWithEmail, signUpWithEmail, signInWithGoogle, signInDemoUser } = useAuth();
  const { isDark, toggleTheme } = useTheme();

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [role, setRole] = useState('Home Cook');
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
      setErrorMsg('Please enter your name.');
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
      if (
        anyErr?.code === 'auth/invalid-credential' ||
        anyErr?.code === 'auth/wrong-password' ||
        anyErr?.code === 'auth/user-not-found'
      ) {
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
    <div className="min-h-screen w-full flex flex-col lg:flex-row bg-[#EDEEE9] dark:bg-[#191E1F] text-[#3D4547] dark:text-[#EDEEE9] transition-colors duration-200">
      {/* Left Editorial Brand Panel */}
      <aside className="lg:w-5/12 bg-[#ECD0C2] dark:bg-[#292F2D] text-[#3D4547] dark:text-[#EDEEE9] p-8 lg:p-12 flex flex-col justify-between border-b lg:border-b-0 lg:border-r border-[#3D4547]/15 dark:border-[#424844] transition-colors duration-200">
        <div>
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-[#3D4547] dark:bg-[#B5B86F] text-[#EDEEE9] dark:text-[#191E1F] flex items-center justify-center">
                <Leaf className="w-5 h-5" />
              </div>
              <div>
                <span className="font-serif text-2xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] block leading-none">
                  PantryAI
                </span>
                <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF] mt-1 tracking-wide">
                  Kitchen Companion
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={toggleTheme}
              aria-label={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-lg border border-[#3D4547]/20 dark:border-[#424844] bg-[#EDEEE9]/70 dark:bg-[#343A36] hover:bg-[#EDEEE9] dark:hover:bg-[#3E4540] text-[#3D4547] dark:text-[#EDEEE9] transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52] dark:focus-visible:outline-[#B5B86F]"
            >
              {isDark ? <Sun className="w-4 h-4 text-[#B5B86F]" /> : <Moon className="w-4 h-4" />}
            </button>
          </div>

          <div className="mt-6 lg:mt-14 space-y-5">
            <p className="text-xs font-medium uppercase tracking-[0.14em] text-[#B42B2F] dark:text-[#D65356]">
              Seasonal &amp; Everyday Cooking
            </p>
            <h1 className="font-serif text-3xl lg:text-4xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9] leading-[1.2] text-balance">
              Turn the ingredients in your kitchen into thoughtful meals.
            </h1>
            <p className="text-sm lg:text-base text-[#535C5E] dark:text-[#B8B9AF] leading-relaxed max-w-md">
              Type what you have or photograph your pantry. PantryAI pairs your ingredients with three tailored recipes and notes only the essentials left to pick up.
            </p>
          </div>
        </div>

        {/* Editorial Highlights */}
        <div className="my-8 space-y-4 pt-6 border-t border-[#3D4547]/15 dark:border-[#424844]">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-[#6E7234] dark:text-[#B5B86F] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9]">
                Strict dietary &amp; time filters
              </p>
              <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF]">
                Tailored to your schedule, servings, and pantry staples.
              </p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Utensils className="w-5 h-5 text-[#6E7234] dark:text-[#B5B86F] shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-[#3D4547] dark:text-[#EDEEE9]">
                Personal recipe archive
              </p>
              <p className="text-xs text-[#535C5E] dark:text-[#B8B9AF]">
                Save favorites, copy missing grocery lists, and revisit past searches.
              </p>
            </div>
          </div>
        </div>

        <div className="pt-4 text-xs text-[#535C5E] dark:text-[#B8B9AF] flex items-center justify-between border-t border-[#3D4547]/10 dark:border-[#424844]/60">
          <span>PantryAI</span>
          <span className="text-[#B42B2F] dark:text-[#D9B9AA]">Curated Recipe Journal</span>
        </div>
      </aside>

      {/* Right Auth Card Area */}
      <main className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md">
          <div className="bg-[#F5F5F1] dark:bg-[#292F2D] rounded-xl border border-[#3D4547]/15 dark:border-[#424844] p-7 sm:p-9 transition-colors duration-200">
            {/* Header */}
            <div className="mb-6 text-center space-y-1">
              <h2 className="font-serif text-2xl font-semibold tracking-tight text-[#3D4547] dark:text-[#EDEEE9]">
                {mode === 'signin' ? 'Sign In to PantryAI' : 'Create an Account'}
              </h2>
              <p className="text-sm text-[#535C5E] dark:text-[#B8B9AF]">
                {mode === 'signin'
                  ? 'Welcome back to your personal pantry'
                  : 'Save your favorite recipes and pantry searches'}
              </p>
            </div>

            {/* Mode Switch Tabs */}
            <div className="grid grid-cols-2 p-1 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/12 dark:border-[#424844] rounded-lg mb-6">
              <button
                type="button"
                onClick={() => {
                  setMode('signin');
                  setErrorMsg(null);
                }}
                className={`min-h-[40px] py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  mode === 'signin'
                    ? 'bg-[#3D4547] text-[#EDEEE9] dark:bg-[#B5B86F] dark:text-[#191E1F]'
                    : 'text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9]'
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
                className={`min-h-[40px] py-2 text-xs sm:text-sm font-medium rounded-md transition-colors cursor-pointer ${
                  mode === 'signup'
                    ? 'bg-[#3D4547] text-[#EDEEE9] dark:bg-[#B5B86F] dark:text-[#191E1F]'
                    : 'text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9]'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Error Alert */}
            {errorMsg && (
              <div
                role="alert"
                className="mb-5 p-3.5 rounded-lg bg-[#ECD0C2]/70 dark:bg-[#343A36] border border-[#B42B2F]/40 dark:border-[#D65356]/50 text-[#B42B2F] dark:text-[#D65356] text-xs sm:text-sm flex items-start gap-2.5"
              >
                <span className="font-semibold shrink-0">!</span>
                <span>{errorMsg}</span>
              </div>
            )}

            {/* Quick Demo Account */}
            <div className="mb-5">
              <button
                type="button"
                onClick={handleDemoLogin}
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg bg-[#9C9F52] hover:bg-[#8B8E47] text-[#191E1F] dark:bg-transparent dark:border dark:border-[#B5B86F] dark:text-[#EDEEE9] dark:hover:bg-[#B5B86F]/10 text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
              >
                <Sparkles className="w-4 h-4" />
                <span>One-Click Demo Account (Alex Rivera)</span>
              </button>
            </div>

            <div className="relative flex py-2 items-center mb-5">
              <div className="flex-grow border-t border-[#3D4547]/15 dark:border-[#424844]" />
              <span className="flex-shrink mx-3 text-xs tracking-wide text-[#535C5E] dark:text-[#B8B9AF]">
                Or continue with email
              </span>
              <div className="flex-grow border-t border-[#3D4547]/15 dark:border-[#424844]" />
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-4">
              {mode === 'signup' && (
                <>
                  <div>
                    <label
                      htmlFor="auth-name"
                      className="block text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] mb-1.5"
                    >
                      Your Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#535C5E] dark:text-[#B8B9AF]">
                        <User className="w-4 h-4" />
                      </div>
                      <input
                        id="auth-name"
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        placeholder="e.g. Jordan Lee"
                        className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] placeholder-[#535C5E]/60 dark:placeholder-[#B8B9AF]/50 focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] transition-colors"
                      />
                    </div>
                  </div>

                  <div>
                    <label
                      htmlFor="auth-role"
                      className="block text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] mb-1.5"
                    >
                      Cooking Style
                    </label>
                    <select
                      id="auth-role"
                      value={role}
                      onChange={(e) => setRole(e.target.value)}
                      className="w-full min-h-[44px] px-3.5 py-2.5 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] transition-colors"
                    >
                      <option value="Home Cook">Home Cook</option>
                      <option value="Busy Weeknight Chef">Busy Weeknight Chef</option>
                      <option value="Meal Prepper">Meal Prepper</option>
                      <option value="Plant-Based Explorer">Plant-Based Explorer</option>
                    </select>
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="auth-email"
                  className="block text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] mb-1.5"
                >
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#535C5E] dark:text-[#B8B9AF]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@domain.com"
                    autoComplete="email"
                    className="w-full min-h-[44px] pl-10 pr-4 py-2.5 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] placeholder-[#535C5E]/60 dark:placeholder-[#B8B9AF]/50 focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] transition-colors"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="auth-password"
                  className="block text-xs font-medium text-[#535C5E] dark:text-[#B8B9AF] mb-1.5"
                >
                  Password
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-[#535C5E] dark:text-[#B8B9AF]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    id="auth-password"
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                    className="w-full min-h-[44px] pl-10 pr-11 py-2.5 bg-[#EDEEE9] dark:bg-[#191E1F] border border-[#3D4547]/20 dark:border-[#424844] rounded-lg text-sm text-[#3D4547] dark:text-[#EDEEE9] placeholder-[#535C5E]/60 dark:placeholder-[#B8B9AF]/50 focus:outline-none focus:border-[#9C9F52] dark:focus:border-[#B5B86F] transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 px-3 flex items-center text-[#535C5E] dark:text-[#B8B9AF] hover:text-[#3D4547] dark:hover:text-[#EDEEE9] cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full min-h-[46px] mt-2 py-2.5 px-4 rounded-lg bg-[#3D4547] hover:bg-[#2F3638] text-[#EDEEE9] dark:bg-[#B5B86F] dark:hover:bg-[#C3C67E] dark:text-[#191E1F] font-medium text-sm transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#9C9F52]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-current/30 border-t-current rounded-full animate-spin" />
                ) : (
                  <>
                    <span>{mode === 'signin' ? 'Sign In' : 'Create an Account'}</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>

            {/* Google Login */}
            <div className="mt-4">
              <button
                type="button"
                onClick={handleGoogleLogin}
                disabled={loading}
                className="w-full min-h-[44px] py-2.5 px-4 rounded-lg border border-[#3D4547]/20 dark:border-[#424844] bg-[#EDEEE9] dark:bg-[#191E1F] hover:bg-[#ECD0C2]/40 dark:hover:bg-[#343A36] text-[#3D4547] dark:text-[#EDEEE9] text-xs sm:text-sm font-medium flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
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

            {/* Footer toggle */}
            <div className="mt-6 text-center text-xs text-[#535C5E] dark:text-[#B8B9AF]">
              {mode === 'signin' ? (
                <span>
                  Don&apos;t have an account?{' '}
                  <button
                    type="button"
                    onClick={() => {
                      setMode('signup');
                      setErrorMsg(null);
                    }}
                    className="text-[#B42B2F] dark:text-[#D65356] font-medium hover:underline cursor-pointer"
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
                    className="text-[#B42B2F] dark:text-[#D65356] font-medium hover:underline cursor-pointer"
                  >
                    Sign In
                  </button>
                </span>
              )}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
