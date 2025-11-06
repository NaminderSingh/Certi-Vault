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
  Trash2,
  AlertTriangle,
  Loader2,
  Eye,
  EyeOff,
  Copy,
  CheckCheck,
  ExternalLink,
  Users,
  FileText
} from 'lucide-react';

const InstitutionProfile = () => {
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

  useEffect(() => {
    if (status === 'authenticated') {
      fetchProfile();
    }
  }, [status]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await fetch('/api/institutionprofile');
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

  const handleDeleteAccount = async () => {
    if (!deleteEmail || deleteEmail !== session.user.email) {
      alert('Please enter your email correctly to confirm deletion');
      return;
    }

    setDeleting(true);
    try {
      const res = await fetch('/api/institutionprofile', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirmEmail: deleteEmail })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to delete account');

      alert('Account deleted successfully. All verified certificates have been unmarked. You will be signed out.');
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
            Institution Profile
          </h1>
          <p className="text-slate-400">Manage your institution account and settings</p>
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
          <h2 className="text-xl font-bold text-cyan-400 mb-6">Institution Information</h2>
          
          <div className="flex flex-col md:flex-row gap-6">
            {/* Profile Picture */}
            <div className="flex-shrink-0">
              {profile?.image ? (
                <img 
                  src={profile.image} 
                  alt="Profile" 
                  className="w-24 h-24 rounded-full border-4 border-cyan-500/30"
                />
              ) : (
                <div className="w-24 h-24 bg-gradient-to-r from-cyan-500 to-purple-600 rounded-full flex items-center justify-center">
                  <Shield className="w-12 h-12 text-white" />
                </div>
              )}
            </div>

            {/* Profile Details */}
            <div className="flex-1 space-y-4">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-slate-400 text-sm flex items-center gap-2 mb-1">
                    <Award className="w-4 h-4" /> Institution Name
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
                  <span className="inline-flex px-3 py-1 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-sm font-medium">
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
          <h2 className="text-xl font-bold text-cyan-400 mb-6">Verification Statistics</h2>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-cyan-500/20 rounded-lg flex items-center justify-center">
                  <FileText className="w-6 h-6 text-cyan-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Certificates Issued</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.totalCertificatesIssued || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Clock className="w-6 h-6 text-yellow-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Pending Requests</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.pendingRequests || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <CheckCircle className="w-6 h-6 text-green-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Approved This Month</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.approvedThisMonth || 0}</p>
                </div>
              </div>
            </div>

            <div className="bg-slate-700/30 rounded-xl p-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center">
                  <Users className="w-6 h-6 text-purple-400" />
                </div>
                <div>
                  <p className="text-slate-400 text-sm">Total Students</p>
                  <p className="text-2xl font-bold text-white">{profile?.stats?.totalStudents || 0}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Signing Key Card */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-xl font-bold text-cyan-400 mb-4 flex items-center gap-2">
            <Key className="w-5 h-5" /> Digital Signature Key
          </h2>
          
          <div className="bg-slate-700/30 rounded-xl p-4 mb-4">
            <p className="text-slate-300 text-sm mb-3">
              Your signing key is used to create digital signatures when verifying certificates. This key proves your institution's authenticity.
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

          <div className="bg-purple-500/10 border border-purple-500/30 rounded-lg p-3">
            <div className="flex items-start gap-2">
              <Shield className="w-5 h-5 text-purple-400 flex-shrink-0 mt-0.5" />
              <p className="text-purple-400 text-sm">
                <strong>Security Notice:</strong> This key is used to sign all certificates you verify. Keep it secure and never share it with unauthorized parties.
              </p>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-slate-800/30 backdrop-blur-md border border-red-700 rounded-2xl p-6">
          <h2 className="text-xl font-bold text-red-400 mb-4">Danger Zone</h2>
          
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 mb-4">
            <p className="text-slate-300 text-sm mb-2">
              Deleting your account will:
            </p>
            <ul className="list-disc list-inside text-slate-400 text-sm space-y-1">
              <li>Remove your institution profile permanently</li>
              <li>Unverify all certificates you've signed ({profile?.stats?.totalCertificatesIssued || 0} certificates)</li>
              <li>Delete all pending verification requests ({profile?.stats?.pendingRequests || 0} requests)</li>
              <li>Remove your digital signing key</li>
            </ul>
          </div>

          <button
            onClick={() => setShowDeleteModal(true)}
            className="w-full flex items-center justify-center gap-2 bg-red-600/20 hover:bg-red-600/30 border border-red-600/50 text-red-400 py-3 px-4 rounded-xl transition-all"
          >
            <Trash2 className="w-5 h-5" />
            Delete Institution Account
          </button>
        </div>

        {/* Delete Account Modal */}
        {showDeleteModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-slate-800 p-6 rounded-2xl max-w-md w-full relative border border-red-700 shadow-2xl">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-red-500/20 rounded-xl flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h2 className="text-xl font-bold text-white">Delete Institution Account</h2>
              </div>

              <div className="mb-4">
                <p className="text-slate-300 mb-4">
                  This action is <strong className="text-red-400">permanent and cannot be undone</strong>. This will affect:
                </p>
                <ul className="list-disc list-inside text-slate-400 text-sm space-y-1 mb-4">
                  <li>{profile?.stats?.totalCertificatesIssued || 0} verified certificate(s) will be unmarked</li>
                  <li>{profile?.stats?.pendingRequests || 0} pending request(s) will be deleted</li>
                  <li>Your digital signing key will be permanently removed</li>
                  <li>All institution data will be erased</li>
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

export default InstitutionProfile;