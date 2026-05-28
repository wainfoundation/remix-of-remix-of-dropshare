import { useEffect, useState } from "react";
import { fetchA2uAdminDashboard } from "@/lib/piA2u";

export default function AdminTestnetProgress() {
  const [data, setData] = useState<any>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let t: ReturnType<typeof setInterval>;
    const load = () => fetchA2uAdminDashboard().then((r) => { setData(r.data); setErr(null); }).catch((e) => setErr(e.message));
    load();
    t = setInterval(load, 15000);
    return () => clearInterval(t);
  }, []);

  if (err) return <div className="p-6 text-destructive">{err}</div>;
  if (!data) return <div className="p-6">Loading…</div>;

  return (
    <div className="min-h-screen bg-background text-foreground p-6 space-y-6">
      <header>
        <h1 className="text-2xl font-bold">Testnet A2U Progress</h1>
        <p className="text-muted-foreground">{data.progress?.progress_label}</p>
      </header>

      <section className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Stat label="Unique wallets" value={`${data.unique_wallets_count} / ${data.progress?.target}`} />
        <Stat label="Successful A2U" value={data.total_successful_a2u} />
        <Stat label="Failed" value={(data.failed_transactions || []).length} />
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Wallets</h2>
        <ul className="text-xs space-y-1 break-all">
          {(data.progress?.wallets || []).map((w: any) => (
            <li key={w.wallet_address} className="border border-border rounded p-2">
              <div className="font-mono">{w.wallet_address}</div>
              <div className="text-muted-foreground">{w.username || w.uid} · txid {w.txid}</div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Transactions</h2>
        <div className="overflow-auto">
          <table className="w-full text-xs">
            <thead className="text-left text-muted-foreground">
              <tr><th>Status</th><th>UID</th><th>Amount</th><th>txid</th><th>Wallet</th><th>When</th></tr>
            </thead>
            <tbody>
              {(data.transactions || []).map((t: any) => (
                <tr key={t.id} className="border-t border-border">
                  <td>{t.status}</td>
                  <td className="font-mono">{t.uid}</td>
                  <td>{t.amount}</td>
                  <td className="font-mono break-all">{t.txid || "—"}</td>
                  <td className="font-mono break-all">{t.wallet_address || "—"}</td>
                  <td>{new Date(t.created_at).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-semibold mb-2">Recent diagnostic logs</h2>
        <ul className="text-xs space-y-1">
          {(data.logs || []).slice(0, 50).map((l: any, i: number) => (
            <li key={i} className="border border-border rounded p-2">
              <div><strong>[{l.level}]</strong> {l.message}</div>
              <div className="text-muted-foreground">{new Date(l.timestamp).toLocaleString()} · {l.username || l.uid}</div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: any }) {
  return (
    <div className="rounded-xl border border-border bg-card/50 p-4">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-2xl font-bold mt-1">{value}</div>
    </div>
  );
}
