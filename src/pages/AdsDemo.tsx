import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import PiBannerAd from '@/components/PiBannerAd';
import PiInterstitialAd from '@/components/PiInterstitialAd';
import PiRewardedAd from '@/components/PiRewardedAd';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { usePiAdNetwork } from '@/hooks/use-pi-adnetwork';
import { ArrowLeft, AlertCircle } from 'lucide-react';

const AdsDemo = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isSupported, isLoading } = usePiAdNetwork();
  const [showInterstitial, setShowInterstitial] = useState(false);
  const [showRewarded, setShowRewarded] = useState(false);

  const handleReward = () => {
    toast({
      title: 'Reward Granted!',
      description: 'Ad reward verified! You earned 10 Pi.',
    });
  };

  return (
    <MainLayout>
      <div className="w-full max-w-2xl mx-auto py-6 px-4 space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <button
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            Back
          </button>
          <h1 className="text-3xl font-bold">Pi Ad Network Demo</h1>
          <p className="text-muted-foreground">
            Official Pi Network ad formats - Follow best practices
          </p>
        </div>

        {/* Support Status */}
        {isLoading ? (
          <div className="text-sm text-muted-foreground">Checking ad network support...</div>
        ) : !isSupported ? (
          <Card className="border-amber-200 bg-amber-50 dark:bg-amber-900/20 dark:border-amber-800">
            <CardContent className="flex gap-3 pt-6">
              <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-900 dark:text-amber-200">Ad Network Not Supported</p>
                <p className="text-sm text-amber-800 dark:text-amber-300 mt-1">
                  You're not in Pi Browser, or your Pi Browser is outdated. Open this in Pi Browser to test ads.
                </p>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Banner Ad Section */}
        <Card>
          <CardHeader>
            <CardTitle>Banner Ads</CardTitle>
            <CardDescription>
              Non-intrusive ads placed between content
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Banner ads appear between posts. Users can dismiss them. Not officially supported via Pi SDK yet - use custom implementation or Loading Banner Ads from Developer Portal.
            </p>
            <PiBannerAd />
          </CardContent>
        </Card>

        {/* Interstitial Ad Section */}
        <Card>
          <CardHeader>
            <CardTitle>Interstitial Ads</CardTitle>
            <CardDescription>
              Full-screen ads at natural break points (Pi.Ads.showAd("interstitial"))
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Shown at natural transitions like level completion or page navigation. Official Pi SDK implementation with full error handling.
            </p>
            <Button
              onClick={() => setShowInterstitial(true)}
              disabled={!isSupported || isLoading}
              className="w-full"
            >
              Show Interstitial Ad Example
            </Button>
          </CardContent>
        </Card>

        {/* Rewarded Ad Section */}
        <Card>
          <CardHeader>
            <CardTitle>Rewarded Ads</CardTitle>
            <CardDescription>
              User opt-in ads with verified rewards (Pi.Ads.showAd("rewarded"))
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Users watch ads to earn rewards. Backend MUST verify adId with Pi Platform API before granting rewards for security.
            </p>
            <Button
              onClick={() => setShowRewarded(true)}
              disabled={!isSupported || isLoading}
              variant="outline"
              className="w-full"
            >
              Show Rewarded Ad Example
            </Button>
          </CardContent>
        </Card>

        {/* Official Implementation */}
        <Card>
          <CardHeader>
            <CardTitle>Official Implementation</CardTitle>
            <CardDescription>Based on Pi Platform Docs</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="text-sm space-y-3">
              <div>
                <p className="font-semibold mb-1">Support Detection:</p>
                <code className="block bg-muted p-2 rounded text-xs break-words">
                  const nativeFeaturesList = await Pi.nativeFeaturesList();<br/>
                  const supported = nativeFeaturesList.includes("ad_network");
                </code>
              </div>
              <div>
                <p className="font-semibold mb-1">Interstitial Flow:</p>
                <code className="block bg-muted p-2 rounded text-xs break-words">
                  1. Pi.Ads.isAdReady("interstitial")<br/>
                  2. Pi.Ads.requestAd("interstitial") if not ready<br/>
                  3. Pi.Ads.showAd("interstitial")<br/>
                  4. Handle response result
                </code>
              </div>
              <div>
                <p className="font-semibold mb-1">Rewarded Flow (with Backend Verification):</p>
                <code className="block bg-muted p-2 rounded text-xs break-words">
                  1. Pi.Ads.showAd("rewarded") → get adId<br/>
                  2. Backend: POST api.pi.delivery/2/me/ads/&#123;adId&#125;<br/>
                  3. Check: mediator_ack_status === "granted"<br/>
                  4. Grant reward if verified
                </code>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Features */}
        <Card>
          <CardHeader>
            <CardTitle>Hook API</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-mono bg-muted px-2 py-1 rounded">usePiAdNetwork()</span>
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li><span className="font-mono">isSupported</span> - Ad network available</li>
                <li><span className="font-mono">showInterstitial()</span> - Advanced flow with error handling</li>
                <li><span className="font-mono">showRewarded(onReward?)</span> - Returns &#123; rewarded, adId &#125;</li>
                <li><span className="font-mono">isAdReady(type)</span> - Check if ad is ready</li>
                <li><span className="font-mono">requestAd(type)</span> - Manually load ad</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Documentation Link */}
        <Card>
          <CardContent className="pt-6">
            <p className="text-sm text-muted-foreground">
              📚 See official docs:{' '}
              <a
                href="https://github.com/pi-apps/pi-platform-docs/blob/master/ads.md"
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                Pi Ad Network Guide
              </a>
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <PiInterstitialAd
        isOpen={showInterstitial}
        onClose={() => setShowInterstitial(false)}
      />

      <PiRewardedAd
        isOpen={showRewarded}
        onClose={() => setShowRewarded(false)}
        onReward={handleReward}
        rewardLabel="10 Pi"
      />
    </MainLayout>
  );
};

export default AdsDemo;
