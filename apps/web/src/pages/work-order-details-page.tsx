import { Link, useParams } from "react-router-dom";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  WorkOrderPriorityBadge,
  WorkOrderStatusBadge,
} from "@/components/work-orders/work-order-badges";
import { WorkOrderUpdateForm } from "@/components/work-orders/work-order-update-form";
import { WorkOrderComments } from "@/components/work-orders/work-order-comments";
import { WorkOrderActivityTimeline } from "@/components/work-orders/work-order-activity-timeline";
import { useWorkOrder } from "@/hooks/use-work-order";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

export function WorkOrderDetailsPage() {
  const { id = "" } = useParams();
  const workOrderQuery = useWorkOrder(id);
  const workOrder = workOrderQuery.data?.data;

  if (workOrderQuery.isPending) {
    return (
      <main
        className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8"
        aria-busy="true"
        aria-label="Loading work order"
      >
        <Skeleton className="h-5 w-28" />
        <Skeleton className="h-9 w-3/4" />
        <Skeleton className="h-48 w-full" />
      </main>
    );
  }

  if (workOrderQuery.isError || workOrder === undefined) {
    return (
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
        <div
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          role="alert"
        >
          <div>
            <h1 className="text-xl font-semibold">Could not load work order</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {workOrderQuery.error instanceof Error
                ? workOrderQuery.error.message
                : "The requested work order is unavailable."}
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => void workOrderQuery.refetch()}
            >
              Try again
            </Button>
            <Link
              to="/work-orders"
              className={buttonVariants({ variant: "outline", size: "sm" })}
            >
              Back to work orders
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4">
        <Link
          to="/work-orders"
          className="w-fit text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to work orders
        </Link>

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Work order
            </p>
            <h1 className="mt-1 text-3xl font-semibold tracking-tight">
              {workOrder.title}
            </h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <WorkOrderStatusBadge status={workOrder.status} />
            <WorkOrderPriorityBadge priority={workOrder.priority} />
          </div>
        </div>
      </header>

      <WorkOrderUpdateForm
        id={workOrder.id}
        status={workOrder.status}
        priority={workOrder.priority}
      />

      <section
        className="rounded-lg border p-5"
        aria-labelledby="description-heading"
      >
        <h2 id="description-heading" className="text-xl font-semibold">
          Description
        </h2>
        <p className="mt-3 whitespace-pre-wrap text-base leading-7">
          {workOrder.description}
        </p>
      </section>

      <section
        className="rounded-lg border p-5"
        aria-labelledby="details-heading"
      >
        <h2 id="details-heading" className="text-xl font-semibold">
          Details
        </h2>

        <dl className="mt-4 grid gap-4 text-base sm:grid-cols-2">
          <div>
            <dt className="text-muted-foreground">Category</dt>
            <dd className="mt-1 font-medium">
              {workOrder.category ?? "Uncategorized"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Assignee</dt>
            <dd className="mt-1 font-medium">
              {workOrder.assignedTo ?? "Unassigned"}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created by</dt>
            <dd className="mt-1 break-all font-medium">
              {workOrder.createdBy}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Created</dt>
            <dd className="mt-1 font-medium">
              {dateFormatter.format(new Date(workOrder.createdAt))}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="mt-1 font-medium">
              {dateFormatter.format(new Date(workOrder.updatedAt))}
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">ID</dt>
            <dd className="mt-1 break-all font-mono text-xs">{workOrder.id}</dd>
          </div>
        </dl>
      </section>

      <WorkOrderActivityTimeline workOrderId={workOrder.id} />

      <WorkOrderComments workOrderId={workOrder.id} />
    </main>
  );
}
