import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePiAuth } from '@/hooks/use-pi-auth';
import { useAuth } from '@/contexts/AuthContext';
import { isPiSdkInitialized, callPi } from '@/integrations/pi/init';
import { testPiSdk, callWindowPi } from '@/integrations/pi/auth';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

/**
 * Standalone Pi Network Authentication Component
 * Following official Pi documentation workflow
 */
export function PiAuthComponent() {
  const { signInWithPi } = useAuth();
  const { 
    authenticate: piAuthenticate, 
    isLoading: piLoading,
    error: piError,
    clearError: clearPiError 
  } = usePiAuth();

  const navigate = useNavigate();
  const { toast } = useToast();

  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);

  // Check Pi SDK availability (should be loaded via HTML script tags per Pi docs)
  useEffect(() => {
    const checkSdk = () => {
      try {
        // Test direct window.Pi access
        console.log('Testing window.Pi access...');
        const piTest = testPiSdk();
        
        if (piTest.available) {
          // Try direct call to window.Pi
          const pi = callWindowPi();
          console.log('window.Pi successfully accessed:', pi);
          
          setSdkReady(true);
          setSdkError(null);
        } else {
          console.error('Pi SDK not available:', piTest.error);
          setSdkError(piTest.error || "Please open this app in Pi Browser");
        }
      } catch (err) {
        console.error("Pi SDK check failed:", err);
        setSdkError("Please open this app in Pi Browser");
      }
    };

    // Check immediately
    checkSdk();

    // Also check after a short delay in case SDK is still loading
    const timeout = setTimeout(checkSdk, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handlePiSignIn = async () => {
    setSdkError(null);
    clearPiError();

    if (!sdkReady) {
      setSdkError("Pi SDK not ready. Please open this app in Pi Browser.");
      return;
    }

    try {
      // Test window.Pi one more time before authentication
      console.log('Final window.Pi test before authentication...');
      const pi = callPi();
      console.log('window.Pi ready for authentication:', pi);

      // Authenticate with Pi Network following official documentation
      const result = await piAuthenticate(["username", "payments"]);

      if (result.success && result.userId) {
        // Call the AuthContext signInWithPi method
        const authResult = await signInWithPi(result.userId);
        
        if (authResult.error) {
          throw authResult.error;
        }

        // Show appropriate notification based on user status
        if (result.isNewUser) {
          toast({
            title: '🎉 Welcome to DropShare!',
            description: 'New account created successfully. Complete your profile to get started.',
            duration: 5000,
          });
          console.log('New user detected - redirecting to signup');
          navigate('/signup');
        } else {
          toast({
            title: '👋 Welcome back!',
            description: 'Successfully signed in to your existing account.',
            duration: 4000,
          });
          console.log('Existing user detected - redirecting to home');
          navigate('/');
        }
      } else {
        // Authentication failed
        const errorMessage = result.isNewUser === undefined 
          ? 'Pi authentication failed. Please try again.' 
          : 'Account verification failed. Please try again.';
        setSdkError(errorMessage);
        
        toast({
          title: 'Authentication Failed',
          description: errorMessage,
          variant: 'destructive',
          duration: 4000,
        });
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to sign in with Pi';
      setSdkError(errorMessage);
      
      toast({
        title: 'Sign In Error',
        description: errorMessage,
        variant: 'destructive',
        duration: 4000,
      });
      
      console.error('Pi authentication error:', err);
    }
  };

  return (
    <div className="space-y-4">
      <Button
        onClick={handlePiSignIn}
        disabled={!sdkReady || piLoading}
        className="w-full h-12 text-base font-semibold bg-sky-500 hover:bg-sky-600 text-white"
      >
        {!sdkReady ? (
          <>
            <LoadingLogo size="sm" />
            Waiting for Pi Browser...
          </>
        ) : piLoading ? (
          <>
            <LoadingLogo size="sm" />
            Signing in...
          </>
        ) : (
          "Sign in with Pi Network"
        )}
      </Button>

      {(sdkError || piError) && (
        <p className="text-xs text-destructive text-center">
          {sdkError || piError?.message}
        </p>
      )}
      
      <p className="text-xs text-muted-foreground text-center">
        Secure authentication using Pi Network blockchain
      </p>
    </div>
  );
}