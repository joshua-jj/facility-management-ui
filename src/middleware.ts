import { NextRequest, NextResponse } from 'next/server';

/**
 * Server-side middleware for route protection.
 * Checks for the authToken cookie before allowing access to /admin/* routes.
 * This supplements the client-side PrivateRoute component.
 */
export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Only protect admin routes
  if (!pathname.startsWith('/admin')) {
    return NextResponse.next();
  }

  const token = request.cookies.get('authToken')?.value;

  if (!token) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('from', encodeURIComponent(pathname));
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/admin/:path*'],
};
