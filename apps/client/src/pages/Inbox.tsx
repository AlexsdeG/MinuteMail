import React, { useEffect, useState, useCallback } from 'react';
import { useParams } from 'react-router-dom';
import { Card } from '../components/Card';
import Timer from '../components/Timer';
import EmailViewer from '../components/EmailViewer';
import { Alias, Email } from '../types';
import Button from '../components/Button';
import CopyButton from '../components/CopyButton';
import { RefreshCw, Mail as MailIcon, Search, ChevronRight, ArrowLeft } from 'lucide-react';
import api from '../api/axios';
import { useSocket } from '../hooks/useSocket';
import { cn } from '../utils/cn';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import toast from 'react-hot-toast';

dayjs.extend(relativeTime);

const Inbox: React.FC = () => {
  const { aliasId } = useParams<{ aliasId: string }>();
  const [alias, setAlias] = useState<Alias | null>(null);
  const [emails, setEmails] = useState<Email[]>([]);
  const [selectedEmail, setSelectedEmail] = useState<Email | null>(null);
  const [loadingAlias, setLoadingAlias] = useState(true);
  const [loadingEmails, setLoadingEmails] = useState(false);

  // 1. Fetch Alias Details
  useEffect(() => {
    const fetchAlias = async () => {
      setLoadingAlias(true);
      try {
        const stored = localStorage.getItem('guest_alias');
        if (stored) {
          try {
            const parsed: Alias = JSON.parse(stored);
            if (parsed.id === aliasId) {
              setAlias(parsed);
              setLoadingAlias(false);
              return;
            }
          } catch (e) { console.error(e); }
        }

        // If not found in localStorage, fetch from API
        if (aliasId) {
          const res = await api.get<Alias>(`/aliases/${aliasId}`);
          if (res?.data) {
            setAlias(res.data);
            try { localStorage.setItem('guest_alias', JSON.stringify(res.data)); } catch(e) { /* ignore */ }
          }
        }
      } catch (err) {
        console.error('Failed to load alias', err);
      } finally {
        setLoadingAlias(false);
      }
    };
    fetchAlias();
  }, [aliasId]);

  // 2. Fetch Email History
  useEffect(() => {
    if (!aliasId) return;
    
    const fetchEmails = async () => {
      setLoadingEmails(true);
      try {
        const response = await api.get<Email[]>(`/aliases/${aliasId}/emails`);
        const sorted = response.data.sort((a, b) => 
          new Date(b.receivedAt).getTime() - new Date(a.receivedAt).getTime()
        );
        setEmails(sorted);
      } catch (error) {
        console.error("Failed to load emails", error);
        setEmails([]); 
      } finally {
        setLoadingEmails(false);
      }
    };
    
    fetchEmails();
  }, [aliasId]);

  // 3. Setup Socket for Real-Time Updates
  const handleNewEmail = useCallback((newEmail: Email) => {
    setEmails((prev) => {
      if (prev.find(e => e.id === newEmail.id)) return prev;
      return [newEmail, ...prev];
    });
    toast.success(`New email from ${newEmail.sender}`, { icon: '📧' });
  }, []);

  useSocket(aliasId, handleNewEmail);

  // 4. Handle Deletion
  const handleDeleteEmail = async (emailId: string) => {
    if (!aliasId) return;
    if (!window.confirm("Are you sure you want to delete this email?")) return;

    try {
        // Optimistic update
        const prevEmails = [...emails];
        setEmails(prev => prev.filter(e => e.id !== emailId));
        if (selectedEmail?.id === emailId) setSelectedEmail(null);

        // API Call
        await api.delete(`/aliases/${aliasId}/emails/${emailId}`);
        toast.success("Email deleted");
    } catch (error) {
        console.error("Failed to delete email", error);
        toast.error("Failed to delete email");
        // Revert on failure (optional, skipping for simplicity)
    }
  };

  if (loadingAlias && !alias) {
     return <div className="flex items-center justify-center h-[60vh] text-slate-500">Loading inbox...</div>;
  }

  return (
    <div className="space-y-6 h-[calc(100vh-140px)] flex flex-col">
      {/* Header */}
      <div className="bg-white p-4 rounded-lg shadow-sm border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4 flex-shrink-0">
        <div className="flex flex-col space-y-1">
          <span className="text-xs uppercase tracking-wider text-slate-500 font-semibold">Active Alias</span>
          <div className="flex items-center space-x-2">
            <h2 className="text-xl md:text-2xl font-bold text-slate-900 tracking-tight font-mono break-all">
              {alias?.address || 'Loading...'}
            </h2>
            {alias?.address && <CopyButton text={alias.address} />}
          </div>
        </div>

        <div className="flex items-center space-x-4">
           {alias?.expiresAt && (
             <div className="flex flex-col items-end">
                <span className="text-xs text-slate-400 mb-1 font-medium">Auto-destruct in</span>
                <Timer 
                  expiresAt={alias.expiresAt} 
                  onExpire={() => toast.error("This email has expired!")} 
                />
             </div>
           )}
           <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
             <RefreshCw className="h-4 w-4 mr-2" /> Refresh
           </Button>
        </div>
      </div>

      {/* Main Split View */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        
        {/* Sidebar */}
        <Card className={cn(
            "lg:col-span-1 border-r flex flex-col overflow-hidden h-full transition-all",
            selectedEmail ? "hidden lg:flex" : "flex"
          )}>
          <div className="p-4 border-b bg-slate-50/80 backdrop-blur-sm flex justify-between items-center">
             <h3 className="font-semibold text-sm uppercase tracking-wider text-slate-500">
               Inbox {emails.length > 0 && <span className="ml-1 bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-xs">{emails.length}</span>}
             </h3>
             <Search className="h-4 w-4 text-slate-400" />
          </div>
          
          <div className="flex-1 overflow-y-auto">
             {loadingEmails ? (
               <div className="p-8 text-center text-slate-400">Loading...</div>
             ) : emails.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-64 text-slate-400 p-8 text-center">
                 <div className="bg-slate-100 p-4 rounded-full mb-4">
                   <MailIcon className="h-8 w-8 opacity-50" />
                 </div>
                 <p className="text-sm">No emails received yet.</p>
                 <p className="text-xs mt-2 opacity-70">Waiting for incoming messages...</p>
               </div>
             ) : (
               <div className="divide-y divide-slate-100">
                 {emails.map((email) => (
                   <button
                     key={email.id}
                     onClick={() => setSelectedEmail(email)}
                     className={cn(
                       "w-full text-left p-4 hover:bg-slate-50 transition-colors duration-150 group relative",
                       selectedEmail?.id === email.id ? "bg-blue-50/60 hover:bg-blue-50/80 border-l-4 border-blue-500 pl-3" : "pl-4"
                     )}
                   >
                     <div className="flex justify-between items-start mb-1">
                       <span className={cn("font-medium text-sm truncate pr-2", selectedEmail?.id === email.id ? "text-blue-700" : "text-slate-900")}>
                         {email.sender}
                       </span>
                       <span className="text-xs text-slate-400 whitespace-nowrap">
                         {dayjs(email.receivedAt).fromNow(true)}
                       </span>
                     </div>
                     <h4 className={cn("text-sm mb-1 truncate", selectedEmail?.id === email.id ? "text-slate-800 font-medium" : "text-slate-600")}>
                       {email.subject || '(No Subject)'}
                     </h4>
                     <p className="text-xs text-slate-400 truncate pr-6">
                       {email.bodyText?.slice(0, 60) || 'Click to view message content...'}
                     </p>
                     <ChevronRight className={cn("absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity", selectedEmail?.id === email.id && "opacity-100 text-blue-300")} />
                   </button>
                 ))}
               </div>
             )}
          </div>
        </Card>

        {/* Email Viewer */}
        <div className={cn(
            "lg:col-span-2 h-full min-h-0 flex flex-col transition-all",
            !selectedEmail ? "hidden lg:flex" : "flex"
          )}>
          {selectedEmail ? (
            <div className="flex flex-col h-full">
              <div className="lg:hidden mb-2">
                 <Button variant="ghost" size="sm" onClick={() => setSelectedEmail(null)} className="pl-0 hover:bg-transparent hover:text-blue-600">
                    <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inbox
                 </Button>
              </div>
              <EmailViewer email={selectedEmail} onDelete={handleDeleteEmail} />
            </div>
          ) : (
            <Card className="flex items-center justify-center h-full bg-slate-50/50 border-dashed">
              <div className="text-slate-400 flex flex-col items-center p-8 text-center">
                <div className="bg-white p-6 rounded-full shadow-sm mb-4">
                   <MailIcon className="h-10 w-10 text-slate-300" />
                </div>
                <h3 className="text-lg font-medium text-slate-600 mb-1">Select a message</h3>
                <p className="text-sm max-w-xs">Choose an email from the sidebar to read its contents securely.</p>
              </div>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default Inbox;
