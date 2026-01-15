import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';

const CreateStory = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [uploading, setUploading] = useState(false);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async () => {
    if (!imageFile || !user) return;

    setUploading(true);

    // Validate image
    const validation = validateFile(imageFile, {
      maxSizeMB: 10,
      allowedTypes: ['image/*']
    });
    
    if (!validation.valid) {
      toast({ title: validation.error || 'Invalid image', variant: 'destructive' });
      setUploading(false);
      return;
    }

    // Upload image
    const filePath = generateFilePath(user.id, imageFile.name, 'stories');
    const { url: imageUrl, error: uploadError } = await uploadFile(imageFile, filePath);

    if (uploadError || !imageUrl) {
      toast({ title: 'Failed to upload image', variant: 'destructive' });
      setUploading(false);
      return;
    }

    // Create story
    const { error: storyError } = await supabase.from('stories').insert({
      user_id: user.id,
      image_url: imageUrl,
      caption: caption || null,
    });

    if (storyError) {
      toast({ title: 'Failed to create story', variant: 'destructive' });
    } else {
      toast({ title: 'Story posted!' });
      navigate('/');
    }

    setUploading(false);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <p className="text-lg font-medium">Please sign in to create stories</p>
          <Button onClick={() => navigate('/login')} className="mt-4">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center border-b border-border bg-background/95 px-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="ml-4 text-lg font-semibold">New Story</h1>
        <Button
          onClick={handleSubmit}
          disabled={!imageFile || uploading}
          className="ml-auto"
        >
          {uploading ? 'Posting...' : 'Share'}
        </Button>
      </header>

      <div className="mx-auto max-w-lg p-6">
        {!imagePreview ? (
          <div className="space-y-4">
            {/* Camera option */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex w-full items-center gap-4 rounded-lg border border-border bg-card p-4 transition-colors hover:bg-accent"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary">
                <Camera className="h-6 w-6 text-primary-foreground" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-semibold">Create a photo story</p>
                <p className="text-sm text-muted-foreground">Share a photo with your followers</p>
              </div>
            </button>

            {/* Gallery info */}
            <div className="rounded-lg border border-border bg-secondary/30 p-4">
              <p className="text-sm text-muted-foreground">
                Stories disappear after 24 hours and can be seen by your followers.
              </p>
            </div>
          </div>
        ) : (
          <div className="relative">
            <img
              src={imagePreview}
              alt="Story preview"
              className="w-full rounded-lg object-cover"
              style={{ maxHeight: '70vh' }}
            />
            <Button
              variant="secondary"
              size="icon"
              className="absolute right-2 top-2"
              onClick={() => {
                setImageFile(null);
                setImagePreview(null);
              }}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleImageSelect}
          className="hidden"
        />

        {imagePreview && (
          <div className="mt-4">
            <Input
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Add a caption (optional)"
              maxLength={100}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateStory;
