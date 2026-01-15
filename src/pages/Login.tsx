import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { PiAuthComponent } from '@/components/auth/PiAuthComponent';
import { AppLogo } from '@/components/AppLogo';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const Login = () => {
  const { profile, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && profile) {
      navigate('/');
    }
  }, [profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="animate-pulse flex flex-col items-center gap-4">
            <AppLogo size="xl" />
            <p className="text-muted-foreground">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 bg-gradient-to-b from-background to-muted/20">
      <div className="w-full max-w-md space-y-8">
        {/* Logo & Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <AppLogo size="xl" />
          </div>
          <h1 className="text-4xl font-bold text-foreground">
            DropShare
          </h1>
          <p className="text-muted-foreground">
            Powered by Pi Network
          </p>
          <p className="text-sm text-muted-foreground">
            Discover and share products from your favorite stores
          </p>
        </div>

        {/* Pi Network Authentication Card */}
        <Card className="border-2">
          <CardHeader className="text-center pb-4">
            <CardTitle className="text-2xl">Welcome</CardTitle>
            <CardDescription>
              Sign in with your Pi Network account to continue
            </CardDescription>
          </CardHeader>
          <CardContent>
            <PiAuthComponent />
            
            <div className="mt-6 pt-6 border-t border-border">
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <svg className="h-4 w-4 text-sky-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>Secure Pi Network Authentication</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Info Section */}
        <div className="text-center space-y-4">
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-sm">Why Pi Network?</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>✓ Secure blockchain authentication</li>
              <li>✓ Earn Pi for sharing products</li>
              <li>✓ Global decentralized marketplace</li>
              <li>✓ No traditional passwords needed</li>
            </ul>
          </div>

          <p className="text-xs text-muted-foreground">
            New to Pi Network?{' '}
            <a 
              href="https://minepi.com" 
              target="_blank" 
              rel="noopener noreferrer"
              className="font-semibold text-sky-500 hover:underline"
            >
              Learn more about Pi
            </a>
          </p>
        </div>

        {/* Footer */}
        <div className="text-center space-y-2">
          <p className="text-xs text-muted-foreground">
            By signing in, you agree to our{' '}
            <Link to="/terms" className="underline hover:text-foreground">
              Terms of Service
            </Link>
            {' '}and{' '}
            <Link to="/privacy" className="underline hover:text-foreground">
              Privacy Policy
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
