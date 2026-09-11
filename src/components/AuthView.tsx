'use client';

import React, { useState } from 'react';
import { signInWithEmailAndPassword, signUpWithEmailAndPassword } from '../lib/services/authService';
import { createUserDoc } from '../lib/services/userService';

export default function AuthView() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isBusinessPage = typeof window !== 'undefined' && window.location.pathname.startsWith('/business');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    
    if (!email || !password) {
      setError('Please fill in all fields.');
      return;
    }

    if (isSignUp && password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      if (isSignUp) {
        // Sign up
        const userCredential = await signUpWithEmailAndPassword(email, password);
        const user = userCredential.user;
        // Create user document in Firestore with 0 points
        await createUserDoc(user.uid);
      } else {
        // Sign in
        await signInWithEmailAndPassword(email, password);
      }
    } catch (err: any) {
      console.error(err);
      let message = 'An authentication error occurred.';
      if (err.code === 'auth/email-already-in-use') {
        message = 'This email is already registered.';
      } else if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Invalid email address format.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Password should be at least 6 characters.';
      }
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full justify-center bg-transparent px-6 py-12 select-none overflow-y-auto">
      <div className="w-full max-w-sm mx-auto">
        
        {/* Spot Logo and Header */}
        <div className="text-center mb-10 mt-6">
          <div className="inline-flex items-center justify-center w-24 h-24 rounded-3xl bg-spot-orange shadow-lg mb-6 transform -rotate-6 hover:rotate-0 transition-transform duration-300">
            <span className="text-5xl font-black text-white">S</span>
          </div>
          <h2 className="text-4xl font-black tracking-tight text-spot-ink mb-3">
            {isSignUp ? 'Join Spot' : 'Get Spot\'d'}
          </h2>
          <p className="text-base text-spot-muted font-bold">
            {isSignUp 
              ? 'Claim your parking identity and start earning.' 
              : 'Sign in. Find a spot. Claim it.'}
          </p>
        </div>

        <div className="bg-spot-cream p-6 rounded-3xl">
          {/* Error Alert Box */}
          {error && (
            <div className="bg-red-500/90 text-white p-3 rounded-2xl text-xs font-bold flex items-center space-x-2 animate-bounce mb-6">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-spot-ink mb-2">
                Email
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@domain.com"
                className="w-full bg-white border-2 border-spot-ink/10 rounded-2xl px-5 py-4 text-sm text-spot-ink font-bold placeholder-spot-muted focus:outline-none focus:border-spot-orange transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-spot-ink mb-2">
                Password
              </label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-white border-2 border-spot-ink/10 rounded-2xl px-5 py-4 text-sm text-spot-ink font-bold placeholder-spot-muted focus:outline-none focus:border-spot-orange transition-colors"
              />
            </div>

            {isSignUp && (
              <div>
                <label className="block text-xs font-black uppercase tracking-widest text-spot-ink mb-2">
                  Confirm Password
                </label>
                <input
                  type="password"
                  required
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white border-2 border-spot-ink/10 rounded-2xl px-5 py-4 text-sm text-spot-ink font-bold placeholder-spot-muted focus:outline-none focus:border-spot-orange transition-colors"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-spot-orange hover:bg-spot-orange/90 text-white font-black py-5 px-4 rounded-2xl text-base transition-all duration-300 flex items-center justify-center space-x-2 disabled:opacity-70 mt-4 shadow-[0_4px_0_0_#171717] active:shadow-none active:translate-y-1 border-2 border-spot-ink"
            >
              {loading ? (
                <span className="w-6 h-6 border-4 border-white/30 border-t-white rounded-full animate-spin"></span>
              ) : (
                <span>{isSignUp ? 'Create Account' : 'Let\'s Go'}</span>
              )}
            </button>
          </form>

          {/* Toggle between Sign In and Sign Up */}
          <div className="text-center mt-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
              }}
              className="text-sm text-spot-muted hover:text-spot-ink transition-colors font-bold tracking-wide"
            >
              {isSignUp 
                ? 'Got an account? Sign In' 
                : "Need an account? Sign Up"}
            </button>
          </div>
        </div>

        {/* Business CTA */}
        {!isBusinessPage && (
          <div className="mt-8 text-center animate-in fade-in duration-500">
            <a 
              href="/business" 
              className="inline-flex items-center justify-center py-2.5 px-5 text-xs font-black tracking-widest uppercase text-spot-muted hover:text-spot-ink bg-transparent border-2 border-spot-ink/10 hover:border-spot-ink/30 rounded-full transition-all"
            >
              Spot for Business
            </a>
          </div>
        )}

      </div>
    </div>
  );
}
