-- Create user_settings table for syncable preferences
CREATE TABLE IF NOT EXISTS public.user_settings (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  tmdb_api_key TEXT,
  theme_preferences JSONB DEFAULT '{}',
  streaming_preferences JSONB DEFAULT '[]',
  voice_preferences JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create user_content_preferences table for likes/dislikes
CREATE TABLE IF NOT EXISTS public.user_content_preferences (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id INTEGER NOT NULL,
  media_type TEXT NOT NULL CHECK (media_type IN ('movie', 'tv')),
  preference TEXT NOT NULL CHECK (preference IN ('like', 'dislike')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE(user_id, media_id, media_type)
);

-- Create user_watchlist table for cross-device sync
CREATE TABLE IF NOT EXISTS public.user_watchlist (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  media_id TEXT NOT NULL,
  media_type TEXT NOT NULL, -- 'movie', 'tv'
  media_data JSONB,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE(user_id, media_id, media_type)
);

-- Create user_search_history table for syncable search history
CREATE TABLE IF NOT EXISTS public.user_search_history (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  searched_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id)
);

-- Create user_game_progress table for game state sync
CREATE TABLE IF NOT EXISTS public.user_game_progress (
  id UUID DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  game_type TEXT NOT NULL,
  game_data JSONB DEFAULT '{}',
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  PRIMARY KEY (id),
  UNIQUE(user_id, game_type)
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_content_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_watchlist ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_game_progress ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for user_settings
CREATE POLICY "Users can view own settings" ON public.user_settings
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own settings" ON public.user_settings
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own settings" ON public.user_settings
  FOR UPDATE USING (auth.uid() = id);

-- Create RLS policies for user_content_preferences
CREATE POLICY "Users can view own content preferences" ON public.user_content_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own content preferences" ON public.user_content_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own content preferences" ON public.user_content_preferences
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own content preferences" ON public.user_content_preferences
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_watchlist
CREATE POLICY "Users can view own watchlist" ON public.user_watchlist
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own watchlist items" ON public.user_watchlist
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own watchlist items" ON public.user_watchlist
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own watchlist items" ON public.user_watchlist
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_search_history
CREATE POLICY "Users can view own search history" ON public.user_search_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own search history" ON public.user_search_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own search history" ON public.user_search_history
  FOR DELETE USING (auth.uid() = user_id);

-- Create RLS policies for user_game_progress
CREATE POLICY "Users can view own game progress" ON public.user_game_progress
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own game progress" ON public.user_game_progress
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own game progress" ON public.user_game_progress
  FOR UPDATE USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_user_content_preferences_user_id ON public.user_content_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_content_preferences_media ON public.user_content_preferences(media_id, media_type);
CREATE INDEX IF NOT EXISTS idx_user_watchlist_user_id ON public.user_watchlist(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON public.user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_searched_at ON public.user_search_history(searched_at);
CREATE INDEX IF NOT EXISTS idx_user_game_progress_user_id ON public.user_game_progress(user_id);

-- Create function to handle user settings creation on signup
CREATE OR REPLACE FUNCTION public.handle_new_user_settings()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_settings (id)
  VALUES (NEW.id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to create user settings on signup
DROP TRIGGER IF EXISTS on_auth_user_created_settings ON auth.users;
CREATE TRIGGER on_auth_user_created_settings
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_settings();
