import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { usePiAuth } from '@/hooks/use-pi-auth';
import { AppLogo } from '@/components/AppLogo';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Store, ShoppingBag, Sparkles, ArrowLeft, Check, Info } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

type AccountType = 'business' | 'creator' | 'shopper';
type SignupStep = 'select-type' | 'fill-details' | 'creating';

const Signup = () => {
  const { profile, loading, signUpWithPi } = useAuth();
  const { isAuthenticated, user: piUser, isLoading: piLoading } = usePiAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const [step, setStep] = useState<SignupStep>('select-type');
  const [selectedType, setSelectedType] = useState<AccountType | null>(null);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [storeName, setStoreName] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPlanModal, setShowPlanModal] = useState(false);

  const userId = searchParams.get('userId');

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && profile) {
      navigate('/');
    }
  }, [profile, loading, navigate]);

  // Ensure we have a userId from Pi auth
  useEffect(() => {
    if (!userId) {
      console.error('No userId provided. User must authenticate first.');
      navigate('/login');
    }
  }, [userId, navigate]);

  // Pre-fill username from Pi auth when we have the user
  useEffect(() => {
    if (piUser?.username && !username) {
      const cleanUsername = piUser.username.toLowerCase().replace(/^@/, '');
      setUsername(cleanUsername);
      setDisplayName(piUser.username);
    }
  }, [piUser, username]);


  const accountTypes = [
    {
      type: 'business' as AccountType,
      icon: Store,
      title: 'Business',
      description: 'Share products with Pi pricing & links',
      price: '10π',
      features: ['Product listings with pricing', 'External store links', 'Business verification badge', 'Analytics dashboard'],
    },
    {
      type: 'creator' as AccountType,
      icon: Sparkles,
      title: 'Creator',
      description: 'Share content & grow your audience',
      price: '10π',
      features: ['Unlimited posts & reels', 'Content analytics', 'Verified creator badge', 'Audience insights'],
    },
    {
      type: 'shopper' as AccountType,
      icon: ShoppingBag,
      title: 'Shopper',
      description: 'Discover products & follow creators',
      price: 'Free',
      features: ['Follow creators & businesses', 'Save favorite products', 'Comment & engage', 'Personalized feed'],
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

  const handleUsernameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    // Remove @ if user types it
    value = value.replace(/^@+/, '');
    // Remove spaces and special chars except underscore
    value = value.replace(/[^a-zA-Z0-9_]/g, '');
    setUsername(value.toLowerCase());
  };

  const handleCompleteSignup = async () => {
    if (!userId) {
      toast({
        title: "Error",
        description: "Missing user ID. Please sign in again.",
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

    if (!username.trim()) {
      toast({
        title: "Username required",
        description: "Please enter a username to continue.",
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
    setStep("creating");

    try {
      // Charge 10π for Business/Creator account types (Shopper is free)
      if (selectedType === 'business' || selectedType === 'creator') {
        const pricePi = 10;
        await new Promise<void>((resolve, reject) => {
          if (typeof window === 'undefined' || !window.Pi) {
            return reject(new Error('Pi SDK not available. Please open this app in Pi Browser.'));
          }
          try {
            window.Pi.createPayment(
              {
                amount: pricePi,
                memo: `Create ${selectedType} account`,
                metadata: { purpose: 'account_creation', type: selectedType, userId },
              },
              {
                onReadyForServerApproval: () => {
                  // Mainnet mode - payment ready for server approval
                  console.log('Pi payment ready for approval');
                },
                onReadyForServerCompletion: () => {
                  console.log('✅ Pi payment completed on MAINNET');
                  resolve();
                },
                onCancel: () => reject(new Error('Payment cancelled')),
                onError: (e: any) => reject(e instanceof Error ? e : new Error('Payment failed')),
              }
            );
          } catch (e) {
            reject(e instanceof Error ? e : new Error('Unable to start payment'));
          }
        });
      }

      const { error } = await signUpWithPi(
        userId,
        username,
        displayName,
        selectedType,
        websiteUrl || undefined,
        selectedType === "business" ? storeName : undefined
      );

      if (error) {
        throw error;
      }

      // Record/activate subscription when paid tiers are selected
      if (selectedType === 'business' || selectedType === 'creator') {
        try {
          await supabase.functions.invoke('record-payment', {
            body: { userId, plan: 'monthly_20pi', accountType: selectedType },
          });
        } catch (e) {
          console.warn('record-payment invocation failed (will rely on client features only):', e);
        }
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

  // Step 2: Creating account
  if (step === 'creating') {
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
            {selectedType && (selectedType === 'business' || selectedType === 'creator') && (
              <p className="text-xs text-muted-foreground">Creating a {selectedType} account costs <span className="font-semibold">10 π</span></p>
            )}
          </div>

          {/* Form */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
                <Input
                  id="username"
                  value={username}
                  onChange={handleUsernameChange}
                  placeholder="username"
                  className="h-12 pl-8"
                  maxLength={20}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Your unique username (letters, numbers, underscore only)
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
              disabled={!displayName.trim() || isSubmitting || (selectedType === 'business' && !storeName.trim())}
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

          {/* Plan Info Section */}
          <div className="rounded-lg border border-border bg-secondary/30 p-4 space-y-2">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <h3 className="font-semibold text-sm">Choose Your Account Type</h3>
                <p className="text-xs text-muted-foreground">
                  Business & Creator accounts require a 10π monthly subscription.
                  Shopper accounts are completely free.
                </p>
              </div>
              <Dialog open={showPlanModal} onOpenChange={setShowPlanModal}>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <Info className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>Account Plans</DialogTitle>
                    <DialogDescription>
                      Choose the plan that best fits your needs
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    {accountTypes.map(({ type, icon: Icon, title, price, features }) => (
                      <div key={type} className="space-y-2">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary">
                            <Icon className="h-5 w-5" />
                          </div>
                          <div className="flex-1">
                            <h4 className="font-semibold">{title}</h4>
                            <p className="text-sm text-primary font-semibold">{price}{price !== 'Free' && '/month'}</p>
                          </div>
                        </div>
                        <ul className="ml-13 space-y-1 text-xs text-muted-foreground">
                          {features.map((feature, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <Check className="h-3 w-3 mt-0.5 text-primary flex-shrink-0" />
                              <span>{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                    <p className="text-xs text-muted-foreground pt-2 border-t">
                      💡 Your subscription auto-renews monthly. Downgrade to Shopper anytime for free.
                    </p>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          {/* Account Type Selection */}
          <div className="space-y-3">
            {accountTypes.map(({ type, icon: Icon, title, description, price }) => (
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
                  <div className="flex items-center gap-2">
                    <span className="font-semibold">{title}</span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      price === 'Free' ? 'bg-green-500/10 text-green-600' : 'bg-primary/10 text-primary'
                    }`}>
                      {price}{price !== 'Free' && '/mo'}
                    </span>
                  </div>
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
            disabled={!selectedType}
            className="w-full h-12 text-base font-semibold"
          >
            Continue to Complete Profile
          </Button>

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
            onClick={() => navigate('/login')}
            disabled={piLoading}
            className="w-full h-12 text-base font-semibold"
          >
            {piLoading ? 'Authenticating...' : 'Sign in with Pi'}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
