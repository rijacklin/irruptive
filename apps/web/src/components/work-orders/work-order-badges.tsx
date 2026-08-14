import type { WorkOrderPriority, WorkOrderStatus } from "@irruptive/shared";
import { Badge } from "@/components/ui/badge";

const statusLabels: Record<WorkOrderStatus, string> = {
  open: "Open",
  assigned: "Assigned",
  in_progress: "In progress",
  blocked: "Blocked",
  resolved: "Resolved",
  closed: "Closed",
};

const priorityLabels: Record<WorkOrderPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

export function WorkOrderStatusBadge({ status }: { status: WorkOrderStatus }) {
  const variant =
    status === "blocked"
      ? "destructive"
      : status === "resolved" || status === "closed"
        ? "outline"
        : status === "in_progress"
          ? "default"
          : "secondary";

  return <Badge variant={variant}>{statusLabels[status]}</Badge>;
}

export function WorkOrderPriorityBadge({
  priority,
}: {
  priority: WorkOrderPriority;
}) {
  const variant =
    priority === "critical"
      ? "destructive"
      : priority === "high"
        ? "default"
        : priority === "medium"
          ? "secondary"
          : "outline";

  return <Badge variant={variant}>{priorityLabels[priority]}</Badge>;
}
