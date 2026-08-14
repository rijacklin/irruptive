import type { WorkOrderResponse } from "@irruptive/shared";

import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from "@/components/work-orders/work-order-badges";

interface WorkOrderTableProps {
  workOrders: WorkOrderResponse[];
  isLoading: boolean;
}

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export function WorkOrderTable({ workOrders, isLoading }: WorkOrderTableProps) {
  return (
    <div className="overflow-hidden rounded-lg border">
      <Table>
        <TableCaption className="sr-only">Work orders</TableCaption>

        <TableHeader>
          <TableRow>
            <TableHead>Title</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Priority</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Assignee</TableHead>
            <TableHead>Created</TableHead>
          </TableRow>
        </TableHeader>

        <TableBody>
          {isLoading ? (
            Array.from({ length: 5 }, (_, index) => (
              <TableRow key={index}>
                {Array.from({ length: 6 }, (_, cellIndex) => (
                  <TableCell key={cellIndex}>
                    <Skeleton className="h-5 w-full max-w-32" />
                  </TableCell>
                ))}
              </TableRow>
            ))
          ) : workOrders.length === 0 ? (
            <TableRow>
              <TableCell
                colSpan={6}
                className="h-32 text-center text-muted-foreground"
              >
                No work orders found.
              </TableCell>
            </TableRow>
          ) : (
            workOrders.map((workOrder) => (
              <TableRow key={workOrder.id}>
                <TableCell className="max-w-80">
                  <span className="block truncate font-medium">
                    {workOrder.title}
                  </span>
                </TableCell>

                <TableCell>
                  <WorkOrderStatusBadge status={workOrder.status} />
                </TableCell>

                <TableCell>
                  <WorkOrderPriorityBadge priority={workOrder.priority} />
                </TableCell>

                <TableCell>{workOrder.category ?? "Uncategorized"}</TableCell>
                <TableCell>{workOrder.assignedTo ?? "Unassigned"}</TableCell>
                <TableCell>
                  {dateFormatter.format(new Date(workOrder.createdAt))}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}
