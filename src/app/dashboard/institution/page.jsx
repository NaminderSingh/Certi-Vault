"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { 
  Shield, 
  FileText, 
  Users, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Award,
  TrendingUp,
  Eye,
  Plus,
  Search,
  Filter,
  Download,
  Verified
} from "lucide-react";
import Link from "next/link";

export default function InstitutionDashboard() {
  const { data: session } = useSession();
  const [searchQuery, setSearchQuery] = useState("");

  // Mock data for demonstration
  const stats = {
    totalCertificates: 1247,
    pendingRequests: 23,
    approvedToday: 8,
    totalStudents: 892
  };

  const recentRequests = [
    {
      id: 1,
      studentName: "John Smith",
      certificateType: "Bachelor of Science",
      submissionDate: "2025-09-27",
      status: "pending",
      priority: "high"
    },
    {
      id: 2,
      studentName: "Sarah Johnson",
      certificateType: "Master of Arts",
      submissionDate: "2025-09-26",
      status: "pending",
      priority: "medium"
    },
    {
      id: 3,
      studentName: "Michael Brown",
      certificateType: "PhD Computer Science",
      submissionDate: "2025-09-25",
      status: "approved",
      priority: "low"
    }
  ];

  const recentActivity = [
    {
      id: 1,
      action: "Certificate Issued",
      student: "Alice Wilson",
      certificate: "Bachelor of Engineering",
      timestamp: "2 hours ago"
    },
    {
      id: 2,
      action: "Request Approved",
      student: "David Lee",
      certificate: "Master of Business Administration",
      timestamp: "4 hours ago"
    },
    {
      id: 3,
      action: "Digital Signature Applied",
      student: "Emma Davis",
      certificate: "Bachelor of Arts",
      timestamp: "6 hours ago"
    }
  ];

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
                Institution Dashboard
              </h1>
              <p className="text-slate-400">Welcome back, {session?.user?.name}!</p>
            </div>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-4">
            <p className="text-slate-300">
              <span className="text-cyan-400 font-semibold">Role:</span> {session?.user?.role} • 
              <span className="text-cyan-400 font-semibold ml-2">Institution:</span> Your Institution Name
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Certificates</p>
                <p className="text-3xl font-bold text-cyan-400">{stats.totalCertificates.toLocaleString()}</p>
              </div>
              <Award className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">+12% this month</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Requests</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pendingRequests}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">Requires attention</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Approved Today</p>
                <p className="text-3xl font-bold text-green-400">{stats.approvedToday}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Verified className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">All verified</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-purple-400">{stats.totalStudents.toLocaleString()}</p>
              </div>
              <Users className="w-10 h-10 text-purple-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">+5% this week</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-4 text-cyan-400">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/dashboard/institution/issue" className="group">
              <div className="bg-gradient-to-r from-cyan-500/20 to-purple-600/20 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-cyan-400">Issue Certificate</h3>
                    <p className="text-slate-400">Create new certificates for students</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/institution/manageRequests" className="group">
              <div className="bg-gradient-to-r from-yellow-500/20 to-orange-600/20 border border-yellow-500/30 rounded-2xl p-6 hover:border-yellow-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FileText className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-yellow-400">Manage Requests</h3>
                    <p className="text-slate-400">Review and approve verification requests</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/institution/profile" className="group">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-green-400">Institution Profile</h3>
                    <p className="text-slate-400">Manage institution settings and info</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Recent Requests and Activity */}
        <div className="grid lg:grid-cols-2 gap-8">
          {/* Recent Verification Requests */}
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-cyan-400">Recent Verification Requests</h2>
              <Link href="/dashboard/institution/manageRequests" className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-1">
                View All <Eye className="w-4 h-4" />
              </Link>
            </div>

            <div className="space-y-4">
              {recentRequests.map((request) => (
                <div key={request.id} className="bg-slate-700/30 border border-slate-600 rounded-xl p-4 hover:border-cyan-500/50 transition-all">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold text-white">{request.studentName}</p>
                      <p className="text-slate-400 text-sm">{request.certificateType}</p>
                      <p className="text-slate-500 text-xs">{request.submissionDate}</p>
                    </div>
                    <div className="text-right">
                      <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${
                        request.status === 'pending' 
                          ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30' 
                          : 'bg-green-500/20 text-green-400 border border-green-500/30'
                      }`}>
                        {request.status}
                      </span>
                      <p className={`text-xs mt-1 ${
                        request.priority === 'high' ? 'text-red-400' :
                        request.priority === 'medium' ? 'text-yellow-400' : 'text-green-400'
                      }`}>
                        {request.priority} priority
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-cyan-400">Recent Activity</h2>
              <button className="text-cyan-400 hover:text-cyan-300 transition-colors text-sm flex items-center gap-1">
                Export <Download className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-4 p-3 bg-slate-700/20 rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
                    <CheckCircle className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-white">{activity.action}</p>
                    <p className="text-slate-400 text-sm">{activity.student} • {activity.certificate}</p>
                    <p className="text-slate-500 text-xs">{activity.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Key Features */}
        <div className="mt-8 bg-slate-800/20 border border-slate-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold mb-4 text-cyan-400">Institution Capabilities</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-center gap-3">
              <Shield className="w-8 h-8 text-cyan-400" />
              <div>
                <h3 className="font-semibold text-white">Secure Verification</h3>
                <p className="text-slate-400 text-sm">AES encryption & digital signatures</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <FileText className="w-8 h-8 text-purple-400" />
              <div>
                <h3 className="font-semibold text-white">Certificate Management</h3>
                <p className="text-slate-400 text-sm">Issue and track all certificates</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Users className="w-8 h-8 text-green-400" />
              <div>
                <h3 className="font-semibold text-white">Student Records</h3>
                <p className="text-slate-400 text-sm">Comprehensive record management</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}