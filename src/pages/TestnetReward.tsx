import { useEffect, useState } from "react";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authenticateWithPi, isPiAuthenticated } from "@/integrations/pi/auth";
import { initPiSdk } from "@/integrations/pi/init";
import { claimTestnetPi, fetchWalletProgress, type WalletProgress } from "@/lib/piA2u";

export default function TestnetReward() {
  const [progress, setProgress] = useState<WalletProgress | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [accessToken, setAccessToken] = useState<string | null>(
    () => localStorage.getItem("pi_access_token")
  );
  const [lastTxid, setLastTxid] = useState<string | null>(null);

  useEffect(() => {
    initPiSdk({ version: "2.0", sandbox: false }).catch(() => {});
    fetchWalletProgress().then(setProgress).catch(() => {});
  }, []);

  const signIn = async () => {
    try {
      const res = await authenticateWithPi(["username", "payments", "wallet_address"]);
      if (res?.accessToken) {
        localStorage.setItem("pi_access_token", res.accessToken);
        setAccessToken(res.accessToken);
        toast.success(`Signed in as ${res.user?.username || "Pioneer"}`);
      }
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Pi sign-in failed");
    }
  };

  const handleClaim = async () => {
    let token = accessToken;
    if (!token) {
      await signIn();
      token = localStorage.getItem("pi_access_token");
      if (!token) return;
    }
    setClaiming(true);
    try {
      const r = await claimTestnetPi(token, 0.01, "Testnet reward");
      setLastTxid(r.data.txid);
      setProgress(r.data.progress);
      toast.success(`Sent ${r.data.amount} Test Pi!`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Claim failed";
      toast.error(msg);
      try { setProgress(await fetchWalletProgress()); } catch { /* ignore */ }
    } finally {
      setClaiming(false);
    }
  };

  const inPiBrowser =
    typeof navigator !== "undefined" && (/PiBrowser/i.test(navigator.userAgent) || !!(window as any).Pi);

  return (
    <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card/50 backdrop-blur-xl p-8 shadow-xl">
        <h1 className="text-2xl font-bold mb-2">Claim Test Pi</h1>
        <p className="text-sm text-muted-foreground mb-6">
          Help us reach 10 unique wallets so this app can be promoted to Mainnet.
        </p>

        {!inPiBrowser && (
          <div className="mb-4 rounded-lg border border-border p-3 text-sm text-muted-foreground">
            Open this page in the <strong>Pi Browser</strong> to claim.
          </div>
        )}

        {progress && (
          <p className="text-sm font-medium mb-4">{progress.progress_label}</p>
        )}

        {!accessToken ? (
          <Button onClick={signIn} className="w-full h-11 rounded-xl">
            Sign in with Pi
          </Button>
        ) : (
          <Button onClick={handleClaim} disabled={claiming} className="w-full h-11 rounded-xl">
            {claiming ? (
              <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Sending Test Pi…</>
            ) : (
              <><Gift className="mr-2 h-4 w-4" /> Claim Test Pi</>
            )}
          </Button>
        )}

        {lastTxid && (
          <p className="mt-4 text-xs break-all text-muted-foreground">
            Success — txid: {lastTxid}
          </p>
        )}

        <a href="/admin/testnet-progress" className="block mt-6 text-center text-xs underline text-muted-foreground">
          View admin progress
        </a>
      </div>
    </div>
  );
}
