import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '../components/Card';
import Input from '../components/Input';
import Button from '../components/Button';
import { useAuth } from '../context/AuthContext';

const Register: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Check if registration is allowed via environment variable
  const isRegistrationAllowed = import.meta.env.VITE_REGISTER === 'true';

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
      await register(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isRegistrationAllowed) {
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

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">Create an Account</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input id="email" name="email" type="email" label="Email Address" placeholder="you@example.com" />
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
