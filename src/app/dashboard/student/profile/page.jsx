'use client';

import { useState, useEffect } from 'react';
import { useSession, signOut } from 'next-auth/react';
import {
  User,
  Mail,
  Shield,
  Award,
  CheckCircle,
  Clock,
  Calendar,
  Key,
  Download,
  Trash2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  ExternalLink
} from 'lucide-react';

const StudentProfile = () => {
  const { data: session, status } = useSession();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Delete account state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteEmail, setDeleteEmail] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Encryption key state
  const [showKey, setShowKey] = useState(false);
  const [copied, setCopied] = useState(false);

  // Bulk download state
  const [downloading, setDownloading] = useState(false);

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/studentprofile');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to fetch profile');
      }

      const data = await res.json();
      if (data.success) {
        setProfile(data.profile);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const copyToClipboard = async () => {
    if (!profile?.encryptionKey) return;

    try {
      await navigator.clipboard.writeText(profile.encryptionKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      alert('Failed to copy to clipboard');
    }
  };

  const handleBulkDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch('/api/certifictes/bulkdownload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to download certificates');

      if (data.success && data.certificates.length > 0) {
        // Download each certificate
        data.certificates.forEach((cert, index) => {
          setTimeout(() => {
            const byteChars = atob(cert.pdf);
            const byteNumbers = Array.from(byteChars, c => c.charCodeAt(0));
            const blob = new Blob([new Uint8Array(byteNumbers)], { type: 'application/pdf' });

            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `${cert.title.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.pdf`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }, index * 500); // Stagger downloads by 500ms
        });

        alert(`Successfully downloaded ${data.certificates.length} certificate(s)`);
      }
    } catch (err) {
      console.error('Bulk download error:', err);
      alert('Error downloading certificates: ' + err.message);
    } finally {
      setDownloading(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!deleteEmail || deleteEmail !== session.user.email) {
      alert('Please enter your email correctly to confirm deletion');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/certifictes/studentprofile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: deleteEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      alert('Account deleted successfully. You will be signed out.');
      await signOut({ callbackUrl: '/' });
    } catch (err) {
      console.error('Delete account error:', err);
      alert('Error deleting account: ' + err.message);
    } finally {
      setDeleting(false);
    }
  };

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-cyan-400 animate-spin mx-auto mb-4" />
          <p className="text-slate-300">Loading profile...</p>
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
          <p className="text-slate-400">Please sign in to view your profile.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white">
      <div className="max-w-5xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent mb-2">
            Student Profile
          </h1>
          <p className="text-slate-400">Manage your account settings and information</p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-500/20 border border-red-500/50 rounded-xl p-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-red-400" />
              <p className="text-red-400">{error}</p>
            </div>
          </div>
        )}

        {/* Profile Information Card */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-6">Profile Information</h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile?.image ? (
                <img 
                  src={session.user.image} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-cyan-500/30"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                  <User className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <User className="w-4 h-4" /> Full Name
                  </label>
                  <p className="text-white font-medium text-lg">{profile?.name}</p>
                </div>

                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <Mail className="w-4 h-4" /> Email Address
                  </label>
                  <p className="text-white font-medium">{profile?.email}</p>
                </div>

                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <Shield className="w-4 h-4" /> Role
                  </label>
                  <span className="inline-flex px-3 py-1 bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 rounded-full text-sm font-medium">
                    {profile?.role}
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <Calendar className="w-4 h-4" /> Member Since
                  </label>
                  <p className="text-white font-medium">{profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}</p>
                </div>
              </div>

              {profile?.provider && (
                <div className="flex items-center gap-2 text-sm text-slate-400">
                  <ExternalLink className="w-4 h-4" />
                  Signed in with {profile.provider.charAt(0).toUpperCase() + profile.provider.slice(1)}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Statistics Card */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-6">Account Statistics</h2>
          
          <div className="grid md:grid-cols-3 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <Award className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Certificates</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.totalCertificates || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Verified</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.verifiedCertificates || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Pending</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.pendingRequests || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Encryption Key Card */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" /> Encryption Key
          </h2>
          
          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <p className="text-slate-300 text-sm mb-3">
              Your encryption key is used to secure your certificates. Keep this key safe and never share it with anyone.
            </p>
            
            <div className="flex items-center gap-2">
              <div className="flex-1 bg-slate-900 rounded-lg p-3 font-mono text-sm overflow-x-auto">
                {showKey ? (
                  <span className="text-cyan-400 break-all">{profile?.encryptionKey}</span>
                ) : (
                  <span className="text-slate-500">{'•'.repeat(64)}</span>
                )}
              </div>
              
              <button
                onClick={() => setShowKey(!showKey)}
                className="p-3 bg-slate-700 hover:bg-slate-600 rounded-lg transition-colors"
                title={showKey ? 'Hide key' : 'Show key'}
              >
                {showKey ? <EyeOff className="w-5 h-5 text-slate-300" /> : <Eye className="w-5 h-5 text-slate-300" />}
              </button>
              
              <button
                onClick={copyToClipboard}
                className="p-3 bg-cyan-600 hover:bg-cyan-700 rounded-lg transition-colors"
                title="Copy to clipboard"
              >
                {copied ? <CheckCheck className="w-5 h-5 text-white" /> : <Copy className="w-5 h-5 text-white" />}
              </button>
            </div>
          </div>

          <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
              <p className="text-yellow-400 text-sm">
                <strong>Important:</strong> If you lose this key, you will not be able to decrypt your certificates. Store it securely.
              </p>
            </div>
          </div>
        </div>

        {/* Actions Card */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4">Account Actions</h2>
          
          <div className="space-y-3">
            <button
              onClick={handleBulkDownload}
              disabled={downloading || profile?.stats?.totalCertificates === 0}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {downloading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Downloading All Certificates...
                </>
              ) : (
                <>
                  <Download className="w-5 h-5" />
                  Download All Certificates ({profile?.stats?.totalCertificates || 0})
                </>
              )}
            </button>

            <button
              onClick={() => setShowDeleteModal(true)}
              className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 py-3 px-4 rounded-xl transition-all"
            >
              <Trash2 className="w-5 h-5" />
              Delete Account
            </button>
          </div>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 p-6 rounded-2xl max-w-md w-full relative border border-red-700 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Delete Account</h2>
              </div>

              <div className="mb-4">
                <p className="text-slate-300 mb-4">
                  This action is <strong className="text-red-400">permanent and cannot be undone</strong>. All your data will be deleted:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-4">
                  <li>{profile?.stats?.totalCertificates || 0} certificate(s)</li>
                  <li>{profile?.stats?.pendingRequests || 0} pending verification request(s)</li>
                  <li>Your encryption key and all account data</li>
                </ul>
              </div>

              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-4">
                <p className="text-red-400 text-sm">
                  Please type your email <strong>{session?.user?.email}</strong> to confirm deletion.
                </p>
              </div>

              <input
                type="email"
                placeholder="Enter your email"
                className="w-full p-3 rounded-xl mb-4 bg-slate-700 text-white border border-slate-600 focus:border-red-400 focus:outline-none transition-colors"
                value={deleteEmail}
                onChange={(e) => setDeleteEmail(e.target.value)}
              />

              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeleteEmail('');
                  }}
                  disabled={deleting}
                  className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deleting || deleteEmail !== session?.user?.email}
                  className="flex-1 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-700 hover:to-rose-700 text-white py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {deleting ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Deleting...
                    </span>
                  ) : (
                    'Delete Forever'
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

export default StudentProfile;