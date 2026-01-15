type VerifiedBadgeProps = {
  className?: string;
  size?: 'sm' | 'md';
  src?: string; // allow override if needed
};

export default function VerifiedBadge({ className = '', size = 'md', src = 'https://i.ibb.co/p72ndX2/verify-3.png' }: VerifiedBadgeProps) {
  const dimClass = size === 'sm' ? 'h-5 w-5' : 'h-6 w-6';
  return (
    <img
      src={src}
      alt="Verified"
      className={`inline-block rounded-full object-contain ${dimClass} ${className}`}
      loading="lazy"
      crossOrigin="anonymous"
    />
  );
}
