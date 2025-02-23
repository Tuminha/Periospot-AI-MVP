'use client';

import { createContext, useContext, useEffect, useState, useMemo } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter, usePathname } from 'next/navigation';

type AuthContextType = {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    console.log('🔄 AuthProvider effect starting');

    // Initialize auth state
    const initializeAuth = async () => {
      try {
        console.log('📥 Fetching initial session');
        const { data: { session: initialSession }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session fetch error:', error);
          return;
        }

        if (!mounted) {
          console.log('⚠️ Component unmounted during initialization');
          return;
        }

        console.log('✅ Session fetch complete:', { 
          hasSession: !!initialSession,
          user: initialSession?.user?.email,
          provider: initialSession?.user?.app_metadata?.provider,
          timestamp: new Date().toISOString()
        });
        
        if (initialSession) {
          setSession(initialSession);
          setUser(initialSession.user);
        }
      } catch (error) {
        console.error('❌ Auth initialization error:', error);
      } finally {
        if (mounted) {
          // Add a small delay before setting loading to false to ensure state updates have propagated
          timeoutId = setTimeout(() => {
            if (mounted) {
              setLoading(false);
              console.log('🏁 Initial loading complete');
            }
          }, 100);
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, newSession) => {
      console.log('🔔 Auth state change:', { 
        event, 
        hasSession: !!newSession,
        user: newSession?.user?.email,
        provider: newSession?.user?.app_metadata?.provider,
        timestamp: new Date().toISOString()
      });
      
      if (!mounted) return;

      if (newSession) {
        setSession(newSession);
        setUser(newSession.user);
      } else {
        setSession(null);
        setUser(null);
      }

      // Ensure loading is false after auth state change
      setLoading(false);
    });

    // Initialize auth state
    initializeAuth();

    // Handle navigation based on auth state
    const handleNavigation = () => {
      if (!mounted) return;

      console.log('🧭 Handling navigation:', {
        hasSession: !!session,
        currentPath: pathname,
        loading,
        timestamp: new Date().toISOString()
      });

      if (session) {
        if (pathname === '/' || pathname === '/auth/callback') {
          console.log('🚀 Redirecting to dashboard');
          router.replace('/dashboard');
        }
      } else if (!loading && pathname !== '/' && !pathname.startsWith('/auth/')) {
        console.log('🏠 Redirecting to home');
        router.replace('/');
      }
    };

    // Run navigation handler when auth state or pathname changes
    handleNavigation();

    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
      subscription.unsubscribe();
      console.log('🔚 AuthProvider cleanup');
    };
  }, [session, loading, router, pathname]);

  const signInWithGoogle = async () => {
    try {
      console.log('🔑 Initiating Google sign-in');
      
      // Clear any existing auth state
      if (typeof window !== 'undefined') {
        const pkceVerifierKey = 'supabase-auth-token-code-verifier';
        const pkceStateKey = 'supabase-auth-token-state';
        const storageKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')?.[0]?.split('//')[1]}-auth-token`;

        // Log current state before clearing
        console.log('📝 Current auth state:', {
          storage: {
            pkceVerifier: !!window.localStorage.getItem(pkceVerifierKey),
            pkceState: !!window.localStorage.getItem(pkceStateKey),
            session: !!window.localStorage.getItem(storageKey)
          }
        });

        // Clear PKCE and session state
        window.localStorage.removeItem(pkceVerifierKey);
        window.localStorage.removeItem(pkceStateKey);
        window.localStorage.removeItem(storageKey);

        // Also clear any existing cookies
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
      }
      
      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          },
          skipBrowserRedirect: false,
        },
      });

      if (error) {
        console.error('❌ Sign in error:', error);
        throw error;
      }

      // Log the state of the PKCE flow
      if (typeof window !== 'undefined') {
        const pkceVerifierKey = 'supabase-auth-token-code-verifier';
        const pkceStateKey = 'supabase-auth-token-state';
        
        console.log('✅ Sign in initiated:', {
          provider: 'google',
          hasAuthUrl: !!data?.url,
          timestamp: new Date().toISOString(),
          storage: {
            pkceVerifier: !!window.localStorage.getItem(pkceVerifierKey),
            pkceState: !!window.localStorage.getItem(pkceStateKey),
            verifierValue: window.localStorage.getItem(pkceVerifierKey)?.substring(0, 8) + '...',
            stateValue: window.localStorage.getItem(pkceStateKey)?.substring(0, 8) + '...'
          }
        });
      }
    } catch (error) {
      console.error('❌ Sign in error:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      console.log('👋 Initiating sign-out');

      // Clear any existing auth state before signing out
      if (typeof window !== 'undefined') {
        const pkceVerifierKey = 'supabase-auth-token-code-verifier';
        const pkceStateKey = 'supabase-auth-token-state';
        const storageKey = `sb-${process.env.NEXT_PUBLIC_SUPABASE_URL?.split('.')?.[0]?.split('//')[1]}-auth-token`;

        window.localStorage.removeItem(pkceVerifierKey);
        window.localStorage.removeItem(pkceStateKey);
        window.localStorage.removeItem(storageKey);

        // Clear cookies
        document.cookie.split(';').forEach(c => {
          document.cookie = c
            .replace(/^ +/, '')
            .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
        });
      }

      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        throw error;
      }
      
      setSession(null);
      setUser(null);

      // Force reload to ensure clean state
      window.location.href = '/';
    } catch (error) {
      console.error('❌ Sign out error:', error);
      throw error;
    }
  };

  const value = useMemo(() => ({
    user,
    session,
    loading,
    signInWithGoogle,
    signOut
  }), [user, session, loading]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
