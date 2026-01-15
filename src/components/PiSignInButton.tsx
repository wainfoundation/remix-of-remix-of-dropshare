import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { usePiAuth } from "@/hooks/use-pi-auth";
import { LogOut, User } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { initPiSdk, isPiSdkInitialized } from "@/integrations/pi/init";
import LoadingSpinner from "@/components/ui/loading-spinner";

export function PiSignInButton() {
  const { isAuthenticated, user, isLoading, authenticate, logout, isNewUser } = usePiAuth();
  const [error, setError] = useState<string | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  // Initialize Pi SDK on mount
  useEffect(() => {
    const initSdk = async () => {
      try {
        // Check if already initialized
        if (isPiSdkInitialized()) {
          setSdkReady(true);
          return;
        }

        await initPiSdk({ version: "2.0" });
        setSdkReady(true);
      } catch (err) {
        console.error("Failed to initialize Pi SDK:", err);
        setError("Please open this app in Pi Browser");
      }
    };

    initSdk();
  }, []);

  const handleSignIn = async () => {
    try {
      setError(null);
      setIsAuthenticating(true);

      const result = await authenticate(["username", "payments"]);

      if (result.success) {
        if (result.isNewUser) {
          toast({
            title: "Welcome to DropShare!",
            description: "Your account has been created successfully.",
          });
          // New users go to signup to complete profile
          navigate("/signup");
        } else {
          toast({
            title: "Welcome back!",
            description: "You have successfully signed in.",
          });
          navigate("/");
        }
      } else {
        setError("Sign in failed. Please try again.");
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to sign in with Pi"
      );
    } finally {
      setIsAuthenticating(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    toast({
      title: "Signed out",
      description: "You have been signed out successfully.",
    });
    navigate("/login");
  };

  if (!sdkReady && !error) {
    return (
      <Button disabled className="w-full h-12 justify-center">
        <LoadingSpinner size="sm" text="Initializing Pi..." className="gap-2" />
      </Button>
    );
  }

  if (isLoading || isAuthenticating) {
    return (
      <Button disabled className="w-full h-12 justify-center">
        <LoadingSpinner 
          size="sm" 
          text={isAuthenticating ? "Signing in..." : "Loading..."} 
          className="gap-2" 
        />
      </Button>
    );
  }

  if (isAuthenticated && user) {
    return (
      <div className="flex flex-col gap-3 w-full">
        <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
              <User className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-medium">
              {user.username || `@pioneer${user.uid.slice(0, 8)}`}
            </span>
          </div>
          <Button variant="ghost" size="sm" onClick={handleLogout}>
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
        <Button onClick={() => navigate("/")} className="w-full h-12">
          Continue to App
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 w-full">
      <Button 
        onClick={handleSignIn} 
        className="w-full gap-2 h-12 text-base font-semibold"
        disabled={!!error}
      >
        <svg 
          width="24" 
          height="24" 
          viewBox="0 0 24 24" 
          fill="currentColor"
          className="mr-1"
        >
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 15h-2v-6h2v6zm0-8h-2V7h2v2zm4 8h-2V9h2v8z"/>
        </svg>
        Sign in with Pi Network
      </Button>
      {error && (
        <p className="text-xs text-destructive text-center">{error}</p>
      )}
      <p className="text-xs text-muted-foreground text-center">
        Sign in automatically creates your account if you're new
      </p>
    </div>
  );
}
