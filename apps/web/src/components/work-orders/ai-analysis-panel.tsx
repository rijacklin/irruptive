import type { UserRole } from "@irruptive/shared";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAIAnalysis, useCreateAIAnalysis } from "@/hooks/use-ai-analysis";

const dateFormatter = new Intl.DateTimeFormat(undefined, {
  dateStyle: "medium",
  timeStyle: "short",
});

interface AIAnalysisPanelProps {
  workOrderId: string;
  role: UserRole | undefined;
}

export function AIAnalysisPanel({ workOrderId, role }: AIAnalysisPanelProps) {
  const analysisQuery = useAIAnalysis(workOrderId);
  const createAnalysis = useCreateAIAnalysis(workOrderId);
  const canRequest = role === "supervisor" || role === "admin";
  const analysis = analysisQuery.data?.data;

  return (
    <section
      className="rounded-lg border p-5"
      aria-labelledby="ai-analysis-heading"
      aria-busy={analysisQuery.isPending || createAnalysis.isPending}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 id="ai-analysis-heading" className="text-xl font-semibold">
              AI analysis
            </h2>
            <Badge variant="secondary">AI-generated</Badge>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Recommendations only. Work-order fields are unchanged.
          </p>
        </div>

        {canRequest ? (
          <Button
            type="button"
            size="sm"
            onClick={() => createAnalysis.mutate()}
            disabled={createAnalysis.isPending}
          >
            {createAnalysis.isPending
              ? "Generating…"
              : analysis
                ? "Generate again"
                : "Generate analysis"}
          </Button>
        ) : null}
      </div>

      {analysisQuery.isPending ? (
        <div className="mt-5 space-y-3" aria-label="Loading AI analysis">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      ) : analysisQuery.isError ? (
        <div className="mt-5" role="alert">
          <p className="font-medium">Could not load AI analysis</p>
          <p className="mt-1 text-sm text-muted-foreground">
            {analysisQuery.error.message}
          </p>
          <Button
            className="mt-3"
            variant="outline"
            size="sm"
            onClick={() => void analysisQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : analysis === null || analysis === undefined ? (
        <p className="mt-5 text-sm text-muted-foreground">
          No AI analysis has been generated for this work order.
        </p>
      ) : (
        <div className="mt-5 space-y-5">
          <div>
            <h3 className="font-medium">Summary</h3>
            <p className="mt-1 whitespace-pre-wrap leading-6">
              {analysis.summary}
            </p>
          </div>

          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-sm text-muted-foreground">
                Suggested category
              </dt>
              <dd className="mt-1 font-medium">
                {analysis.suggestedCategory ?? "No suggestion"}
              </dd>
            </div>
            <div>
              <dt className="text-sm text-muted-foreground">
                Suggested priority
              </dt>
              <dd className="mt-1 font-medium capitalize">
                {analysis.suggestedPriority ?? "No suggestion"}
              </dd>
            </div>
          </dl>

          <div>
            <h3 className="font-medium">Suggested troubleshooting actions</h3>
            {analysis.suggestedActions.length === 0 ? (
              <p className="mt-1 text-sm text-muted-foreground">
                No actions suggested.
              </p>
            ) : (
              <ol className="mt-2 list-decimal space-y-1 pl-5">
                {analysis.suggestedActions.map((action, index) => (
                  <li key={`${index}-${action}`}>{action}</li>
                ))}
              </ol>
            )}
          </div>

          <p className="text-xs text-muted-foreground">
            Generated {dateFormatter.format(new Date(analysis.createdAt))} by{" "}
            {analysis.provider} / {analysis.model} ({analysis.promptVersion})
          </p>
        </div>
      )}

      {createAnalysis.isError ? (
        <p className="mt-4 text-sm text-destructive" role="alert">
          {createAnalysis.error.message}
        </p>
      ) : null}
    </section>
  );
}
