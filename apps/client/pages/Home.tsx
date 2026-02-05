import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import { ArrowRight, ShieldCheck, Zap, Clock } from 'lucide-react';
import api from '../api/axios';
import { Alias } from '../types';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);

  const handleCreateGuestAlias = async () => {
    setIsLoading(true);
    try {
      // Phase 2: Call API to create guest alias
      const response = await api.post<Alias>('/aliases');
      const alias = response.data;
      
      // Store in local storage for easy access in Inbox (or if user refreshes)
      localStorage.setItem('guest_alias', JSON.stringify(alias));
      
      navigate(`/inbox/${alias.id}`);
    } catch (error) {
      console.error("Failed to create alias", error);
      alert("Failed to create temporary email. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center space-y-12 py-12">
      <section className="text-center space-y-6 max-w-3xl">
        <h1 className="text-4xl md:text-6xl font-extrabold text-slate-900 tracking-tight">
          Disposable Email, <br />
          <span className="text-blue-600">Reimagined.</span>
        </h1>
        <p className="text-lg text-slate-600 max-w-2xl mx-auto">
          Secure, anonymous, and real-time. Generate a temporary email in seconds and keep your real inbox clean from spam.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Button size="lg" onClick={handleCreateGuestAlias} isLoading={isLoading} className="w-full sm:w-auto">
            Create Temporary Email <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {import.meta.env.VITE_REGISTER === 'true' && (
            <Button variant="outline" size="lg" onClick={() => navigate('/register')} className="w-full sm:w-auto">
              Create Account
            </Button>
          )}
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full max-w-5xl">
        <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white shadow-sm border border-slate-100">
          <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center mb-4">
            <Zap className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Real-Time Sync</h3>
          <p className="text-slate-500">Emails arrive instantly via WebSocket connection. No page refreshes needed.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white shadow-sm border border-slate-100">
          <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
            <ShieldCheck className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Spam Protection</h3>
          <p className="text-slate-500">Keep your primary email safe. Use our aliases for signups and untrusted sites.</p>
        </div>
        <div className="flex flex-col items-center text-center p-6 rounded-xl bg-white shadow-sm border border-slate-100">
          <div className="h-12 w-12 rounded-full bg-purple-100 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="text-xl font-bold mb-2">Extended Duration</h3>
          <p className="text-slate-500">10 minutes for guests, up to 1 week for registered users. Extend as needed.</p>
        </div>
      </section>
    </div>
  );
};

export default Home;
