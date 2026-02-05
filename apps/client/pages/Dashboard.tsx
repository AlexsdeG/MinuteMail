import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Button from '../components/Button';
import Modal from '../components/Modal';
import Timer from '../components/Timer';
import { Plus, Trash2, Clock, ExternalLink, RefreshCw } from 'lucide-react';
import api from '../api/axios';
import { Alias } from '../types';
import dayjs from 'dayjs';

const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDeletingId, setIsDeletingId] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchAliases = async () => {
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
      console.error("Failed to fetch aliases", error);
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
      await api.post('/aliases'); // Optional: pass domain if supported
      await fetchAliases();
      setIsCreateModalOpen(false);
    } catch (error) {
      console.error("Failed to create alias", error);
      alert("Failed to create alias. You may have reached your limit.");
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
    } catch (error) {
      console.error("Failed to delete alias", error);
      alert("Failed to delete alias.");
    } finally {
      setActionLoading(false);
    }
  };

  const handleExtendAlias = async (id: string) => {
    // Optimistic UI update could be done here, but we'll refresh for accuracy
    try {
      await api.patch(`/aliases/${id}/extend`, { duration: 3600 }); // +1 Hour
      await fetchAliases();
    } catch (error) {
      console.error("Failed to extend alias", error);
      alert("Failed to extend duration.");
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
                        <button 
                          onClick={() => navigate(`/inbox/${alias.id}`)}
                          className="flex items-center hover:text-blue-600 hover:underline"
                        >
                          {alias.address}
                          <ExternalLink className="h-3 w-3 ml-2 opacity-50" />
                        </button>
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
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Alias"
        footer={
          <>
            <Button variant="ghost" onClick={() => setIsCreateModalOpen(false)}>Cancel</Button>
            <Button onClick={handleCreateAlias} isLoading={actionLoading}>Generate Alias</Button>
          </>
        }
      >
        <p className="text-slate-600 mb-4">
          Generate a new random email address. This alias will be active for 1 week by default and can be extended.
        </p>
        <div className="bg-slate-50 p-3 rounded border border-slate-200 text-xs text-slate-500">
          Tip: You can manage multiple aliases simultaneously from this dashboard.
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
