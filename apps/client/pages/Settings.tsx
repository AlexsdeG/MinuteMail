import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';
import { Card, CardHeader, CardTitle, CardContent } from '../components/Card';
import Button from '../components/Button';
import { UserProfile, Invite } from '../types';
import { Settings as SettingsIcon, Key, Mail, Users, Copy, Trash2, Plus, Shield, CheckCircle, Send } from 'lucide-react';

const VERIFICATION_COOLDOWN_SECONDS = 60;
const VERIFICATION_COOLDOWN_KEY = 'lastVerificationRequest';

const Settings: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Password change state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Email change state
  const [newEmail, setNewEmail] = useState('');
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState(false);
  const [isChangingEmail, setIsChangingEmail] = useState(false);

  // Email verification state
  const [isSendingVerification, setIsSendingVerification] = useState(false);
  const [verificationMessage, setVerificationMessage] = useState<string | null>(null);
  const [verificationCooldown, setVerificationCooldown] = useState(0);

  // Invites state (for master admin)
  const [invites, setInvites] = useState<Invite[]>([]);
  const [inviteEmail, setInviteEmail] = useState('');
  const [isCreatingInvite, setIsCreatingInvite] = useState(false);
  const [inviteLink, setInviteLink] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
    if (user?.isMasterAdmin) {
      fetchInvites();
    }
    // Check verification cooldown
    updateVerificationCooldown();
    const interval = setInterval(updateVerificationCooldown, 1000);
    return () => clearInterval(interval);
  }, [user]);

  const updateVerificationCooldown = () => {
    const lastRequest = localStorage.getItem(VERIFICATION_COOLDOWN_KEY);
    if (lastRequest) {
      const elapsed = Math.floor((Date.now() - parseInt(lastRequest)) / 1000);
      const remaining = Math.max(0, VERIFICATION_COOLDOWN_SECONDS - elapsed);
      setVerificationCooldown(remaining);
    } else {
      setVerificationCooldown(0);
    }
  };

  const fetchProfile = async () => {
    try {
      const response = await api.get<UserProfile>('/settings/profile');
      setProfile(response.data);
    } catch (error) {
      console.error('Failed to fetch profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchInvites = async () => {
    try {
      const response = await api.get<Invite[]>('/invites');
      setInvites(response.data);
    } catch (error) {
      console.error('Failed to fetch invites', error);
    }
  };

  const handleSendVerification = async () => {
    if (verificationCooldown > 0) return;
    
    setIsSendingVerification(true);
    setVerificationMessage(null);
    try {
      await api.post('/settings/send-verification');
      localStorage.setItem(VERIFICATION_COOLDOWN_KEY, Date.now().toString());
      setVerificationCooldown(VERIFICATION_COOLDOWN_SECONDS);
      setVerificationMessage('Verification email sent! Check your inbox.');
    } catch (error: any) {
      setVerificationMessage(error.response?.data?.message || 'Failed to send verification email');
    } finally {
      setIsSendingVerification(false);
    }
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match');
      return;
    }

    if (newPassword.length < 6) {
      setPasswordError('Password must be at least 6 characters');
      return;
    }

    setIsChangingPassword(true);
    try {
      await api.patch('/settings/password', { currentPassword, newPassword });
      setPasswordSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: any) {
      setPasswordError(error.response?.data?.message || 'Failed to change password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleEmailChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setEmailError(null);
    setEmailSuccess(false);

    if (!newEmail) {
      setEmailError('Please enter a new email');
      return;
    }

    setIsChangingEmail(true);
    try {
      await api.patch('/settings/email', { newEmail });
      setEmailSuccess(true);
      setNewEmail('');
      await refreshUser();
    } catch (error: any) {
      setEmailError(error.response?.data?.message || 'Failed to change email');
    } finally {
      setIsChangingEmail(false);
    }
  };

  const handleCreateInvite = async () => {
    setIsCreatingInvite(true);
    try {
      const response = await api.post<Invite>('/invites', { 
        email: inviteEmail || undefined,
        expiresInDays: 7 
      });
      const domain = import.meta.env.VITE_DOMAIN || window.location.host;
      setInviteLink(`https://${domain}/register?invite=${response.data.token}`);
      setInviteEmail('');
      fetchInvites();
    } catch (error) {
      console.error('Failed to create invite', error);
    } finally {
      setIsCreatingInvite(false);
    }
  };

  const handleCopyInvite = (token: string) => {
    const domain = import.meta.env.VITE_DOMAIN || window.location.host;
    navigator.clipboard.writeText(`https://${domain}/register?invite=${token}`);
  };

  const handleRevokeInvite = async (id: string) => {
    try {
      await api.delete(`/invites/${id}`);
      fetchInvites();
    } catch (error) {
      console.error('Failed to revoke invite', error);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-900">Settings</h1>
        <p className="text-slate-500">Manage your account settings and preferences.</p>
      </div>

      {/* Profile Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <SettingsIcon className="mr-2 h-5 w-5" />
            Profile
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-600">Email</span>
              <span className="font-medium">{profile?.email}</span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-600">Account Type</span>
              <span className="font-medium flex items-center">
                {profile?.isMasterAdmin && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 mr-2">
                    <Shield className="h-3 w-3 mr-1" />
                    Master Admin
                  </span>
                )}
                User
              </span>
            </div>
            <div className="flex items-center justify-between py-2 border-b">
              <span className="text-slate-600">Email Verified</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${profile?.emailVerified ? 'text-green-600' : 'text-amber-600'}`}>
                  {profile?.emailVerified ? 'Verified' : 'Not Verified'}
                </span>
                {!profile?.emailVerified && (
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleSendVerification}
                    isLoading={isSendingVerification}
                    disabled={verificationCooldown > 0}
                    title={verificationCooldown > 0 ? `Wait ${verificationCooldown}s` : 'Send verification email'}
                  >
                    {verificationCooldown > 0 ? (
                      `${verificationCooldown}s`
                    ) : (
                      <><Send className="h-3 w-3 mr-1" /> Verify</>   
                    )}
                  </Button>
                )}
              </div>
            </div>
            {verificationMessage && (
              <div className={`text-sm p-2 rounded ${verificationMessage.includes('sent') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                {verificationMessage}
              </div>
            )}
            <div className="flex items-center justify-between py-2">
              <span className="text-slate-600">Member Since</span>
              <span className="font-medium">
                {profile?.createdAt && new Date(profile.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Key className="mr-2 h-5 w-5" />
            Change Password
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            {passwordError && (
              <p className="text-red-600 text-sm">{passwordError}</p>
            )}
            {passwordSuccess && (
              <p className="text-green-600 text-sm">Password changed successfully!</p>
            )}
            <Button type="submit" isLoading={isChangingPassword}>
              Change Password
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Change Email Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Mail className="mr-2 h-5 w-5" />
            Change Email
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleEmailChange} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Email Address
              </label>
              <input
                type="email"
                value={newEmail}
                onChange={(e) => setNewEmail(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="newemail@example.com"
                required
              />
            </div>
            {emailError && (
              <p className="text-red-600 text-sm">{emailError}</p>
            )}
            {emailSuccess && (
              <p className="text-green-600 text-sm">Email updated successfully!</p>
            )}
            <Button type="submit" isLoading={isChangingEmail}>
              Update Email
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Admin Section - Only visible to master admin */}
      {user?.isMasterAdmin && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              Invite Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <p className="text-slate-600 text-sm">
                As master admin, you can invite users even when registration is disabled.
              </p>
              
              <div className="flex space-x-2">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="flex-1 px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  placeholder="Optional: Restrict to email"
                />
                <Button onClick={handleCreateInvite} isLoading={isCreatingInvite}>
                  <Plus className="h-4 w-4 mr-1" />
                  Create Invite
                </Button>
              </div>

              {inviteLink && (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                  <p className="text-sm text-green-800 font-medium mb-2">Invite link created:</p>
                  <div className="flex items-center space-x-2">
                    <code className="flex-1 text-xs bg-white px-2 py-1 rounded border overflow-hidden text-ellipsis">
                      {inviteLink}
                    </code>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(inviteLink);
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              )}

              {invites.length > 0 && (
                <div className="border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b">
                      <tr>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Email</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Status</th>
                        <th className="px-4 py-2 text-left font-medium text-slate-600">Expires</th>
                        <th className="px-4 py-2 text-right font-medium text-slate-600">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {invites.map((invite) => (
                        <tr key={invite.id}>
                          <td className="px-4 py-2">{invite.email || 'Any'}</td>
                          <td className="px-4 py-2">
                            {invite.usedAt ? (
                              <span className="text-slate-400">Used</span>
                            ) : new Date(invite.expiresAt) < new Date() ? (
                              <span className="text-red-600">Expired</span>
                            ) : (
                              <span className="text-green-600">Active</span>
                            )}
                          </td>
                          <td className="px-4 py-2 text-slate-600">
                            {new Date(invite.expiresAt).toLocaleDateString()}
                          </td>
                          <td className="px-4 py-2 text-right space-x-1">
                            {!invite.usedAt && new Date(invite.expiresAt) > new Date() && (
                              <>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleCopyInvite(invite.token)}
                                  title="Copy link"
                                >
                                  <Copy className="h-3 w-3" />
                                </Button>
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => handleRevokeInvite(invite.id)}
                                  title="Revoke"
                                  className="text-red-600"
                                >
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default Settings;
