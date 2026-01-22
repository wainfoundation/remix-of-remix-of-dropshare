import { Home, Search, PlusSquare, MessageCircle, User, Menu, Sun, Moon, LogOut, BarChart3, Bookmark, Users, TrendingUp, Bell, Video, Film, Megaphone, Shield, HelpCircle, FileText, Code, Briefcase, Info, Cookie, Settings } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import { AppLogo } from '@/components/AppLogo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SidebarProps {
  mobile?: boolean;
  onNavigate?: () => void;
}

const Sidebar = ({ mobile = false, onNavigate }: SidebarProps) => {
  const location = useLocation();
  const { profile, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();

  const isCreatorOrBusiness = profile?.account_type === 'creator' || profile?.account_type === 'business';
  const isAdmin = profile?.email === 'sibiyagaming@gmail.com'; // Only specific admin email

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Users, path: '/pioneer', label: 'Pioneer' },
    { icon: Search, path: '/explore', label: 'Explore' },
    { icon: TrendingUp, path: '/trending', label: 'Trending' },
    { icon: PlusSquare, path: '/create', label: 'Create' },
    { icon: Video, path: '/reels', label: 'Reels' },
    { icon: Film, path: '/videos', label: 'Videos' },
    { icon: MessageCircle, path: '/messages', label: 'Messages' },
    { icon: Bell, path: '/notifications', label: 'Notifications' },
    { icon: Megaphone, path: '/ads', label: 'Ads' },
    ...(isCreatorOrBusiness ? [{ icon: BarChart3, path: '/analytics', label: 'Analytics' }] : []),
    ...(isAdmin ? [{ icon: Shield, path: '/admin/dashboard', label: 'Admin' }] : []),
    { icon: Bookmark, path: '/saved', label: 'Saved' },
    { icon: User, path: profile ? `/profile/${profile.username}` : '/login', label: 'Profile' },
    { icon: Menu, path: '/menu', label: 'Menu' },
  ];

  return (
    <aside className={cn(
      "h-screen flex-col glass-subtle border-r border-white/10 px-3 py-6 overflow-y-auto backdrop-blur-xl",
      mobile 
        ? "flex pt-16 w-full" 
        : "fixed left-0 top-0 z-50 hidden w-[72px] md:flex lg:w-[244px]"
    )}>
      {/* Logo */}
      <Link 
        to="/" 
        className="mb-8 px-3 flex items-center justify-center lg:justify-start"
        onClick={onNavigate}
      >
        {mobile ? (
          <AppLogo size="lg" />
        ) : (
          <>
            <AppLogo size="md" className="lg:hidden" />
            <AppLogo size="lg" className="hidden lg:block" />
          </>
        )}
      </Link>

      {/* Theme Toggle */}
      <Button
        variant="ghost"
        size="icon"
        onClick={toggleTheme}
        className="mb-4 w-full justify-center lg:justify-start lg:gap-4 lg:px-3 lg:py-3"
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {theme === 'dark' ? (
          <>
            <Sun className="h-6 w-6" />
            <span className="hidden lg:inline text-sm">Light Mode</span>
          </>
        ) : (
          <>
            <Moon className="h-6 w-6" />
            <span className="hidden lg:inline text-sm">Dark Mode</span>
          </>
        )}
      </Button>

      {/* Navigation */}
      <nav className="flex flex-1 flex-col gap-1 overflow-y-auto min-h-0">
        {navItems.map(({ icon: Icon, path, label }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));

          return (
            <Link
              key={path}
              to={path}
              onClick={onNavigate}
              className={cn(
                "flex items-center gap-4 rounded-lg px-3 py-3 transition-all glass-subtle hover:glass",
                isActive ? "font-semibold glass" : "text-foreground"
              )}
            >
              <Icon 
                className={cn(
                  "h-6 w-6 flex-shrink-0",
                  isActive && "fill-current"
                )} 
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className={cn(mobile ? "inline" : "hidden lg:inline")}>{label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Menu */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="justify-start gap-4 px-3 py-3">
            <Menu className="h-6 w-6" />
            <span className={cn(mobile ? "inline" : "hidden lg:inline")}>More</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="w-56">
          <DropdownMenuItem asChild>
            <Link to="/legal/help" onClick={onNavigate} className="flex items-center">
              <HelpCircle className="mr-2 h-4 w-4" />
              Help Center
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/about" onClick={onNavigate} className="flex items-center">
              <Info className="mr-2 h-4 w-4" />
              About
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/terms" onClick={onNavigate} className="flex items-center">
              <FileText className="mr-2 h-4 w-4" />
              Terms
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/privacy" onClick={onNavigate} className="flex items-center">
              <Settings className="mr-2 h-4 w-4" />
              Privacy Policy
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/community" onClick={onNavigate} className="flex items-center">
              <Users className="mr-2 h-4 w-4" />
              Community Guidelines
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/safety" onClick={onNavigate} className="flex items-center">
              <Shield className="mr-2 h-4 w-4" />
              Safety Center
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/developers" onClick={onNavigate} className="flex items-center">
              <Code className="mr-2 h-4 w-4" />
              Developers
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/cookies" onClick={onNavigate} className="flex items-center">
              <Cookie className="mr-2 h-4 w-4" />
              Cookies
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/careers" onClick={onNavigate} className="flex items-center">
              <Briefcase className="mr-2 h-4 w-4" />
              Careers
            </Link>
          </DropdownMenuItem>
          <DropdownMenuItem asChild>
            <Link to="/legal/advertising" onClick={onNavigate} className="flex items-center">
              <Megaphone className="mr-2 h-4 w-4" />
              Advertising
            </Link>
          </DropdownMenuItem>
          {profile && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => signOut()}>
                <LogOut className="mr-2 h-4 w-4" />
                Log Out
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
      
      {/* Copyright */}
      <div className="mt-4 pt-4 border-t border-border">
        <p className="text-xs text-muted-foreground text-center px-2">
          © 2026 DropShare by Mrwain Organization
        </p>
      </div>
    </aside>
  );
};

export default Sidebar;
