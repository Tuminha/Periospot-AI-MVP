"use client";

import { useState } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { SessionContextProvider, Session } from '@supabase/auth-helpers-react';

export default function SupabaseProvider({
  children,
  initialSession,
}: {
  children: React.ReactNode;
  initialSession: Session | null;
}) {
  const [supabaseClient] = useState(() => createClientComponentClient());

  return (
    <SessionContextProvider 
      supabaseClient={supabaseClient} 
      initialSession={initialSession}
    >
      {children}
    </SessionContextProvider>
  );
} 