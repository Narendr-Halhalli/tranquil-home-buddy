import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { BottomNav } from "../components/mps/BottomNav";
import { MonthGate } from "../components/mps/MonthGate";

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  useEffect(() => { reportLovableError(error, { boundary: "root" }); }, [error]);
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold">Something went wrong</h1>
        <button onClick={() => { router.invalidate(); reset(); }} className="mt-4 rounded-full bg-primary text-white px-5 py-2">Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "MPS Tranquil — Maintenance Portal" },
      { name: "description", content: "Apartment maintenance expense tracking for MPS Tranquil." },
      { property: "og:title", content: "MPS Tranquil — Maintenance Portal" },
      { property: "og:description", content: "Apartment maintenance expense tracking for MPS Tranquil." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "MPS Tranquil — Maintenance Portal" },
      { name: "twitter:description", content: "Apartment maintenance expense tracking for MPS Tranquil." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a1b39002-02b1-43a1-a097-5d971488f861/id-preview-216fd041--b4fdc13d-d92b-40bc-9de1-6d6ebf7083cc.lovable.app-1784006553071.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/a1b39002-02b1-43a1-a097-5d971488f861/id-preview-216fd041--b4fdc13d-d92b-40bc-9de1-6d6ebf7083cc.lovable.app-1784006553071.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  errorComponent: ErrorComponent,
  notFoundComponent: () => (
    <div className="flex min-h-screen items-center justify-center">
      <div className="text-center">
        <h1 className="text-6xl font-bold">404</h1>
        <a href="/" className="text-primary underline mt-2 inline-block">Go home</a>
      </div>
    </div>
  ),
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen mps-bg">
        <div className="mx-auto max-w-2xl px-5 pt-8">
          <Outlet />
        </div>
        <BottomNav />
        <MonthGate />
        <Toaster position="top-center" richColors />
      </div>
    </QueryClientProvider>
  );
}
