import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/"],
  async afterAuth(auth, req) {
    try {
      // Redirect authenticated users from landing page to chat
      if (auth.userId && req.nextUrl.pathname === '/') {
        const chatUrl = new URL('/chat', req.url);
        return Response.redirect(chatUrl);
      }

      // Redirect unauthenticated users to landing page
      if (!auth.userId && req.nextUrl.pathname !== '/') {
        const landingUrl = new URL('/', req.url);
        return Response.redirect(landingUrl);
      }
    } catch (error) {
      console.error('Middleware error:', error);
    }
  }
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
}; 