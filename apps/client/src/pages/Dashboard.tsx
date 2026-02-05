import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Input from '../components/Input';
import Modal from '../components/Modal';
import Timer from '../components/Timer';
import CopyButton from '../components/CopyButton';
import { Plus, Trash2, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { Alias } from '../types';
import toast from 'react-hot-toast';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  
  // Custom prefix state
  const [customPrefix, setCustomPrefix] = useState('');

  const fetchAliases = async () => {
    try {
      const response = await api.get<Alias[]>('/aliases');
      const sorted = response.data.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        return dateB - dateA;
      });
      setAliases(sorted);
    } catch (error) {
      console.error("Failed to fetch aliases", error);
      toast.error("Failed to load aliases");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchAliases();
  }, []);

  const handleCreateAlias = async () => {
    setActionLoading(true);
    try {
      // Pass the optional prefix. If empty, backend generates random.
      await api.post('/aliases', { prefix: customPrefix ? customPrefix.trim() : undefined });
      await fetchAliases();
      setIsCreateModalOpen(false);
      setCustomPrefix(''); // Reset
      toast.success("Alias created successfully");
    } catch (error) {
      console.error("Failed to create alias", error);
      toast.error("Failed to create alias. Name might be taken or limit reached.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteAlias = async () => {
    if (!isDeletingId) return;
    setActionLoading(true);
    try {
      await api.delete(`/aliases/${isDeletingId}`);
      setAliases(prev => prev.filter(a => a.id !== isDeletingId));
      setIsDeletingId(null);
      toast.success("Alias deleted");
    } catch (error) {
      console.error("Failed to delete alias", error);
      toast.error("Failed to delete alias");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendAlias = async (id: string) => {
    try {
      await api.patch(`/aliases/${id}/extend`, { duration: 3600 }); // +1 Hour
      await fetchAliases();
      toast.success("Alias extended by 1 hour");
    } catch (error) {
      console.error("Failed to extend alias", error);
      toast.error("Failed to extend duration");
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
           <h1 className="text-3xl font-bold tracking-tight text-slate-900">Dashboard</h1>
           <p className="text-slate-500">Manage your active email aliases.</p>
        </div>
        <Button onClick={() => setIsCreateModalOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> New Alias
        </Button>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <CardTitle>Your Aliases</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading aliases...</div>
          ) : aliases.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center text-slate-500">
               <div className="bg-slate-100 p-4 rounded-full mb-4">
                 <Clock className="h-8 w-8 opacity-50" />
               </div>
               <p className="mb-4">You don't have any active aliases yet.</p>
               <Button variant="outline" onClick={() => setIsCreateModalOpen(true)}>Create one now</Button>
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
                        <div className="flex items-center space-x-2">
                          <button 
                            onClick={() => navigate(`/inbox/${alias.id}`)}
                            className="hover:text-blue-600 hover:underline"
                          >
                            {alias.address}
                          </button>
                          <CopyButton text={alias.address} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center">
                          <Timer 
                            expiresAt={alias.expiresAt} 
                            className="bg-transparent px-0 py-0 text-slate-600" 
                          />
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${alias.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                          {alias.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right space-x-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="View Inbox"
                          onClick={() => navigate(`/inbox/${alias.id}`)}
                        >
                           <ExternalLink className="h-4 w-4 text-slate-400 hover:text-blue-600" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          title="Extend 1 Hour"
                          onClick={() => handleExtendAlias(alias.id)}
                        >
                          <RefreshCw className="h-4 w-4 text-blue-600" />
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
        onClose={() => { setIsCreateModalOpen(false); setCustomPrefix(''); }}
        title="Create New Alias"
        footer={
          <>
            <Button variant="ghost" onClick={() => { setIsCreateModalOpen(false); setCustomPrefix(''); }}>Cancel</Button>
            <Button onClick={handleCreateAlias} isLoading={actionLoading}>
              {customPrefix ? 'Create Custom' : 'Generate Random'}
            </Button>
          </>
        }
      >
        <p className="text-slate-600 mb-4">
          Create a new email alias. Valid for 1 week (renewable).
        </p>
        <div className="space-y-3">
          <label className="block text-sm font-medium text-slate-700">Custom Name (Optional)</label>
          <div className="flex">
            <Input 
              placeholder="e.g. my-project-test" 
              value={customPrefix}
              onChange={(e) => setCustomPrefix(e.target.value)}
              className="rounded-r-none"
            />
            <div className="flex items-center px-3 border border-l-0 border-slate-300 bg-slate-50 text-slate-500 rounded-r-md text-sm">
              @domain.com
            </div>
          </div>
          <p className="text-xs text-slate-500">Leave empty to auto-generate a random secure name.</p>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!isDeletingId}
        onClose={() => setIsDeletingId(null)}
        title="Delete Alias"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsDeletingId(null)}>Cancel</Button>
            <Button variant="danger" onClick={handleDeleteAlias} isLoading={actionLoading}>Delete Forever</Button>
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
