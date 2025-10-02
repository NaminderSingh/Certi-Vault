"use client";

import { useEffect, useState } from "react";
import {
  Shield,
  FileText,
  User,
  Calendar,
  Eye,
  CheckCircle,
  XCircle,
  ArrowLeft,
  Loader2,
  Search,
  Filter,
  AlertCircle,
  Mail,
  Clock,
  X
} from "lucide-react";
import Link from "next/link";

export default function ManageRequestsPage() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCert, setSelectedCert] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    async function fetchRequests() {
      setLoading(true);
      try {
        const res = await fetch("/api/certifictes/verify");
        const data = await res.json();
        if (res.ok) {
          setRequests(data.requests);
        } else {
          console.error("Error fetching requests:", data.error);
        }
      } catch (err) {
        console.error("Error fetching requests:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchRequests();
  }, []);

  const handleVerify = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/certifictes/verify", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        setSelectedCert(null);
        // Show success message (you might want to add a toast notification here)
      } else {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong while verifying the request.");
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (requestId) => {
    setProcessingId(requestId);
    try {
      const res = await fetch("/api/certificates/verify", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId }),
      });
      const data = await res.json();
      if (res.ok) {
        setRequests((prev) => prev.filter((r) => r._id !== requestId));
        setSelectedCert(null);
      } else {
        alert(data.error);
      }
    } catch {
      alert("Something went wrong while rejecting the request.");
    } finally {
      setProcessingId(null);
    }
  };

  const filteredRequests = requests.filter((req) => {
    const matchesSearch = req.student?.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.certificate?.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         req.student?.email.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case "pending": return "text-yellow-400 bg-yellow-400/20 border-yellow-400/30";
      case "verified": return "text-green-400 bg-green-400/20 border-green-400/30";
      case "rejected": return "text-red-400 bg-red-400/20 border-red-400/30";
      default: return "text-slate-400 bg-slate-400/20 border-slate-400/30";
    }
  };

  const getPriorityColor = (days) => {
    if (days <= 1) return "text-red-400";
    if (days <= 3) return "text-yellow-400";
    return "text-green-400";
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading verification requests...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link 
            href="/dashboard/institution"
            className="inline-flex items-center text-slate-400 hover:text-cyan-400 transition-colors mb-6 group"
          >
            <ArrowLeft className="w-4 h-4 mr-2 group-hover:-translate-x-1 transition-transform" />
            Back to Dashboard
          </Link>

          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                Manage Verification Requests
              </h1>
              <p className="text-slate-400">Review and approve certificate verification requests</p>
            </div>
          </div>

          {/* Search and Filter Bar */}
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="w-5 h-5 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by student name, email, or certificate title..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-700/50 border border-slate-600 rounded-xl pl-10 pr-4 py-3 text-white placeholder-slate-400 focus:border-cyan-500 focus:outline-none transition-colors"
                />
              </div>
              <div className="flex items-center gap-4">
                <div className="bg-slate-700/50 px-4 py-2 rounded-xl border border-slate-600">
                  <span className="text-sm text-slate-400">
                    {filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {filteredRequests.length === 0 ? (
          <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-12 text-center">
            <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-slate-300 mb-2">No verification requests found</h2>
            <p className="text-slate-400">
              {requests.length === 0 
                ? "There are currently no pending verification requests."
                : "No requests match your search criteria."
              }
            </p>
          </div>
        ) : (
          /* Requests Grid */
          <div className="grid gap-6">
            {filteredRequests.map((req) => {
              const requestDate = new Date(req.createdAt);
              const daysAgo = Math.floor((Date.now() - requestDate.getTime()) / (1000 * 60 * 60 * 24));
              
              return (
                <div key={req._id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    {/* Student Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                          <User className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <p className="font-semibold text-white text-lg">{req.student?.name}</p>
                          <div className="flex items-center gap-2 text-slate-400 text-sm">
                            <Mail className="w-4 h-4" />
                            {req.student?.email}
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Certificate Info */}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <FileText className="w-5 h-5 text-cyan-400" />
                        <div>
                          <p className="font-semibold text-cyan-400">{req.certificate?.title}</p>
                          {req.certificate?.description && (
                            <p className="text-slate-400 text-sm">{req.certificate?.description}</p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Request Date & Priority */}
                    <div className="flex flex-col items-start lg:items-end gap-2">
                      <div className="flex items-center gap-2 text-slate-400 text-sm">
                        <Calendar className="w-4 h-4" />
                        {requestDate.toLocaleDateString()}
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className={`text-sm font-medium ${getPriorityColor(daysAgo)}`}>
                          {daysAgo === 0 ? "Today" : `${daysAgo} day${daysAgo > 1 ? 's' : ''} ago`}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedCert({ ...req.certificate, requestId: req._id })}
                        className="bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white px-4 py-2 rounded-xl transition-all duration-200 transform hover:scale-105 flex items-center gap-2"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* PDF Viewer Modal */}
        {selectedCert && (
          <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
            <div className="bg-slate-900/95 border border-slate-700 rounded-3xl max-w-6xl w-full max-h-[95vh] overflow-hidden">
              {/* Modal Header */}
              <div className="flex justify-between items-center p-6 border-b border-slate-700">
                <div>
                  <h2 className="text-2xl font-bold text-cyan-400">{selectedCert.title}</h2>
                  <p className="text-slate-400 text-sm">Certificate Verification Request</p>
                </div>
                <button 
                  onClick={() => setSelectedCert(null)}
                  className="text-slate-400 hover:text-white transition-colors p-2 hover:bg-slate-800 rounded-xl"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              
              {/* PDF Viewer */}
              <div className="p-6 overflow-auto" style={{ height: "calc(95vh - 180px)" }}>
                {selectedCert.pdf ? (
                  <div className="w-full h-full bg-white rounded-xl overflow-hidden">
                    <iframe
                      src={`data:application/pdf;base64,${selectedCert.pdf}`}
                      width="100%"
                      height="100%"
                      title={selectedCert.title}
                      className="w-full h-full"
                    />
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <AlertCircle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                    <p className="text-slate-400 text-lg">PDF not available for preview</p>
                  </div>
                )}
              </div>
              
              {/* Modal Actions */}
              <div className="flex justify-end gap-4 p-6 border-t border-slate-700">
                <button
                  onClick={() => handleReject(selectedCert.requestId)}
                  disabled={processingId === selectedCert.requestId}
                  className="bg-gradient-to-r from-red-500 to-pink-600 hover:from-red-600 hover:to-pink-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 font-semibold"
                >
                  {processingId === selectedCert.requestId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4" />
                  )}
                  {processingId === selectedCert.requestId ? "Rejecting..." : "Reject"}
                </button>
                <button
                  onClick={() => handleVerify(selectedCert.requestId)}
                  disabled={processingId === selectedCert.requestId}
                  className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 disabled:from-slate-600 disabled:to-slate-700 text-white px-6 py-3 rounded-xl transition-all duration-200 transform hover:scale-105 disabled:hover:scale-100 flex items-center gap-2 font-semibold"
                >
                  {processingId === selectedCert.requestId ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  {processingId === selectedCert.requestId ? "Verifying..." : "Verify & Approve"}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}