"use client";

import { useSession } from "next-auth/react";
import { useState } from "react";
import { 
  Shield, 
  FileText, 
  Upload, 
  Users, 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  Award,
  TrendingUp,
  Eye,
  Plus,
  Share,
  Download,
  Verified,
  BookOpen,
  User,
  Calendar,
  FolderOpen,
  Settings
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { data: session } = useSession();

  // Mock stats - these would come from your API
  const stats = {
    totalCertificates: 0, // You can fetch this from API
    verifiedCertificates: 0,
    pendingRequests: 0,
    sharedDocuments: 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
              <User className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Student Dashboard
              </h1>
              <p className="text-slate-400">Welcome back, {session?.user?.name}!</p>
            </div>
          </div>
          
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-4">
            <p className="text-slate-300">
              <span className="text-cyan-400 font-semibold">Role:</span> {session?.user?.role} • 
              <span className="text-cyan-400 font-semibold ml-2">Account Status:</span> Active
            </p>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">My Certificates</p>
                <p className="text-3xl font-bold text-cyan-400">{stats.totalCertificates}</p>
              </div>
              <FileText className="w-10 h-10 text-cyan-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <TrendingUp className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Ready to upload more</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-green-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Verified</p>
                <p className="text-3xl font-bold text-green-400">{stats.verifiedCertificates}</p>
              </div>
              <CheckCircle className="w-10 h-10 text-green-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Verified className="w-4 h-4 text-green-400" />
              <span className="text-green-400 text-sm">Authenticity confirmed</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-yellow-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Verification</p>
                <p className="text-3xl font-bold text-yellow-400">{stats.pendingRequests}</p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <AlertCircle className="w-4 h-4 text-yellow-400" />
              <span className="text-yellow-400 text-sm">Awaiting approval</span>
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-purple-500/50 transition-all">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Shared Documents</p>
                <p className="text-3xl font-bold text-purple-400">{stats.sharedDocuments}</p>
              </div>
              <Share className="w-10 h-10 text-purple-400" />
            </div>
            <div className="flex items-center gap-2 mt-4">
              <Users className="w-4 h-4 text-purple-400" />
              <span className="text-purple-400 text-sm">With employers</span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6 text-cyan-400">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Link href="/dashboard/student/upload" className="group">
              <div className="bg-gradient-to-r from-cyan-500/20 to-blue-600/20 border border-cyan-500/30 rounded-2xl p-6 hover:border-cyan-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Plus className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-cyan-400">Upload Certificate</h3>
                    <p className="text-slate-400">Add new certificates to your vault</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/myfiles" className="group">
              <div className="bg-gradient-to-r from-purple-500/20 to-pink-600/20 border border-purple-500/30 rounded-2xl p-6 hover:border-purple-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <FolderOpen className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-purple-400">My Files</h3>
                    <p className="text-slate-400">View and manage your certificates</p>
                  </div>
                </div>
              </div>
            </Link>

            <Link href="/dashboard/student/profile" className="group">
              <div className="bg-gradient-to-r from-green-500/20 to-emerald-600/20 border border-green-500/30 rounded-2xl p-6 hover:border-green-500/60 transition-all transform hover:scale-105">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-emerald-600 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform">
                    <Settings className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-green-400">Profile Settings</h3>
                    <p className="text-slate-400">Manage your account preferences</p>
                  </div>
                </div>
              </div>
            </Link>
          </div>
        </div>

        {/* Getting Started Guide */}
        <div className="grid lg:grid-cols-2 gap-8">
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-6">Getting Started with CertiVault</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-blue-600 rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <div>
                  <p className="font-medium text-white">Upload Your Certificates</p>
                  <p className="text-slate-400 text-sm">Start by uploading your academic certificates and transcripts</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-sm font-bold">2</div>
                <div>
                  <p className="font-medium text-white">Request Verification</p>
                  <p className="text-slate-400 text-sm">Send verification requests to your institutions</p>
                </div>
              </div>
              <div className="flex items-center gap-4 p-4 bg-slate-700/30 rounded-xl">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-full flex items-center justify-center text-sm font-bold">3</div>
                <div>
                  <p className="font-medium text-white">Share Securely</p>
                  <p className="text-slate-400 text-sm">Share verified certificates with potential employers</p>
                </div>
              </div>
            </div>
          </div>

          {/* Security Features */}
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <h2 className="text-xl font-bold text-cyan-400 mb-6">Your Data Security</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <Shield className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">AES-256 Encryption</p>
                  <p className="text-slate-400 text-sm">Military-grade encryption for all documents</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                  <FileText className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">IPFS Storage</p>
                  <p className="text-slate-400 text-sm">Decentralized and permanent storage</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-600 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">Digital Signatures</p>
                  <p className="text-slate-400 text-sm">Cryptographic proof of authenticity</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-gradient-to-r from-yellow-500 to-orange-600 rounded-lg flex items-center justify-center">
                  <Users className="w-4 h-4 text-white" />
                </div>
                <div>
                  <p className="font-medium text-white">Controlled Access</p>
                  <p className="text-slate-400 text-sm">You control who can access your documents</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Help Section */}
        <div className="mt-8 bg-slate-800/20 border border-slate-700 rounded-2xl p-6">
          <div className="text-center">
            <h2 className="text-xl font-bold mb-4 text-cyan-400">Need Help?</h2>
            <p className="text-slate-400 mb-6">
              CertiVault makes certificate management simple and secure. Start by uploading your first certificate!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/dashboard/student/upload" className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105 font-semibold">
                Upload First Certificate
              </Link>
              <Link href="/myfiles" className="border border-slate-600 hover:border-cyan-500 text-slate-300 hover:text-cyan-400 px-6 py-3 rounded-xl transition-all duration-300 font-semibold">
                Browse My Files
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}