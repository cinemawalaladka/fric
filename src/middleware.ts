import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Middleware Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are missing.'
    );
    return supabaseResponse;
  }

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;

  // ====== Public routes — always accessible ======
  if (
    pathname === '/' ||
    pathname === '/policy' ||
    pathname === '/guidelines' ||
    pathname.startsWith('/auth/') ||
    pathname === '/login' ||
    pathname === '/admin-login' ||
    pathname.endsWith('.pdf') ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.ico')
  ) {
    return supabaseResponse;
  }

  // ====== Admin routes — check admin session cookie or authenticated Supabase user ======
  if (pathname.startsWith('/admin')) {
    const adminSession = request.cookies.get('admin_session');
    if (adminSession?.value || user) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin-login';
    return NextResponse.redirect(url);
  }

  // ====== Protected routes — require Supabase auth ======
  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ====== Role-based access for faculty and verifier routes ======
  // Note: Fine-grained role checks happen at the page/action level
  // Middleware just ensures authentication
  if (pathname.startsWith('/faculty') || pathname.startsWith('/verifier')) {
    return supabaseResponse;
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization)
     * - favicon.ico (favicon)
     * - public folder files
     * - API routes (handled separately)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|pdf|html|txt)$|api/).*)',
  ],
};
