import { Navigate, Route, Routes } from "react-router-dom";
import { WorkOrderListPage } from "@/pages/work-order-list-page";
import { WorkOrderDetailsPage } from "@/pages/work-order-details-page";
import { CreateWorkOrderPage } from "@/pages/create-work-order-page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/work-orders" replace />} />
      <Route path="/work-orders" element={<WorkOrderListPage />} />
      <Route path="/work-orders/new" element={<CreateWorkOrderPage />} />
      <Route path="/work-orders/:id" element={<WorkOrderDetailsPage />} />
      <Route path="*" element={<Navigate to="/work-orders" replace />} />
    </Routes>
  );
}
