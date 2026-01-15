import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { PenSquare } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { formatDistanceToNow } from 'date-fns';

interface Conversation {
  id: string;
  updated_at: string;
  other_user: {
    username: string;
    display_name: string;
    avatar_url: string | null;
  };
  last_message: {
    content: string;
    created_at: string;
  } | null;
}

const Messages = () => {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchConversations();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchConversations = async () => {
    if (!user) return;

    setLoading(true);

    // Get conversations the user is part of
    const { data: participantsData, error } = await supabase
      .from('conversation_participants')
      .select(`
        conversation_id,
        conversations!inner (
          id,
          updated_at
        )
      `)
      .eq('user_id', user.id)
      .order('conversations(updated_at)', { ascending: false });

    if (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
      return;
    }

    const conversationIds = participantsData?.map((p: any) => p.conversation_id) || [];

    if (conversationIds.length === 0) {
      setConversations([]);
      setLoading(false);
      return;
    }

    // Get other participants and last messages
    const conversationsWithDetails = await Promise.all(
      conversationIds.map(async (convId: string) => {
        // Get other participant
        const { data: otherParticipant } = await supabase
          .from('conversation_participants')
          .select(`
            profiles!inner (
              username,
              display_name,
              avatar_url
            )
          `)
          .eq('conversation_id', convId)
          .neq('user_id', user.id)
          .maybeSingle();

        // Get last message
        const { data: lastMessage } = await supabase
          .from('messages')
          .select('content, created_at')
          .eq('conversation_id', convId)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data: convData } = await supabase
          .from('conversations')
          .select('updated_at')
          .eq('id', convId)
          .single();

        return {
          id: convId,
          updated_at: convData?.updated_at || '',
          other_user: otherParticipant?.profiles as any || {
            username: 'Unknown',
            display_name: 'Unknown User',
            avatar_url: null,
          },
          last_message: lastMessage,
        };
      })
    );

    setConversations(conversationsWithDetails.sort((a, b) => 
      new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
    ));
    setLoading(false);
  };

  if (!user) {
    return (
      <MainLayout>
        <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
          <h2 className="text-xl font-semibold">Sign in to view messages</h2>
          <p className="mt-2 text-muted-foreground">
            You need to be logged in to access your messages.
          </p>
          <Button onClick={() => navigate('/login')} className="mt-6">
            Log In
          </Button>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="mx-auto max-w-lg">
        {/* Header */}
        <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-border bg-background px-4">
          <h1 className="text-lg font-semibold">{profile?.username}</h1>
          <Button variant="ghost" size="icon" onClick={() => navigate('/messages/new')}>
            <PenSquare className="h-6 w-6" />
          </Button>
        </header>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <LoadingLogo size="md" />
          </div>
        ) : conversations.length > 0 ? (
          <div className="divide-y divide-border">
            {conversations.map((conv) => (
              <Link
                key={conv.id}
                to={`/messages/${conv.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-secondary"
              >
                <Avatar className="h-14 w-14">
                  <AvatarImage src={conv.other_user.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary">
                    {conv.other_user.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="font-semibold truncate">{conv.other_user.username}</p>
                    {conv.last_message && (
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(conv.last_message.created_at), { addSuffix: false })}
                      </span>
                    )}
                  </div>
                  {conv.last_message && (
                    <p className="text-sm text-muted-foreground truncate">
                      {conv.last_message.content}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h2 className="text-xl font-semibold">No messages yet</h2>
            <p className="mt-2 text-muted-foreground">
              Start a conversation by visiting a business profile.
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default Messages;
