import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { MoreHorizontal, Flag, Link2, Trash2, Edit } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface ReelMenuProps {
  reelId: string;
  reelUserId: string;
  onDelete?: () => void;
}

const ReelMenu = ({ reelId, reelUserId, onDelete }: ReelMenuProps) => {
  const { user } = useAuth();
  const { theme } = useTheme();
  const { toast } = useToast();
  const isOwner = user?.id === reelUserId;

  const handleCopyLink = async () => {
    const url = `${window.location.origin}/reels/${reelId}`;
    await navigator.clipboard.writeText(url);
    toast({
      title: 'Link copied!',
      description: 'Reel link copied to clipboard',
    });
  };

  const handleReport = () => {
    toast({
      title: 'Report submitted',
      description: 'Thank you for helping keep our community safe',
    });
  };

  const handleDelete = async () => {
    if (!isOwner) return;

    const confirmed = window.confirm('Are you sure you want to delete this reel?');
    if (!confirmed) return;

    const { error } = await supabase
      .from('reels')
      .delete()
      .eq('id', reelId);

    if (error) {
      toast({
        title: 'Error',
        description: 'Failed to delete reel',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Reel deleted',
      description: 'Your reel has been deleted',
    });

    onDelete?.();
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex flex-col items-center">
          <MoreHorizontal className={`h-7 w-7 ${theme === 'dark' ? 'text-white' : 'text-black'}`} />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={handleCopyLink}>
          <Link2 className="h-4 w-4 mr-2" />
          Copy link
        </DropdownMenuItem>
        
        {isOwner ? (
          <>
            <DropdownMenuItem onClick={handleDelete} className="text-destructive">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete reel
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem onClick={handleReport}>
            <Flag className="h-4 w-4 mr-2" />
            Report
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ReelMenu;
