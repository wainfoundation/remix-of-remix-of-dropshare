import React from 'react';
import { PostActions } from './PostActions';

export const TestReactions: React.FC = () => {
  // Mock data for testing
  const mockUserId = 'test-user-123';
  const mockPostId = 'test-post-456';

  return (
    <div style={{ 
      maxWidth: '600px', 
      margin: '20px auto', 
      padding: '20px', 
      border: '1px solid #e5e7eb',
      borderRadius: '12px',
      backgroundColor: 'white',
      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.1)'
    }}>
      <div style={{ marginBottom: '16px' }}>
        <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', fontWeight: '600' }}>
          Test Post for Facebook-Style Reactions
        </h3>
        <p style={{ margin: '0', color: '#6b7280', lineHeight: '1.5' }}>
          This is a sample post to test the long-press emoji reaction feature. 
          Try long-pressing (500ms) the React button to see the emoji picker, 
          or click it for quick access to the reaction selector.
        </p>
      </div>

      <div style={{ 
        padding: '12px', 
        backgroundColor: '#f9fafb', 
        borderRadius: '8px',
        marginBottom: '12px'
      }}>
        <p style={{ margin: '0', fontSize: '14px', color: '#4b5563' }}>
          <strong>Instructions:</strong><br/>
          • <strong>Long press</strong> the React button for 500ms to show emoji picker<br/>
          • <strong>Click</strong> the React button for quick access<br/>
          • Available reactions: 👍 ❤️ 😂 😮 😢 😠<br/>
          • Clicking the same reaction will remove it
        </p>
      </div>
      
      <PostActions
        postId={mockPostId}
        userId={mockUserId}
        onComment={() => alert('Comment feature clicked! (Navigate to comments here)')}
        onShare={() => alert('Share feature clicked! (Open share dialog here)')}
      />

      <div style={{ 
        marginTop: '16px', 
        padding: '12px', 
        backgroundColor: '#eff6ff', 
        borderRadius: '8px',
        fontSize: '12px',
        color: '#1e40af'
      }}>
        <strong>Note:</strong> This uses mock data. In production, connect to your authentication 
        system and real post data. The Supabase database table 'post_reactions' needs to be created.
      </div>
    </div>
  );
};