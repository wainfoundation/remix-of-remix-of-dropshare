import { useTheme } from '@/contexts/ThemeContext';

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function AppLogo({ size = 'md', className = '' }: AppLogoProps) {
  const { theme } = useTheme();
  
  const sizeClasses = {
    sm: 'h-6 w-auto',
    md: 'h-8 w-auto',
    lg: 'h-12 w-auto',
    xl: 'h-16 w-auto',
  };

  // Dark mode uses the white/bright logo, light mode uses the dark logo
  const logoSrc = theme === 'dark' 
    ? 'https://i.ibb.co/0yMxN5s3/Untitled-design-72-removebg-preview.png'
    : 'https://i.ibb.co/LDKVc6k6/Untitled-design-73-removebg-preview.png';

  return (
    <img 
      src={logoSrc} 
      alt="DropShare" 
      className={`${sizeClasses[size]} object-contain ${className}`}
      onError={(e) => {
        // Fallback if image doesn't load - hide it
        e.currentTarget.style.display = 'none';
      }}
    />
  );
}
