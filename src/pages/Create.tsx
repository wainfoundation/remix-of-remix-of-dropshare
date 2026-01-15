import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Image as ImageIcon, X, Plus, Video, ChevronLeft, ChevronRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';
import PostTypeSelector, { PostType } from '@/components/create/PostTypeSelector';

interface MediaItem {
  file: File;
  preview: string;
  type: 'image' | 'video';
}

const MAX_TWEET_CHARS = 280;

const Create = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { toast } = useToast();
  
  const [postType, setPostType] = useState<PostType>('image');
  const [mediaItems, setMediaItems] = useState<MediaItem[]>([]);
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  const [caption, setCaption] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [productName, setProductName] = useState('');
  const [price, setPrice] = useState('');
  const [externalLink, setExternalLink] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const isBusiness = profile?.account_type === 'business';
  const isCreator = profile?.account_type === 'creator';
  const canCreate = isBusiness || isCreator;

  const handleMediaChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const newItems: MediaItem[] = [];
    
    Array.from(files).forEach(file => {
      if (mediaItems.length + newItems.length >= 10) return;
      
      const isVideo = file.type.startsWith('video/');
      
      // For reel type, only allow videos
      if (postType === 'reel' && !isVideo) return;
      // For video type, only allow videos
      if (postType === 'video' && !isVideo) return;
      // For image type, only allow images
      if (postType === 'image' && isVideo) return;
      
      newItems.push({
        file,
        preview: URL.createObjectURL(file),
        type: isVideo ? 'video' : 'image',
      });
    });

    setMediaItems([...mediaItems, ...newItems]);
  };

  const removeMedia = (index: number) => {
    const newItems = [...mediaItems];
    URL.revokeObjectURL(newItems[index].preview);
    newItems.splice(index, 1);
    setMediaItems(newItems);
    if (currentMediaIndex >= newItems.length && newItems.length > 0) {
      setCurrentMediaIndex(newItems.length - 1);
    }
  };

  const handlePostTypeChange = (type: PostType) => {
    setPostType(type);
    // Clear media when switching types (except between image/video which are compatible)
    if (type === 'text') {
      mediaItems.forEach(item => URL.revokeObjectURL(item.preview));
      setMediaItems([]);
    }
    // Clear caption for tweet-style if over limit
    if (type === 'reel' && caption.length > MAX_TWEET_CHARS) {
      setCaption(caption.substring(0, MAX_TWEET_CHARS));
    }
  };

  const canSubmit = () => {
    if (postType === 'text') {
      return caption.trim().length > 0;
    }
    if (postType === 'reel') {
      return caption.trim().length > 0 && caption.length <= MAX_TWEET_CHARS;
    }
    return mediaItems.length > 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !canSubmit()) {
      toast({
        title: 'Error',
        description: postType === 'text' || postType === 'reel' 
          ? 'Please enter some text' 
          : 'Please select at least one image or video',
        variant: 'destructive',
      });
      return;
    }

    setIsLoading(true);

    try {
      let imageUrl: string | null = null;

      // Upload first media as main image (if any)
      if (mediaItems.length > 0) {
        const firstMedia = mediaItems[0];
        
        // Validate file
        const validation = validateFile(firstMedia.file, {
          maxSizeMB: 100,
          allowedTypes: ['image/*', 'video/*']
        });
        
        if (!validation.valid) {
          throw new Error(validation.error || 'Invalid file');
        }
        
        const filePath = generateFilePath(user.id, firstMedia.file.name, 'posts');
        const { url, error: uploadError } = await uploadFile(firstMedia.file, filePath);

        if (uploadError || !url) {
          throw uploadError || new Error('Failed to upload file');
        }
        
        imageUrl = url;
      }

      // Create post
      const postData: any = {
        user_id: user.id,
        image_url: imageUrl,
        caption: caption || null,
        title: title || null,
        description: description || null,
        post_type: postType,
        character_count: caption.length,
      };

      // Only add product fields for business accounts
      if (isBusiness) {
        postData.product_name = productName || null;
        postData.price = price ? parseFloat(price) : null;
        postData.external_link = externalLink || null;
      }

      const { data: post, error: postError } = await supabase
        .from('posts')
        .insert(postData)
        .select()
        .single();

      if (postError) throw postError;

      // Upload additional media
      if (mediaItems && mediaItems.length > 1) {
        const mediaCount = mediaItems.length;
        for (let i = 1; i < mediaCount; i++) {
          const media = mediaItems[i];
          if (!media) continue;
          
          const filePath = generateFilePath(user.id, media.file.name, 'posts');
          const { url: mediaUrl, error: mediaUploadError } = await uploadFile(media.file, filePath);

          if (mediaUploadError || !mediaUrl) continue;

          await supabase.from('post_media').insert({
            post_id: post.id,
            media_url: mediaUrl,
            media_type: media.type,
            order_index: i,
          });
        }
      }

      toast({
        title: 'Success!',
        description: 'Your post has been created.',
      });

      navigate('/');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message,
        variant: 'destructive',
      });
    }

    setIsLoading(false);
  };

  console.log('User state in Create page:', user);

  if (!user) {
    console.log('User is not logged in. Redirecting to login page.');
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to create posts</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be logged in to create posts.
          </p>
          <Button onClick={() => navigate('/login')} className="mt-6">
            Log In
          </Button>
        </div>
      </MainLayout>
    );
  }

  if (!canCreate) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Creator or Business Account Required</h2>
          <p className="mt-2 text-muted-foreground">
            Only creator and business accounts can create posts.
          </p>
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
          <h1 className="text-lg font-semibold">New Post</h1>
          <Button
            size="sm"
            onClick={handleSubmit}
            disabled={!canSubmit() || isLoading}
          >
            {isLoading ? 'Posting...' : 'Share'}
          </Button>
        </header>

        <form onSubmit={handleSubmit} className="p-4 space-y-6">
          {/* Post Type Selector */}
          <div className="space-y-2">
            <Label>Post Type</Label>
            <PostTypeSelector selected={postType} onSelect={handlePostTypeChange} />
          </div>

          {/* Media Upload - Only for image/video types */}
          {(postType === 'image' || postType === 'video') && (
            <div>
              {mediaItems.length > 0 ? (
                <div className="relative aspect-square w-full overflow-hidden rounded-lg bg-secondary">
                  {mediaItems[currentMediaIndex].type === 'video' ? (
                    <video
                      src={mediaItems[currentMediaIndex].preview}
                      className="h-full w-full object-cover"
                      controls
                      playsInline
                    />
                  ) : (
                    <img
                      src={mediaItems[currentMediaIndex].preview}
                      alt="Preview"
                      className="h-full w-full object-cover"
                    />
                  )}
                  
                  {/* Remove button */}
                  <button
                    type="button"
                    onClick={() => removeMedia(currentMediaIndex)}
                    className="absolute right-2 top-2 rounded-full bg-background/80 p-1.5 backdrop-blur"
                  >
                    <X className="h-5 w-5" />
                  </button>

                  {/* Navigation arrows */}
                  {mediaItems.length > 1 && (
                    <>
                      {currentMediaIndex > 0 && (
                        <button
                          type="button"
                          onClick={() => setCurrentMediaIndex(currentMediaIndex - 1)}
                          className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 backdrop-blur"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                      )}
                      {currentMediaIndex < mediaItems.length - 1 && (
                        <button
                          type="button"
                          onClick={() => setCurrentMediaIndex(currentMediaIndex + 1)}
                          className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 backdrop-blur"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      )}
                    </>
                  )}

                  {/* Dots indicator */}
                  {mediaItems.length > 1 && (
                    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1">
                      {mediaItems.map((_, idx) => (
                        <div
                          key={idx}
                          className={`h-1.5 w-1.5 rounded-full transition-colors ${
                            idx === currentMediaIndex ? 'bg-white' : 'bg-white/50'
                          }`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Add more button */}
                  {mediaItems.length < 10 && (
                    <label className="absolute bottom-3 right-3 cursor-pointer rounded-full bg-background/80 p-2 backdrop-blur">
                      <Plus className="h-5 w-5" />
                      <input
                        type="file"
                        accept={postType === 'video' ? 'video/*' : 'image/*'}
                        multiple
                        onChange={handleMediaChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              ) : (
                <label className="flex aspect-square w-full cursor-pointer flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border bg-secondary/50 transition-colors hover:bg-secondary">
                  <div className="flex gap-4">
                    {postType === 'image' ? (
                      <ImageIcon className="h-12 w-12 text-muted-foreground" />
                    ) : (
                      <Video className="h-12 w-12 text-muted-foreground" />
                    )}
                  </div>
                  <span className="text-sm text-muted-foreground text-center px-4">
                    {postType === 'image' ? 'Upload images (up to 10)' : 'Upload videos (up to 10)'}
                  </span>
                  <input
                    type="file"
                    accept={postType === 'video' ? 'video/*' : 'image/*'}
                    multiple
                    onChange={handleMediaChange}
                    className="hidden"
                  />
                </label>
              )}

              {/* Media count */}
              {mediaItems.length > 0 && (
                <p className="mt-2 text-sm text-muted-foreground text-center">
                  {mediaItems.length}/10 files selected
                </p>
              )}
            </div>
          )}

          {/* Product Details - Only for Business */}
          {isBusiness && postType !== 'text' && postType !== 'reel' && (
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="productName">Product Name</Label>
                <Input
                  id="productName"
                  placeholder="e.g., Summer Collection Dress"
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price">Price (USD)</Label>
                <Input
                  id="price"
                  type="number"
                  step="0.01"
                  min="0"
                  placeholder="e.g., 49.99"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="externalLink">Product Link</Label>
                <Input
                  id="externalLink"
                  type="url"
                  placeholder="https://yourstore.com/product"
                  value={externalLink}
                  onChange={(e) => setExternalLink(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Caption / Text Content */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="caption">
                {postType === 'text' || postType === 'reel' ? 'Content' : 'Caption'}
              </Label>
              {postType === 'reel' && (
                <span className={`text-xs ${caption.length > MAX_TWEET_CHARS ? 'text-destructive' : 'text-muted-foreground'}`}>
                  {caption.length}/{MAX_TWEET_CHARS}
                </span>
              )}
            </div>
            <Textarea
              id="caption"
              placeholder={
                postType === 'text' 
                  ? "What's on your mind?" 
                  : postType === 'reel'
                    ? "Share a quick thought..."
                    : "Write a caption..."
              }
              value={caption}
              onChange={(e) => {
                if (postType === 'reel' && e.target.value.length > MAX_TWEET_CHARS) {
                  return;
                }
                setCaption(e.target.value);
              }}
              rows={postType === 'text' ? 6 : postType === 'reel' ? 3 : 4}
              className={postType === 'reel' ? 'resize-none' : ''}
            />
          </div>

          {/* Optional: Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="text-muted-foreground">Title (optional)</Label>
            <Input
              id="title"
              placeholder="Add a title for your post"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
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

export default Create;