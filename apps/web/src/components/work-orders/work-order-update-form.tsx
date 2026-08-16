import { useEffect, useState, type FormEvent } from "react";
import {
  workOrderPriorities,
  workOrderStatuses,
  type WorkOrderPriority,
  type WorkOrderStatus,
} from "@irruptive/shared";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useUpdateWorkOrder } from "@/hooks/use-update-work-order";
import { useUsers } from "@/hooks/use-users";

const unassignedValue = "unassigned";

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

interface WorkOrderUpdateFormProps {
  id: string;
  status: WorkOrderStatus;
  priority: WorkOrderPriority;
  assignedTo: string | null;
}

export function WorkOrderUpdateForm({
  id,
  status: savedStatus,
  priority: savedPriority,
  assignedTo: savedAssignedTo,
}: WorkOrderUpdateFormProps) {
  const updateWorkOrderMutation = useUpdateWorkOrder(id);
  const techniciansQuery = useUsers("technician");
  const [status, setStatus] = useState(savedStatus);
  const [priority, setPriority] = useState(savedPriority);
  const [assignedTo, setAssignedTo] = useState(savedAssignedTo);

  useEffect(() => {
    setStatus(savedStatus);
    setPriority(savedPriority);
    setAssignedTo(savedAssignedTo);
  }, [savedAssignedTo, savedPriority, savedStatus]);

  const hasChanges =
    status !== savedStatus ||
    priority !== savedPriority ||
    assignedTo !== savedAssignedTo;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasChanges || updateWorkOrderMutation.isPending) {
      return;
    }

    updateWorkOrderMutation.mutate({
      ...(status !== savedStatus ? { status } : {}),
      ...(priority !== savedPriority ? { priority } : {}),
      ...(assignedTo !== savedAssignedTo ? { assignedTo } : {}),
    });
  }

  function handleStatusChange(value: WorkOrderStatus | null) {
    if (value !== null) {
      updateWorkOrderMutation.reset();
      setStatus(value);
    }
  }

  function handlePriorityChange(value: WorkOrderPriority | null) {
    if (value !== null) {
      updateWorkOrderMutation.reset();
      setPriority(value);
    }
  }

  function handleAssigneeChange(value: string | null) {
    if (value !== null) {
      updateWorkOrderMutation.reset();
      setAssignedTo(value === unassignedValue ? null : value);
    }
  }

  return (
    <section className="rounded-lg border p-5" aria-labelledby="update-heading">
      <h2 id="update-heading" className="text-xl font-semibold">
        Update work order
      </h2>

      <form className="mt-4 flex flex-col gap-4" onSubmit={handleSubmit}>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="work-order-status">
              Status
            </label>
            <Select value={status} onValueChange={handleStatusChange}>
              <SelectTrigger id="work-order-status" className="w-full">
                <SelectValue>{statusLabels[status]}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {workOrderStatuses.map((value) => (
                  <SelectItem key={value} value={value}>
                    {statusLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor="work-order-priority"
            >
              Priority
            </label>
            <Select value={priority} onValueChange={handlePriorityChange}>
              <SelectTrigger id="work-order-priority" className="w-full">
                <SelectValue>{priorityLabels[priority]}</SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                {workOrderPriorities.map((value) => (
                  <SelectItem key={value} value={value}>
                    {priorityLabels[value]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-2">
            <label
              className="text-sm font-medium"
              htmlFor="work-order-assignee"
            >
              Assignee
            </label>
            <Select
              value={assignedTo ?? unassignedValue}
              onValueChange={handleAssigneeChange}
              disabled={techniciansQuery.isPending || techniciansQuery.isError}
            >
              <SelectTrigger id="work-order-assignee" className="w-full">
                <SelectValue>
                  {assignedTo === null
                    ? "Unassigned"
                    : (techniciansQuery.data?.data.find(
                        (technician) => technician.id === assignedTo,
                      )?.name ?? "Assigned user")}
                </SelectValue>
              </SelectTrigger>
              <SelectContent align="start">
                <SelectItem value={unassignedValue}>Unassigned</SelectItem>
                {techniciansQuery.data?.data.map((technician) => (
                  <SelectItem key={technician.id} value={technician.id}>
                    {technician.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {techniciansQuery.isError ? (
              <p className="text-sm text-destructive" role="alert">
                Unable to load technicians.
              </p>
            ) : null}
          </div>
        </div>

        {updateWorkOrderMutation.isError ? (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
            role="alert"
          >
            <p className="font-medium">Could not update work order</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {updateWorkOrderMutation.error instanceof Error
                ? updateWorkOrderMutation.error.message
                : "An unexpected error occurred."}
            </p>
          </div>
        ) : null}

        {updateWorkOrderMutation.isSuccess ? (
          <p className="text-sm text-muted-foreground" aria-live="polite">
            Work order updated.
          </p>
        ) : null}

        <div className="flex justify-end border-t pt-4">
          <Button
            type="submit"
            disabled={!hasChanges || updateWorkOrderMutation.isPending}
          >
            {updateWorkOrderMutation.isPending ? "Saving…" : "Save changes"}
          </Button>
        </div>
      </form>
    </section>
  );
}
