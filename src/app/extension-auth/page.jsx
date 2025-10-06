'use client';

import { useSession } from 'next-auth/react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2, CheckCircle, AlertCircle } from 'lucide-react';

export default function ExtensionAuth() {
  const { data: session, status } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const email = searchParams.get('email');
  const [authStatus, setAuthStatus] = useState('checking');

  useEffect(() => {
    if (status === 'authenticated' && session?.user?.email === email) {
      fetch('/api/auth/extension-token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      })
      .then(res => res.json())
      .then(data => {
        if (data.token) {
          setAuthStatus('success');
          
          if (window.opener) {
            window.opener.postMessage({
              type: 'certivault-auth-complete',
              token: data.token,
              email: email
            }, '*');
          }
          
          if (typeof chrome !== 'undefined' && chrome.runtime) {
            chrome.runtime.sendMessage({
              action: 'authComplete',
              token: data.token,
              email: email
            });
          }
          
          setTimeout(() => {
            window.close();
          }, 2000);
        } else {
          setAuthStatus('error');
        }
      })
      .catch((err) => {
        console.error('Token fetch error:', err);
        setAuthStatus('error');
      });
    } else if (status === 'unauthenticated') {
      setAuthStatus('needLogin');
    } else if (status === 'authenticated' && session?.user?.email !== email) {
      setAuthStatus('emailMismatch');
    }
  }, [status, session, email]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-6">
      <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-8 max-w-md w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-cyan-400 mb-4">
            CertiVault Extension Auth
          </h1>

          {authStatus === 'checking' && (
            <>
              <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
              <p className="text-slate-300">Verifying your account...</p>
            </>
          )}

          {authStatus === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 text-green-400 mx-auto mb-4" />
              <p className="text-green-400 text-lg font-semibold mb-2">Success!</p>
              <p className="text-slate-300 mb-2">Extension connected successfully!</p>
              <p className="text-slate-400 text-sm">You can close this tab or it will close automatically.</p>
            </>
          )}

          {authStatus === 'needLogin' && (
            <>
              <AlertCircle className="w-16 h-16 text-yellow-400 mx-auto mb-4" />
              <p className="text-yellow-400 text-lg font-semibold mb-2">Please Sign In</p>
              <p className="text-slate-300 mb-4">You need to sign in to CertiVault first</p>
              <button
                onClick={() => router.push('/')}
                className="bg-cyan-500 hover:bg-cyan-600 text-white px-6 py-2 rounded-lg"
              >
                Go to CertiVault
              </button>
            </>
          )}

          {authStatus === 'emailMismatch' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-lg font-semibold mb-2">Email Mismatch</p>
              <p className="text-slate-300 mb-2">Logged in as: {session?.user?.email}</p>
              <p className="text-slate-300">Expected: {email}</p>
              <p className="text-slate-400 text-sm mt-4">Please sign out and sign in with the correct account</p>
            </>
          )}

          {authStatus === 'error' && (
            <>
              <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
              <p className="text-red-400 text-lg font-semibold mb-2">Error</p>
              <p className="text-slate-300">Failed to connect extension. Please try again.</p>
            </>
          )}
        </div>
      </div>
    </div>
  );
}