// Test Push Notifications System
// Run this in browser console after logging in

console.log('🧪 Testing Push Notifications...\n');

async function testNotifications() {
  try {
    // Step 1: Check if service worker is registered
    console.log('1️⃣ Checking Service Worker...');
    const registrations = await navigator.serviceWorker.getRegistrations();
    if (registrations.length === 0) {
      console.error('❌ No service worker registered');
      return;
    }
    console.log('✅ Service worker registered:', registrations[0].scope);

    // Step 2: Check notification permission
    console.log('\n2️⃣ Checking Notification Permission...');
    console.log('Permission:', Notification.permission);
    if (Notification.permission !== 'granted') {
      console.warn('⚠️ Notification permission not granted. Requesting...');
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') {
        console.error('❌ Notification permission denied');
        return;
      }
    }
    console.log('✅ Notification permission granted');

    // Step 3: Check push subscription
    console.log('\n3️⃣ Checking Push Subscription...');
    const registration = registrations[0];
    let subscription = await registration.pushManager.getSubscription();
    
    if (!subscription) {
      console.warn('⚠️ No push subscription found. Creating...');
      
      // Use the VAPID key from env
      const vapidKey = 'BEl62iUYgUivxIkv69yViEuiBIa40HI0DLLgUiMwcr7fLCX1PW1fzJ7pj8Q1mHgQWW8x9M5wB7iF5Y5xL5cL5yc';
      
      function urlB64ToUint8Array(base64String) {
        const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
        const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
        const rawData = window.atob(base64);
        const outputArray = new Uint8Array(rawData.length);
        for (let i = 0; i < rawData.length; ++i) {
          outputArray[i] = rawData.charCodeAt(i);
        }
        return outputArray;
      }
      
      const applicationServerKey = urlB64ToUint8Array(vapidKey);
      
      subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: applicationServerKey,
      });
      
      console.log('✅ Push subscription created');
    } else {
      console.log('✅ Push subscription exists');
    }
    
    console.log('Subscription endpoint:', subscription.endpoint);

    // Step 4: Send test notification
    console.log('\n4️⃣ Sending Test Notification...');
    await registration.showNotification('🧪 Test Notification', {
      body: 'If you see this, push notifications are working!',
      icon: '/icon-192x192.png',
      badge: '/icon-72x72.png',
      tag: 'test',
      requireInteraction: false,
      vibrate: [200, 100, 200],
      data: {
        type: 'test',
        url: '/',
      },
      actions: [
        { action: 'open', title: 'View' },
        { action: 'close', title: 'Dismiss' },
      ],
    });
    console.log('✅ Test notification sent');

    // Step 5: Check database subscription
    console.log('\n5️⃣ Checking Database Subscription...');
    
    // Get user ID from localStorage
    const userId = localStorage.getItem('pi_supabase_user_id');
    if (!userId) {
      console.warn('⚠️ No user ID found in localStorage');
    } else {
      console.log('User ID:', userId);
      
      // Check if subscription is saved in database
      console.log('\nRun this SQL in Supabase to verify:');
      console.log(`SELECT * FROM push_subscriptions WHERE user_id = '${userId}';`);
    }

    // Step 6: Summary
    console.log('\n═══════════════════════════════════════');
    console.log('🎉 Push Notifications Test Complete!');
    console.log('═══════════════════════════════════════');
    console.log('\n📋 Test Results:');
    console.log('✅ Service Worker: Registered');
    console.log('✅ Permission: Granted');
    console.log('✅ Push Subscription: Active');
    console.log('✅ Test Notification: Sent');
    console.log('\n📝 Next Steps:');
    console.log('1. Check if you saw the test notification');
    console.log('2. Try the "Send Test Notification" button in Settings');
    console.log('3. Have another user like/comment on your post');
    console.log('4. You should receive a notification!');
    console.log('\n💡 To test database triggers:');
    console.log('Run this SQL in Supabase:');
    console.log(`SELECT public.queue_notification(
  '${userId}',
  'test',
  '🧪 Database Test',
  'This notification was created via database function',
  '{"test": true}'::jsonb
);`);
    console.log('\nThen check:');
    console.log(`SELECT * FROM notification_queue WHERE user_id = '${userId}' ORDER BY created_at DESC LIMIT 5;`);
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    console.log('\n🔍 Debugging tips:');
    console.log('- Ensure service worker is registered');
    console.log('- Check browser console for errors');
    console.log('- Verify VAPID keys are correct');
    console.log('- Make sure you\'re using HTTPS or localhost');
  }
}

testNotifications();
