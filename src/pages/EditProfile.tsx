import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';

const STORE_CATEGORIES = [
  'Fashion & Apparel',
  'Beauty & Cosmetics',
  'Electronics',
  'Home & Garden',
  'Sports & Outdoors',
  'Art & Crafts',
  'Food & Beverages',
  'Health & Wellness',
  'Jewelry & Accessories',
  'Toys & Games',
  'Books & Media',
  'Automotive',
  'Pet Supplies',
  'Other',
];

const EditProfile = () => {
  const navigate = useNavigate();
  const { user, profile, refreshProfile } = useAuth();

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [storeCategory, setStoreCategory] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [coverUrl, setCoverUrl] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [usernameChanged, setUsernameChanged] = useState(false);

  useEffect(() => {
    if (profile) {
      setDisplayName(profile.display_name || '');
      setUsername(profile.username || '');
      setBio(profile.bio || '');
      setWebsiteUrl(profile.website_url || '');
      setStoreCategory(profile.store_category || '');
      setAvatarUrl(profile.avatar_url);
      setCoverUrl(profile.cover_url || null);
      setUsernameChanged(profile.username_changed || false);
    }
  }, [profile]);

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setCoverFile(file);
      setCoverPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;

    setLoading(true);

    let newAvatarUrl = avatarUrl;
    let newCoverUrl = coverUrl;

    // Upload avatar if changed
    if (avatarFile) {
      // Validate file
      const validation = validateFile(avatarFile, {
        maxSizeMB: 5,
        allowedTypes: ['image/*']
      });
      
      if (!validation.valid) {
        toast({ title: validation.error || 'Invalid image', variant: 'destructive' });
        setLoading(false);
        return;
      }
      
      const filePath = generateFilePath(user.id, avatarFile.name, 'avatars');
      const { url, error: uploadError } = await uploadFile(avatarFile, filePath);

      if (uploadError || !url) {
        toast({ title: 'Failed to upload avatar', variant: 'destructive' });
        setLoading(false);
        return;
      }

      newAvatarUrl = url;
    }

    // Upload cover if changed
    if (coverFile) {
      const validation = validateFile(coverFile, {
        maxSizeMB: 10,
        allowedTypes: ['image/*']
      });
      
      if (!validation.valid) {
        toast({ title: validation.error || 'Invalid cover image', variant: 'destructive' });
        setLoading(false);
        return;
      }
      
      const filePath = generateFilePath(user.id, coverFile.name, 'covers');
      const { url, error: uploadError } = await uploadFile(coverFile, filePath);

      if (uploadError || !url) {
        toast({ title: 'Failed to upload cover', variant: 'destructive' });
        setLoading(false);
        return;
      }

      newCoverUrl = url;
    }

    // Check username uniqueness if changed
    if (username !== profile.username) {
      if (usernameChanged) {
        toast({ title: 'Username can only be changed once', variant: 'destructive' });
        setLoading(false);
        return;
      }

      const { data: existingUser } = await supabase
        .from('profiles')
        .select('id')
        .eq('username', username)
        .neq('user_id', user.id)
        .maybeSingle();

      if (existingUser) {
        toast({ title: 'Username already taken', variant: 'destructive' });
        setLoading(false);
        return;
      }
    }

    // Update profile
    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: displayName,
        username,
        bio: bio || null,
        website_url: websiteUrl || null,
        store_category: storeCategory || null,
        avatar_url: newAvatarUrl,
        cover_url: newCoverUrl,
        username_changed: username !== profile.username ? true : usernameChanged,
      })
      .eq('user_id', user.id);

    if (error) {
      toast({ title: 'Failed to update profile', variant: 'destructive' });
    } else {
      toast({ title: 'Profile updated successfully!' });
      await refreshProfile();
      navigate(`/profile/${username}`);
    }

    setLoading(false);
  };

  if (!user || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center justify-center text-center">
          <h2 className="text-xl font-semibold">Sign in to edit profile</h2>
          <p className="mt-2 text-muted-foreground mb-6">
            You need to be logged in to edit your profile.
          </p>
          <Button onClick={() => navigate('/login')}>Log In</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500/10 via-pink-500/10 to-orange-400/10 dark:from-purple-900/20 dark:via-pink-900/20 dark:to-orange-900/20">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center glass backdrop-blur-xl border-b border-white/10 px-4">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-white">
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-lg font-semibold text-white">Edit Profile</h1>
        <Button
          onClick={handleSubmit}
          disabled={loading || !displayName.trim() || !username.trim()}
          className="ml-auto glass-strong hover:glass text-white"
        >
          {loading ? 'Saving...' : 'Save'}
        </Button>
      </header>

      <form onSubmit={handleSubmit} className="mx-auto max-w-lg space-y-6">
        {/* Cover Image */}
        <div className="relative h-48 overflow-hidden">
          {coverPreview || coverUrl ? (
            <img
              src={coverPreview || coverUrl || undefined}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-purple-500 via-pink-500 to-orange-400" />
          )}
          <label
            htmlFor="cover-upload"
            className="absolute bottom-4 right-4 glass backdrop-blur-xl p-3 rounded-full cursor-pointer text-white hover:glass-strong transition-all"
          >
            <Camera className="h-5 w-5" />
            <input
              id="cover-upload"
              type="file"
              accept="image/*"
              onChange={handleCoverChange}
              className="hidden"
            />
          </label>
        </div>

        <div className="px-6 space-y-6">
          {/* Avatar */}
          <div className="flex flex-col items-center gap-4 -mt-16">
            <div className="relative glass-strong p-2 rounded-full">
              <Avatar className="h-24 w-24 border-4 border-background">
                <AvatarImage src={avatarPreview || avatarUrl || undefined} />
                <AvatarFallback className="bg-secondary text-2xl">
                  {displayName[0]?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <label
                htmlFor="avatar-upload"
                className="absolute bottom-0 right-0 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full glass-strong backdrop-blur-xl text-white hover:glass transition-all"
              >
                <Camera className="h-4 w-4" />
                <input
                  id="avatar-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
              </label>
            </div>
            <p className="text-sm text-white/70">
              Click to change profile photo or cover
            </p>
          </div>

        {/* Display Name */}
        <div className="space-y-2">
          <Label htmlFor="displayName" className="text-white">Display Name</Label>
          <Input
            id="displayName"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Your display name"
            className="glass border-white/10 text-white placeholder:text-white/60"
          />
        </div>

        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username" className="text-white">Username</Label>
          {usernameChanged ? (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                disabled
                className="h-12 pl-8 bg-muted"
              />
            </div>
          ) : (
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
              <Input
                id="username"
                value={username}
                onChange={(e) => {
                  let value = e.target.value;
                  // Remove @ if user types it
                  value = value.replace(/^@+/, '');
                  // Remove spaces and special chars except underscore
                  value = value.replace(/[^a-zA-Z0-9_]/g, '');
                  setUsername(value.toLowerCase());
                }}
                placeholder="username"
                className="h-12 pl-8"
                maxLength={20}
              />
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            {usernameChanged ? 'Username can only be changed once' : 'Your unique username (letters, numbers, underscore only) - can be changed once'}
          </p>
        </div>

        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself..."
            rows={4}
            maxLength={150}
          />
          <p className="text-xs text-muted-foreground text-right">
            {bio.length}/150
          </p>
        </div>

        {/* Website (for business accounts) */}
        {profile.account_type === 'business' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                type="url"
                value={websiteUrl}
                onChange={(e) => setWebsiteUrl(e.target.value)}
                placeholder="https://yourstore.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="category">Store Category</Label>
              <Select value={storeCategory} onValueChange={setStoreCategory}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent>
                  {STORE_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
