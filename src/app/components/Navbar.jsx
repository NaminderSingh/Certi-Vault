"use client";

import { signOut, useSession } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, LogOut, User } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();

  // Hide navbar on landing page
  if (pathname === "/") {
    return null;
  }

  const handleLogout = () => {
    signOut({ callbackUrl: "/" });
  };

  return (
    <nav className="bg-slate-900/95 backdrop-blur-md border-b border-slate-800 text-white px-6 py-4 flex justify-between items-center sticky top-0 z-50">
      {/* Left side: Logo + Role-specific navigation */}
      <div className="flex items-center gap-8">
        {/* Logo */}
        <Link href="/" className="flex items-center space-x-2 group">
          <div className="w-8 h-8 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
            CertiVault
          </span>
        </Link>
        
        {/* Student Navigation */}
        {session?.user?.role === "student" && (
          <div className="flex items-center gap-6">
            
            <Link 
              href="/dashboard/student/upload" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Upload Certificates
            </Link>
            <Link 
              href="/myfiles" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              My Files
            </Link>
            <Link 
              href="/dashboard/student/profile" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Profile
            </Link>
          </div>
        )}

        {/* Institution Navigation */}
        {session?.user?.role === "institution" && (
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard/institution/issue" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Issue Certificate
            </Link>
            <Link 
              href="/dashboard/institution/manageRequests" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Manage Requests
            </Link>
            <Link 
              href="/dashboard/institution/profile" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Profile
            </Link>
          </div>
        )}

        {/* Verifier Navigation */}
        {session?.user?.role === "verifier" && (
          <div className="flex items-center gap-6">
            <Link 
              href="/dashboard/verifier/verify" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Verify Certificates
            </Link>
            <Link 
              href="/dashboard/verifier/history" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              History
            </Link>
            <Link 
              href="/dashboard/verifier/profile" 
              className="text-slate-300 hover:text-cyan-400 transition-colors duration-200 font-medium"
            >
              Profile
            </Link>
          </div>
        )}
      </div>

      {/* Right side: User info + Logout */}
      {session ? (
        <div className="flex items-center gap-4">
          {/* User Info */}
          <div className="flex items-center gap-3 bg-slate-800/50 rounded-full px-4 py-2 border border-slate-700">
            <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-medium text-slate-200">
                {session.user.name}
              </span>
              <span className="text-xs text-slate-400 capitalize">
                {session.user.role}
              </span>
            </div>
          </div>

          {/* Logout Button */}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 px-4 py-2 rounded-full transition-all duration-200 transform hover:scale-105 font-medium"
          >
            <LogOut className="w-4 h-4" />
            Logout
          </button>
        </div>
      ) : (
        <Link 
          href="/" 
          className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 px-6 py-2 rounded-full transition-all duration-200 transform hover:scale-105 font-medium"
        >
          Login
        </Link>
      )}
    </nav>
  );
}