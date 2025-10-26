# Test script to check if sync is working:

# 1. Check if user_content_preferences table exists and has data
echo 'Checking user_content_preferences table:'
psql -h [YOUR_DB_HOST] -p 5432 -U [YOUR_DB_USER] -d [YOUR_DB_NAME] -c 'SELECT COUNT(*) FROM public.user_content_preferences;'

# 2. Check if current user has any preferences  
echo 'Checking if user can query the table:'
echo "SELECT * FROM public.user_content_preferences WHERE user_id = auth.uid();" | psql -h [YOUR_DB_HOST] -p 5432 -U [YOUR_DB_USER] -d [YOUR_DB_NAME]

# Test through Supabase dashboard instead if you prefer
