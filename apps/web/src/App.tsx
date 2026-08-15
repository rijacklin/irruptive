import { Link, Navigate, Route, Routes } from "react-router-dom";
import { ThemeSelector } from "@/components/theme-selector";
import { WorkOrderListPage } from "@/pages/work-order-list-page";
import { WorkOrderDetailsPage } from "@/pages/work-order-details-page";
import { CreateWorkOrderPage } from "@/pages/create-work-order-page";

export function App() {
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
          <ThemeSelector />
        </div>
      </header>

      <Routes>
        <Route path="/" element={<Navigate to="/work-orders" replace />} />
        <Route path="/work-orders" element={<WorkOrderListPage />} />
        <Route path="/work-orders/new" element={<CreateWorkOrderPage />} />
        <Route path="/work-orders/:id" element={<WorkOrderDetailsPage />} />
        <Route path="*" element={<Navigate to="/work-orders" replace />} />
      </Routes>
    </div>
  );
}
