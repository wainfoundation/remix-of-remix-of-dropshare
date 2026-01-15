import { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { ArrowLeft, Search } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LoadingLogo } from '@/components/ui/loading-logo';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface SearchUser {
  id: string;
  user_id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  account_type: 'business' | 'shopper';
}

const NewMessage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, profile } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  // Shoppers can only message businesses
  const targetAccountType = profile?.account_type === 'shopper' ? 'business' : null;

  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    if (query.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    setLoading(true);

    let queryBuilder = supabase
      .from('profiles')
      .select('id, user_id, username, display_name, avatar_url, account_type')
      .neq('user_id', user?.id)
      .or(`username.ilike.%${query}%,display_name.ilike.%${query}%`)
      .limit(20);

    // If shopper, only show businesses
    if (targetAccountType) {
      queryBuilder = queryBuilder.eq('account_type', targetAccountType);
    }

    const { data } = await queryBuilder;
    setSearchResults((data as SearchUser[]) || []);
    setLoading(false);
  };

  const startConversation = async (targetUserId: string) => {
    if (!user) return;

    setCreating(true);

    // Check if conversation already exists
    const { data: existingParticipants } = await supabase
      .from('conversation_participants')
      .select('conversation_id')
      .eq('user_id', user.id);

    const myConversationIds = existingParticipants?.map(p => p.conversation_id) || [];

    if (myConversationIds.length > 0) {
      const { data: otherParticipants } = await supabase
        .from('conversation_participants')
        .select('conversation_id')
        .eq('user_id', targetUserId)
        .in('conversation_id', myConversationIds);

      if (otherParticipants && otherParticipants.length > 0) {
        // Conversation exists, navigate to it
        navigate(`/messages/${otherParticipants[0].conversation_id}`);
        return;
      }
    }

    // Create new conversation
    const { data: newConversation, error: convError } = await supabase
      .from('conversations')
      .insert({})
      .select()
      .single();

    if (convError || !newConversation) {
      console.error('Error creating conversation:', convError);
      setCreating(false);
      return;
    }

    // Add participants
    await supabase.from('conversation_participants').insert([
      { conversation_id: newConversation.id, user_id: user.id },
      { conversation_id: newConversation.id, user_id: targetUserId },
    ]);

    navigate(`/messages/${newConversation.id}`);
  };

  if (!user) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p>Please log in to send messages.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 flex h-14 items-center gap-3 border-b border-border bg-background/95 px-4 backdrop-blur">
        <Button variant="ghost" size="icon" onClick={() => navigate('/messages')}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h1 className="text-lg font-semibold">New Message</h1>
      </header>

      {/* Search */}
      <div className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={targetAccountType ? 'Search businesses...' : 'Search users...'}
            className="pl-10"
          />
        </div>
        {profile?.account_type === 'shopper' && (
          <p className="mt-2 text-xs text-muted-foreground">
            As a shopper, you can message business accounts
          </p>
        )}
      </div>

      {/* Results */}
      <div className="px-4">
        {loading ? (
          <div className="flex items-center justify-center py-8">
            <LoadingLogo size="sm" />
          </div>
        ) : searchResults.length > 0 ? (
          <div className="space-y-2">
            {searchResults.map((u) => (
              <button
                key={u.id}
                onClick={() => startConversation(u.user_id)}
                disabled={creating}
                className="flex w-full items-center gap-3 rounded-lg p-3 transition-colors hover:bg-secondary disabled:opacity-50"
              >
                <Avatar className="h-12 w-12">
                  <AvatarImage src={u.avatar_url || undefined} />
                  <AvatarFallback className="bg-secondary">
                    {u.display_name[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left">
                  <p className="font-semibold">{u.username}</p>
                  <p className="text-sm text-muted-foreground">{u.display_name}</p>
                </div>
                {u.account_type === 'business' && (
                  <span className="ml-auto text-xs bg-primary/10 text-primary px-2 py-1 rounded">
                    Business
                  </span>
                )}
              </button>
            ))}
          </div>
        ) : searchQuery.length >= 2 ? (
          <p className="text-center py-8 text-muted-foreground">No users found</p>
        ) : (
          <p className="text-center py-8 text-muted-foreground">
            Search for {targetAccountType === 'business' ? 'businesses' : 'users'} to message
          </p>
        )}
      </div>
    </div>
  );
};

export default NewMessage;
