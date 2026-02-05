import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';
import api from '../api/axios';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Get invite token from URL
  const inviteToken = searchParams.get('invite');
  const [inviteValid, setInviteValid] = useState<boolean | null>(null);
  const [inviteEmail, setInviteEmail] = useState<string | null>(null);

  // Check if registration is allowed via environment variable
  const isRegistrationAllowed = import.meta.env.VITE_REGISTER === 'true';

  // Validate invite token on component mount
  useEffect(() => {
    if (inviteToken) {
      validateInvite();
    }
  }, [inviteToken]);

  const validateInvite = async () => {
    try {
      const response = await api.get<{ valid: boolean; email?: string; reason?: string }>(
        `/invites/validate/${inviteToken}`
      );
      setInviteValid(response.data.valid);
      if (response.data.email) {
        setInviteEmail(response.data.email);
      }
      if (!response.data.valid) {
        setError(response.data.reason || 'Invalid invite link');
      }
    } catch (err) {
      setInviteValid(false);
      setError('Failed to validate invite link');
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirm-password') as string;

    if (!email || !password) {
      setError("Please fill in all fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    try {
      await register(email, password, inviteToken || undefined);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Show closed message only if registration is disabled AND no valid invite
  if (!isRegistrationAllowed && !inviteToken) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
           <CardContent className="pt-6 text-center">
             <h2 className="text-xl font-bold text-slate-800">Registration Closed</h2>
             <p className="text-slate-500 mt-2">New user registration is currently disabled by the administrator.</p>
             <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Return Home</Button>
           </CardContent>
        </Card>
      </div>
    );
  }

  // Show invalid invite message
  if (inviteToken && inviteValid === false) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md">
           <CardContent className="pt-6 text-center">
             <h2 className="text-xl font-bold text-slate-800">Invalid Invite</h2>
             <p className="text-slate-500 mt-2">{error || 'This invite link is invalid or has expired.'}</p>
             <Button variant="outline" className="mt-4" onClick={() => navigate('/')}>Return Home</Button>
           </CardContent>
        </Card>
      </div>
    );
  }

  // Show loading while validating invite
  if (inviteToken && inviteValid === null) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Create an Account</CardTitle>
          {inviteToken && inviteValid && (
            <p className="text-center text-sm text-green-600 mt-2">
              ✓ You're registering with a valid invite link
            </p>
          )}
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input 
              id="email" 
              name="email" 
              type="email" 
              label="Email Address" 
              placeholder="you@example.com"
              defaultValue={inviteEmail || ''}
              disabled={!!inviteEmail}
            />
            <Input id="password" name="password" type="password" label="Password" placeholder="••••••••" />
            <Input id="confirm-password" name="confirm-password" type="password" label="Confirm Password" placeholder="••••••••" />
            {error && <div className="text-sm text-red-500 font-medium">{error}</div>}
            <Button type="submit" className="w-full" isLoading={isLoading}>Sign Up</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default Register;
