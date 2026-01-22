import { ReactNode, useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import BottomNav from './BottomNav';
import RightSidebar from './RightSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { useSwipe } from '@/hooks/use-swipe';
import { usePushNotifications } from '@/hooks/use-push-notifications';
import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import SwipeIndicator from '@/components/ui/swipe-indicator';

interface MainLayoutProps {
  children: ReactNode;
}

const MainLayout = ({ children }: MainLayoutProps) => {
  const { loading } = useAuth();
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);
  const [showSwipeHints, setShowSwipeHints] = useState(false);

  // Initialize push notifications
  const { subscribe: subscribeToPush, permission } = usePushNotifications();

  useEffect(() => {
    // Show swipe hints after a delay when component mounts
    const timer = setTimeout(() => {
      setShowSwipeHints(true);
      // Hide hints after 3 seconds
      setTimeout(() => setShowSwipeHints(false), 3000);
    }, 2000);

    // Initialize push notifications if permission is granted
    if (permission === 'granted') {
      subscribeToPush();
    }

    return () => clearTimeout(timer);
  }, [subscribeToPush, permission]);

  const swipeHandlers = useSwipe({
    onSwipeLeft: () => {
      if (leftSidebarOpen) {
        setLeftSidebarOpen(false);
      } else {
        setRightSidebarOpen(true);
      }
    },
    onSwipeRight: () => {
      if (rightSidebarOpen) {
        setRightSidebarOpen(false);
      } else {
        setLeftSidebarOpen(true);
      }
    },
    minSwipeDistance: 80,
  });

  if (loading) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-purple-500/20 via-pink-500/20 to-orange-400/20 dark:from-purple-900/30 dark:via-pink-900/30 dark:to-orange-900/30">
        <LoadingLogo size="xl" />
        <p className="mt-4 text-lg text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
      {/* Desktop Sidebar - Always visible on md+ */}
      <div className="hidden md:block">
        <div className="fixed left-0 top-0 h-screen overflow-y-auto">
          <Sidebar />
        </div>
      </div>

      {/* Mobile Left Sidebar - Swipeable */}
      <div
        className={cn(
          'fixed left-0 top-0 z-50 h-screen w-[280px] transform bg-background transition-transform duration-300 ease-in-out md:hidden border-r border-border overflow-y-auto',
          leftSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <button
          onClick={() => setLeftSidebarOpen(false)}
          className="absolute right-4 top-4 rounded-full p-2 hover:bg-accent z-10"
        >
          <X className="h-5 w-5" />
        </button>
        <Sidebar mobile onNavigate={() => setLeftSidebarOpen(false)} />
      </div>

      {/* Mobile Right Sidebar - Swipeable */}
      <div
        className={cn(
          'fixed right-0 top-0 z-50 h-screen w-[320px] transform bg-background transition-transform duration-300 ease-in-out lg:hidden border-l border-border overflow-y-auto',
          rightSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        )}
      >
        <button
          onClick={() => setRightSidebarOpen(false)}
          className="absolute left-4 top-4 rounded-full p-2 hover:bg-accent z-10"
        >
          <X className="h-5 w-5" />
        </button>
        <RightSidebar mobile />
      </div>

      {/* Swipe Indicators */}
      <SwipeIndicator 
        direction="left" 
        show={showSwipeHints && !leftSidebarOpen && window.innerWidth < 768}
        className="md:hidden"
      />
      <SwipeIndicator 
        direction="right" 
        show={showSwipeHints && !rightSidebarOpen && window.innerWidth < 1024}
        className="lg:hidden"
      />

      {/* Overlay for mobile sidebars */}
      {(leftSidebarOpen || rightSidebarOpen) && (
        <div
          className="fixed inset-0 z-40 bg-black/50 transition-opacity"
          onClick={() => {
            setLeftSidebarOpen(false);
            setRightSidebarOpen(false);
          }}
        />
      )}

      {/* Main Content */}
      <div
        className="flex justify-center md:ml-[72px] lg:ml-[244px]"
        {...swipeHandlers}
      >
        <main className="pb-20 md:pb-0 w-full max-w-[600px] lg:max-w-[700px] min-h-screen">
          {children}
        </main>
        <div className="hidden lg:block">
          <div className="fixed right-0 top-0 h-screen overflow-y-auto">
            <RightSidebar />
          </div>
        </div>
      </div>
      <BottomNav />
    </div>
  );
};

export default MainLayout;
