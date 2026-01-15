import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Bell,
  Lock,
  HelpCircle,
  Info,
  LogOut,
  Moon,
  Sun,
  ChevronRight,
  Store,
  Sparkles,
  ShoppingBag,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type AccountType = 'business' | 'creator' | 'shopper';

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, profile, user, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [showAccountTypeDialog, setShowAccountTypeDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPrivate, setIsPrivate] = useState(profile?.privacy === 'private');

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

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

  const handleAccountTypeChange = async (newType: AccountType) => {
    if (!user || newType === profile?.account_type) {
      setShowAccountTypeDialog(false);
      return;
    }

    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ account_type: newType })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      toast({
        title: 'Account type updated',
        description: `You are now a ${newType} account.`,
      });
    } catch (error) {
      console.error('Error updating account type:', error);
      toast({
        title: 'Failed to update',
        description: 'Could not update account type. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
      setShowAccountTypeDialog(false);
    }
  };

  const handlePrivacyToggle = async () => {
    if (!user) return;

    const newPrivacy = isPrivate ? 'public' : 'private';
    setIsUpdating(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ privacy: newPrivacy })
        .eq('user_id', user.id);

      if (error) throw error;

      await refreshProfile();
      setIsPrivate(!isPrivate);
      toast({
        title: 'Privacy updated',
        description: `Your account is now ${newPrivacy}.`,
      });
    } catch (error) {
      console.error('Error updating privacy:', error);
      toast({
        title: 'Failed to update',
        description: 'Could not update privacy settings. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  const getCurrentAccountTypeIcon = () => {
    switch (profile?.account_type) {
      case 'business':
        return Store;
      case 'creator':
        return Sparkles;
      case 'shopper':
        return ShoppingBag;
      default:
        return User;
    }
  };

  const AccountTypeIcon = getCurrentAccountTypeIcon();

  const settingsSections = [
    {
      title: 'Account',
      items: [
        {
          icon: User,
          label: 'Edit Profile',
          onClick: () => navigate('/edit-profile'),
        },
        {
          icon: AccountTypeIcon,
          label: 'Account Type',
          subtitle: profile?.account_type ? profile.account_type.charAt(0).toUpperCase() + profile.account_type.slice(1) : undefined,
          onClick: () => setShowAccountTypeDialog(true),
        },
        {
          icon: Lock,
          label: 'Privacy',
          onClick: () => navigate('/legal/privacy'),
        },
      ],
    },
    {
      title: 'Preferences',
      items: [
        {
          icon: theme === 'dark' ? Moon : Sun,
          label: 'Dark Mode',
          toggle: true,
          value: theme === 'dark',
          onToggle: toggleTheme,
        },
        {
          icon: Bell,
          label: 'Notifications',
          toggle: true,
          value: notifications,
          onToggle: () => setNotifications(!notifications),
        },
      ],
    },
    {
      title: 'Support',
      items: [
        {
          icon: HelpCircle,
          label: 'Help Center',
          onClick: () => navigate('/legal/help'),
        },
        {
          icon: Info,
          label: 'About',
          onClick: () => navigate('/legal/about'),
        },
        {
          icon: Info,
          label: 'Terms',
          onClick: () => navigate('/legal/terms'),
        },
        {
          icon: Info,
          label: 'Privacy Policy',
          onClick: () => navigate('/legal/privacy'),
        },
        {
          icon: Info,
          label: 'Developers',
          onClick: () => navigate('/legal/developers'),
        },
        {
          icon: Info,
          label: 'Cookies',
          onClick: () => navigate('/legal/cookies'),
        },
        {
          icon: Info,
          label: 'Careers',
          onClick: () => navigate('/legal/careers'),
        },
        {
          icon: Info,
          label: 'Advertising',
          onClick: () => navigate('/legal/advertising'),
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-lg font-semibold">Settings</h1>
      </header>

      <div className="mx-auto max-w-lg">
        {/* Profile summary */}
        {profile && (
          <button
            onClick={() => navigate('/edit-profile')}
            className="flex w-full items-center gap-4 p-4 transition-colors hover:bg-secondary"
          >
            <div className="h-14 w-14 rounded-full bg-secondary flex items-center justify-center">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="h-full w-full rounded-full object-cover"
                />
              ) : (
                <span className="text-xl font-medium">
                  {profile.display_name[0]?.toUpperCase()}
                </span>
              )}
            </div>
            <div className="flex-1 text-left">
              <p className="font-semibold">{profile.display_name}</p>
              <p className="text-sm text-muted-foreground">{profile.username}</p>
            </div>
            <ChevronRight className="h-5 w-5 text-muted-foreground" />
          </button>
        )}

        <Separator />

        {/* Settings sections */}
        {settingsSections.map((section) => (
          <div key={section.title} className="py-4">
            <h2 className="px-4 mb-2 text-sm font-medium text-muted-foreground">
              {section.title}
            </h2>
            <div>
              {section.items.map((item) => (
                <div
                  key={item.label}
                  className={`flex items-center justify-between px-4 py-3 ${
                    !item.toggle && !item.disabled
                      ? 'cursor-pointer transition-colors hover:bg-secondary'
                      : ''
                  } ${item.disabled ? 'opacity-50' : ''}`}
                  onClick={item.toggle || item.disabled ? undefined : item.onClick}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className="h-5 w-5 text-muted-foreground" />
                    <div>
                      <span>{item.label}</span>
                      {item.subtitle && (
                        <p className="text-xs text-muted-foreground">{item.subtitle}</p>
                      )}
                    </div>
                  </div>
                  {item.toggle ? (
                    <Switch
                      checked={item.value}
                      onCheckedChange={item.onToggle}
                    />
                  ) : !item.disabled ? (
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Privacy Settings */}
        <div className="py-4">
          <h2 className="px-4 mb-2 text-sm font-medium text-muted-foreground">
            Privacy Settings
          </h2>
          <div className="flex items-center justify-between py-4">
            <div>
              <h4 className="font-medium">Privacy</h4>
              <p className="text-sm text-muted-foreground">
                Set your account as public or private.
              </p>
            </div>
            <Switch checked={isPrivate} onCheckedChange={handlePrivacyToggle} disabled={isUpdating} />
          </div>
          <Separator />
        </div>

        {/* Logout */}
        <div className="p-4">
          <AlertDialog>
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
                  Are you sure you want to log out of your account?
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleLogout}>
                  Log Out
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>

        {/* App version */}
        <div className="p-4 text-center">
          <p className="text-xs text-muted-foreground">DropShare v1.0.0</p>
        </div>
      </div>

      {/* Account Type Dialog */}
      <Dialog open={showAccountTypeDialog} onOpenChange={setShowAccountTypeDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Change Account Type</DialogTitle>
            <DialogDescription>
              Select your account type. This affects what features are available to you.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 py-4">
            {accountTypes.map(({ type, icon: Icon, title, description }) => (
              <button
                key={type}
                onClick={() => handleAccountTypeChange(type)}
                disabled={isUpdating}
                className={`flex w-full items-center gap-4 p-4 rounded-xl border-2 transition-all ${
                  profile?.account_type === type
                    ? 'border-primary bg-primary/5'
                    : 'border-border hover:border-muted-foreground/30'
                } ${isUpdating ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className={`flex h-12 w-12 items-center justify-center rounded-full ${
                  profile?.account_type === type ? 'bg-primary text-primary-foreground' : 'bg-secondary'
                }`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1 text-left">
                  <span className="font-semibold">{title}</span>
                  <p className="text-sm text-muted-foreground">{description}</p>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Settings;
