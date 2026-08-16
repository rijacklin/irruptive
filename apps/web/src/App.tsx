import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ThemeSelector } from "@/components/theme-selector";
import { WorkOrderListPage } from "@/pages/work-order-list-page";
import { WorkOrderDetailsPage } from "@/pages/work-order-details-page";
import { CreateWorkOrderPage } from "@/pages/create-work-order-page";
import { LoginPage } from "@/pages/login-page";
import { RequireSession } from "@/components/require-session";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export function App() {
  const session = authClient.useSession();

  async function signOut() {
    await authClient.signOut();
    window.location.assign("/login");
  }

  return (
    <div className="min-h-screen">
      <header className="border-b bg-background">
        <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link
            to="/work-orders"
            className="text-lg font-semibold tracking-tight"
          >
            Irruptive
          </Link>
          <div className="flex items-center gap-3">
            {session.data ? (
              <>
                <span className="hidden text-sm text-muted-foreground sm:inline">
                  {session.data.user.name}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={signOut}
                >
                  Sign out
                </Button>
              </>
            ) : null}
            <ThemeSelector />
          </div>
        </div>
      </header>

      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<Navigate to="/work-orders" replace />} />
        <Route
          path="/work-orders"
          element={
            <RequireSession>
              <WorkOrderListPage />
            </RequireSession>
          }
        />
        <Route
          path="/work-orders/new"
          element={
            <RequireSession>
              <CreateWorkOrderPage />
            </RequireSession>
          }
        />
        <Route
          path="/work-orders/:id"
          element={
            <RequireSession>
              <WorkOrderDetailsPage />
            </RequireSession>
          }
        />
        <Route path="*" element={<Navigate to="/work-orders" replace />} />
      </Routes>
    </div>
  );
}
