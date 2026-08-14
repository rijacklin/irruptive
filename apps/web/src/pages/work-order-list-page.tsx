import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { WorkOrderTable } from "@/components/work-orders/work-order-table";
import { useWorkOrders } from "@/hooks/use-work-orders";

const pageSize = 20;

export function WorkOrderListPage() {
  const [page, setPage] = useState(1);
  const offset = (page - 1) * pageSize;

  const workOrdersQuery = useWorkOrders({
    limit: pageSize,
    offset,
  });

  const workOrders = workOrdersQuery.data?.data ?? [];
  const canGoBack = page > 1;

  // The API does not return a total count yet. A full page is the only
  // indication that another page might exist.
  const canGoForward = workOrders.length === pageSize;

  function goToPreviousPage() {
    if (canGoBack) {
      setPage((currentPage) => currentPage - 1);
    }
  }

  function goToNextPage() {
    if (canGoForward) {
      setPage((currentPage) => currentPage + 1);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
          Operations
        </p>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Work orders</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review and track operational issues.
          </p>
        </div>
      </header>

      {workOrdersQuery.isError ? (
        <div
          className="flex flex-col items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4"
          role="alert"
        >
          <div>
            <p className="font-medium">Could not load work orders</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {workOrdersQuery.error instanceof Error
                ? workOrdersQuery.error.message
                : "An unexpected error occurred."}
            </p>
          </div>

          <Button
            variant="outline"
            size="sm"
            onClick={() => void workOrdersQuery.refetch()}
          >
            Try again
          </Button>
        </div>
      ) : (
        <>
          <div className="relative">
            {workOrdersQuery.isFetching && !workOrdersQuery.isPending ? (
              <p className="absolute -top-5 right-0 text-xs text-muted-foreground">
                Updating…
              </p>
            ) : null}

            <WorkOrderTable
              workOrders={workOrders}
              isLoading={workOrdersQuery.isPending}
            />
          </div>

          <div className="flex flex-col items-center gap-2">
            <Pagination>
              <PaginationContent>
                <PaginationItem>
                  <PaginationPrevious
                    href="#"
                    aria-disabled={!canGoBack}
                    className={
                      canGoBack ? undefined : "pointer-events-none opacity-50"
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      goToPreviousPage();
                    }}
                  />
                </PaginationItem>

                <PaginationItem>
                  <span
                    className="flex h-7 items-center px-3 text-xs"
                    aria-current="page"
                  >
                    Page {page}
                  </span>
                </PaginationItem>

                <PaginationItem>
                  <PaginationNext
                    href="#"
                    aria-disabled={!canGoForward}
                    className={
                      canGoForward
                        ? undefined
                        : "pointer-events-none opacity-50"
                    }
                    onClick={(event) => {
                      event.preventDefault();
                      goToNextPage();
                    }}
                  />
                </PaginationItem>
              </PaginationContent>
            </Pagination>

            <p className="text-xs text-muted-foreground">
              Showing up to {pageSize} work orders per page
            </p>
          </div>
        </>
      )}
    </main>
  );
}
