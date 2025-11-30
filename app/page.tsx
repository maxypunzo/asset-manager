// app/page.tsx
'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabaseClient';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleAuth = async () => {
    setError('');

    let data, error;

    if (isSignUp) {
      ({ data, error } = await supabase.auth.signUp({ email, password }));
    } else {
      ({ data, error } = await supabase.auth.signInWithPassword({ email, password }));
    }

    if (error) {
      setError(error.message);
      return;
    }

    router.push('/dashboard');
  };

  return (
    <div className="w-full max-w-md bg-white text-slate-900 shadow-lg rounded-lg p-6">
      {/* <h1 className="text-2xl font-bold mb-4 text-slate-900">Asset Manager</h1> */}
      <h1 className="text-2xl font-bold mb-4 text-slate-900">
        Asset Manager Eport Demo
      </h1>

      <input
        className="border border-slate-300 rounded-md p-2 w-full mb-3 bg-slate-50 text-slate-900"
        placeholder="Email"
        value={email}
        onChange={e => setEmail(e.target.value)}
      />

      <input
        type="password"
        className="border border-slate-300 rounded-md p-2 w-full mb-3 bg-slate-50 text-slate-900"
        placeholder="Password"
        value={password}
        onChange={e => setPassword(e.target.value)}
      />

      {error && (
        <p className="text-red-600 text-sm mb-3">
          {error}
        </p>
      )}

      <button
        className="bg-blue-600 hover:bg-blue-700 text-white font-semibold px-4 py-2 rounded w-full mb-2"
        onClick={handleAuth}
      >
        {isSignUp ? 'Sign Up' : 'Login'}
      </button>

      <button
        type="button"
        className="mt-1 text-sm text-blue-600 hover:text-blue-700 underline"
        onClick={() => setIsSignUp(!isSignUp)}
      >
        {isSignUp ? 'Already have an account? Login' : 'No account? Sign up'}
      </button>
    </div>
  );
}