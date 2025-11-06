// app/dashboard/employer/page.js
"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { 
  Shield, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Eye,
  TrendingUp,
  Loader2,
  Search,
  Award,
  Share2
} from "lucide-react";
import Link from "next/link";

export default function EmployerDashboard() {
  const { data: session, status } = useSession();
  const [stats, setStats] = useState({
    totalShared: 0,
    pendingReview: 0,
    verifiedCertificates: 0,
    totalStudents: 0
  });
  const [recentShares, setRecentShares] = useState([]);
  const [employerInfo, setEmployerInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchDashboardStats();
    }
  }, [status]);

  const fetchDashboardStats = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/certifictes/employerdash');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch dashboard stats');
      }

      const data = await res.json();
      
      if (data.success) {
        setStats(data.stats);
        setRecentShares(data.recentShares || []);
        setEmployerInfo(data.employer);
      }
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (status === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-8">
          <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
          <p className="text-slate-400">Please sign in to view your dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Employer Dashboard
              </h1>
              <p className="text-slate-400">Welcome back, {session?.user?.name}!</p>
            </div>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-4">
            <p className="text-slate-300">
              <span className="text-cyan-400 font-semibold">Role:</span> {session?.user?.role} • 
              <span className="text-cyan-400 font-semibold ml-2">Organization:</span> {employerInfo?.name || session?.user?.name}
            </p>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Shared Certificates</p>
                <p className="text-3xl font-bold text-cyan-400">{stats.totalShared}</p>
              </div>
              <Share2 className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <FileText className="w-4 h-4 text-cyan-400" />
              <span className="text-cyan-400 text-sm">Total received</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pendingReview}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">
                {stats.pendingReview > 0 ? 'Requires review' : 'All reviewed'}
              </span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Verified Certificates</p>
                <p className="text-3xl font-bold text-green-400">{stats.verifiedCertificates}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Award className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Institutionally verified</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Unique Students</p>
                <p className="text-3xl font-bold text-purple-400">{stats.totalStudents}</p>
              </div>
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Candidates</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/employer/shared" className="group">
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-cyan-400">Shared Documents</h3>
                    <p className="text-slate-400">View all shared certificates</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/employer/view-shared" className="group">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-purple-400">Students</h3>
                    <p className="text-slate-400">Browse by student</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/employer/search" className="group">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Search className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-green-400">Search</h3>
                    <p className="text-slate-400">Find specific certificates</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Shares */}
        <div className="mb-8">
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-cyan-400">Recently Shared Certificates</h2>
              <Link href="/dashboard/employer/shared" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-1">
                View All <Eye className="w-4 h-4" />
              </Link>
            </div>

            {recentShares.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="w-12 h-12 text-slate-400 mx-auto mb-3" />
                <p className="text-slate-400">No certificates shared yet</p>
                <p className="text-slate-500 text-sm mt-2">Students will share their certificates with you for verification</p>
              </div>
            ) : (
              <div className="space-y-4">
                {recentShares.map((share) => (
                  <Link 
                    key={share._id} 
                    href={`/dashboard/employer/certificates/${share.certificate._id}`}
                    className="block"
                  >
                    <div className="bg-slate-700/30 border border-slate-600 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <p className="font-semibold text-white">{share.student.name}</p>
                            {share.certificate.verification?.isVerified && (
                              <CheckCircle className="w-4 h-4 text-green-400" />
                            )}
                          </div>
                          <p className="text-slate-400 text-sm">{share.certificate.title}</p>
                          <p className="text-slate-500 text-xs mt-1">
                            Shared: {formatDate(share.sharedAt)}
                          </p>
                        </div>
                        <div className="text-right">
                          {share.isReviewed ? (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-green-500/20 text-green-400 border border-green-500/30">
                              Reviewed
                            </span>
                          ) : (
                            <span className="inline-flex px-3 py-1 rounded-full text-xs font-medium bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
                              New
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Key Features */}
        <div className="bg-slate-800/20 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">Employer Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="font-semibold text-white">Verify Authenticity</h3>
                <p className="text-slate-400 text-sm">Check digital signatures & validity</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white">View Certificates</h3>
                <p className="text-slate-400 text-sm">Access shared documents securely</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="font-semibold text-white">Track Candidates</h3>
                <p className="text-slate-400 text-sm">Manage student applications</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}