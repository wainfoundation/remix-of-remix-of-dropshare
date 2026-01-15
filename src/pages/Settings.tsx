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
  Trash2,
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

declare global {
  interface Window {
    Pi?: any;
  }
}

const Settings = () => {
  const navigate = useNavigate();
  const { signOut, profile, user, refreshProfile } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [notifications, setNotifications] = useState(true);
  const [showAccountTypeDialog, setShowAccountTypeDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [isPrivate, setIsPrivate] = useState(profile?.privacy === 'private');

  const requestPiPayment = async (type: AccountType) => {
    const pricePi = 10;
    await new Promise<void>((resolve, reject) => {
      if (typeof window === 'undefined' || !window.Pi) {
        return reject(new Error('Pi SDK not available. Please open this app in Pi Browser.'));
      }
      try {
        window.Pi.createPayment(
          {
            amount: pricePi,
            memo: `Switch to ${type} account`,
            metadata: { purpose: 'account_switch', type, userId: user?.id },
          },
          {
            onReadyForServerApproval: () => {
              console.log('Pi payment ready for approval (skipped)');
            },
            onReadyForServerCompletion: () => {
              console.log('Pi payment completed (sandbox accepted)');
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
  };

  const handleLogout = async () => {
    await signOut();
    navigate('/login');
  };

  const handleDeleteAccount = async () => {
    if (!user) return;

    setIsUpdating(true);
    try {
      // Delete user profile
      const { error: profileError } = await supabase
        .from('profiles')
        .delete()
        .eq('user_id', user.id);

      if (profileError) throw profileError;

      // Sign out and redirect
      await signOut();
      toast({
        title: 'Account deleted',
        description: 'Your account and all data have been permanently deleted.',
      });
      navigate('/login');
    } catch (error) {
      console.error('Error deleting account:', error);
      toast({
        title: 'Failed to delete account',
        description: 'Could not delete your account. Please try again or contact support.',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
      setShowDeleteDialog(false);
    }
  };

  const accountTypes = [
    {
      type: 'business' as AccountType,
      icon: Store,
      title: 'Business',
      description: 'Share products with Pi pricing & links • 10π/mo',
    },
    {
      type: 'creator' as AccountType,
      icon: Sparkles,
      title: 'Creator',
      description: 'Share content & grow your audience • 10π/mo',
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
      if (newType === 'business' || newType === 'creator') {
        await requestPiPayment(newType);

        const { error: fnError } = await supabase.functions.invoke('record-payment', {
          body: { userId: user.id, plan: 'monthly_10pi', accountType: newType },
        });

        if (fnError) {
          console.warn('record-payment invocation failed, applying local fallback', fnError);
          const now = new Date();
          const newExpiry = new Date(now.getTime());
          newExpiry.setDate(newExpiry.getDate() + 30);
          const fallbackUpdate: any = {
            account_type: newType,
            desired_account_type: newType,
            subscription_status: 'active',
            subscription_plan: 'monthly_10pi',
            subscription_expires_at: newExpiry.toISOString(),
            last_payment_at: now.toISOString(),
          };
          const { error: fallbackErr } = await supabase
            .from('profiles')
            .update(fallbackUpdate)
            .eq('user_id', user.id);
          if (fallbackErr) throw fallbackErr;
        }
      } else {
        const updates: any = {
          account_type: 'shopper',
          desired_account_type: null,
          subscription_status: 'canceled',
          subscription_plan: null,
          subscription_expires_at: null,
        };
        const { error } = await supabase
          .from('profiles')
          .update(updates)
          .eq('user_id', user.id);
        if (error) throw error;
      }

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
        {
          icon: Trash2,
          label: 'Delete Account',
          onClick: () => setShowDeleteDialog(true),
          destructive: true,
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

        {/* Subscription/Plan Panel */}
        {profile && (
          <div className="p-4 space-y-4">
            <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border border-primary/20 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-semibold text-sm">Current Plan</h3>
                  <p className="text-sm text-muted-foreground capitalize">
                    {profile.account_type === 'shopper' 
                      ? 'Free' 
                      : `${profile.account_type} - 10π/month`}
                  </p>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  profile.subscription_status === 'active'
                    ? 'bg-green-500/20 text-green-700 dark:text-green-300'
                    : profile.subscription_status === 'expired'
                    ? 'bg-orange-500/20 text-orange-700 dark:text-orange-300'
                    : 'bg-muted text-muted-foreground'
                }`}>
                  {profile.subscription_status === 'active' ? 'Active' : 
                   profile.subscription_status === 'expired' ? 'Expired' : 
                   'None'}
                </div>
              </div>

              {profile.subscription_expires_at && profile.account_type !== 'shopper' && (
                <div className="space-y-2 pt-2 border-t border-primary/10">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Expires:</span>
                    <span className="font-medium">
                      {new Date(profile.subscription_expires_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Renews:</span>
                    <span className="font-medium">
                      {new Date(new Date(profile.subscription_expires_at).getTime()).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground pt-1">
                    ℹ️ Your subscription automatically renews on the expiry date. Your plan will continue uninterrupted.
                  </p>
                </div>
              )}

              {profile.account_type === 'shopper' && (
                <p className="text-xs text-muted-foreground pt-2">
                  Upgrade to Business or Creator account for advanced features (10π/month).
                </p>
              )}
            </div>
          </div>
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
                  } ${item.disabled ? 'opacity-50' : ''} ${item.destructive ? 'text-destructive hover:bg-destructive/10' : ''}`}
                  onClick={item.toggle || item.disabled ? undefined : item.onClick}
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-5 w-5 ${
                      item.destructive ? 'text-destructive' : 'text-muted-foreground'
                    }`} />
                    <div>
                      <span className={item.destructive ? 'font-medium' : ''}>{item.label}</span>
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

      {/* Delete Account Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-destructive">Delete Account</AlertDialogTitle>
            <AlertDialogDescription className="space-y-4">
              <p>
                Are you sure you want to permanently delete your account? This action cannot be undone.
              </p>
              <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 space-y-2">
                <p className="font-semibold text-sm text-destructive">What happens when you delete:</p>
                <ul className="text-sm text-destructive/90 space-y-1 list-disc list-inside">
                  <li>Your profile and all personal data will be permanently deleted</li>
                  <li>All your posts and content will be removed</li>
                  <li>Comments, likes, and follows associated with your account will be deleted</li>
                  <li>Any active subscriptions will be canceled</li>
                  <li>You will be immediately logged out</li>
                </ul>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isUpdating}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isUpdating}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isUpdating ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Settings;
