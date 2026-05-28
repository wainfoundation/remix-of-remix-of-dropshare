import { useEffect, useState } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { initPiSdk } from "@/integrations/pi";
import LoadingOverlay from "@/components/ui/loading-overlay";
import { TestReactions } from "@/components/TestReactions";
import Index from "./pages/Index";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Explore from "./pages/Explore";
import Pioneer from "./pages/Pioneer";
import Trending from "./pages/Trending";
import Create from "./pages/Create";
import Profile from "./pages/Profile";
import Messages from "./pages/Messages";
import Conversation from "./pages/Conversation";
import NewMessage from "./pages/NewMessage";
import PostDetail from "./pages/PostDetail";
import EditProfile from "./pages/EditProfile";
import Settings from "./pages/Settings";
import CreateStory from "./pages/CreateStory";
import StoryViewer from "./pages/StoryViewer";
import Notifications from "./pages/Notifications";
import Reels from "./pages/Reels";
import CreateReel from "./pages/CreateReel";
import VideoFeed from "./pages/VideoFeed";
import Analytics from "./pages/Analytics";
import Saved from "./pages/Saved";
import NotFound from "./pages/NotFound";
import Legal from "./pages/Legal";
import Menu from "./pages/Menu";
import Ads from "./pages/Ads";
import CreateAd from "./pages/CreateAd";
import AdsDemo from "./pages/AdsDemo";
import AdminDashboard from "./pages/AdminDashboard";
import Admin from "./pages/Admin";
import AdminMrwain from "./pages/AdminMrwain";
import AdminSignup from "./pages/AdminSignup";
import NotificationDemo from "./pages/NotificationDemo";
import GlassDesign from "./pages/GlassDesign";
import TestnetReward from "./pages/TestnetReward";
import AdminTestnetProgress from "./pages/AdminTestnetProgress";

const queryClient = new QueryClient();

const AppContent = () => {
  const [isInitializing, setIsInitializing] = useState(true);
  const [initializationText, setInitializationText] = useState("Initializing DropShare...");

  useEffect(() => {
    const initializeApp = async () => {
      try {
        // Simulate app initialization with multiple steps
        setInitializationText("Loading application...");
        await new Promise(resolve => setTimeout(resolve, 800));
        
        setInitializationText("Connecting to Pi Network...");
        // Pi SDK will automatically detect the environment (production vs development)
        await initPiSdk({
          version: "2.0",
        }).catch((error) => {
          console.warn("Pi SDK initialization failed (this is OK if not in Pi Browser):", error);
        });
        
        setInitializationText("Preparing your experience...");
        await new Promise(resolve => setTimeout(resolve, 600));
        
        setInitializationText("Almost ready...");
        await new Promise(resolve => setTimeout(resolve, 400));
        
      } catch (error) {
        console.error("App initialization error:", error);
        setInitializationText("Something went wrong, but we're continuing...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      } finally {
        setIsInitializing(false);
      }
    };

    initializeApp();
  }, []);

  return (
    <>
      <LoadingOverlay isLoading={isInitializing} text={initializationText} />
      
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/pioneer" element={<Pioneer />} />
          <Route path="/trending" element={<Trending />} />
          <Route path="/create" element={<Create />} />
          <Route path="/profile/:username" element={<Profile />} />
          <Route path="/post/:postId" element={<PostDetail />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/edit-profile" element={<EditProfile />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/messages/new" element={<NewMessage />} />
          <Route path="/messages/:conversationId" element={<Conversation />} />
          <Route path="/create-story" element={<CreateStory />} />
          <Route path="/story/:username" element={<StoryViewer />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/notifications/demo" element={<NotificationDemo />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/reels/:reelId" element={<Reels />} />
          <Route path="/create-reel" element={<CreateReel />} />
          <Route path="/test-reactions" element={<TestReactions />} />
          <Route path="/videos" element={<VideoFeed />} />
          <Route path="/analytics" element={<Analytics />} />
          <Route path="/saved" element={<Saved />} />
          <Route path="/terms" element={<Navigate to="/legal/terms" replace />} />
          <Route path="/privacy" element={<Navigate to="/legal/privacy" replace />} />
          <Route path="/cookies" element={<Navigate to="/legal/cookies" replace />} />
          <Route path="/help" element={<Navigate to="/legal/help" replace />} />
          <Route path="/about" element={<Navigate to="/legal/about" replace />} />
          <Route path="/careers" element={<Navigate to="/legal/careers" replace />} />
          <Route path="/developers" element={<Navigate to="/legal/developers" replace />} />
          <Route path="/advertising" element={<Navigate to="/legal/advertising" replace />} />
          <Route path="/legal" element={<Legal />} />
          <Route path="/legal/:slug" element={<Legal />} />
          <Route path="/menu" element={<Menu />} />
          <Route path="/ads" element={<Ads />} />
          <Route path="/ads/create" element={<CreateAd />} />
          <Route path="/ads/demo" element={<AdsDemo />} />
          <Route path="/glass-design" element={<GlassDesign />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="/admin/dashboard" element={<AdminDashboard />} />
          <Route path="/admin-mrwain" element={<AdminMrwain />} />
          <Route path="/admin/signup" element={<AdminSignup />} />
          <Route path="/testnet-reward" element={<TestnetReward />} />
          <Route path="/admin/testnet-progress" element={<AdminTestnetProgress />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AppContent />
        </TooltipProvider>
      </AuthProvider>
    </ThemeProvider>
  </QueryClientProvider>
);

export default App;
