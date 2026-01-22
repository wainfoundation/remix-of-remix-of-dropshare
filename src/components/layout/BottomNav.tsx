import { Home, Users, PlusSquare, Video, Film, User, Menu } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useScrollDirection } from '@/hooks/use-scroll-direction';

const BottomNav = () => {
  const location = useLocation();
  const { profile } = useAuth();
  const { scrollDirection } = useScrollDirection();

  const navItems = [
    { icon: Home, path: '/', label: 'Home' },
    { icon: Users, path: '/pioneer', label: 'Pioneer' },
    { icon: Video, path: '/reels', label: 'Reels' },
    { icon: Film, path: '/videos', label: 'Videos' },
    { icon: User, path: profile ? `/profile/${profile.username}` : '/login', label: 'Profile' },
    { icon: Menu, path: '/menu', label: 'Menu' },
  ];

  return (
    <nav className={cn(
      "fixed bottom-0 left-0 right-0 z-50 border-t border-white/10 glass backdrop-blur-xl md:hidden transition-transform duration-300 ease-out",
      scrollDirection === 'down' ? 'translate-y-full' : 'translate-y-0'
    )}>
      <div className="flex h-16 items-center justify-around">
        {navItems.map(({ icon: Icon, path, label }) => {
          const isActive = location.pathname === path || 
            (path !== '/' && location.pathname.startsWith(path));
          
          return (
            <Link
              key={path}
              to={path}
              className={cn(
                "flex flex-col h-full flex-1 items-center justify-center gap-1 transition-all rounded-lg",
                isActive ? "text-foreground" : "text-muted-foreground hover:text-foreground hover:glass-subtle"
              )}
              aria-label={label}
            >
              <Icon 
                className={cn(
                  "h-6 w-6",
                  isActive && "fill-current"
                )} 
                strokeWidth={isActive ? 2.5 : 1.5}
              />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
