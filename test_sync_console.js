// Console test commands to debug sync issues
// Copy and paste these into your browser's console (F12) when signed in

console.log('=== SCREENSCAPE SYNC DEBUG ===');

// 1. Check if Supabase is connected
console.log('Checking Supabase connection...');
supabase.from('user_settings').select('count', { count: 'exact', head: true }).then(r => {
  console.log('Supabase connected:', r.error ? 'ERROR: ' + r.error.message : 'SUCCESS');
});

// 2. Check current user
window.currentUser = supabase.auth.getUser();
window.currentUser.then(r => {
  console.log('Current user:', r.data.user?.id || 'No user');
});

// 3. Test table access with current user
console.log('Testing table access...');
window.currentUser.then(({data}) => {
  if (!data.user) return console.log('No user to test with');

  const userId = data.user.id;

  // Test user_settings
  supabase.from('user_settings').select('*').eq('id', userId).then(r =>
    console.log('user_settings access:', r.error ? 'ERROR: ' + r.error.message : 'SUCCESS', r.data)
  );

  // Test user_content_preferences
  supabase.from('user_content_preferences').select('*').eq('user_id', userId).then(r =>
    console.log('user_content_preferences access:', r.error ? 'ERROR: ' + r.error.message : 'SUCCESS', r.data)
  );

  // Test watchlist
  supabase.from('user_watchlist').select('*').eq('user_id', userId).then(r =>
    console.log('user_watchlist access:', r.error ? 'ERROR: ' + r.error.message : 'SUCCESS', r.data)
  );

  // Test search history
  supabase.from('user_search_history').select('*').eq('user_id', userId).then(r =>
    console.log('user_search_history access:', r.error ? 'ERROR: ' + r.error.message : 'SUCCESS', r.data)
  );
});

// 4. Test manual sync
window.testSync = () => {
  console.log('Testing manual sync...');
  // Get the auth context and trigger sync
  // This will work if you're signed in
  console.log('Look for "Starting data sync" messages in auth context logs');
};

console.log('=== Run these functions after signing in: ===');
// Instructions:
console.log('1. Sign in to ScreenScape');
console.log('2. Open browser console (F12)');
console.log('3. Wait a moment for sync logs');
console.log('4. Check for any ERROR messages');
console.log('5. Try: window.testSync() to trigger manual sync test');
