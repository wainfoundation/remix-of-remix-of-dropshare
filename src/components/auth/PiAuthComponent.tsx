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

      if (result.success) {
        console.log('Pi authentication successful:', result);

        if (result.isNewUser) {
          console.log('New user detected. Redirecting to sign-up page.');
          navigate(`/signup?userId=${result.userId}`);
        } else {
          await signInWithPi(result.userId!);
          navigate('/');
        }
      } else {
        console.error('Pi authentication failed:', result);
        toast({
          title: 'Authentication Failed',
          description: 'Unable to authenticate with Pi Network. Please try again.',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Error during Pi authentication:', error);
      toast({
        title: 'Authentication Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
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