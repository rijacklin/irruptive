import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useComments } from "@/hooks/use-comments";
import { useCreateComment } from "@/hooks/use-create-comment";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

interface WorkOrderCommentsProps {
  workOrderId: string;
}

export function WorkOrderComments({ workOrderId }: WorkOrderCommentsProps) {
  const commentsQuery = useComments(workOrderId);
  const createComment = useCreateComment(workOrderId);
  const [userId, setUserId] = useState("");
  const [body, setBody] = useState("");

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    createComment.mutate(
      { userId: userId.trim(), body: body.trim() },
      { onSuccess: () => setBody("") },
    );
  }

  const canSubmit =
    userId.trim().length > 0 &&
    body.trim().length > 0 &&
    !createComment.isPending;

  return (
    <section
      className="rounded-lg border p-5"
      aria-labelledby="comments-heading"
    >
      <h2 id="comments-heading" className="text-xl font-semibold">
        Comments
      </h2>

      {commentsQuery.isPending ? (
        <p className="mt-4 text-sm text-muted-foreground" aria-live="polite">
          Loading comments…
        </p>
      ) : commentsQuery.isError ? (
        <div className="mt-4" role="alert">
          <p className="text-sm font-medium text-destructive">
            Could not load comments
          </p>
          <p className="mt-1 text-sm text-muted-foreground">
            {commentsQuery.error instanceof Error
              ? commentsQuery.error.message
              : "Comments are currently unavailable."}
          </p>
          <Button
            className="mt-3"
            type="button"
            variant="outline"
            size="sm"
            onClick={() => void commentsQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : commentsQuery.data.data.length === 0 ? (
        <p className="mt-4 text-sm text-muted-foreground">No comments yet.</p>
      ) : (
        <ol className="mt-4 space-y-3">
          {commentsQuery.data.data.map((comment) => (
            <li key={comment.id} className="rounded-md bg-muted/40 p-4">
              <p className="whitespace-pre-wrap leading-6">{comment.body}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                <span className="break-all">{comment.userId}</span>
                {" · "}
                <time dateTime={comment.createdAt}>
                  {dateFormatter.format(new Date(comment.createdAt))}
                </time>
              </p>
            </li>
          ))}
        </ol>
      )}

      <form className="mt-6 space-y-4 border-t pt-5" onSubmit={handleSubmit}>
        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comment-user-id">
            Your user ID
          </label>
          <Input
            id="comment-user-id"
            name="userId"
            autoComplete="off"
            required
            value={userId}
            onChange={(event) => setUserId(event.target.value)}
            placeholder="UUID until authentication is available"
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium" htmlFor="comment-body">
            Add a comment
          </label>
          <Textarea
            id="comment-body"
            name="body"
            required
            value={body}
            onChange={(event) => setBody(event.target.value)}
          />
        </div>

        {createComment.isError ? (
          <p className="text-sm text-destructive" role="alert">
            {createComment.error instanceof Error
              ? createComment.error.message
              : "Could not add comment."}
          </p>
        ) : null}

        {createComment.isSuccess ? (
          <p className="text-sm text-muted-foreground" role="status">
            Comment added.
          </p>
        ) : null}

        <Button type="submit" disabled={!canSubmit}>
          {createComment.isPending ? "Adding…" : "Add comment"}
        </Button>
      </form>
    </section>
  );
}
