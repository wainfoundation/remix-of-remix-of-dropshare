import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { usePiAuth } from '@/hooks/use-pi-auth';
import { isPiSdkInitialized } from '@/integrations/pi/init';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, ShoppingBag, Sparkles, ArrowLeft, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type AccountType = 'business' | 'creator' | 'shopper';
type SignupStep = 'authenticate-first' | 'select-type' | 'fill-details' | 'authenticating';

const Signup = () => {
  const { profile, loading, signUpWithPi } = useAuth();
  const { isAuthenticated, user: piUser, authenticate, isLoading: piLoading } = usePiAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [step, setStep] = useState<SignupStep>('authenticate-first');
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [sdkReady, setSdkReady] = useState(false);
  const [sdkError, setSdkError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && profile) {
      navigate('/');
    }
  }, [profile, loading, navigate]);

  // Initialize Pi SDK check (should be initialized in HTML per Pi docs)
  useEffect(() => {
    const checkSdk = () => {
      try {
        if (isPiSdkInitialized()) {
          setSdkReady(true);
          setSdkError(null);
        } else {
          setSdkError("Please open this app in Pi Browser");
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

  // Pre-fill username from Pi auth when we have the user
  useEffect(() => {
    if (piUser?.username && !username) {
      setUsername(piUser.username);
      setDisplayName(piUser.username);
    }
  }, [piUser, username]);


  const accountTypes = [
    {
      type: 'business' as AccountType,
      icon: Store,
      title: 'Business',
      description: 'Share products with Pi pricing & links',
    },
    {
      type: 'creator' as AccountType,
      icon: Sparkles,
      title: 'Creator',
      description: 'Share content & grow your audience',
    },
    {
      type: 'shopper' as AccountType,
      icon: ShoppingBag,
      title: 'Shopper',
      description: 'Discover products & follow creators',
    },
  ];

  const handleTypeSelect = (type: AccountType) => {
    setSelectedType(type);
  };

  const handleContinue = () => {
    if (selectedType) {
      setStep('fill-details');
    }
  };

  const handleBack = () => {
    if (step === 'fill-details') {
      setStep('select-type');
    }
  };

  const getOrCreatePiUserId = async (): Promise<{ userId: string; username?: string }> => {
    const existingUserId = localStorage.getItem("pi_supabase_user_id");
    const existingUsername = localStorage.getItem("pi_username") || undefined;

    if (existingUserId) {
      return { userId: existingUserId, username: existingUsername };
    }

    const authResult = await authenticate(["username", "payments"]);

    if (!authResult.success || !authResult.userId) {
      throw new Error("Pi authentication failed. Please try again.");
    }

    return {
      userId: authResult.userId,
      username: localStorage.getItem("pi_username") || undefined,
    };
  };

  const handleCompleteSignup = async () => {
    setSdkError(null);

    if (!sdkReady) {
      toast({
        title: "Pi Browser required",
        description: "Please open this app in Pi Browser to continue.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedType) {
      toast({
        title: "Choose an account type",
        description: "Please select Business, Creator, or Shopper.",
        variant: "destructive",
      });
      return;
    }

    if (!displayName.trim()) {
      toast({
        title: "Display name required",
        description: "Please enter a display name to continue.",
        variant: "destructive",
      });
      return;
    }

    if (selectedType === "business" && !storeName.trim()) {
      toast({
        title: "Store name required",
        description: "Please enter your store name to continue.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setStep("authenticating");

    try {
      const { userId, username: storedUsername } = await getOrCreatePiUserId();
      const finalUsername = (piUser?.username || storedUsername || username || "").toLowerCase();

      if (!finalUsername) {
        throw new Error("Missing Pi username. Please try signing in again.");
      }

      const { error } = await signUpWithPi(
        userId,
        finalUsername,
        displayName,
        selectedType,
        websiteUrl || undefined,
        selectedType === "business" ? storeName : undefined
      );

      if (error) {
        throw error;
      }

      toast({
        title: "Welcome to DropShare!",
        description: "Your profile is ready.",
        duration: 4000,
      });

      navigate("/");
    } catch (err) {
      console.error("Signup error:", err);
      toast({
        title: "Sign up failed",
        description: err instanceof Error ? err.message : "An error occurred. Please try again.",
        variant: "destructive",
      });
      setStep("fill-details");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAuthenticate = async () => {
    try {
      const authResult = await authenticate(["username", "payments"]);
      if (authResult.success) {
        setStep('select-type');
      } else {
        toast({ title: 'Authentication failed. Please try again.', variant: 'destructive' });
      }
    } catch (error) {
      console.error('Authentication failed:', error);
      toast({ title: 'Authentication failed. Please try again.', variant: 'destructive' });
    }
  };

  if (loading) {
    return <LoadingLogo />;
  }

  if (loading || piLoading) {
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

  // Step 3: Authenticating
  if (step === 'authenticating') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <AppLogo size="xl" />
            <LoadingLogo size="lg" />
            <p className="text-muted-foreground">Creating your account...</p>
          </div>
        </div>
      </div>
    );
  }

  // Step 2: Fill details (username & store name)
  if (step === 'fill-details') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <AppLogo size="lg" />
            </div>
            <h1 className="text-4xl font-bold">DropShare</h1>
            <p className="text-muted-foreground">Create your account</p>
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Pi Username</Label>
              <Input
                id="username"
                value={username}
                disabled
                placeholder="Your Pi username"
                className="h-12 bg-muted"
              />
              <p className="text-xs text-muted-foreground">
                Your Pi Network username (read-only)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="displayName">Display Name</Label>
              <Input
                id="displayName"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="How you'll appear on DropShare"
                className="h-12"
              />
            </div>

            {selectedType === 'business' && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={storeName}
                    onChange={(e) => setStoreName(e.target.value)}
                    placeholder="Your business name"
                    className="h-12"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website (Optional)</Label>
                  <Input
                    id="websiteUrl"
                    type="url"
                    value={websiteUrl}
                    onChange={(e) => setWebsiteUrl(e.target.value)}
                    placeholder="https://yourstore.com"
                    className="h-12"
                  />
                </div>
              </>
            )}
          </div>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handleCompleteSignup}
              disabled={!displayName.trim() || isSubmitting || !sdkReady || (selectedType === 'business' && !storeName.trim())}
              className="w-full h-12 text-base font-semibold"
            >
              {isSubmitting ? (
                <>
                  <LoadingLogo size="sm" className="mr-2" />
                  Creating account...
                </>
              ) : (
                'Continue'
              )}
            </Button>

            <Button
              variant="ghost"
              onClick={handleBack}
              className="w-full"
              disabled={isSubmitting}
            >
              Back
            </Button>
          </div>

          {sdkError && (
            <p className="text-xs text-destructive text-center">{sdkError}</p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 1: Select account type
  if (step === 'select-type') {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center px-4">
        <div className="w-full max-w-sm space-y-8">
          {/* Header */}
          <div className="text-center space-y-2">
            <div className="flex justify-center mb-4">
              <AppLogo size="xl" />
            </div>
            <h1 className="text-4xl font-bold">DropShare</h1>
            <p className="text-muted-foreground">
              Join the community of products lovers
            </p>
          </div>

          {/* Account Type Selection */}
          <div className="space-y-3">
            {accountTypes.map(({ type, icon: Icon, title, description }) => (
              <button
                key={type}
                onClick={() => handleTypeSelect(type)}
                className={`flex w-full items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  selectedType === type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                }`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  selectedType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold">{title}</span>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
                {selectedType === type && (
                  <Check className="h-5 w-5 text-primary" />
                )}
              </button>
            ))}
          </div>

          {/* Continue Button */}
          <Button
            onClick={handleContinue}
            disabled={!selectedType || !sdkReady}
            className="w-full h-12 text-base font-semibold"
          >
            {!sdkReady ? (
              <>
                <LoadingLogo size="sm" className="mr-2" />
                Initializing...
              </>
            ) : (
              'Continue'
            )}
          </Button>

          {sdkError && (
            <p className="text-xs text-destructive text-center">{sdkError}</p>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Log in
            </Link>
          </p>
        </div>
      </div>
    );
  }

  // Step 0: Authenticate with Pi
  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4">
      <div className="w-full max-w-sm space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <div className="flex justify-center mb-4">
            <AppLogo size="xl" />
          </div>
          <h1 className="text-4xl font-bold">Welcome to DropShare</h1>
          <p className="text-muted-foreground mb-6">
            Please authenticate with Pi to continue.
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAuthenticate}
            disabled={piLoading}
            className="w-full h-12 text-base font-semibold"
          >
            {piLoading ? 'Authenticating...' : 'Sign in with Pi'}
          </Button>
        </div>

        {sdkError && (
          <p className="text-xs text-destructive text-center">{sdkError}</p>
        )}
      </div>
    </div>
  );
};

export default Signup;
