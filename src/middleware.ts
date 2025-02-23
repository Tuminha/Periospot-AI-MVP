import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const supabase = createMiddlewareClient({ req, res });

  // Only run this middleware for dashboard routes
  if (!req.nextUrl.pathname.startsWith('/dashboard')) {
    return res;
  }

  try {
    const { data: { session }, error } = await supabase.auth.getSession();
    console.log('🔒 Middleware checking session:', { hasSession: !!session, path: req.nextUrl.pathname });

    if (error) {
      console.error('❌ Session error in middleware:', error);
      return NextResponse.redirect(new URL('/', req.url));
    }

    if (!session) {
      console.log('⚠️ No session found, redirecting to home');
      return NextResponse.redirect(new URL('/', req.url));
    }

    // Session exists, allow access to dashboard
    return res;
  } catch (error) {
    console.error('❌ Middleware error:', error);
    return NextResponse.redirect(new URL('/', req.url));
  }
}

export const config = {
  matcher: '/dashboard/:path*'
}; 