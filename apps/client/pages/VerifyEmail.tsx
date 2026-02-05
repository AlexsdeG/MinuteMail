import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, CardContent } from '../components/Card';
import Button from '../components/Button';
import api from '../api/axios';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

const VerifyEmail: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  const token = searchParams.get('token');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('No verification token provided');
      return;
    }

    verifyEmail();
  }, [token]);

  const verifyEmail = async () => {
    try {
      const response = await api.get<{ message: string }>(`/settings/verify/${token}`);
      setStatus('success');
      setMessage(response.data.message || 'Email verified successfully!');
    } catch (error: any) {
      setStatus('error');
      setMessage(error.response?.data?.message || 'Failed to verify email');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardContent className="pt-6 text-center">
          {status === 'loading' && (
            <>
              <Loader2 className="h-12 w-12 text-blue-600 mx-auto animate-spin mb-4" />
              <h2 className="text-xl font-bold text-slate-800">Verifying your email...</h2>
              <p className="text-slate-500 mt-2">Please wait while we verify your email address.</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800">Email Verified!</h2>
              <p className="text-slate-500 mt-2">{message}</p>
              <Button className="mt-4" onClick={() => navigate('/dashboard')}>
                Go to Dashboard
              </Button>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="h-12 w-12 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-bold text-slate-800">Verification Failed</h2>
              <p className="text-slate-500 mt-2">{message}</p>
              <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>
                Return Home
              </Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default VerifyEmail;
