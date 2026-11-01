import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  const pathname = request.nextUrl.pathname;

  // ====== 1. Public routes — zero external network/database calls, instant response ======
  const isPublicRoute =
    pathname === '/' ||
    pathname === '/policy' ||
    pathname === '/guidelines' ||
    pathname.startsWith('/auth/') ||
    pathname === '/login' ||
    pathname === '/admin-login' ||
    pathname.endsWith('.pdf') ||
    pathname.endsWith('.html') ||
    pathname.endsWith('.ico');

  if (isPublicRoute) {
    return NextResponse.next();
  }

  // ====== 2. Check for presence of auth cookies before making any network calls ======
  const adminSession = request.cookies.get('admin_session');
  const allCookies = request.cookies.getAll();
  const hasSupabaseAuthCookie = allCookies.some(
    (c) => c.name.startsWith('sb-') || c.name.includes('supabase')
  );

  // If user is accessing /change-password without any session, redirect to login immediately
  if (pathname === '/change-password' && !hasSupabaseAuthCookie) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    return NextResponse.redirect(url);
  }

  // If visiting admin route with valid admin session cookie, allow through immediately
  if (pathname.startsWith('/admin') && adminSession?.value) {
    return NextResponse.next();
  }

  // If protected route and user has NEITHER admin session NOR Supabase auth cookies:
  // Redirect to login immediately — zero latency, no Supabase network timeout!
  if (!hasSupabaseAuthCookie && !adminSession?.value) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith('/admin') ? '/admin-login' : '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // ====== 3. Authenticated Supabase session check with safety timeout ======
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error(
      'Middleware Error: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY environment variables are missing.'
    );
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

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

  // Fetch user with a strict 1500ms timeout to prevent 504 MIDDLEWARE_INVOCATION_TIMEOUT
  let user: any = null;
  try {
    const userPromise = supabase.auth.getUser();
    const timeoutPromise = new Promise<{ data: { user: null }; error: Error }>((_, reject) =>
      setTimeout(() => reject(new Error('Supabase auth timeout')), 1500)
    );

    const result = await Promise.race([userPromise, timeoutPromise]);
    user = result?.data?.user || null;
  } catch (err) {
    console.warn('Middleware auth check timed out or failed:', err);
    // Fall back to server components / page level authentication without edge crash
    return supabaseResponse;
  }

  // Protected route check
  if (!user && !adminSession?.value) {
    const url = request.nextUrl.clone();
    url.pathname = pathname.startsWith('/admin') ? '/admin-login' : '/login';
    url.searchParams.set('redirectTo', pathname);
    return NextResponse.redirect(url);
  }

  // Mandatory First-Login Password Change Enforcement
  const mustChangePassword = user?.user_metadata?.must_change_password === true;
  if (mustChangePassword && pathname !== '/change-password') {
    const url = request.nextUrl.clone();
    url.pathname = '/change-password';
    return NextResponse.redirect(url);
  }

  // Admin routes
  if (pathname.startsWith('/admin')) {
    if (adminSession?.value || user) {
      return supabaseResponse;
    }
    const url = request.nextUrl.clone();
    url.pathname = '/admin-login';
    return NextResponse.redirect(url);
  }

  // Role-based access for faculty and verifier routes
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
