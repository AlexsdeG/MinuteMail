import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '../components/Card';
import InboxToolbar from '../components/InboxToolbar';
import EmailList from '../components/EmailList';
import EmailViewer from '../components/EmailViewer';
import { Alias, Email, ExtendDuration } from '../types';
import api from '../api/axios';

const Inbox: React.FC = () => {
  const { aliasId } = useParams<{ aliasId: string }>();
  const navigate = useNavigate();
  const [alias, setAlias] = useState<Alias | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [emailsLoading, setEmailsLoading] = useState(false);
  const [copiedToast, setCopiedToast] = useState(false);

  // Fetch alias details
  const fetchAlias = useCallback(async () => {
    if (!aliasId) return;
    try {
      const response = await api.get<Alias>(`/aliases/${aliasId}`);
      setAlias(response.data);
    } catch (error) {
      console.error('Failed to fetch alias', error);
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [aliasId, navigate]);

  // Fetch emails for alias
  const fetchEmails = useCallback(async () => {
    if (!aliasId) return;
    setEmailsLoading(true);
    try {
      const response = await api.get<Email[]>(`/aliases/${aliasId}/emails`);
      setEmails(response.data);
    } catch (error) {
      console.error('Failed to fetch emails', error);
    } finally {
      setEmailsLoading(false);
    }
  }, [aliasId]);

  useEffect(() => {
    fetchAlias();
    fetchEmails();
  }, [fetchAlias, fetchEmails]);

  // Poll for new emails every 30 seconds
  useEffect(() => {
    const interval = setInterval(fetchEmails, 30000);
    return () => clearInterval(interval);
  }, [fetchEmails]);

  const handleRefresh = () => {
    fetchAlias();
    fetchEmails();
  };

  const handleCopy = () => {
    setCopiedToast(true);
    setTimeout(() => setCopiedToast(false), 2000);
  };

  const handleExtend = async (duration: ExtendDuration) => {
    if (!aliasId) return;
    try {
      const response = await api.patch<Alias>(`/aliases/${aliasId}/extend`, { duration });
      setAlias(response.data);
    } catch (error) {
      console.error('Failed to extend alias', error);
      alert('Failed to extend time');
    }
  };

  const handleTogglePause = async () => {
    if (!aliasId) return;
    try {
      const response = await api.patch<Alias>(`/aliases/${aliasId}/pause`);
      setAlias(response.data);
    } catch (error) {
      console.error('Failed to toggle pause', error);
      alert('Failed to toggle pause');
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedIds.size === 0) return;
    try {
      await api.delete('/emails', { data: { ids: Array.from(selectedIds) } });
      setEmails((prev) => prev.filter((e) => !selectedIds.has(e.id)));
      setSelectedIds(new Set());
      if (selectedEmail && selectedIds.has(selectedEmail.id)) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to delete emails', error);
      alert('Failed to delete emails');
    }
  };

  const handleDownloadSelected = () => {
    // Download each selected email
    selectedIds.forEach((id) => {
      window.open(`${import.meta.env.VITE_API_URL}/emails/${id}/download`, '_blank');
    });
  };

  const handleSelect = (id: string, isSelected: boolean) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (isSelected) {
        next.add(id);
      } else {
        next.delete(id);
      }
      return next;
    });
  };

  const handleSelectAll = (selectAll: boolean) => {
    if (selectAll) {
      setSelectedIds(new Set(emails.map((e) => e.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleEmailClick = async (email: Email) => {
    setSelectedEmail(email);
    // Fetch full email content
    try {
      const response = await api.get<Email>(`/emails/${email.id}`);
      setSelectedEmail(response.data);
      // Update list to show as read
      setEmails((prev) =>
        prev.map((e) => (e.id === email.id ? { ...e, isRead: true } : e))
      );
    } catch (error) {
      console.error('Failed to fetch email', error);
    }
  };

  const handleMarkRead = async (id: string, isRead: boolean) => {
    try {
      await api.patch(`/emails/${id}/read`, { isRead });
      setEmails((prev) =>
        prev.map((e) => (e.id === id ? { ...e, isRead } : e))
      );
      if (selectedEmail?.id === id) {
        setSelectedEmail((prev) => (prev ? { ...prev, isRead } : prev));
      }
    } catch (error) {
      console.error('Failed to mark email', error);
    }
  };

  const handleDeleteSingle = async (id: string) => {
    try {
      await api.delete(`/emails/${id}`);
      setEmails((prev) => prev.filter((e) => e.id !== id));
      if (selectedEmail?.id === id) {
        setSelectedEmail(null);
      }
    } catch (error) {
      console.error('Failed to delete email', error);
      alert('Failed to delete email');
    }
  };

  const handleDownloadSingle = (id: string) => {
    window.open(`${import.meta.env.VITE_API_URL}/emails/${id}/download`, '_blank');
  };

  if (loading && !alias) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Toast notification */}
      {copiedToast && (
        <div className="fixed top-4 right-4 bg-slate-900 text-white px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-in">
          Copied to clipboard!
        </div>
      )}

      {/* Toolbar */}
      {alias && (
        <InboxToolbar
          aliasAddress={alias.address}
          expiresAt={alias.expiresAt}
          createdAt={alias.createdAt}
          isPaused={alias.isPaused}
          selectedCount={selectedIds.size}
          onRefresh={handleRefresh}
          onCopy={handleCopy}
          onDelete={handleDeleteSelected}
          onDownload={handleDownloadSelected}
          onExtend={handleExtend}
          onTogglePause={handleTogglePause}
          isLoading={emailsLoading}
        />
      )}

      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-240px)] min-h-[500px]">
        {/* Email list */}
        <Card className="lg:col-span-1 flex flex-col overflow-hidden">
          <EmailList
            emails={emails}
            selectedIds={selectedIds}
            onSelect={handleSelect}
            onSelectAll={handleSelectAll}
            onEmailClick={handleEmailClick}
            onDelete={handleDeleteSingle}
            onDownload={handleDownloadSingle}
            activeEmailId={selectedEmail?.id}
            isLoading={emailsLoading && emails.length === 0}
          />
        </Card>

        {/* Email viewer */}
        <Card className="lg:col-span-2 overflow-hidden">
          <EmailViewer
            email={selectedEmail}
            aliasAddress={alias?.address}
            aliasExpiresAt={alias?.expiresAt}
            onMarkRead={handleMarkRead}
            onDelete={handleDeleteSingle}
            onDownload={handleDownloadSingle}
          />
        </Card>
      </div>
    </div>
  );
};

export default Inbox;
