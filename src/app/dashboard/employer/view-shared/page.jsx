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
  Loader2,
  Eye,
  Mail,
  Search,
  User as UserIcon
} from "lucide-react";
import Link from "next/link";

export default function SharedDocumentsPage() {
  const { data: session, status } = useSession();
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (status === 'authenticated') {
      fetchSharedDocuments();
    }
  }, [status]);

  useEffect(() => {
    // Filter students based on search query
    if (searchQuery.trim() === '') {
      setFilteredStudents(students);
    } else {
      const query = searchQuery.toLowerCase();
      const filtered = students.filter(s => 
        s.student.name.toLowerCase().includes(query) ||
        s.student.email.toLowerCase().includes(query)
      );
      setFilteredStudents(filtered);
    }
  }, [searchQuery, students]);

  const fetchSharedDocuments = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/certifictes/shared-certificates');
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch shared documents');
      }

      const data = await res.json();
      
      if (data.success) {
        setStudents(data.students || []);
        setFilteredStudents(data.students || []);
      }
    } catch (err) {
      console.error('Error fetching shared documents:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading shared documents...</p>
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
          <p className="text-slate-400">Please sign in to view shared documents.</p>
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
              <FileText className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Shared Documents
              </h1>
              <p className="text-slate-400">View certificates shared by students</p>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
            />
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Students</p>
                <p className="text-3xl font-bold text-cyan-400">{students.length}</p>
              </div>
              <Users className="w-10 h-10 text-cyan-400" />
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Total Certificates</p>
                <p className="text-3xl font-bold text-purple-400">
                  {students.reduce((sum, s) => sum + s.totalShared, 0)}
                </p>
              </div>
              <FileText className="w-10 h-10 text-purple-400" />
            </div>
          </div>

          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-slate-400 text-sm">Pending Review</p>
                <p className="text-3xl font-bold text-yellow-400">
                  {students.reduce((sum, s) => sum + s.unviewedCount, 0)}
                </p>
              </div>
              <Clock className="w-10 h-10 text-yellow-400" />
            </div>
          </div>
        </div>

        {/* Students List */}
        {filteredStudents.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-12 max-w-md mx-auto">
              <Users className="w-16 h-16 text-slate-400 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-slate-300 mb-4">
                {searchQuery ? 'No Students Found' : 'No Shared Documents Yet'}
              </h2>
              <p className="text-slate-400">
                {searchQuery 
                  ? 'Try adjusting your search query'
                  : 'Students will share their certificates with you for verification'
                }
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredStudents.map((studentData) => (
              <Link
                key={studentData.student._id}
                href={`/dashboard/employer/students/${studentData.student._id}`}
                className="block"
              >
                <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1 cursor-pointer">
                  {/* Student Info */}
                  <div className="flex items-start gap-4 mb-4">
                    <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                      <UserIcon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-lg font-semibold text-white mb-1 truncate">
                        {studentData.student.name}
                      </h3>
                      <div className="flex items-center gap-1 text-slate-400 text-sm mb-2">
                        <Mail className="w-3 h-3" />
                        <span className="truncate">{studentData.student.email}</span>
                      </div>
                    </div>
                  </div>

                  {/* Stats Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-cyan-400">
                        {studentData.totalShared}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Total</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-green-400">
                        {studentData.verifiedCount}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">Verified</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-3 text-center">
                      <p className="text-2xl font-bold text-yellow-400">
                        {studentData.unviewedCount}
                      </p>
                      <p className="text-xs text-slate-400 mt-1">New</p>
                    </div>
                  </div>

                  {/* Status Indicators */}
                  <div className="space-y-2">
                    {studentData.verifiedCount > 0 && (
                      <div className="flex items-center gap-2 text-green-400 text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>{studentData.verifiedCount} verified certificate(s)</span>
                      </div>
                    )}
                    {studentData.unviewedCount > 0 && (
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <Clock className="w-4 h-4" />
                        <span>{studentData.unviewedCount} pending review</span>
                      </div>
                    )}
                  </div>

                  {/* View Button */}
                  <div className="mt-4 pt-4 border-t border-slate-700">
                    <div className="flex items-center justify-between text-cyan-400 text-sm font-medium">
                      <span>View Certificates</span>
                      <Eye className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}