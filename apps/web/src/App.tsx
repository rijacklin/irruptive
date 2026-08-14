import { Navigate, Route, Routes } from "react-router-dom";
import { WorkOrderListPage } from "@/pages/work-order-list-page";

export function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/work-orders" replace />} />
      <Route path="/work-orders" element={<WorkOrderListPage />} />
      <Route path="*" element={<Navigate to="/work-orders" replace />} />
    </Routes>
  );
}
