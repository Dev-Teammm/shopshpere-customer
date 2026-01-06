import { Suspense } from "react";
import { StoreProductsClient } from "./StoreProductsClient";
import { Loader2 } from "lucide-react";

export interface PageProps {
  params: {
    storeId: string;
  };
}

export default async function StoreProductsPage({ params }: PageProps) {
  const { storeId } = await params;

  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16 flex flex-col items-center justify-center min-h-[50vh]">
          <Loader2 className="h-16 w-16 animate-spin text-primary" />
          <p className="mt-4 text-lg text-muted-foreground">
            Loading products...
          </p>
        </div>
      }
    >
      <StoreProductsClient storeId={storeId} />
    </Suspense>
  );
}
