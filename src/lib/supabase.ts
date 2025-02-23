import { createClient } from '@supabase/supabase-js';
import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs';

// Validate environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL');
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL');
}
if (!supabaseAnonKey) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_ANON_KEY');
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_ANON_KEY');
}

const isClient = typeof window !== 'undefined';
const isDevelopment = process.env.NODE_ENV === 'development';

// Create a singleton instance
let supabase: any;

if (!supabase) {
  const storageKey = `sb-${supabaseUrl?.split('.')?.[0]?.split('//')[1]}-auth-token`;
  const cookieName = `sb-${supabaseUrl?.split('.')?.[0]?.split('//')[1]}-auth`;
  const pkceVerifierKey = `sb-${supabaseUrl?.split('.')?.[0]?.split('//')[1]}-auth-token-code-verifier`;
  const pkceStateKey = `sb-${supabaseUrl?.split('.')?.[0]?.split('//')[1]}-auth-token-state`;

  console.log('🔧 Initializing Supabase client with:', {
    url: supabaseUrl,
    hasAnonKey: !!supabaseAnonKey,
    environment: isClient ? 'client' : 'server',
    storageKey,
    cookieName,
    localStorage: isClient ? (window.localStorage ? 'available' : 'unavailable') : 'n/a',
    cookiesEnabled: isClient ? navigator.cookieEnabled : 'n/a',
    timestamp: new Date().toISOString()
  });

  try {
    const options = {
      auth: {
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
        autoRefreshToken: true,
        storage: isClient ? window.localStorage : undefined,
        storageKey,
        debug: isDevelopment,
        cookieOptions: {
          name: cookieName,
          lifetime: 60 * 60 * 24 * 7, // 7 days
          domain: isDevelopment ? 'localhost' : undefined,
          sameSite: 'lax',
          secure: !isDevelopment,
          path: '/'
        }
      },
      global: {
        headers: { 'x-client-info': 'periospot-ai' }
      }
    };

    // Use different client initialization based on environment
    if (isClient) {
      // Create browser client for client-side
      supabase = createBrowserSupabaseClient({
        supabaseUrl,
        supabaseKey: supabaseAnonKey,
        options: {
          ...options,
          auth: {
            ...options.auth,
            storage: window.localStorage,
            onAuthStateChange: (event, session) => {
              console.log('🔄 Auth state changed:', {
                event,
                hasSession: !!session,
                user: session?.user?.email,
                timestamp: new Date().toISOString(),
                storage: {
                  hasItem: !!window.localStorage.getItem(storageKey),
                  pkceVerifier: !!window.localStorage.getItem(pkceVerifierKey),
                  pkceState: !!window.localStorage.getItem(pkceStateKey),
                  verifierValue: window.localStorage.getItem(pkceVerifierKey)?.substring(0, 8) + '...',
                  stateValue: window.localStorage.getItem(pkceStateKey)?.substring(0, 8) + '...'
                }
              });

              // Only clear PKCE state after successful sign in and session is stored
              if (event === 'SIGNED_IN' && session) {
                // Wait longer to ensure session is properly stored
                setTimeout(() => {
                  const storedSession = window.localStorage.getItem(storageKey);
                  if (storedSession) {
                    console.log('🧹 Clearing PKCE state after successful sign in');
                    window.localStorage.removeItem(pkceVerifierKey);
                    window.localStorage.removeItem(pkceStateKey);
                  } else {
                    console.warn('⚠️ Not clearing PKCE state - session not found in storage');
                  }
                }, 2000);
              }

              // Ensure session is properly stored
              if (session) {
                const sessionStr = JSON.stringify(session);
                try {
                  window.localStorage.setItem(storageKey, sessionStr);
                  console.log('💾 Session stored in localStorage');

                  // Set session cookie with proper attributes
                  const cookieValue = encodeURIComponent(sessionStr);
                  const maxAge = 60 * 60 * 24 * 7; // 7 days
                  const cookieAttributes = [
                    `${cookieName}=${cookieValue}`,
                    'path=/',
                    `max-age=${maxAge}`,
                    'SameSite=Lax',
                    isDevelopment ? '' : 'Secure'
                  ].filter(Boolean).join('; ');

                  document.cookie = cookieAttributes;
                  console.log('🍪 Session cookie set');
                } catch (error) {
                  console.error('❌ Error storing session:', error);
                }
              }
            }
          }
        }
      });

      // Initial storage check
      console.log('🔐 Initial storage check:', {
        localStorage: {
          available: !!window.localStorage,
          keys: Object.keys(window.localStorage)
            .filter(key => key.includes('supabase') || key.includes('sb-'))
            .reduce((acc, key) => ({
              ...acc,
              [key]: key.includes('verifier') || key.includes('state')
                ? window.localStorage.getItem(key)?.substring(0, 8) + '...'
                : 'present'
            }), {})
        },
        cookies: document.cookie.split(';')
          .map(c => c.trim())
          .filter(c => c.startsWith('sb-'))
          .map(c => c.split('=')[0])
      });
    } else {
      // Create standard client for server-side
      supabase = createClient(supabaseUrl, supabaseAnonKey, options);
    }
  } catch (error) {
    console.error('❌ Error initializing Supabase client:', error);
    throw error;
  }
}

export { supabase };