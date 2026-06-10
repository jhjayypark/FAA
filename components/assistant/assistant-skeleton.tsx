"use client";

import { Skeleton } from "@/components/ui/skeleton";

/** Loading layout matching the assistant page: top bar, thread, composer. */
export function AssistantSkeleton() {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col gap-2 border-b px-6 py-3 md:flex-row md:items-center md:gap-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-7 w-full md:w-72" />
      </div>
      <div className="flex-1 overflow-hidden px-6 py-6">
        <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
          <Skeleton className="h-10 w-2/5 self-end rounded-lg" />
          <Skeleton className="h-24 w-4/5 self-start rounded-lg" />
          <Skeleton className="h-10 w-1/3 self-end rounded-lg" />
          <Skeleton className="h-16 w-3/5 self-start rounded-lg" />
        </div>
      </div>
      <div className="border-t px-6 py-4">
        <div className="mx-auto flex w-full max-w-3xl items-end gap-2">
          <Skeleton className="h-9 flex-1 rounded-md" />
          <Skeleton className="size-9 rounded-md" />
        </div>
      </div>
    </div>
  );
}
