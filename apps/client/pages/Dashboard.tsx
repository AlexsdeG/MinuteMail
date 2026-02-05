import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Input from '../components/Input';
import Timer from '../components/Timer';
import { 
  Plus, 
  Trash2, 
  Clock, 
  ExternalLink, 
  RefreshCw, 
  PauseCircle, 
  PlayCircle,
  Mail,
  AlertCircle
} from 'lucide-react';
import api from '../api/axios';
import { Alias } from '../types';
import { formatTimeRemaining } from '../utils/format';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Custom alias naming state
  const [customSlug, setCustomSlug] = useState('');
  const [slugError, setSlugError] = useState<string | null>(null);
  const [isCheckingSlug, setIsCheckingSlug] = useState(false);
  const [useCustomName, setUseCustomName] = useState(false);

  const fetchAliases = useCallback(async (showRefresh = false) => {
    if (showRefresh) setIsRefreshing(true);
    try {
      const response = await api.get<Alias[]>('/aliases');
      // Sort by Created At desc
      const sorted = response.data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAliases(sorted);
    } catch (error) {
      console.error('Failed to fetch aliases', error);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchAliases();
  }, [fetchAliases]);

  // Check slug availability with debounce
  useEffect(() => {
    if (!useCustomName || !customSlug.trim()) {
      setSlugError(null);
      return;
    }

    // Validate format
    if (!/^[a-zA-Z0-9._-]+$/.test(customSlug)) {
      setSlugError('Only letters, numbers, dots, dashes, and underscores');
      return;
    }

    if (customSlug.length > 20) {
      setSlugError('Maximum 20 characters');
      return;
    }

    const checkSlug = async () => {
      setIsCheckingSlug(true);
      try {
        const response = await api.get<{ available: boolean; reason?: string }>(
          `/aliases/check/${customSlug}`
        );
        if (!response.data.available) {
          setSlugError(response.data.reason || 'Alias not available');
        } else {
          setSlugError(null);
        }
      } catch (error) {
        console.error('Failed to check slug', error);
      } finally {
        setIsCheckingSlug(false);
      }
    };

    const timer = setTimeout(checkSlug, 500);
    return () => clearTimeout(timer);
  }, [customSlug, useCustomName]);

  const handleCreateAlias = async () => {
    if (useCustomName && (slugError || isCheckingSlug)) return;
    
    setActionLoading(true);
    try {
      await api.post('/aliases', {
        slug: useCustomName && customSlug.trim() ? customSlug.trim() : undefined,
      });
      await fetchAliases();
      setIsCreateModalOpen(false);
      setCustomSlug('');
      setUseCustomName(false);
    } catch (error: any) {
      console.error('Failed to create alias', error);
      const message = error.response?.data?.message || 'Failed to create alias';
      alert(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAlias = async () => {
    if (!isDeletingId) return;
    setActionLoading(true);
    try {
      await api.delete(`/aliases/${isDeletingId}`);
      setAliases((prev) => prev.filter((a) => a.id !== isDeletingId));
      setIsDeletingId(null);
    } catch (error) {
      console.error('Failed to delete alias', error);
      alert('Failed to delete alias.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendAlias = async (id: string) => {
    try {
      await api.patch(`/aliases/${id}/extend`, { duration: '1hour' });
      await fetchAliases();
    } catch (error) {
      console.error('Failed to extend alias', error);
      alert('Failed to extend duration.');
    }
  };

  const handleTogglePause = async (id: string) => {
    try {
      const response = await api.patch<Alias>(`/aliases/${id}/pause`);
      setAliases((prev) =>
        prev.map((a) => (a.id === id ? response.data : a))
      );
    } catch (error) {
      console.error('Failed to toggle pause', error);
      alert('Failed to toggle pause.');
    }
  };

  const handleReload = () => {
    fetchAliases(true);
  };

  const getTimerDisplayClass = (expiresAt: string) => {
    const remaining = new Date(expiresAt).getTime() - Date.now();
    if (remaining < 60 * 60 * 1000) return 'text-red-600'; // < 1 hour
    if (remaining < 24 * 60 * 60 * 1000) return 'text-amber-600'; // < 1 day
    return 'text-slate-600';
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
          <p className="text-slate-500">Manage your active email aliases.</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={handleReload} disabled={isRefreshing}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            Reload
          </Button>
          <Button onClick={() => setIsCreateModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New Alias
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Your Aliases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto" />
            </div>
          ) : aliases.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-slate-500">
              <div className="bg-slate-100 p-4 rounded-full mb-4">
                <Clock className="h-8 w-8 opacity-50" />
              </div>
              <p className="mb-4">You don't have any active aliases yet.</p>
              <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>
                Create one now
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-slate-500 uppercase bg-slate-50 border-b border-slate-200">
                  <tr>
                    <th className="px-6 py-3 font-medium">Address</th>
                    <th className="px-6 py-3 font-medium">Expires</th>
                    <th className="px-6 py-3 font-medium">Status</th>
                    <th className="px-6 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {aliases.map((alias) => (
                    <tr key={alias.id} className="bg-white hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-4 font-medium text-slate-900">
                        <button
                          onClick={() => navigate(`/inbox/${alias.id}`)}
                          className="flex items-center hover:text-blue-600 group"
                        >
                          <span className="group-hover:underline">{alias.address}</span>
                          {(alias.unreadCount ?? 0) > 0 && (
                            <span className="ml-2 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold bg-blue-600 text-white">
                              {alias.unreadCount}
                            </span>
                          )}
                          <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                        </button>
                      </td>
                      <td className="px-6 py-4">
                        <Timer
                          expiresAt={alias.expiresAt}
                          showFull={true}
                          variant="plain"
                          className={`font-mono text-sm ${getTimerDisplayClass(alias.expiresAt)}`}
                        />
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center space-x-2">
                          {alias.isPaused ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                              <PauseCircle className="h-3 w-3 mr-1" />
                              Paused
                            </span>
                          ) : alias.isActive ? (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              Active
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              Inactive
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 text-right space-x-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          title={alias.isPaused ? 'Resume' : 'Pause'}
                          onClick={() => handleTogglePause(alias.id)}
                          className={alias.isPaused ? 'text-green-600' : 'text-amber-600'}
                        >
                          {alias.isPaused ? (
                            <PlayCircle className="h-4 w-4" />
                          ) : (
                            <PauseCircle className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Extend 1 Hour"
                          onClick={() => handleExtendAlias(alias.id)}
                        >
                          <Clock className="h-4 w-4 text-blue-600" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          title="Delete"
                          className="hover:text-red-600"
                          onClick={() => setIsDeletingId(alias.id)}
                        >
                          <Trash2 className="h-4 w-4 text-slate-400 hover:text-red-600" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Alias Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          setCustomSlug('');
          setUseCustomName(false);
          setSlugError(null);
        }}
        title="Create New Alias"
        footer={
          <>
            <Button
              variant="ghost"
              onClick={() => {
                setIsCreateModalOpen(false);
                setCustomSlug('');
                setUseCustomName(false);
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateAlias}
              isLoading={actionLoading}
              disabled={useCustomName && (!!slugError || isCheckingSlug || !customSlug.trim())}
            >
              {useCustomName ? 'Create Custom Alias' : 'Generate Random Alias'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <p className="text-slate-600">
            Create a new email address. This alias will be active for 1 hour by default and can be extended.
          </p>

          <div className="flex items-center space-x-2">
            <input
              type="checkbox"
              id="useCustomName"
              checked={useCustomName}
              onChange={(e) => {
                setUseCustomName(e.target.checked);
                if (!e.target.checked) {
                  setCustomSlug('');
                  setSlugError(null);
                }
              }}
              className="h-4 w-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
            />
            <label htmlFor="useCustomName" className="text-sm text-slate-700">
              Use custom alias name
            </label>
          </div>

          {useCustomName && (
            <div className="space-y-2">
              <div className="flex items-center">
                <Input
                  placeholder="myalias"
                  value={customSlug}
                  onChange={(e) => setCustomSlug(e.target.value.toLowerCase())}
                  className={`rounded-r-none ${slugError ? 'border-red-500' : ''}`}
                  maxLength={20}
                />
                <span className="px-3 py-2 bg-slate-100 border border-l-0 border-slate-300 rounded-r-md text-sm text-slate-500">
                  @{import.meta.env.VITE_DOMAIN || 'example.com'}
                </span>
              </div>
              {isCheckingSlug && (
                <p className="text-sm text-slate-500 flex items-center">
                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                  Checking availability...
                </p>
              )}
              {slugError && (
                <p className="text-sm text-red-600 flex items-center">
                  <AlertCircle className="h-3 w-3 mr-1" />
                  {slugError}
                </p>
              )}
              {!slugError && !isCheckingSlug && customSlug.trim() && (
                <p className="text-sm text-green-600">✓ Alias available</p>
              )}
            </div>
          )}

          <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500">
            Tip: Custom names are reserved permanently and cannot be reused once deleted.
          </div>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!isDeletingId}
        onClose={() => setIsDeletingId(null)}
        title="Delete Alias"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeletingId(null)}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteAlias} isLoading={actionLoading}>
              Delete Forever
            </Button>
          </>
        }
      >
        <p className="text-slate-600">
          Are you sure you want to delete this alias? You will stop receiving emails immediately, and this action cannot be undone.
        </p>
      </Modal>
    </div>
  );
};

export default Dashboard;
