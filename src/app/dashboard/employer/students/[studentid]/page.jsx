"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { 
  Shield, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Loader2,
  Eye,
  Award,
  Mail,
  User as UserIcon,
  ArrowLeft,
  Calendar,
  X
} from "lucide-react";
import Link from "next/link";

export default function StudentCertificatesPage() {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  
  // Extract studentId from pathname
  const studentId = pathname?.split('/').pop();

  const [student, setStudent] = useState(null);
  const [certificates, setCertificates] = useState([]);
  const [stats, setStats] = useState({ total: 0, verified: 0, reviewed: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // PDF Viewer Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);
  const [selectedCert, setSelectedCert] = useState(null);

  // Verification Modal State
  const [showVerificationModal, setShowVerificationModal] = useState(false);
  const [verificationSteps, setVerificationSteps] = useState([]);
  const [verificationResult, setVerificationResult] = useState(null);
  const [verifyingCert, setVerifyingCert] = useState(null);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (status === 'authenticated' && studentId) {
      fetchStudentCertificates();
    }
  }, [status, studentId]);

  // Cleanup PDF URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const fetchStudentCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch(`/api/certifictes/student-certificates/${studentId}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch certificates');
      }

      const data = await res.json();
      
      if (data.success) {
        setStudent(data.student);
        setCertificates(data.certificates || []);
        setStats(data.stats);
      }
    } catch (err) {
      console.error('Error fetching student certificates:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const closePdfModal = () => {
    setShowPdfModal(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setSelectedCert(null);
  };

  const viewCertificate = async (certificate) => {
    if (!certificate.ipfsCid) return;

    try {
      setLoadingPdf(true);
      setShowPdfModal(true);
      setSelectedCert(certificate);
      
      const res = await fetch('/api/certifictes/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipfsCid: certificate.ipfsCid })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to decrypt certificate');

      // Convert base64 to blob and create URL
      const byteChars = atob(data.pdf);
      const byteNumbers = Array.from(byteChars, c => c.charCodeAt(0));
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      setPdfUrl(url);
      setSelectedCert({ ...certificate, pdf: data.pdf });
      
      // Mark as reviewed if not already
      if (!certificate.isReviewed) {
        markAsReviewed(certificate._id);
      }
    } catch (err) {
      console.error(err);
      alert('Error fetching certificate: ' + err.message);
      closePdfModal();
    } finally {
      setLoadingPdf(false);
    }
  };

  const markAsReviewed = async (sharedId) => {
    try {
      const res = await fetch('/api/certifictes/mark-reviewed', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sharedId })
      });

      if (res.ok) {
        // Update local state
        setCertificates(prev => prev.map(cert => 
          cert._id === sharedId ? { ...cert, isReviewed: true, reviewedAt: new Date() } : cert
        ));
        setStats(prev => ({ ...prev, reviewed: prev.reviewed + 1 }));
      }
    } catch (err) {
      console.error('Error marking as reviewed:', err);
    }
  };

  const verifyAuthenticity = async (certificate) => {
    setVerifyingCert(certificate);
    setShowVerificationModal(true);
    setVerificationSteps([]);
    setVerificationResult(null);
    setCurrentStep(0);

    try {
      const res = await fetch('/api/certifictes/verify-authenticity', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          certificateId: certificate.certificateId,
          sharedId: certificate._id
        })
      });

      const data = await res.json();
      
      if (data.steps) {
        // Animate steps one by one
        for (let i = 0; i < data.steps.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 800)); // Delay between steps
          setVerificationSteps(prev => [...prev, data.steps[i]]);
          setCurrentStep(i + 1);
        }
      }

      setVerificationResult(data);
    } catch (err) {
      console.error('Verification error:', err);
      setVerificationResult({
        success: false,
        message: 'Failed to verify certificate',
        steps: [{
          step: 0,
          name: "Error",
          status: "failed",
          details: err.message
        }]
      });
    }
  };

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Authenticating...</p>
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
          <p className="text-slate-400">Please sign in to view certificates.</p>
        </div>
      </div>
    );
  }

  if (!studentId) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading student ID...</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading certificates...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center bg-slate-800/30 backdrop-blur-md border border-red-700 rounded-2xl p-8 max-w-md">
          <AlertCircle className="w-16 h-16 text-red-400 mx-auto mb-4" />
          <h2 className="text-2xl font-bold text-white mb-4">Error Loading Certificates</h2>
          <p className="text-red-400 mb-6">{error}</p>
          <Link 
            href="/dashboard/employer/view-shared"
            className="inline-flex items-center gap-2 bg-cyan-600 hover:bg-cyan-700 text-white px-6 py-3 rounded-xl transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Shared Documents
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Back Button */}
        <Link 
          href="/dashboard/employer/view-shared"
          className="inline-flex items-center gap-2 text-cyan-400 hover:text-cyan-300 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to All Students
        </Link>

        {/* Header */}
        {student && (
          <div className="mb-8">
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6">
              <div className="flex items-start gap-4">
                <div className="w-16 h-16 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <UserIcon className="w-8 h-8 text-white" />
                </div>
                <div className="flex-1">
                  <h1 className="text-3xl font-bold text-white mb-2">{student.name}</h1>
                  <div className="flex items-center gap-2 text-slate-400 mb-4">
                    <Mail className="w-4 h-4" />
                    <span>{student.email}</span>
                  </div>

                  {/* Stats */}
                  <div className="grid grid-cols-3 gap-4 mt-4">
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-2xl font-bold text-cyan-400">{stats.total}</p>
                      <p className="text-sm text-slate-400 mt-1">Total Certificates</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-2xl font-bold text-green-400">{stats.verified}</p>
                      <p className="text-sm text-slate-400 mt-1">Verified</p>
                    </div>
                    <div className="bg-slate-700/30 rounded-lg p-4">
                      <p className="text-2xl font-bold text-purple-400">{stats.reviewed}</p>
                      <p className="text-sm text-slate-400 mt-1">Reviewed</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Certificates Grid */}
        {certificates.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-12 max-w-md mx-auto">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-slate-300 mb-4">No Certificates Shared</h2>
              <p className="text-slate-400">
                This student hasn't shared any certificates with you yet.
              </p>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map((cert) => (
              <div
                key={cert._id}
                className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1"
              >
                {/* New Badge */}
                {!cert.isReviewed && (
                  <div className="inline-flex items-center gap-1 bg-yellow-500/20 text-yellow-400 text-xs font-medium px-2 py-1 rounded-full mb-3">
                    <Clock className="w-3 h-3" />
                    New
                  </div>
                )}

                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                    {cert.title}
                  </h3>
                  {cert.description && (
                    <p className="text-slate-400 text-sm line-clamp-3 mb-3">{cert.description}</p>
                  )}
                  
                  {/* Verification Status */}
                  {cert.isVerified ? (
                    <div className="bg-green-500/10 border border-green-500/30 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2 text-green-400 text-sm mb-1">
                        <CheckCircle className="w-4 h-4" /> 
                        <span className="font-semibold">Digitally Verified</span>
                      </div>
                      <div className="text-xs text-green-300/80 ml-6">
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3" />
                          <span>By: {cert.verifiedBy?.institutionName}</span>
                        </div>
                        {cert.verifiedBy?.verifiedAt && (
                          <div className="flex items-center gap-1 mt-1">
                            <Clock className="w-3 h-3" />
                            <span>On: {formatDate(cert.verifiedBy.verifiedAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-xl p-3 mb-3">
                      <div className="flex items-center gap-2 text-yellow-400 text-sm">
                        <AlertCircle className="w-4 h-4" /> 
                        <span className="font-semibold">Not Verified</span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Shared: {formatDate(cert.sharedAt)}</span>
                  </div>
                  {cert.isReviewed && cert.reviewedAt && (
                    <div className="flex items-center gap-2 text-xs text-green-500">
                      <CheckCircle className="w-3 h-3" />
                      <span>Reviewed: {formatDate(cert.reviewedAt)}</span>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="flex gap-2">
                  <button 
                    onClick={() => viewCertificate(cert)} 
                    className="flex-1 flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  
                  {/* Verify Button - Only show for verified certificates */}
                  {cert.isVerified && (
                    <button 
                      onClick={() => verifyAuthenticity(cert)} 
                      className="flex-1 flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                    >
                      <Shield className="w-4 h-4" /> Verify
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* PDF Viewer Modal */}
        {showPdfModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
            <div className="bg-slate-800 rounded-2xl w-full max-w-6xl h-[90vh] flex flex-col shadow-2xl border border-slate-700">
              {/* Modal Header */}
              <div className="flex items-center justify-between p-4 border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <FileText className="w-6 h-6 text-cyan-400" />
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedCert?.title || 'Certificate Viewer'}
                    </h2>
                    {selectedCert?.isVerified && (
                      <div className="flex items-center gap-1 text-xs text-green-400 mt-1">
                        <CheckCircle className="w-3 h-3" />
                        <span>Verified by {selectedCert.verifiedBy?.institutionName}</span>
                      </div>
                    )}
                  </div>
                </div>
                <button 
                  onClick={closePdfModal} 
                  className="text-slate-400 hover:text-white transition-colors p-2"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* PDF Content */}
              <div className="flex-1 overflow-hidden bg-slate-900">
                {loadingPdf ? (
                  <div className="flex flex-col items-center justify-center h-full">
                    <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mb-4" />
                    <p className="text-slate-300">Loading certificate...</p>
                  </div>
                ) : pdfUrl ? (
                  <iframe
                    src={pdfUrl}
                    className="w-full h-full"
                    title="Certificate PDF"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full">
                    <p className="text-slate-400">Failed to load certificate</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Verification Modal - Visual Flow Style */}
{showVerificationModal && (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 backdrop-blur-sm p-4">
    <div className="bg-slate-800 rounded-2xl w-full max-w-6xl max-h-[95vh] overflow-y-auto shadow-2xl border border-slate-700">
      {/* Modal Header */}
      <div className="sticky top-0 bg-slate-800 border-b border-slate-700 p-6 z-10">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-emerald-500 rounded-xl flex items-center justify-center">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-white">Digital Signature Verification</h2>
              <p className="text-slate-400 text-sm">{verifyingCert?.title}</p>
            </div>
          </div>
          <button 
            onClick={() => setShowVerificationModal(false)} 
            className="text-slate-400 hover:text-white transition-colors p-2"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </div>

      {/* Verification Process Flow */}
      <div className="p-8">
        {/* Process Overview */}
        <div className="mb-8 text-center">
          <h3 className="text-xl font-bold text-cyan-400 mb-2">
            How Digital Signature Verification Works
          </h3>
          <p className="text-slate-400">
            Following cryptographic steps to verify certificate authenticity
          </p>
        </div>

        {/* Visual Flow Diagram */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          {/* Left Column - Certificate Data */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-600">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500/20 rounded-lg flex items-center justify-center">
                <FileText className="w-4 h-4 text-blue-400" />
              </div>
              <h4 className="font-bold text-white">Certificate Data</h4>
            </div>
            
            {verificationSteps.length > 0 && verificationSteps[0]?.data && (
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Title</p>
                  <p className="text-sm text-white font-mono break-all">
                    {verificationSteps[0].data.title}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Student</p>
                  <p className="text-sm text-white font-mono">
                    {verificationSteps[0].data.studentName}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Created At</p>
                  <p className="text-sm text-white font-mono">
                    {new Date(verificationSteps[0].data.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Status Indicator */}
            <div className="mt-4 flex items-center gap-2">
              {verificationSteps.length > 0 ? (
                <CheckCircle className="w-5 h-5 text-green-400" />
              ) : (
                <Loader2 className="w-5 h-5 text-yellow-400 animate-spin" />
              )}
              <span className={`text-sm ${verificationSteps.length > 0 ? 'text-green-400' : 'text-yellow-400'}`}>
                {verificationSteps.length > 0 ? 'Data Retrieved' : 'Fetching...'}
              </span>
            </div>
          </div>

          {/* Middle Column - Algorithm Process */}
          <div className="bg-gradient-to-br from-purple-900/30 to-blue-900/30 rounded-xl p-6 border-2 border-purple-500/30">
            <div className="flex items-center gap-2 mb-6">
              <div className="w-8 h-8 bg-purple-500/20 rounded-lg flex items-center justify-center">
                <Shield className="w-4 h-4 text-purple-400" />
              </div>
              <h4 className="font-bold text-white">Cryptographic Process</h4>
            </div>

            {/* Step 1: Hash Calculation */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  verificationSteps.length >= 4 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'
                }`}>
                  1
                </div>
                <span className="text-white font-semibold">SHA-256 Hashing</span>
              </div>
              <div className="ml-8 bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Algorithm: SHA-256</p>
                <div className="flex items-center gap-2">
                  <code className="text-xs text-cyan-400 font-mono">
                    hash = SHA256(ipfsCid + title + studentId)
                  </code>
                </div>
                {verificationSteps[3]?.data?.hash && (
                  <div className="mt-2 p-2 bg-slate-800 rounded text-xs text-green-400 font-mono break-all">
                    {verificationSteps[3].data.hash.substring(0, 40)}...
                  </div>
                )}
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center mb-6">
              <div className="text-purple-400">↓</div>
            </div>

            {/* Step 2: Hash Comparison */}
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  verificationSteps.length >= 5 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'
                }`}>
                  2
                </div>
                <span className="text-white font-semibold">Compare Hashes</span>
              </div>
              <div className="ml-8 bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Integrity Check</p>
                {verificationSteps[4]?.data ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Calculated:</span>
                      <code className="text-xs text-blue-400 font-mono">
                        {verificationSteps[4].data.calculatedHash}
                      </code>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-slate-400">Stored:</span>
                      <code className="text-xs text-blue-400 font-mono">
                        {verificationSteps[4].data.storedHash}
                      </code>
                    </div>
                    <div className={`flex items-center gap-2 ${verificationSteps[4].data.match ? 'text-green-400' : 'text-red-400'}`}>
                      {verificationSteps[4].data.match ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                      <span className="text-sm font-semibold">
                        {verificationSteps[4].data.match ? '✓ Match!' : '✗ Mismatch!'}
                      </span>
                    </div>
                  </div>
                ) : (
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                )}
              </div>
            </div>

            {/* Arrow Down */}
            <div className="flex justify-center mb-6">
              <div className="text-purple-400">↓</div>
            </div>

            {/* Step 3: HMAC Verification */}
            <div>
              <div className="flex items-center gap-2 mb-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                  verificationSteps.length >= 6 ? 'bg-green-500 text-white' : 'bg-slate-600 text-slate-400'
                }`}>
                  3
                </div>
                <span className="text-white font-semibold">HMAC Signature</span>
              </div>
              <div className="ml-8 bg-slate-900/50 rounded-lg p-3 border border-slate-700">
                <p className="text-xs text-slate-400 mb-2">Algorithm: SHA256-HMAC</p>
                <code className="text-xs text-cyan-400 font-mono block mb-2">
                  HMAC = SHA256(hash, institutionKey)
                </code>
                {verificationSteps[5]?.data ? (
                  <div className={`flex items-center gap-2 mt-2 ${verificationSteps[5].data.signatureValid ? 'text-green-400' : 'text-red-400'}`}>
                    {verificationSteps[5].data.signatureValid ? <CheckCircle className="w-4 h-4" /> : <AlertCircle className="w-4 h-4" />}
                    <span className="text-sm font-semibold">
                      {verificationSteps[5].data.signatureValid ? '✓ Valid Signature!' : '✗ Invalid Signature!'}
                    </span>
                  </div>
                ) : (
                  <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
                )}
              </div>
            </div>
          </div>

          {/* Right Column - Institution & Result */}
          <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-600">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-green-500/20 rounded-lg flex items-center justify-center">
                <Award className="w-4 h-4 text-green-400" />
              </div>
              <h4 className="font-bold text-white">Verification Authority</h4>
            </div>

            {verificationSteps[1]?.data && (
              <div className="space-y-3">
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Institution</p>
                  <p className="text-sm text-white font-semibold">
                    {verificationSteps[1].data.institutionName}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Email</p>
                  <p className="text-sm text-white font-mono break-all">
                    {verificationSteps[1].data.institutionEmail}
                  </p>
                </div>
                <div className="bg-slate-800 rounded-lg p-3">
                  <p className="text-xs text-slate-400 mb-1">Verified On</p>
                  <p className="text-sm text-white font-mono">
                    {new Date(verificationSteps[1].data.verifiedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            {/* Institution Key Info */}
            {verificationSteps[2]?.data && (
              <div className="mt-4 bg-blue-500/10 rounded-lg p-3 border border-blue-500/30">
                <p className="text-xs text-blue-400 mb-2">Verification Key</p>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-blue-400" />
                  <span className="text-xs text-slate-300">
                    Key Retrieved ({verificationSteps[2].data.keyLength} bytes)
                  </span>
                </div>
                <code className="text-xs text-blue-300 font-mono block mt-2">
                  {verificationSteps[2].data.keyPreview}
                </code>
              </div>
            )}

            {/* Final Status */}
            <div className="mt-6">
              {verificationResult ? (
                <div className={`p-4 rounded-lg border-2 ${
                  verificationResult.valid 
                    ? 'bg-green-500/10 border-green-500' 
                    : 'bg-red-500/10 border-red-500'
                }`}>
                  <div className="flex items-center gap-3 mb-2">
                    {verificationResult.valid ? (
                      <CheckCircle className="w-8 h-8 text-green-400" />
                    ) : (
                      <AlertCircle className="w-8 h-8 text-red-400" />
                    )}
                    <div>
                      <p className={`font-bold text-lg ${verificationResult.valid ? 'text-green-400' : 'text-red-400'}`}>
                        {verificationResult.valid ? 'AUTHENTIC' : 'INVALID'}
                      </p>
                      <p className="text-xs text-slate-300">
                        {verificationResult.message}
                      </p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-lg border-2 border-yellow-500/30 bg-yellow-500/10">
                  <div className="flex items-center gap-3">
                    <Loader2 className="w-6 h-6 text-yellow-400 animate-spin" />
                    <span className="text-yellow-400 font-semibold">Verifying...</span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Technical Explanation */}
        <div className="bg-slate-900/50 rounded-xl p-6 border border-slate-600">
          <h4 className="font-bold text-white mb-4 flex items-center gap-2">
            <Shield className="w-5 h-5 text-cyan-400" />
            How This Works
          </h4>
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-cyan-400">
                <div className="w-6 h-6 bg-cyan-500/20 rounded flex items-center justify-center text-xs font-bold">1</div>
                <span className="font-semibold">Hash Generation</span>
              </div>
              <p className="text-slate-400 text-xs">
                Certificate data is hashed using SHA-256, creating a unique fingerprint. Any change in data produces a completely different hash.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-purple-400">
                <div className="w-6 h-6 bg-purple-500/20 rounded flex items-center justify-center text-xs font-bold">2</div>
                <span className="font-semibold">Integrity Check</span>
              </div>
              <p className="text-slate-400 text-xs">
                We compare the calculated hash with the stored hash. If they match, the certificate hasn't been tampered with.
              </p>
            </div>
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-green-400">
                <div className="w-6 h-6 bg-green-500/20 rounded flex items-center justify-center text-xs font-bold">3</div>
                <span className="font-semibold">Signature Verification</span>
              </div>
              <p className="text-slate-400 text-xs">
                HMAC signature proves the institution verified this certificate. Only the institution's secret key could create this signature.
              </p>
            </div>
          </div>
        </div>

        {/* Security Guarantees */}
        {verificationResult?.valid && (
          <div className="mt-6 bg-green-500/10 rounded-xl p-6 border border-green-500/30">
            <h4 className="font-bold text-green-400 mb-4">Security Guarantees</h4>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">Tamper-Proof</p>
                  <p className="text-slate-300 text-xs">Any modification to the certificate data will be detected immediately</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">Non-Repudiation</p>
                  <p className="text-slate-300 text-xs">The institution cannot deny having verified this certificate</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">Authenticity</p>
                  <p className="text-slate-300 text-xs">Only the legitimate institution could create this digital signature</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-white font-semibold text-sm">Cryptographically Secure</p>
                  <p className="text-slate-300 text-xs">Uses industry-standard SHA-256 and HMAC algorithms</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="sticky bottom-0 bg-slate-800 border-t border-slate-700 p-6">
        <button 
          onClick={() => setShowVerificationModal(false)}
          className="w-full bg-gradient-to-r from-cyan-600 to-purple-600 hover:from-cyan-700 hover:to-purple-700 text-white py-3 rounded-xl transition-all font-semibold"
        >
          Close Verification
        </button>
      </div>
    </div>
  </div>
)}
      </div>
    </div>
  );
}