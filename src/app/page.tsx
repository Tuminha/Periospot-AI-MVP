'use client';

import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useAuth } from '@/components/SupabaseProvider';

export default function Home() {
  const supabase = createClientComponentClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const error = searchParams.get('error');
  const [initError, setInitError] = useState<Error | null>(null);
  const { isLoading, isAuthenticated } = useAuth();

  useEffect(() => {
    // Clear any existing session when landing on home page
    const clearSession = async () => {
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.error('Error clearing session:', error);
      }
    };
    clearSession();
  }, [supabase]);

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
        }
      });
      
      if (error) throw error;
    } catch (e) {
      console.error('Sign in error:', e);
      setInitError(e as Error);
    }
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-periospot-blue-strong mb-4"></div>
          <p className="text-periospot-blue-strong">Loading...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (initError) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <div className="text-center p-8">
          <div className="text-red-600 mb-4">Error initializing application</div>
          <pre className="text-sm text-gray-600 whitespace-pre-wrap break-words max-w-lg mx-auto">
            {initError.message}
          </pre>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-periospot-blue-strong">
      {error && (
        <div className="max-w-7xl mx-auto px-4 py-3 bg-red-100 text-red-700 rounded-md mt-4">
          {error === 'oauth' &&
            `Authentication error: ${
              searchParams.get('description') ||
              'There was an error with Google authentication'
            }. Please try again.`}
          {error === 'no_code' && 'Authentication code missing. Please try again.'}
          {error === 'auth_exchange' &&
            `Authentication failed: ${
              searchParams.get('description') ||
              'There was an error completing authentication'
            }. Please try again.`}
          {error === 'no_session' && 'No session was created. Please try again.'}
          {error === 'unexpected' && 'An unexpected error occurred. Please try again.'}
          {error === 'auth' && 'Authentication error. Please try again.'}
          {error === 'session_verification' && 'Could not verify your session. Please try again.'}
        </div>
      )}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center">
          <Image
            src="/images/periospot_ai_logo 1.png"
            alt="Periospot AI Logo"
            width={200}
            height={80}
            priority
            className="mx-auto mb-8"
          />
          <h1 className="text-4xl font-bold text-periospot-blue-strong dark:text-periospot-white sm:text-5xl md:text-6xl tracking-tight">
            <span className="block font-extrabold">Periospot AI</span>
            <span className="block text-periospot-blue-mystic text-2xl mt-3 font-medium dark:text-periospot-cream">
              Scientific Article Analysis for Dental Professionals
            </span>
          </h1>
          <p className="mt-3 max-w-md mx-auto text-base text-periospot-blue-mystic dark:text-periospot-cream sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            Upload your dental research papers and let our AI analyze them for inconsistencies,
            statistical flaws, and reference accuracy.
          </p>
          
          <div className="mt-8">
            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-periospot-white bg-periospot-blue-strong hover:bg-periospot-blue-mystic focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-periospot-blue-mystic transition-colors"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path
                  fill="currentColor"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="currentColor"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="currentColor"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="currentColor"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Log in with Google
            </button>
          </div>
        </div>

        <div className="mt-16">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            {/* Analysis Feature Card */}
            <div className="relative group bg-white dark:bg-periospot-blue-mystic p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-periospot-blue-strong rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-periospot-cream dark:bg-periospot-blue-strong text-periospot-blue-strong dark:text-periospot-cream ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-periospot-blue-strong dark:text-periospot-white">
                  <a href="#" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Results Analysis
                  </a>
                </h3>
                <p className="mt-2 text-sm text-periospot-blue-mystic dark:text-periospot-cream">
                  Detect inconsistencies between results and conclusions in dental research papers.
                </p>
              </div>
            </div>

            {/* Statistical Analysis Card */}
            <div className="relative group bg-white dark:bg-periospot-blue-mystic p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-periospot-blue-strong rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-periospot-cream dark:bg-periospot-blue-strong text-periospot-blue-strong dark:text-periospot-cream ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-periospot-blue-strong dark:text-periospot-white">
                  <a href="#" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Statistical Verification
                  </a>
                </h3>
                <p className="mt-2 text-sm text-periospot-blue-mystic dark:text-periospot-cream">
                  Identify statistical flaws and validate methodological approaches.
                </p>
              </div>
            </div>

            {/* Reference Check Card */}
            <div className="relative group bg-white dark:bg-periospot-blue-mystic p-6 focus-within:ring-2 focus-within:ring-inset focus-within:ring-periospot-blue-strong rounded-lg shadow-sm hover:shadow-lg transition-all">
              <div>
                <span className="rounded-lg inline-flex p-3 bg-periospot-cream dark:bg-periospot-blue-strong text-periospot-blue-strong dark:text-periospot-cream ring-4 ring-white">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                </span>
              </div>
              <div className="mt-8">
                <h3 className="text-lg font-semibold text-periospot-blue-strong dark:text-periospot-white">
                  <a href="#" className="focus:outline-none">
                    <span className="absolute inset-0" aria-hidden="true" />
                    Reference Validation
                  </a>
                </h3>
                <p className="mt-2 text-sm text-periospot-blue-mystic dark:text-periospot-cream">
                  Check for accurate interpretation and citation of referenced works.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
