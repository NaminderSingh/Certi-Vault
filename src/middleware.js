import { withAuth } from "next-auth/middleware";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const role = req.nextauth.token?.role;

    console.log("🔍 Role in middleware:", role);
    console.log("🔍 Current pathname:", pathname);

    // Force user to pick a role if null
    if (pathname.startsWith("/dashboard") && !role) {
      return Response.redirect(new URL("/select-role", req.url));
    }

    // Role-based redirects - only redirect if user is on generic /dashboard
    if (pathname === "/dashboard" && role) {
      return Response.redirect(new URL(`/dashboard/${role}`, req.url));
    }

    // Role-based restrictions (uncomment if needed)
    if (pathname.startsWith("/dashboard/student") && role !== "student") {
      return Response.redirect(new URL("/unauthorized", req.url));
    }
    if (pathname.startsWith("/dashboard/institution") && role !== "institution") {
      return Response.redirect(new URL("/unauthorized", req.url));
    }
    if (pathname.startsWith("/dashboard/employer") && role !== "employer") {
      return Response.redirect(new URL("/unauthorized", req.url));
    }
  },
  {
    callbacks: {
      authorized: ({ token }) => !!token, // logged-in users only
    },
  }
);

export const config = {
  matcher: ["/dashboard/:path*"], // protect all dashboards
};