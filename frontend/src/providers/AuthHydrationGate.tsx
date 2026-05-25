import type { ReactNode } from "react";
import { useEffect, useState } from "react";

import { bootstrapAuthFromPersistedRefresh } from "@/lib/auth-session-bootstrap";
import { useAuthStore } from "@/stores/auth.store";

type AuthHydrationGateProps = {
  children: ReactNode;
};

/**
 * Wait for persist hydrate to finish, bootstrap refresh + /users/me, then render router.
 * Always open gate after all steps complete (even on error) to avoid stuck Loading.
 */
export function AuthHydrationGate({ children }: AuthHydrationGateProps) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    void (async () => {
      try {
        await Promise.resolve(useAuthStore.persist.rehydrate());
        await bootstrapAuthFromPersistedRefresh();
      } catch {
      } finally {
        setReady(true);
      }
    })();
  }, []);

  if (!ready) {
    return (
      <div className="flex h-svh items-center justify-center bg-background text-muted-foreground text-sm">
        Loading…
      </div>
    );
  }

  return children;
}
