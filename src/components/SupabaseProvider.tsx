"use client";

import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { useRouter } from 'next/navigation';
import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext<{
  isLoading: boolean;
  isAuthenticated: boolean;
}>({
  isLoading: true,
  isAuthenticated: false,
});

export function SupabaseProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const router = useRouter();
  const supabase = createClientComponentClient();

  useEffect(() => {
    let mounted = true;

    // Initial session check
    const checkSession = async () => {
      try {
        console.log('🔍 Checking initial session...');
        
        // Clear any existing session on startup
        if (window.location.pathname === '/') {
          await supabase.auth.signOut();
          setIsAuthenticated(false);
          setIsLoading(false);
          return;
        }

        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error('❌ Session check error:', error);
          setIsAuthenticated(false);
          setIsLoading(false);
          if (window.location.pathname.startsWith('/dashboard')) {
            router.replace('/');
          }
          return;
        }

        console.log('📊 Initial session state:', { hasSession: !!session });
        
        if (session?.expires_at) {
          const expiresAt = new Date(session.expires_at * 1000);
          const now = new Date();
          
          if (expiresAt <= now) {
            console.log('⚠️ Session expired, signing out...');
            await supabase.auth.signOut();
            setIsAuthenticated(false);
            setIsLoading(false);
            if (window.location.pathname.startsWith('/dashboard')) {
              router.replace('/');
            }
            return;
          }
          
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(!!session);
          if (!session && window.location.pathname.startsWith('/dashboard')) {
            router.replace('/');
          }
        }
        
        setIsLoading(false);
      } catch (error) {
        console.error('❌ Session check error:', error);
        if (mounted) {
          setIsAuthenticated(false);
          setIsLoading(false);
          if (window.location.pathname.startsWith('/dashboard')) {
            router.replace('/');
          }
        }
      }
    };

    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('🔔 Auth state changed:', { event, hasSession: !!session });
        
        if (!mounted) return;

        if (event === 'TOKEN_REFRESHED') {
          console.log('🔄 Token refreshed');
          return;
        }

        if (event === 'SIGNED_IN' && session) {
          console.log('✅ User signed in');
          setIsAuthenticated(true);
          setIsLoading(false);
          router.push('/dashboard');
        } else if (event === 'SIGNED_OUT') {
          console.log('👋 User signed out');
          setIsAuthenticated(false);
          setIsLoading(false);
          router.push('/');
        }
      }
    );

    checkSession();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [supabase, router]);

  return (
    <AuthContext.Provider value={{ isLoading, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within a SupabaseProvider');
  }
  return context;
}; 