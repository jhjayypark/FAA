"use client";

import { Suspense } from "react";
import { AssistantView } from "@/components/assistant/assistant-view";
import { AssistantSkeleton } from "@/components/assistant/assistant-skeleton";

export default function AssistantPage() {
  // AssistantView reads ?incident= via useSearchParams, which requires a
  // Suspense boundary in Next.js App Router.
  return (
    <Suspense fallback={<AssistantSkeleton />}>
      <AssistantView />
    </Suspense>
  );
}
