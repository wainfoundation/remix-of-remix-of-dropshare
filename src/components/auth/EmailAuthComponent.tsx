import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEmailAuth } from '@/hooks/use-email-auth';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Mail } from 'lucide-react';

/**
 * Standalone Email Authentication Component
 * Completely independent from Pi authentication
 */
export function EmailAuthComponent() {
  const {
    signInWithEmail,
    signInWithGoogle,
    isLoading: emailLoading,
    error: emailError
  } = useEmailAuth();

  const navigate = useNavigate();
  const { toast } = useToast();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const result = await signInWithEmail(email.trim(), password);

      if (result.success) {
        // Check if this is the specific admin email
        if (email === 'sibiyagaming@gmail.com') {
          toast({
            title: '👑 Admin Login Successful',
            description: 'Welcome back, Admin!',
          });
          navigate('/admin-mrwain');
        } else {
          if (result.isNewUser) {
            toast({
              title: '✅ Account Created Successfully',
              description: 'Please check your email to verify your account.',
            });
            navigate('/signup');
          } else {
            toast({
              title: '✅ Login Successful',
              description: 'Welcome back!',
            });
            navigate('/');
          }
        }
      } else {
        toast({
          title: '❌ Authentication Failed',
          description: emailError || 'Please check your credentials and try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: '❌ Authentication Failed',
        description: error.message || 'Please check your credentials and try again.',
        variant: 'destructive',
      });
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const result = await signInWithGoogle();
      
      if (result.success) {
        toast({
          title: '✅ Google Sign In Successful',
          description: 'Welcome to DropShare!',
        });
      } else {
        toast({
          title: '❌ Google Sign In Failed',
          description: emailError || 'Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error: any) {
      toast({
        title: '❌ Google Sign In Failed',
        description: error.message || 'Please try again.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="space-y-4">
      <form onSubmit={handleEmailSignIn} className="space-y-3">
        <div className="space-y-2">
          <Input
            id="email"
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full"
          />
        </div>
        
        <div className="space-y-2">
          <Input
            id="password"
            type="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full"
          />
        </div>

        <Button
          type="submit"
          disabled={emailLoading || !email || !password}
          variant="outline"
          className="w-full h-12 font-semibold"
        >
          {emailLoading ? (
            <>
              <LoadingLogo size="sm" />
              Signing in...
            </>
          ) : (
            <>
              <Mail className="h-4 w-4 mr-2" />
              Sign In with Email
            </>
          )}
        </Button>
      </form>

      <Button
        onClick={handleGoogleSignIn}
        variant="outline"
        className="w-full h-12 font-semibold"
        disabled={emailLoading}
      >
        {emailLoading ? (
          <LoadingLogo size="sm" />
        ) : (
          <>
            <Mail className="h-4 w-4 mr-2" />
            Continue with Google
          </>
        )}
      </Button>

      <p className="text-xs text-muted-foreground text-center">
        Don't have an account? Signing in will create one automatically
      </p>

      {emailError && (
        <p className="text-xs text-destructive text-center">
          {emailError}
        </p>
      )}
    </div>
  );
}