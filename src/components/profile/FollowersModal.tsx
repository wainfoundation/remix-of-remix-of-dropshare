import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface FollowUser {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  isFollowing: boolean;
}

interface FollowersModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
  type: 'followers' | 'following';
  username: string;
}

const FollowersModal = ({ open, onOpenChange, userId, type, username }: FollowersModalProps) => {
  const { user } = useAuth();
  const [users, setUsers] = useState<FollowUser[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (open) {
      fetchUsers();
    }
  }, [open, userId, type]);

  const fetchUsers = async () => {
    setLoading(true);

    if (type === 'followers') {
      // Get users who follow this user
      const { data: followsData } = await supabase
        .from('follows')
        .select('follower_id')
        .eq('following_id', userId);

      const followerIds = followsData?.map(f => f.follower_id) || [];

      if (followerIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', followerIds);

      // Check if current user follows these users
      let followingMap: Record<string, boolean> = {};
      if (user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', followerIds);

        followingMap = (followingData || []).reduce((acc, f) => {
          acc[f.following_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      setUsers(
        (profilesData || []).map(p => ({
          ...p,
          isFollowing: followingMap[p.user_id] || false,
        }))
      );
    } else {
      // Get users this user follows
      const { data: followsData } = await supabase
        .from('follows')
        .select('following_id')
        .eq('follower_id', userId);

      const followingIds = followsData?.map(f => f.following_id) || [];

      if (followingIds.length === 0) {
        setUsers([]);
        setLoading(false);
        return;
      }

      const { data: profilesData } = await supabase
        .from('profiles')
        .select('id, user_id, username, display_name, avatar_url')
        .in('user_id', followingIds);

      // Check if current user follows these users
      let followingMap: Record<string, boolean> = {};
      if (user) {
        const { data: followingData } = await supabase
          .from('follows')
          .select('following_id')
          .eq('follower_id', user.id)
          .in('following_id', followingIds);

        followingMap = (followingData || []).reduce((acc, f) => {
          acc[f.following_id] = true;
          return acc;
        }, {} as Record<string, boolean>);
      }

      setUsers(
        (profilesData || []).map(p => ({
          ...p,
          isFollowing: followingMap[p.user_id] || false,
        }))
      );
    }

    setLoading(false);
  };

  const handleFollow = async (targetUserId: string, currentlyFollowing: boolean) => {
    if (!user) return;

    if (currentlyFollowing) {
      await supabase
        .from('follows')
        .delete()
        .eq('follower_id', user.id)
        .eq('following_id', targetUserId);
    } else {
      await supabase.from('follows').insert({
        follower_id: user.id,
        following_id: targetUserId,
      });
    }

    setUsers(users.map(u =>
      u.user_id === targetUserId
        ? { ...u, isFollowing: !currentlyFollowing }
        : u
    ));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="text-center">
            {type === 'followers' ? 'Followers' : 'Following'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="max-h-96 overflow-y-auto">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingLogo size="sm" />
            </div>
          ) : users.length > 0 ? (
            <div className="space-y-3">
              {users.map((u) => (
                <div key={u.id} className="flex items-center gap-3">
                  <Link
                    to={`/profile/${u.username}`}
                    onClick={() => onOpenChange(false)}
                    className="flex items-center gap-3 flex-1 min-w-0"
                  >
                    <Avatar className="h-11 w-11">
                      <AvatarImage src={u.avatar_url || undefined} />
                      <AvatarFallback className="bg-secondary">
                        {u.display_name[0]?.toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm truncate">{u.username}</p>
                      <p className="text-xs text-muted-foreground truncate">{u.display_name}</p>
                    </div>
                  </Link>
                  {user && user.id !== u.user_id && (
                    <Button
                      size="sm"
                      variant={u.isFollowing ? 'secondary' : 'default'}
                      onClick={() => handleFollow(u.user_id, u.isFollowing)}
                    >
                      {u.isFollowing ? 'Following' : 'Follow'}
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center py-8 text-muted-foreground">
              {type === 'followers' ? 'No followers yet' : 'Not following anyone'}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default FollowersModal;
