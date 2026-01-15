-- Add title and description columns to posts table for better post content support
ALTER TABLE public.posts ADD COLUMN title text;
ALTER TABLE public.posts ADD COLUMN description text;

-- Create indexes for searching
CREATE INDEX IF NOT EXISTS idx_posts_title ON public.posts(title);
CREATE INDEX IF NOT EXISTS idx_posts_description ON public.posts(description);

-- Add comments for clarity
COMMENT ON COLUMN public.posts.title IS 'Post title or headline';
COMMENT ON COLUMN public.posts.description IS 'Extended post description or story text';
