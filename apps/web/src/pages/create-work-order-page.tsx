import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { workOrderPriorities, type WorkOrderPriority } from "@irruptive/shared";

import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useCreateWorkOrder } from "@/hooks/use-create-work-order";

const priorityLabels: Record<WorkOrderPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  critical: "Critical",
};

const uuidPattern =
  "[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[1-8][0-9a-fA-F]{3}-[89abAB][0-9a-fA-F]{3}-[0-9a-fA-F]{12}";

export function CreateWorkOrderPage() {
  const navigate = useNavigate();
  const createWorkOrderMutation = useCreateWorkOrder();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<WorkOrderPriority>("medium");
  const [category, setCategory] = useState("");
  const [createdBy, setCreatedBy] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (createWorkOrderMutation.isPending) {
      return;
    }

    const normalizedCategory = category.trim();

    createWorkOrderMutation.mutate(
      {
        title: title.trim(),
        description: description.trim(),
        priority,
        createdBy: createdBy.trim(),
        ...(normalizedCategory === "" ? {} : { category: normalizedCategory }),
      },
      {
        onSuccess: ({ data }) => {
          void navigate(`/work-orders/${data.id}`);
        },
      },
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-4">
        <Link
          to="/work-orders"
          className="w-fit text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back to work orders
        </Link>

        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
            Work order
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Create work order
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Report an operational issue for review and assignment.
          </p>
        </div>
      </header>

      <form
        className="flex flex-col gap-6 rounded-lg border p-5"
        onSubmit={handleSubmit}
      >
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="title">
            Title
          </label>
          <Input
            id="title"
            name="title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            minLength={3}
            maxLength={200}
            required
            autoFocus
            aria-describedby="title-help"
            placeholder="Conveyor intermittently stopping"
          />
          <p id="title-help" className="text-xs text-muted-foreground">
            Use a concise description between 3 and 200 characters.
          </p>
        </div>

        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium" htmlFor="description">
            Description
          </label>
          <Textarea
            id="description"
            name="description"
            value={description}
            onChange={(event) => setDescription(event.target.value)}
            minLength={10}
            required
            aria-describedby="description-help"
            placeholder="Describe what happened, when it occurs, and any symptoms observed."
          />
          <p id="description-help" className="text-xs text-muted-foreground">
            Include enough operational detail for a technician to investigate.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2">
          <div className="flex flex-col gap-2">
            <label className="text-sm font-medium" htmlFor="priority">
              Priority
            </label>
            <Select
              value={priority}
              onValueChange={(value) => {
                if (value !== null) {
                  setPriority(value);
                }
              }}
            >
              <SelectTrigger id="priority" className="w-full">
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
            <label className="text-sm font-medium" htmlFor="category">
              Category <span className="text-muted-foreground">(optional)</span>
            </label>
            <Input
              id="category"
              name="category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              placeholder="Mechanical"
            />
          </div>
        </div>

        <div className="flex flex-col gap-2 rounded-md border border-dashed p-4">
          <label className="text-sm font-medium" htmlFor="created-by">
            Creator user ID
          </label>
          <Input
            id="created-by"
            name="createdBy"
            value={createdBy}
            onChange={(event) => setCreatedBy(event.target.value)}
            pattern={uuidPattern}
            required
            autoComplete="off"
            aria-describedby="created-by-help"
            placeholder="00000000-0000-4000-8000-000000000000"
          />
          <p id="created-by-help" className="text-xs text-muted-foreground">
            Temporary development field. Authentication will provide this value
            automatically in Phase 4; enter the UUID of an existing user for
            now.
          </p>
        </div>

        {createWorkOrderMutation.isError ? (
          <div
            className="rounded-md border border-destructive/30 bg-destructive/5 p-3"
            role="alert"
          >
            <p className="font-medium">Could not create work order</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {createWorkOrderMutation.error instanceof Error
                ? createWorkOrderMutation.error.message
                : "An unexpected error occurred."}
            </p>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-2 border-t pt-4">
          <Link
            to="/work-orders"
            className={buttonVariants({ variant: "outline" })}
          >
            Cancel
          </Link>
          <Button type="submit" disabled={createWorkOrderMutation.isPending}>
            {createWorkOrderMutation.isPending
              ? "Creating…"
              : "Create work order"}
          </Button>
        </div>
      </form>
    </main>
  );
}
