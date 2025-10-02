"use client";

import { useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Shield, Loader2 } from "lucide-react";

import Home from "./home/page";

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated" && session?.user?.role) {
      // Redirect automatically to the correct dashboard
      router.replace(`/dashboard/${session.user.role}`);
    }
  }, [status, session, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          {/* Logo */}
          <div className="flex items-center justify-center space-x-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center animate-pulse">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
              CertiVault
            </span>
          </div>
          
          {/* Loading Animation */}
          <div className="flex items-center justify-center gap-3 text-slate-300">
            <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
            <span className="text-lg font-medium">Loading...</span>
          </div>
          
          {/* Loading Description */}
          <p className="text-slate-400 mt-4 max-w-md">
            Initializing secure certificate management system
          </p>
          
          {/* Loading Bar */}
          <div className="w-64 bg-slate-800 rounded-full h-2 mt-6 mx-auto overflow-hidden">
            <div className="bg-gradient-to-r from-cyan-400 to-purple-500 h-full rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>
    );
  }

  // Not logged in → show landing page
  return <Home />;
}