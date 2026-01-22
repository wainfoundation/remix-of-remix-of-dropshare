import { GlassCard } from "./ui/glass-card";
import { GlassButton } from "./ui/glass-button";
import { MessageCircle, UserPlus, Share2, MoreVertical } from "lucide-react";

interface GlassmorphicProfileCardProps {
  username: string;
  displayName: string;
  bio?: string;
  followers: number;
  following: number;
  posts: number;
  avatarUrl?: string;
  coverUrl?: string;
  isFollowing?: boolean;
}

export function GlassmorphicProfileCard({
  username,
  displayName,
  bio,
  followers,
  following,
  posts,
  avatarUrl,
  coverUrl,
  isFollowing = false,
}: GlassmorphicProfileCardProps) {
  return (
    <GlassCard className="relative overflow-hidden max-w-md w-full">
      {/* Cover Image with Overlay */}
      <div className="relative h-40">
        {coverUrl ? (
          <img
            src={coverUrl}
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
        )}
        <div className="absolute inset-0 bg-black/20" />
        
        {/* Top Actions */}
        <div className="absolute top-4 right-4 flex gap-2">
          <button className="glass p-2 rounded-full hover:glass-strong transition-all">
            <Share2 className="w-4 h-4 text-white" />
          </button>
          <button className="glass p-2 rounded-full hover:glass-strong transition-all">
            <MoreVertical className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Profile Content */}
      <div className="p-6">
        {/* Avatar */}
        <div className="relative -mt-20 mb-4">
          <div className="glass-strong p-1 rounded-full inline-block">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white text-3xl font-bold">
                  {displayName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Name and Username */}
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-white mb-1">{displayName}</h2>
          <p className="text-white/70">@{username}</p>
        </div>

        {/* Bio */}
        {bio && (
          <p className="text-white/90 text-sm mb-4 line-clamp-3">{bio}</p>
        )}

        {/* Stats */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          <div className="glass-subtle p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{posts}</p>
            <p className="text-white/70 text-xs">Posts</p>
          </div>
          <div className="glass-subtle p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{followers}</p>
            <p className="text-white/70 text-xs">Followers</p>
          </div>
          <div className="glass-subtle p-3 rounded-lg text-center">
            <p className="text-2xl font-bold text-white">{following}</p>
            <p className="text-white/70 text-xs">Following</p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <GlassButton
            variant={isFollowing ? "subtle" : "strong"}
            className="flex-1"
          >
            <UserPlus className="w-4 h-4" />
            {isFollowing ? "Following" : "Follow"}
          </GlassButton>
          <GlassButton variant="default" className="flex-1">
            <MessageCircle className="w-4 h-4" />
            Message
          </GlassButton>
        </div>
      </div>
    </GlassCard>
  );
}
