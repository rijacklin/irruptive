import type {
  WorkOrderActivityEventType,
  WorkOrderActivityItemResponse,
} from "@irruptive/shared";
import { Button } from "@/components/ui/button";
import { useWorkOrderActivity } from "@/hooks/use-work-order-activity";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

const eventLabels: Record<WorkOrderActivityEventType, string> = {
  work_order_created: "Work order created",
  status_changed: "Status changed",
  priority_changed: "Priority changed",
  category_changed: "Category changed",
  assignment_changed: "Assignee changed",
};

function formatValue(value: unknown): string {
  if (value === null || value === undefined || value === "") {
    return "None";
  }

  return typeof value === "string" ? value.replaceAll("_", " ") : String(value);
}

function describeEvent(
  item: Extract<WorkOrderActivityItemResponse, { kind: "event" }>,
) {
  const previous = item.eventData.previous;
  const current = item.eventData.current;

  if (previous === undefined && current === undefined) {
    return eventLabels[item.eventType];
  }

  return `${eventLabels[item.eventType]} from ${formatValue(previous)} to ${formatValue(current)}`;
}

interface WorkOrderActivityTimelineProps {
  workOrderId: string;
}

export function WorkOrderActivityTimeline({
  workOrderId,
}: WorkOrderActivityTimelineProps) {
  const activityQuery = useWorkOrderActivity(workOrderId);

  return (
    <section
      className="rounded-lg border p-5"
      aria-labelledby="activity-heading"
    >
      <h2 id="activity-heading" className="text-xl font-semibold">
        Activity
      </h2>

      {activityQuery.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          Loading activity…
        </p>
      ) : activityQuery.isError ? (
        <div className="mt-4" role="alert">
          <p className="text-sm font-medium text-destructive">
            Could not load activity
          </p>
          <Button
            className="mt-3"
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void activityQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : activityQuery.data.data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No activity yet.</p>
      ) : (
        <ol className="mt-5 border-l pl-5">
          {activityQuery.data.data.map((item) => (
            <li
              key={`${item.kind}-${item.id}`}
              className="relative pb-5 last:pb-0"
            >
              <span
                className="absolute top-1.5 -left-[1.55rem] size-2 rounded-full bg-foreground"
                aria-hidden="true"
              />
              <p className="font-medium">
                {item.kind === "event" ? describeEvent(item) : "Comment added"}
              </p>
              {item.kind === "comment" ? (
                <>
                  <p className="mt-1 whitespace-pre-wrap leading-6">
                    {item.body}
                  </p>
                  <p className="mt-1 break-all text-xs text-muted-foreground">
                    By {item.userId}
                  </p>
                </>
              ) : null}
              <time
                className="mt-1 block text-xs text-muted-foreground"
                dateTime={item.createdAt}
              >
                {dateFormatter.format(new Date(item.createdAt))}
              </time>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
