import type { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { authClient } from "@/lib/auth-client";

export function RequireSession({ children }: { children: ReactNode }) {
  const session = authClient.useSession();
  const location = useLocation();

  if (session.isPending) {
    return (
      <main className="mx-auto w-full max-w-5xl px-4 py-8" aria-live="polite">
        Loading session…
      </main>
    );
  }

  if (!session.data) {
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );
  }

  return children;
}
