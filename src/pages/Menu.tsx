import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import {
  Home,
  Search,
  Users,
  TrendingUp,
  PlusSquare,
  Video,
  MessageCircle,
  Bell,
  Bookmark,
  BarChart3,
  User,
  Settings,
  Moon,
  Sun,
  LogOut,
  Heart,
  Share2,
  HelpCircle,
  FileText,
  Lock,
  Zap,
  Briefcase,
  Cookie,
  Smartphone,
  Megaphone,
  Shield,
  Users2,
  CreditCard,
  UserCheck,
  ExternalLink,
  Film,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

const Menu = () => {
  const navigate = useNavigate();
  const { profile, user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [showLogoutDialog, setShowLogoutDialog] = useState(false);

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const isCreatorOrBusiness =
    profile?.account_type === 'creator' || profile?.account_type === 'business';

  // Main Navigation Items
  const mainNavItems = [
    { icon: Home, label: 'Home', path: '/' },
    { icon: Users, label: 'Pioneer', path: '/pioneer' },
    { icon: Search, label: 'Explore', path: '/explore' },
    { icon: TrendingUp, label: 'Trending', path: '/trending' },
    { icon: Video, label: 'Reels', path: '/reels' },
    { icon: Film, label: 'Videos', path: '/videos' },
  ];

  // Creation & Sharing
  const creationItems = [
    { icon: PlusSquare, label: 'Create Post', path: '/create' },
    { icon: Video, label: 'Create Reel', path: '/create-reel' },
  ];

  // Communication & Notifications
  const communicationItems = [
    { icon: MessageCircle, label: 'Messages', path: '/messages' },
    { icon: Bell, label: 'Notifications', path: '/notifications' },
  ];

  // Personal
  const personalItems = [
    { icon: Bookmark, label: 'Saved', path: '/saved' },
    { icon: BarChart3, label: 'Analytics', path: '/analytics' },
    { icon: User, label: 'Profile', path: profile ? `/profile/${profile.username}` : '/login' },
  ];

  // Advertising (for all users to explore, but functionality may require creator/business account)
  const adsItems = [
    { icon: Megaphone, label: 'DropShare Ads', path: '/ads' },
    { icon: PlusSquare, label: 'Create Ad', path: '/ads/create' },
  ];

  // Settings & Preferences
  const settingsItems = [
    { icon: Settings, label: 'Settings', path: '/settings' },
    { icon: theme === 'dark' ? Sun : Moon, label: `${theme === 'dark' ? 'Light' : 'Dark'} Mode`, onClick: toggleTheme },
  ];

  // Settings and Activity
  const settingsActivityItems = [
    { icon: CreditCard, label: 'Orders and payments', path: '/orders' },
    { icon: Bell, label: 'Notification Demo', path: '/notifications/demo' },
    ...(user?.email === 'sibiyagaming@gmail.com' || profile?.email === 'sibiyagaming@gmail.com' ? [{ icon: Shield, label: 'Admin Mrwain', path: '/admin-mrwain' }] : []),
  ];

  // More info and support
  const supportItems = [
    { icon: HelpCircle, label: 'Help', path: '/legal/help' },
    { icon: Shield, label: 'Privacy Center', path: '/legal/privacy' },
    { icon: UserCheck, label: 'Account Status', path: '/account/status' },
  ];

  // Also from Mrwain Organization
  const mrwainOrgItems = [
    { icon: ExternalLink, label: 'Droplink', description: 'Direct file sharing and links', url: 'https://www.droplink.space/' },
    { icon: ExternalLink, label: 'DropStore', description: 'Online marketplace and shopping', url: 'https://dropshops.space/' },
    { icon: ExternalLink, label: 'DropPay', description: 'Secure payment solutions', url: 'https://droppay.space/' },
  ];

  // Account Management
  const accountItems = [
    { icon: User, label: 'Add account', path: '/add-account' },
  ];

  // Legal & Help
  const legalItems = [
    { icon: HelpCircle, label: 'Help Center', path: '/legal/help' },
    { icon: FileText, label: 'About', path: '/legal/about' },
    { icon: FileText, label: 'Terms', path: '/legal/terms' },
    { icon: Lock, label: 'Privacy Policy', path: '/legal/privacy' },
    { icon: Users2, label: 'Community Guidelines', path: '/legal/community' },
    { icon: Shield, label: 'Safety Center', path: '/legal/safety' },
    { icon: Zap, label: 'Developers', path: '/legal/developers' },
    { icon: Cookie, label: 'Cookies', path: '/legal/cookies' },
    { icon: Briefcase, label: 'Careers', path: '/legal/careers' },
    { icon: Smartphone, label: 'Advertising', path: '/legal/advertising' },
  ];

  const handleNavigate = (path?: string, url?: string) => {
    if (url) {
      window.open(url, '_blank');
    } else if (path) {
      navigate(path);
    }
  };

  return (
    <MainLayout>
      <div className="mx-auto max-w-2xl space-y-6 px-4 py-6">
        {/* Profile Card */}
        {profile && (
          <div
            onClick={() => navigate(`/profile/${profile.username}`)}
            className="flex cursor-pointer items-center gap-4 rounded-xl bg-card p-4 shadow-sm transition-all hover:shadow-md"
          >
            <div className="h-16 w-16 flex-shrink-0 rounded-full bg-secondary overflow-hidden">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-xl font-bold">
                  {profile.display_name[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold">{profile.display_name}</h2>
              <p className="text-sm text-muted-foreground">@{profile.username}</p>
              <p className="text-xs text-muted-foreground capitalize mt-1">
                {profile.account_type} Account
              </p>
            </div>
          </div>
        )}

        <Separator />

        {/* Main Navigation */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Navigation
          </h3>
          <div className="space-y-1">
            {mainNavItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Creation & Sharing */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Create & Share
          </h3>
          <div className="space-y-1">
            {creationItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Communication */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Communication
          </h3>
          <div className="space-y-1">
            {communicationItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Personal */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Personal
          </h3>
          <div className="space-y-1">
            {personalItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Advertising */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Advertising
          </h3>
          <div className="space-y-1">
            {adsItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Settings & Preferences */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Settings & Preferences
          </h3>
          <div className="space-y-1">
            {settingsItems.map(({ icon: Icon, label, path, onClick }) => (
              <button
                key={label}
                onClick={() => {
                  if (onClick) onClick();
                  else if (path) handleNavigate(path);
                }}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Settings and Activity */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Settings and activity
          </h3>
          <div className="space-y-1">
            {settingsActivityItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* More info and support */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            More info and support
          </h3>
          <div className="space-y-1">
            {supportItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Also from Mrwain Organization */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Also from Mrwain Organization
          </h3>
          <div className="space-y-1">
            {mrwainOrgItems.map(({ icon: Icon, label, description, url }) => (
              <button
                key={url}
                onClick={() => handleNavigate(undefined, url)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <span className="font-medium block">{label}</span>
                  <span className="text-sm text-muted-foreground">{description}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Account Management */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Login
          </h3>
          <div className="space-y-1">
            {accountItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary text-blue-500 hover:text-blue-600"
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Legal & Help */}
        <div>
          <h3 className="mb-3 px-2 text-xs font-semibold uppercase text-muted-foreground">
            Help & Legal
          </h3>
          <div className="space-y-1">
            {legalItems.map(({ icon: Icon, label, path }) => (
              <button
                key={path}
                onClick={() => handleNavigate(path)}
                className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left transition-colors hover:bg-secondary"
              >
                <Icon className="h-5 w-5 text-muted-foreground" />
                <span className="font-medium">{label}</span>
              </button>
            ))}
          </div>
        </div>

        <Separator />

        {/* Logout */}
        <div>
          <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Log Out
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Log out?</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to log out of your DropShare account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* Footer */}
        <div className="pt-4 text-center">
          <p className="text-xs text-muted-foreground">DropShare v1.0.0</p>
          <p className="text-xs text-muted-foreground mt-1">© 2026 DropShare. All rights reserved.</p>
        </div>
      </div>
    </MainLayout>
  );
};

export default Menu;
