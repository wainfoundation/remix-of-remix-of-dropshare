import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface AlgorithmWeights {
  engagement: number;
  recency: number;
  quality: number;
  relevance: number;
  userPreference: number;
}

interface ContentItem {
  id: string;
  type: 'post' | 'reel' | 'story';
  user_id: string;
  created_at: string;
  likes_count?: number;
  comments_count?: number;
  shares_count?: number;
  views_count?: number;
  algorithm_score?: number;
  trending_score?: number;
  quality_score?: number;
}

interface UserInteraction {
  user_id: string;
  content_type: string;
  content_id: string;
  interaction_type: 'view' | 'like' | 'comment' | 'share' | 'save' | 'follow';
  interaction_duration?: number;
}

export class FeedAlgorithm {
  private readonly defaultWeights: AlgorithmWeights = {
    engagement: 0.35,
    recency: 0.25,
    quality: 0.20,
    relevance: 0.15,
    userPreference: 0.05
  };

  // Track user interaction for algorithm learning (stores in localStorage for now)
  async trackInteraction(interaction: UserInteraction) {
    try {
      // Store interactions locally until database table is created
      const stored = localStorage.getItem('user_interactions') || '[]';
      const interactions = JSON.parse(stored);
      interactions.push({
        ...interaction,
        created_at: new Date().toISOString()
      });
      // Keep only last 100 interactions
      if (interactions.length > 100) {
        interactions.shift();
      }
      localStorage.setItem('user_interactions', JSON.stringify(interactions));
    } catch (error) {
      console.error('Error tracking interaction:', error);
    }
  }

  // Calculate engagement score (likes, comments, shares)
  private calculateEngagementScore(content: ContentItem): number {
    const likes = content.likes_count || 0;
    const comments = content.comments_count || 0;
    const shares = content.shares_count || 0;
    const views = content.views_count || 1;

    // Weighted engagement: comments worth more than likes, shares worth most
    const engagementRate = (likes * 1 + comments * 2 + shares * 3) / views;
    return Math.min(engagementRate * 100, 100); // Cap at 100
  }

  // Calculate recency score (how recent the content is)
  private calculateRecencyScore(content: ContentItem): number {
    const now = new Date();
    const createdAt = new Date(content.created_at);
    const hoursAge = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);

    // Score decreases with age, but not linearly
    if (hoursAge < 1) return 100;
    if (hoursAge < 6) return 90;
    if (hoursAge < 24) return 70;
    if (hoursAge < 72) return 50;
    if (hoursAge < 168) return 30; // 1 week
    return 10;
  }

  // Calculate quality score based on various factors
  private calculateQualityScore(content: ContentItem): number {
    if (content.quality_score) return content.quality_score;

    let score = 50; // Base score

    // Boost score for content with good engagement ratio
    const engagementScore = this.calculateEngagementScore(content);
    if (engagementScore > 50) score += 20;
    if (engagementScore > 80) score += 20;

    return Math.min(score, 100);
  }

  // Calculate relevance score based on user preferences and interactions
  private async calculateRelevanceScore(content: ContentItem, userId: string): Promise<number> {
    try {
      // Get user's interaction history from localStorage
      const stored = localStorage.getItem('user_interactions') || '[]';
      const interactions = JSON.parse(stored).filter((i: any) => i.user_id === userId);

      if (interactions.length === 0) return 50; // Default score

      let relevanceScore = 50;

      // Check content type preference
      const typeInteractions = interactions.filter((i: any) => i.content_type === content.type);
      const typePreference = typeInteractions.length / interactions.length;
      relevanceScore += typePreference * 25;

      return Math.min(relevanceScore, 100);
    } catch (error) {
      console.error('Error calculating relevance score:', error);
      return 50;
    }
  }

  // Calculate user preference score
  private async calculateUserPreferenceScore(content: ContentItem, userId: string): Promise<number> {
    // Use localStorage preferences
    try {
      const prefs = localStorage.getItem('user_preferences');
      if (!prefs) return 50;
      return 50; // Placeholder implementation
    } catch (error) {
      console.error('Error calculating user preference score:', error);
      return 50;
    }
  }

  // Main algorithm to score content for a user
  async scoreContent(content: ContentItem[], userId: string, customWeights?: Partial<AlgorithmWeights>): Promise<ContentItem[]> {
    const weights = { ...this.defaultWeights, ...customWeights };

    const scoredContent = await Promise.all(
      content.map(async (item) => {
        const engagementScore = this.calculateEngagementScore(item);
        const recencyScore = this.calculateRecencyScore(item);
        const qualityScore = this.calculateQualityScore(item);
        const relevanceScore = await this.calculateRelevanceScore(item, userId);
        const userPrefScore = await this.calculateUserPreferenceScore(item, userId);

        const finalScore = 
          (engagementScore * weights.engagement) +
          (recencyScore * weights.recency) +
          (qualityScore * weights.quality) +
          (relevanceScore * weights.relevance) +
          (userPrefScore * weights.userPreference);

        return {
          ...item,
          algorithm_score: Math.round(finalScore * 100) / 100
        };
      })
    );

    // Sort by algorithm score (highest first)
    return scoredContent.sort((a, b) => (b.algorithm_score || 0) - (a.algorithm_score || 0));
  }

  // Update trending scores for hashtags (stores locally)
  async updateTrendingHashtags() {
    try {
      // Get hashtags from recent posts (last 24 hours)
      const twentyFourHoursAgo = new Date();
      twentyFourHoursAgo.setHours(twentyFourHoursAgo.getHours() - 24);

      const { data: recentPosts } = await supabase
        .from('posts')
        .select('caption, created_at')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      if (!recentPosts) return;

      // Extract hashtags and count occurrences
      const hashtagCounts: { [key: string]: { count: number, posts: string[] } } = {};

      recentPosts.forEach(post => {
        if (post.caption) {
          const hashtags = post.caption.match(/#\w+/g) || [];
          hashtags.forEach(tag => {
            const cleanTag = tag.toLowerCase();
            if (!hashtagCounts[cleanTag]) {
              hashtagCounts[cleanTag] = { count: 0, posts: [] };
            }
            hashtagCounts[cleanTag].count++;
            hashtagCounts[cleanTag].posts.push(post.caption || '');
          });
        }
      });

      // Store hashtag trends locally
      localStorage.setItem('hashtag_trends', JSON.stringify(hashtagCounts));
    } catch (error) {
      console.error('Error updating trending hashtags:', error);
    }
  }

  // Get trending content
  async getTrendingContent(limit: number = 20): Promise<ContentItem[]> {
    try {
      // Get posts with high engagement from last 48 hours
      const fortyEightHoursAgo = new Date();
      fortyEightHoursAgo.setHours(fortyEightHoursAgo.getHours() - 48);

      const { data: trendingPosts } = await supabase
        .from('posts')
        .select(`
          *,
          profiles:user_id(username, display_name, avatar_url),
          likes:likes(count),
          comments:comments(count),
          shares:shares(count)
        `)
        .gte('created_at', fortyEightHoursAgo.toISOString())
        .order('created_at', { ascending: false })
        .limit(limit);

      if (!trendingPosts) return [];

      // Transform to ContentItem format
      return trendingPosts.map(post => ({
        id: post.id,
        type: 'post' as const,
        user_id: post.user_id,
        created_at: post.created_at,
        likes_count: post.likes?.length || 0,
        comments_count: post.comments?.length || 0,
        shares_count: post.shares?.length || 0,
      }));
    } catch (error) {
      console.error('Error getting trending content:', error);
      return [];
    }
  }
}

// Hook for using the algorithm
export function useFeedAlgorithm() {
  const [algorithm] = useState(() => new FeedAlgorithm());

  const trackInteraction = async (interaction: UserInteraction) => {
    await algorithm.trackInteraction(interaction);
  };

  const getPersonalizedFeed = async (userId: string, rawContent: ContentItem[]) => {
    return await algorithm.scoreContent(rawContent, userId);
  };

  const getTrendingContent = async (limit?: number) => {
    return await algorithm.getTrendingContent(limit);
  };

  const updateTrending = async () => {
    await algorithm.updateTrendingHashtags();
  };

  return {
    trackInteraction,
    getPersonalizedFeed,
    getTrendingContent,
    updateTrending
  };
}
