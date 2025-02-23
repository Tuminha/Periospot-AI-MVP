import { createRouteHandlerClient } from '@supabase/auth-helpers-nextjs'
import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  const requestUrl = new URL(request.url)
  const code = requestUrl.searchParams.get('code')

  if (code) {
    const supabase = createRouteHandlerClient({ cookies })
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    
    if (error) {
      console.error('Auth callback error:', error)
      return NextResponse.redirect(
        `${requestUrl.origin}?error=auth_exchange&description=${encodeURIComponent(error.message)}`
      )
    }

    return NextResponse.redirect(`${requestUrl.origin}/dashboard`)
  }

  // Return the user to an error page with some instructions
  return NextResponse.redirect(
    `${requestUrl.origin}?error=no_code`
  )
} 