import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Video, X, Play } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';

const CreateReel = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  const [video, setVideo] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const handleVideoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Create video element to check duration
      const videoEl = document.createElement('video');
      videoEl.preload = 'metadata';
      videoEl.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoEl.src);
        const videoDuration = Math.floor(videoEl.duration);
        
        if (videoDuration > 60) {
          toast({
            title: 'Video too long',
            description: 'Reels must be 60 seconds or less.',
            variant: 'destructive',
          });
          return;
        }
        
        setDuration(videoDuration);
        setVideo(file);
        setVideoPreview(URL.createObjectURL(file));
      };
      videoEl.src = URL.createObjectURL(file);
    }
  };

  const removeVideo = () => {
    setVideo(null);
    setVideoPreview(null);
    setDuration(0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !video) {
      toast({
        title: 'Error',
        description: 'Please select a video',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      // Validate video
      const validation = validateFile(video, {
        maxSizeMB: 200,
        allowedTypes: ['video/*']
      });
      
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid video');
      }
      
      // Upload video
      const filePath = generateFilePath(user.id, video.name, 'reels');
      const { url: publicUrl, error: uploadError } = await uploadFile(video, filePath);

      if (uploadError || !publicUrl) {
        throw uploadError || new Error('Failed to upload video');
      }

      // Create reel
      const { error: reelError } = await supabase.from('reels').insert({
        user_id: user.id,
        video_url: publicUrl,
        caption: caption || null,
        title: title || null,
        description: description || null,
        duration,
      });

      if (reelError) throw reelError;

      toast({
        title: 'Success!',
        description: 'Your reel has been posted.',
      });

      navigate('/reels');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  const canCreate = true; // Allow all logged-in users to create reels

  console.log('User state in CreateReel page:', user);

  if (!user) {
    console.log('User is not logged in. Redirecting to login page.');
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to create reels</h2>
          <Button onClick={() => navigate('/login')} className="mt-6">Log In</Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <button onClick={() => navigate(-1)} className="p-2">
            <ArrowLeft className="h-6 w-6" />
          </button>
          <h1 className="text-lg font-semibold">New Reel</h1>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!video || isLoading}
          >
            {isLoading ? 'Posting...' : 'Share'}
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Video Upload */}
          <div>
            {videoPreview ? (
              <div className="relative aspect-[9/16] w-full max-w-xs mx-auto overflow-hidden rounded-lg bg-black">
                <video
                  ref={videoRef}
                  src={videoPreview}
                  className="h-full w-full object-contain"
                  controls
                  playsInline
                />
                <button
                  type="button"
                  onClick={removeVideo}
                  className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur"
                >
                  <X className="h-5 w-5" />
                </button>
                <div className="absolute bottom-2 left-2 bg-black/70 px-2 py-1 rounded text-xs text-white">
                  {duration}s / 60s max
                </div>
              </div>
            ) : (
              <div className="flex aspect-[9/16] w-full max-w-xs mx-auto flex-col gap-4 justify-center">
                <Card className="border-2 border-dashed hover:border-primary/50 transition-colors cursor-pointer">
                  <CardContent className="flex flex-col items-center justify-center p-8 text-center">
                    <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                      <Video className="h-8 w-8 text-primary" />
                    </div>
                    <h3 className="font-semibold text-lg mb-2">Create a video reel</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      Share short, engaging videos
                    </p>
                    <label className="cursor-pointer">
                      <div className="px-6 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors">
                        Choose Video
                      </div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleVideoChange}
                        className="hidden"
                      />
                    </label>
                  </CardContent>
                </Card>
                
                <Card className="bg-muted/50">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <span className="text-primary text-sm font-semibold">i</span>
                      </div>
                      <div className="space-y-1 text-sm">
                        <p className="font-medium">Reel tips</p>
                        <ul className="text-muted-foreground space-y-1">
                          <li>• Max 60 seconds</li>
                          <li>• Vertical format (9:16)</li>
                          <li>• Good lighting & audio</li>
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Caption */}
          <div className="space-y-2">
            <Label htmlFor="caption">Caption</Label>
            <Textarea
              id="caption"
              placeholder="Write a caption..."
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
            />
          </div>

          {/* Optional: Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground">Title (optional)</Label>
            <input
              id="title"
              type="text"
              placeholder="Add a title for your reel"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-input rounded-md bg-background"
            />
          </div>

          {/* Optional: Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-muted-foreground">Description (optional)</Label>
            <Textarea
              id="description"
              placeholder="Add more details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
        </form>
      </div>
    </MainLayout>
  );
};

export default CreateReel;
