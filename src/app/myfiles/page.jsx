'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import {
  Shield,
  FileText,
  Download,
  Eye,
  CheckCircle,
  Clock,
  Calendar,
  Loader2,
  AlertCircle,
  FolderOpen,
  User,
  Send,
  X,
  Trash2
} from 'lucide-react';

const CertificatesViewer = () => {
  const { data: session, status } = useSession();
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCert, setSelectedCert] = useState(null);
  const [userInfo, setUserInfo] = useState(null);

  // PDF Viewer Modal State
  const [showPdfModal, setShowPdfModal] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [loadingPdf, setLoadingPdf] = useState(false);

  // Verification modal state
  const [showVerifyModal, setShowVerifyModal] = useState(false);
  const [verifyEmail, setVerifyEmail] = useState('');
  const [verifyCert, setVerifyCert] = useState(null);
  const [sendingRequest, setSendingRequest] = useState(false);

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [certToDelete, setCertToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') fetchCertificates();
    else if (status === 'unauthenticated') {
      setError('Please sign in to view your certificates');
      setLoading(false);
    }
  }, [status]);

  // Cleanup PDF URL when modal closes
  useEffect(() => {
    return () => {
      if (pdfUrl) {
        URL.revokeObjectURL(pdfUrl);
      }
    };
  }, [pdfUrl]);

  const fetchCertificates = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/certifictes/myfiles');
      if (!res.ok) throw new Error((await res.json()).error || 'Failed to fetch certificates');

      const data = await res.json();
      setCertificates(data.certificates || []);
      setUserInfo(data.user || null);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) =>
    new Date(dateStr).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSendVerification = (certificate) => {
    setVerifyCert(certificate);
    setVerifyEmail('');
    setShowVerifyModal(true);
  };

  const handleDeleteClick = (certificate) => {
    setCertToDelete(certificate);
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!certToDelete || !certToDelete._id) return;

    setDeleting(true);
    try {
      const res = await fetch('/api/certifictes/delete', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ certificateId: certToDelete._id })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete certificate');

      alert('Certificate deleted successfully');
      setShowDeleteModal(false);
      setCertToDelete(null);
      
      // Refresh certificates list
      fetchCertificates();
    } catch (err) {
      console.error(err);
      alert('Error deleting certificate: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  const submitVerificationRequest = async () => {
    if (!verifyEmail || !verifyCert || !verifyCert._id) return;
    if (!validateEmail(verifyEmail)) return alert('Enter a valid email');

    setSendingRequest(true);
    try {
      const requestData = {
        certificateId: verifyCert._id,
        institutionEmail: verifyEmail.trim().toLowerCase(),
        role: session.user.role,
        userEmail: session.user.email
      };

      const res = await fetch('/api/certifictes/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestData)
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Verification request failed');

      alert(`Verification request sent to ${verifyEmail}`);
      setShowVerifyModal(false);
      setVerifyCert(null);
      fetchCertificates();
    } catch (err) {
      console.error(err);
      alert('Error sending verification: ' + err.message);
    } finally {
      setSendingRequest(false);
    }
  };

  const closePdfModal = () => {
    setShowPdfModal(false);
    if (pdfUrl) {
      URL.revokeObjectURL(pdfUrl);
      setPdfUrl(null);
    }
    setSelectedCert(null);
  };

  // Fetch decrypted PDF and display in modal
  const viewCertificate = async (certificate) => {
    if (!certificate.ipfsCid) return;

    try {
      setLoadingPdf(true);
      setShowPdfModal(true);
      
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
    } catch (err) {
      console.error(err);
      alert('Error fetching certificate: ' + err.message);
      closePdfModal();
    } finally {
      setLoadingPdf(false);
    }
  };

  const downloadCertificate = async (certificate) => {
    // If PDF is already loaded in memory, download directly
    if (certificate.pdf) {
      try {
        const byteChars = atob(certificate.pdf);
        const byteNumbers = Array.from(byteChars, c => c.charCodeAt(0));
        const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });

        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${certificate.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      } catch (err) {
        console.error(err);
        alert('Download failed');
      }
      return;
    }

    // Otherwise, fetch and decrypt the PDF first
    if (!certificate.ipfsCid) {
      alert('Certificate data not available');
      return;
    }

    try {
      setLoading(true);
      const res = await fetch('/api/certifictes/decrypt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ipfsCid: certificate.ipfsCid })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to decrypt certificate');

      // Convert base64 to blob and download
      const byteChars = atob(data.pdf);
      const byteNumbers = Array.from(byteChars, c => c.charCodeAt(0));
      const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${certificate.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      // Update the certificate in state with the PDF data
      setCertificates(prev => prev.map(c => 
        c._id === certificate._id ? { ...c, pdf: data.pdf } : c
      ));
    } catch (err) {
      console.error(err);
      alert('Error downloading certificate: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  if (status === 'loading') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
    </div>
  );

  if (status === 'unauthenticated') return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
      <div className="text-center bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-8">
        <Shield className="w-16 h-16 text-slate-400 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-white mb-4">Sign In Required</h2>
        <p className="text-slate-400">Please sign in to view your certificates.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-400 to-purple-500 rounded-xl flex items-center justify-center">
              <FolderOpen className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent">
                My Certificates
              </h1>
              {userInfo && (
                <div className="flex items-center gap-2 text-slate-400">
                  <User className="w-4 h-4" />
                  <span>{userInfo.name} ({userInfo.email})</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center items-center py-20">
            <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto" />
            <span className="text-slate-300 text-lg ml-4">Loading certificates...</span>
          </div>
        ) : certificates.length === 0 ? (
          <div className="text-center py-20">
            <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-12 max-w-md mx-auto">
              <FileText className="w-16 h-16 text-slate-400 mx-auto mb-6" />
              <h2 className="text-xl font-bold text-slate-300 mb-4">No Certificates Found</h2>
              <p className="text-slate-400 mb-6">
                Start by uploading your first certificate to build your secure digital vault.
              </p>
              <button 
                onClick={() => window.location.href = '/dashboard/student/upload'}
                className="bg-gradient-to-r from-cyan-500 to-purple-600 hover:from-cyan-600 hover:to-purple-700 text-white px-6 py-3 rounded-xl transition-all duration-300 transform hover:scale-105"
              >
                Upload First Certificate
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {certificates.map(cert => (
              <div key={cert._id} className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 hover:border-cyan-500/50 transition-all duration-300 transform hover:-translate-y-1">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">{cert.title}</h3>
                  {cert.description && <p className="text-slate-400 text-sm line-clamp-3 mb-3">{cert.description}</p>}
                  
                  {cert.verifiedBy ? (
                    <div className="flex items-center gap-2 text-green-400 text-sm">
                      <CheckCircle className="w-4 h-4" /> Verified by {cert.verifiedBy}
                    </div>
                  ) : (
                    <div className="flex flex-col gap-1 text-yellow-400 text-sm">
                      <div className="flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> Not Verified
                      </div>
                      <button 
                        onClick={() => handleSendVerification(cert)}
                        className="flex items-center gap-2 text-xs bg-blue-600 hover:bg-blue-700 px-3 py-1 rounded-xl transition-all duration-200"
                      >
                        <Send className="w-3 h-3" /> Send Verification Request
                      </button>
                    </div>
                  )}
                </div>

                <div className="mb-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <Calendar className="w-3 h-3" />
                    <span>Created: {formatDate(cert.createdAt)}</span>
                  </div>
                  {cert.updatedAt !== cert.createdAt && (
                    <div className="flex items-center gap-2 text-xs text-slate-500">
                      <Clock className="w-3 h-3" />
                      <span>Updated: {formatDate(cert.updatedAt)}</span>
                    </div>
                  )}
                </div>

                <div className="flex gap-2">
                  <button 
                    onClick={() => viewCertificate(cert)} 
                    className="flex-1 flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-blue-500 to-cyan-600 hover:from-blue-600 hover:to-cyan-700 text-white"
                  >
                    <Eye className="w-4 h-4" /> View
                  </button>
                  <button 
                    onClick={() => downloadCertificate(cert)} 
                    className="flex-1 flex items-center justify-center gap-2 text-sm py-2 px-4 rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white"
                  >
                    <Download className="w-4 h-4" /> Download
                  </button>
                  <button 
                    onClick={() => handleDeleteClick(cert)} 
                    className="flex items-center justify-center gap-2 text-sm py-2 px-3 rounded-xl transition-all duration-200 transform hover:scale-105 bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white"
                    title="Delete Certificate"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
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
                  <h2 className="text-xl font-bold text-white">
                    {selectedCert?.title || 'Certificate Viewer'}
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  {selectedCert?.pdf && (
                    <button 
                      onClick={() => downloadCertificate(selectedCert)}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-xl transition-all"
                    >
                      <Download className="w-4 h-4" /> Download
                    </button>
                  )}
                  <button 
                    onClick={closePdfModal} 
                    className="text-slate-400 hover:text-white transition-colors p-2"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>
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

        {/* Verification Modal */}
        {showVerifyModal && verifyCert && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 p-6 rounded-2xl max-w-sm w-full relative border border-slate-700 shadow-2xl">
              <button 
                onClick={() => setShowVerifyModal(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold mb-4 text-white">Send Verification Request</h2>
              <p className="text-slate-300 mb-4 text-sm">Certificate: <span className="font-semibold">{verifyCert.title}</span></p>
              <input 
                type="email" 
                placeholder="Institution Email" 
                className="w-full p-3 rounded-xl mb-4 bg-slate-700 text-white border border-slate-600 focus:border-cyan-400 focus:outline-none transition-colors"
                value={verifyEmail}
                onChange={(e) => setVerifyEmail(e.target.value)}
              />
              <button 
                onClick={submitVerificationRequest}
                disabled={sendingRequest}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {sendingRequest ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" /> Sending...
                  </span>
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>
        )}

        {/* Delete Confirmation Modal */}
        {showDeleteModal && certToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-slate-800 p-6 rounded-2xl max-w-md w-full relative border border-red-700 shadow-2xl">
              <button 
                onClick={() => setShowDeleteModal(false)} 
                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors"
                disabled={deleting}
              >
                <X className="w-5 h-5" />
              </button>
              
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertCircle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Delete Certificate</h2>
              </div>
              
              <p className="text-slate-300 mb-2">
                Are you sure you want to delete this certificate?
              </p>
              <p className="text-slate-400 text-sm mb-4">
                <span className="font-semibold text-white">{certToDelete.title}</span>
              </p>
              
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-6">
                <p className="text-red-400 text-sm">
                  <strong>Warning:</strong> This action cannot be undone. This will permanently delete the certificate and all associated verification requests.
                </p>
              </div>

              <div className="flex gap-3">
                <button 
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button 
                  onClick={confirmDelete}
                  disabled={deleting}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <Trash2 className="w-4 h-4" /> Delete
                    </span>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CertificatesViewer;