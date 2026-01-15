import { useRef, useState } from 'react';
import { Image as ImageIcon, Video as VideoIcon } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { uploadFile, generateFilePath, validateFile } from '@/lib/storage';

interface FeedComposerProps {
  onPosted?: () => void;
}

const FeedComposer = ({ onPosted }: FeedComposerProps) => {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const [text, setText] = useState('');
  const [showOptionalFields, setShowOptionalFields] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const canPostText = !!user && text.trim().length > 0;

  const handlePostText = async () => {
    if (!canPostText) return;
    setSubmitting(true);
    try {
      const { error } = await supabase.from('posts').insert({
        user_id: user!.id,
        caption: text.trim(),
        post_type: 'text',
        character_count: text.trim().length,
      });
      if (error) throw error;
      setText('');
      setShowOptionalFields(false);
      toast({ title: 'Posted!', description: 'Your update is live.' });
      onPosted?.();
    } catch (e: any) {
      toast({ title: 'Failed to post', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const uploadMediaAndPost = async (file: File) => {
    if (!user) return;
    setSubmitting(true);
    try {
      // Validate file
      const validation = validateFile(file, {
        maxSizeMB: 100,
        allowedTypes: ['image/*', 'video/*']
      });
      
      if (!validation.valid) {
        throw new Error(validation.error || 'Invalid file');
      }
      
      const filePath = generateFilePath(user.id, file.name, 'posts');
      const { url: publicUrl, error: uploadError } = await uploadFile(file, filePath);
      
      if (uploadError || !publicUrl) {
        throw uploadError || new Error('Failed to upload file');
      }
      
      const isVideo = file.type.startsWith('video/');
      const { error: insertError } = await supabase.from('posts').insert({
        user_id: user.id,
        image_url: publicUrl,
        caption: text.trim() || null,
        post_type: isVideo ? 'video' : 'image',
        character_count: text.trim().length,
      });
      if (insertError) throw insertError;
      setText('');
      setShowOptionalFields(false);
      toast({ title: 'Posted!', description: isVideo ? 'Your video is live.' : 'Your photo is live.' });
      onPosted?.();
    } catch (e: any) {
      toast({ title: 'Upload failed', description: e.message, variant: 'destructive' });
    } finally {
      setSubmitting(false);
    }
  };

  const handlePickMedia = (accept: string) => {
    fileInputRef.current?.setAttribute('accept', accept);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await uploadMediaAndPost(file);
    // reset input so same file can be selected again later
    e.target.value = '';
  };

  return (
    <div className="border-b border-border bg-background px-4 py-3">
      <div className="flex gap-3">
        <Avatar className="h-10 w-10">
          <AvatarImage src={profile?.avatar_url || undefined} />
          <AvatarFallback>{profile?.display_name?.[0]?.toUpperCase()}</AvatarFallback>
        </Avatar>
        <div className="flex-1">
          <Textarea
            placeholder="What's on your mind?"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="min-h-[44px] resize-none"
          />
          {showOptionalFields && (
            <div className="mt-2 space-y-2">
              {/* Optional fields section can be expanded here when needed */}
            </div>
          )}
          <div className="mt-2 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handlePickMedia('image/*')}
                disabled={!user || submitting}
                className="gap-2"
              >
                <ImageIcon className="h-4 w-4" /> Photo
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handlePickMedia('video/*')}
                disabled={!user || submitting}
                className="gap-2"
              >
                <VideoIcon className="h-4 w-4" /> Video
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowOptionalFields(!showOptionalFields)}
                disabled={submitting}
                className="text-xs"
              >
                {showOptionalFields ? 'Hide' : '+ More'}
              </Button>
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} />
            </div>
            <Button onClick={handlePostText} disabled={!canPostText || submitting}>
              {submitting ? (<><LoadingLogo size="sm" className="mr-2" /> Posting</>) : 'Post'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedComposer;
