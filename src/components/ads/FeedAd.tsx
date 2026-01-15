import { useEffect, useState } from 'react';
import { ExternalLink, MoreHorizontal } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface Ad {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  destination_url: string | null;
  destination_type: string;
}

interface FeedAdProps {
  ad?: Ad;
}

const FeedAd = ({ ad: propAd }: FeedAdProps) => {
  const { user } = useAuth();
  const [ad, setAd] = useState<Ad | null>(propAd || null);
  const [loading, setLoading] = useState(!propAd);

  useEffect(() => {
    if (!propAd) {
      fetchRandomAd();
    }
  }, [propAd]);

  const fetchRandomAd = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('id, title, description, image_url, destination_url, destination_type')
        .eq('status', 'active')
        .eq('ad_type', 'feed')
        .limit(10);

      if (error) throw error;

      if (data && data.length > 0) {
        // Pick a random ad
        const randomAd = data[Math.floor(Math.random() * data.length)];
        setAd(randomAd);
        
        // Track impression
        trackImpression(randomAd.id);
      }
    } catch (error) {
      console.error('Error fetching ad:', error);
    } finally {
      setLoading(false);
    }
  };

  const trackImpression = async (adId: string) => {
    try {
      await supabase.from('ad_interactions').insert({
        ad_id: adId,
        user_id: user?.id || null,
        interaction_type: 'impression',
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const handleClick = async () => {
    if (!ad) return;

    try {
      // Track click
      await supabase.from('ad_interactions').insert({
        ad_id: ad.id,
        user_id: user?.id || null,
        interaction_type: 'click',
      });

      // Open destination
      if (ad.destination_url) {
        window.open(ad.destination_url, '_blank');
      }
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  if (loading || !ad) {
    return null;
  }

  return (
    <Card className="overflow-hidden border-primary/20 bg-gradient-to-b from-primary/5 to-transparent">
      <CardContent className="p-0">
        {/* Ad Header */}
        <div className="flex items-center justify-between p-3">
          <div className="flex items-center gap-2">
            <Avatar className="h-8 w-8">
              <AvatarImage src="/placeholder.svg" />
              <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium">{ad.title}</p>
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                Sponsored
              </Badge>
            </div>
          </div>
          <button className="p-1 hover:bg-muted rounded-full">
            <MoreHorizontal className="h-5 w-5 text-muted-foreground" />
          </button>
        </div>

        {/* Ad Image */}
        {ad.image_url && (
          <button onClick={handleClick} className="w-full">
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full aspect-video object-cover"
            />
          </button>
        )}

        {/* Ad Content */}
        <div className="p-3 space-y-2">
          {ad.description && (
            <p className="text-sm text-muted-foreground line-clamp-2">{ad.description}</p>
          )}
          
          {ad.destination_url && (
            <button
              onClick={handleClick}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 bg-primary text-primary-foreground rounded-lg text-sm font-medium hover:bg-primary/90 transition-colors"
            >
              Learn More
              <ExternalLink className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default FeedAd;