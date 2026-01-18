/**
 * Pi Network & DropShare Integration Demo Component
 * Shows complete integration of Pi Auth, Payments, Ads, and DropShare API
 */

import React, { useState, useEffect } from 'react';
import { usePiIntegration } from '@/hooks/usePiIntegration';
import { useDropShareApi } from '@/hooks/useDropShareApi';

export function PiIntegrationDemo() {
  const pi = usePiIntegration();
  const dropshare = useDropShareApi();

  const [activeTab, setActiveTab] = useState<'auth' | 'payment' | 'ads' | 'dropshare'>('auth');
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [adLoading, setAdLoading] = useState(false);

  // Initialize Dropshare API on mount
  useEffect(() => {
    dropshare.getApiStatus();
  }, []);

  // ============ Pi Authentication ============
  const handleAuthenticate = async () => {
    const result = await pi.authenticate(['payments', 'username']);
    if (result) {
      console.log('User authenticated:', result.user);
    }
  };

  // ============ Pi Payments ============
  
  // New approach: Using handlePaymentFlow (RECOMMENDED)
  const handlePaymentWithHelper = async () => {
    setPaymentLoading(true);
    try {
      const { handlePaymentFlow } = pi;
      
      const result = await handlePaymentFlow(
        {
          amount: 1.5,
          memo: 'Premium Content Purchase',
          metadata: { 
            productId: 'premium-001', 
            orderId: `order-${Date.now()}`,
            timestamp: new Date().toISOString()
          }
        },
        {
          onApprovalSuccess: () => {
            console.log('✅ Payment approved by server');
            alert('Payment approved! Waiting for completion...');
          },
          onCompletionSuccess: () => {
            console.log('✅ Payment completed successfully');
            alert('✅ Payment successful! Premium access granted.');
            // Here you would:
            // 1. Unlock premium features
            // 2. Update user subscription status
            // 3. Start premium service
          },
          onError: (error) => {
            console.error('❌ Payment error:', error);
            alert(`Payment failed: ${error}`);
          }
        }
      );
      
      console.log('Payment result:', result);
    } catch (error) {
      console.error('Payment flow failed:', error);
      alert(`Payment failed: ${error instanceof Error ? error.message : String(error)}`);
    } finally {
      setPaymentLoading(false);
    }
  };

  // Original approach: Using createPayment with manual callbacks
  const handleCreatePayment = async () => {
    setPaymentLoading(true);
    try {
      const paymentData = {
        amount: 1.5,
        memo: 'Purchase item in DropShare',
        metadata: { productId: 'demo-product', orderId: 'demo-order-001' }
      };

      const callbacks = {
        onReadyForServerApproval: async (paymentId: string) => {
          console.log('Payment ready for approval:', paymentId);
          
          try {
            const result = await pi.approvePayment(
              paymentId,
              paymentData.amount,
              paymentData.memo
            );
            
            if (result.success) {
              console.log('✅ Payment approved:', result.payment);
            } else {
              console.error('❌ Approval failed:', result.error);
            }
          } catch (error) {
            console.error('Approval error:', error);
          }
        },

        onReadyForServerCompletion: async (paymentId: string, txid: string) => {
          console.log('Payment ready for completion:', { paymentId, txid });
          
          try {
            const result = await pi.completePayment(paymentId, txid);
            
            if (result.success) {
              console.log('✅ Payment completed:', result.payment);
              
              // Verify final status
              const verification = await pi.verifyPayment(paymentId);
              console.log('Payment verification:', verification);
            } else {
              console.error('❌ Completion failed:', result.error);
            }
          } catch (error) {
            console.error('Completion error:', error);
          }
        },

        onCancel: (paymentId: string) => {
          console.log('Payment cancelled:', paymentId);
          alert('Payment cancelled by user');
          setPaymentLoading(false);
        },

        onError: (error: any, payment?: any) => {
          console.error('Payment error:', error, payment);
          alert(`Payment error: ${error.message || String(error)}`);
          setPaymentLoading(false);
        }
      };

      await pi.createPayment(paymentData, callbacks);
      console.log('Payment initiated');
    } catch (error) {
      console.error('Payment creation error:', error);
      setPaymentLoading(false);
    }
  };

  // ============ Pi Ads ============
  const handleShowInterstitialAd = async () => {
    setAdLoading(true);
    try {
      const response = await pi.showAd('interstitial');
      console.log('Interstitial ad result:', response);
    } catch (error) {
      console.error('Ad error:', error);
    } finally {
      setAdLoading(false);
    }
  };

  const handleShowRewardedAd = async () => {
    setAdLoading(true);
    try {
      // Check if ad is ready
      const isReady = await pi.isAdReady('rewarded');
      
      if (!isReady.ready) {
        console.log('Requesting rewarded ad...');
        await pi.requestAd('rewarded');
      }

      const response = await pi.showAd('rewarded');
      
      if (response.result === 'AD_REWARDED') {
        console.log('User watched ad, verify on backend:', response.adId);
        
        // Verify with backend
        try {
          const verifyResponse = await fetch(
            `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pi-ads`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ adId: response.adId })
            }
          );
          
          const verifyData = await verifyResponse.json();
          if (verifyData.rewarded) {
            console.log('✅ User reward verified!');
            // Grant reward to user
          }
        } catch (error) {
          console.error('Verification error:', error);
        }
      }
    } catch (error) {
      console.error('Rewarded ad error:', error);
    } finally {
      setAdLoading(false);
    }
  };

  // ============ DropShare API ============
  const handleVerifyDropshare = async () => {
    const verified = await dropshare.verifyCredentials({
      apiKey: import.meta.env.VITE_DROPSHARE_API_KEY || '',
      validationKey: import.meta.env.VITE_DROPSHARE_VALIDATION_KEY || ''
    });
    console.log('DropShare verified:', verified);
  };

  const handleSignPayload = async () => {
    const payload = JSON.stringify({
      userId: pi.user?.uid,
      action: 'purchase',
      amount: 10,
      timestamp: new Date().toISOString()
    });

    const result = await dropshare.signPayload(payload);
    console.log('Signed payload:', result);
  };

  const handleLogTransaction = async () => {
    const transactionData = {
      userId: pi.user?.uid || 'anonymous',
      amount: 10.5,
      description: 'Demo purchase in DropShare',
      metadata: {
        source: 'pi-integration-demo',
        productId: 'demo-product',
        orderId: 'order-' + Date.now()
      }
    };

    try {
      const result = await dropshare.logTransaction(transactionData);
      console.log('Transaction logged:', result);
    } catch (error) {
      console.error('Transaction error:', error);
    }
  };

  // ============ Render ============
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Pi Network & DropShare Integration Demo</h1>

      {/* Status Overview */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-lg">
          <h3 className="font-semibold mb-2">Pi SDK Status</h3>
          <p className={pi.isInitialized ? 'text-green-600' : 'text-red-600'}>
            {pi.isInitialized ? '✅ Initialized' : '❌ Not Initialized'}
          </p>
          <p className={pi.isAuthenticated ? 'text-green-600' : 'text-gray-600'}>
            {pi.isAuthenticated ? '✅ Authenticated' : '⭕ Not Authenticated'}
          </p>
        </div>

        <div className="p-4 bg-green-50 rounded-lg">
          <h3 className="font-semibold mb-2">DropShare API Status</h3>
          <p className={dropshare.isVerified ? 'text-green-600' : 'text-yellow-600'}>
            {dropshare.isVerified ? '✅ Verified' : '⭕ Not Verified'}
          </p>
          <p className="text-sm text-gray-600">{dropshare.status}</p>
        </div>
      </div>

      {/* Error Display */}
      {(pi.error || dropshare.error) && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg mb-6">
          <h3 className="font-semibold text-red-800 mb-2">Errors</h3>
          {pi.error && <p className="text-red-600">Pi: {pi.error}</p>}
          {dropshare.error && <p className="text-red-600">DropShare: {dropshare.error}</p>}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        {(['auth', 'payment', 'ads', 'dropshare'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 font-semibold capitalize ${
              activeTab === tab
                ? 'border-b-2 border-blue-600 text-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Authentication Tab */}
        {activeTab === 'auth' && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Pi Authentication</h2>
            
            {pi.isAuthenticated && pi.user ? (
              <div className="space-y-3">
                <div className="p-3 bg-green-50 rounded">
                  <p className="font-semibold text-green-900">✅ Authenticated</p>
                  <p className="text-sm text-gray-600">User ID: {pi.user.uid}</p>
                  {pi.user.username && (
                    <p className="text-sm text-gray-600">Username: {pi.user.username}</p>
                  )}
                </div>
                <button
                  onClick={() => {
                    localStorage.clear();
                    window.location.reload();
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={handleAuthenticate}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Sign In with Pi
              </button>
            )}

            <div className="mt-4 p-3 bg-gray-50 rounded text-sm">
              <p className="font-semibold mb-2">Scopes Requested:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>payments - Required for payment functionality</li>
                <li>username - For personalization</li>
              </ul>
            </div>
          </div>
        )}

        {/* Payments Tab */}
        {activeTab === 'payment' && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Pi Payments (User-to-App)</h2>
            
            {!pi.isAuthenticated ? (
              <p className="text-yellow-700 bg-yellow-50 p-3 rounded">
                ⚠️ Please authenticate first to make payments
              </p>
            ) : (
              <div className="space-y-4">
                <div className="p-3 bg-blue-50 rounded">
                  <p className="font-semibold text-blue-900">Payment Details</p>
                  <p className="text-sm">Amount: 1.5 Pi</p>
                  <p className="text-sm">Description: Premium Content Purchase</p>
                </div>
                
                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 text-green-700">Recommended Approach</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Use handlePaymentFlow for automatic callback management:
                  </p>
                  <button
                    onClick={handlePaymentWithHelper}
                    disabled={paymentLoading}
                    className="w-full px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 font-semibold"
                  >
                    {paymentLoading ? 'Processing...' : '💳 Start Payment (Managed)'}
                  </button>
                </div>

                <div className="border-t pt-4">
                  <h3 className="font-semibold mb-3 text-blue-700">Advanced Approach</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Use createPayment with custom callbacks for more control:
                  </p>
                  <button
                    onClick={handleCreatePayment}
                    disabled={paymentLoading}
                    className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                  >
                    {paymentLoading ? 'Processing...' : '💳 Start Payment (Custom)'}
                  </button>
                </div>

                <div className="p-3 bg-gray-50 rounded text-sm">
                  <p className="font-semibold mb-2">Payment Flow:</p>
                  <ol className="list-decimal list-inside space-y-1 text-gray-700">
                    <li>User clicks payment button</li>
                    <li>Pi.createPayment() opens payment UI</li>
                    <li>onReadyForServerApproval → Backend approves payment</li>
                    <li>User confirms amount in Pi Wallet</li>
                    <li>onReadyForServerCompletion → Backend completes with txid</li>
                    <li>✅ Payment confirmed and access granted</li>
                  </ol>
                </div>

                <div className="p-3 bg-green-50 rounded text-sm border border-green-200">
                  <p className="font-semibold text-green-900 mb-2">💡 Tip:</p>
                  <p className="text-green-800">
                    Check browser console for detailed logs prefixed with [Payment Helper] or [Payment Flow]
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Ads Tab */}
        {activeTab === 'ads' && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">Pi AdNetwork</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleShowInterstitialAd}
                disabled={adLoading}
                className="w-full px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
              >
                {adLoading ? 'Loading...' : 'Show Interstitial Ad'}
              </button>

              <button
                onClick={handleShowRewardedAd}
                disabled={adLoading || !pi.isAuthenticated}
                className="w-full px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 disabled:opacity-50"
              >
                {adLoading ? 'Loading...' : 'Watch Rewarded Ad'}
              </button>

              {!pi.isAuthenticated && (
                <p className="text-yellow-700 bg-yellow-50 p-3 rounded">
                  ⚠️ Must be authenticated to watch rewarded ads
                </p>
              )}

              <div className="p-3 bg-gray-50 rounded text-sm space-y-2">
                <p className="font-semibold">Ad Types:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li><strong>Interstitial:</strong> Full-screen ads between actions</li>
                  <li><strong>Rewarded:</strong> Full-screen ads with user reward (verified on backend)</li>
                  <li><strong>Banner:</strong> Auto-managed overlay ads (not shown via SDK)</li>
                </ul>
                
                <p className="font-semibold mt-3">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>App must be approved for Ad Network monetization</li>
                  <li>Backend must verify rewarded ads before granting rewards</li>
                  <li>Check `mediator_ack_status === 'granted'` for rewards</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* DropShare API Tab */}
        {activeTab === 'dropshare' && (
          <div className="bg-white p-6 rounded-lg border">
            <h2 className="text-xl font-semibold mb-4">DropShare API Integration</h2>
            
            <div className="space-y-3">
              <button
                onClick={handleVerifyDropshare}
                className="w-full px-4 py-2 bg-teal-600 text-white rounded hover:bg-teal-700"
              >
                Verify Credentials
              </button>

              <button
                onClick={handleSignPayload}
                className="w-full px-4 py-2 bg-cyan-600 text-white rounded hover:bg-cyan-700"
              >
                Sign Payload
              </button>

              <button
                onClick={handleLogTransaction}
                className="w-full px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
              >
                Log Transaction
              </button>

              <div className="p-3 bg-gray-50 rounded text-sm space-y-2">
                <p className="font-semibold">Features:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Verify API credentials with DropShare</li>
                  <li>Sign payloads with HMAC-SHA256 validation key</li>
                  <li>Log and track transactions</li>
                  <li>Secure signing for sensitive operations</li>
                </ul>

                <p className="font-semibold mt-3">API Key Status:</p>
                <p className="text-sm">
                  {import.meta.env.VITE_DROPSHARE_API_KEY ? '✅ Configured' : '❌ Not configured'}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Console Output */}
      <div className="mt-8 p-4 bg-gray-900 text-gray-100 rounded font-mono text-sm max-h-64 overflow-y-auto">
        <p className="text-yellow-400">💡 Check browser console (F12) for detailed logs</p>
      </div>
    </div>
  );
}

export default PiIntegrationDemo;
