import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Crown, Mail, Shield } from 'lucide-react';
import { LoadingLogo } from '@/components/ui/loading-logo';

const AdminSignup = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [isSigningUp, setIsSigningUp] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate admin email
    if (!email.includes('sibiyagaming@gmail.com') && !email.includes('admin')) {
      toast({
        title: '❌ Access Denied',
        description: 'Admin signup is restricted to authorized emails only.',
        variant: 'destructive',
      });
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: '❌ Password Mismatch',
        description: 'Passwords do not match.',
        variant: 'destructive',
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: '❌ Weak Password',
        description: 'Password must be at least 6 characters long.',
        variant: 'destructive',
      });
      return;
    }

    setIsSigningUp(true);

    try {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim(),
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: 'admin',
          },
        },
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        toast({
          title: '✅ Admin Account Created',
          description: 'Please check your email to verify your account.',
        });
        navigate('/login');
      }
    } catch (error: any) {
      toast({
        title: '❌ Signup Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSigningUp(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <AppLogo size="xl" />
          </div>
          <h1 className="text-4xl font-bold">DropShare</h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2">
            <Crown className="h-4 w-4" />
            Admin Registration
          </p>
        </div>

        {/* Admin Signup Form */}
        <Card>
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-lg flex items-center justify-center gap-2">
              <Shield className="h-5 w-5" />
              Create Admin Account
            </CardTitle>
            <CardDescription>
              This form is restricted to authorized administrators only
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSignUp} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Admin Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@dropshare.space"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Create a strong password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full"
                  minLength={6}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">Confirm Password</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full"
                />
              </div>

              <Button
                type="submit"
                disabled={isSigningUp || !email || !password || !fullName}
                className="w-full h-12 font-semibold"
              >
                {isSigningUp ? (
                  <>
                    <LoadingLogo size="sm" />
                    Creating Account...
                  </>
                ) : (
                  <>
                    <Crown className="h-4 w-4 mr-2" />
                    Create Admin Account
                  </>
                )}
              </Button>
            </form>

            <div className="mt-6 space-y-4">
              <div className="text-xs text-red-600 dark:text-red-400 text-center bg-red-50 dark:bg-red-900/20 p-3 rounded">
                <Shield className="h-4 w-4 mx-auto mb-1" />
                <strong>Security Notice:</strong> This registration is restricted to authorized Mrwain Organization administrators. Unauthorized access attempts are logged and monitored.
              </div>
              
              <p className="text-sm text-muted-foreground text-center">
                Already have an admin account?{' '}
                <Link to="/login" className="font-semibold text-primary hover:underline">
                  Sign in here
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminSignup;