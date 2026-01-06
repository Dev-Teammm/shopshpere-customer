import { Suspense } from "react";
import { StoreProfileClient } from "./StoreProfileClient";
import { Loader2 } from "lucide-react";

export default async function StoreProfilePage({
  params,
}: {
  params: Promise<{ storeId: string }>;
}) {
  const { storeId } = await params;
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">Loading store...</p>
        </div>
      }
    >
      <StoreProfileClient storeId={storeId} />
    </Suspense>
  );
}