// Ambient type shims for Deno/Supabase Edge Functions to satisfy VS Code TypeScript
// These are editor-only hints; Deno will use real remote modules at runtime.

declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(
    handler: (req: Request) => Response | Promise<Response>
  ): void;
}

declare module "https://esm.sh/@supabase/supabase-js@2" {
  export function createClient<T = unknown>(
    url: string,
    key: string,
    options?: any
  ): any;
}

declare const Deno: {
  env: { get(name: string): string | undefined };
};
