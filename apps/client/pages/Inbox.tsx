import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import Timer from '../components/Timer';
import { Alias } from '../types';
import Button from '../components/Button';
import { Copy, RefreshCw } from 'lucide-react';
import api from '../api/axios';

const Inbox: React.FC = () => {
  const { aliasId } = useParams<{ aliasId: string }>();
  const [alias, setAlias] = useState<Alias | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Try to get from local storage first (fast load for guests)
    const stored = localStorage.getItem('guest_alias');
    if (stored) {
      try {
        const parsed: Alias = JSON.parse(stored);
        if (parsed.id === aliasId) {
          setAlias(parsed);
          setLoading(false);
          // Optional: Re-verify with API in background
          return;
        }
      } catch (e) {
        console.error("Error parsing stored alias", e);
      }
    }

    // Fallback: Fetch from API (Scenario: Shared link or User Dashboard nav)
    const fetchAlias = async () => {
      try {
        // Assuming we have an endpoint to get specific alias details
        // Or we might list aliases and find one. 
        // For Phase 2 we mainly focus on Guest flow which uses LocalStorage largely
        // But let's mock a fetch if needed or handle 404
        if (!alias) {
            // Placeholder: In a real app we'd fetch GET /aliases/:id
            // setAlias(response.data);
            setLoading(false);
        }
      } catch (error) {
        console.error("Failed to fetch alias", error);
        setLoading(false);
      }
    };

    fetchAlias();
  }, [aliasId]);

  const handleCopy = () => {
    if (alias?.address) {
      navigator.clipboard.writeText(alias.address);
      // Could show toast here
    }
  };

  if (loading && !alias) {
     return <div className="flex items-center justify-center h-64">Loading inbox...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Inbox Header / Controls */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex flex-col space-y-1">
          <span className="text-sm text-slate-500 font-medium">Temporary Email Address</span>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight">
              {alias?.address || 'Loading...'}
            </h2>
            <Button variant="ghost" size="sm" onClick={handleCopy} title="Copy to clipboard">
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="flex items-center space-x-4">
           {alias?.expiresAt && (
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 mb-1">Expires in</span>
                <Timer 
                  expiresAt={alias.expiresAt} 
                  onExpire={() => alert("This email has expired!")} 
                />
             </div>
           )}
           <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
             <RefreshCw className="h-4 w-4 mr-2" /> Refresh
           </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[70vh]">
        {/* Email List */}
        <Card className="lg:col-span-1 border-r flex flex-col">
          <div className="p-4 border-b bg-slate-50/50">
             <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">Messages</h3>
          </div>
          <div className="flex-1 p-8 text-center text-slate-500 flex items-center justify-center">
             <span>Waiting for emails...</span>
          </div>
        </Card>

        {/* Email Viewer */}
        <Card className="lg:col-span-2 flex items-center justify-center bg-slate-50">
          <div className="text-slate-400 flex flex-col items-center">
            <MailIcon className="h-12 w-12 mb-2 opacity-20" />
            Select an email to view
          </div>
        </Card>
      </div>
    </div>
  );
};

const MailIcon = ({className}: {className?: string}) => (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
)

export default Inbox;
