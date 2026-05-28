import { supabase } from "@/integrations/supabase/client";

export type WalletProgress = {
  unique_wallets: number;
  target: number;
  progress_label: string;
  completed: boolean;
};

async function invoke<T>(body: Record<string, unknown>): Promise<T> {
  const { data, error } = await supabase.functions.invoke("pi-a2u", { body });
  if (error) {
    let msg = error.message || "Request failed";
    const ctx: any = (error as any).context;
    try { if (ctx && typeof ctx.json === "function") { const j = await ctx.json(); if (j?.error) msg = j.error; } } catch { /* ignore */ }
    throw new Error(msg);
  }
  if ((data as any)?.error) throw new Error((data as any).error);
  return data as T;
}

export async function verifyPiAuth(accessToken: string) {
  return invoke<{ success: boolean; data: { uid: string; username: string } }>({ action: "auth_verify", accessToken });
}

export async function fetchWalletProgress(): Promise<WalletProgress> {
  const r = await invoke<{ success: boolean; data: WalletProgress }>({ action: "progress" });
  return r.data;
}

export async function claimTestnetPi(accessToken: string, amount = 0.01, memo = "Testnet reward") {
  return invoke<{
    success: boolean;
    data: { payment_id: string; txid: string; wallet_address: string; amount: number; memo: string; progress: WalletProgress; wallet_added: boolean };
  }>({ action: "claim", accessToken, amount, memo });
}

export async function fetchA2uAdminDashboard() {
  return invoke<{ success: boolean; data: any }>({ action: "admin_dashboard" });
}
