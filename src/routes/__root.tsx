import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="inline-flex items-center justify-center rounded-xl bg-gold text-black font-black px-5 py-2.5 text-sm transition-all hover:brightness-110 shadow-lg cursor-pointer"
          >
            Go home
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/join";
            }}
            className="inline-flex items-center justify-center rounded-xl border border-border/80 bg-panel px-4 py-2.5 text-sm font-bold text-cream hover:border-gold/50 cursor-pointer"
          >
            Join Auction Room
          </button>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error("Application Error:", error);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-black tracking-tight text-foreground font-display">
          This page encountered an issue
        </h1>
        <p className="mt-2 text-xs sm:text-sm text-muted-foreground">
          Something interrupted the view. You can reload the live auction or return home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2.5">
          <button
            type="button"
            onClick={() => {
              try {
                reset();
              } catch {
                // ignore
              }
              window.location.reload();
            }}
            className="inline-flex items-center justify-center rounded-xl bg-primary px-5 py-2.5 text-xs sm:text-sm font-black text-primary-foreground transition-all hover:bg-primary/90 shadow-md cursor-pointer"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => {
              window.location.href = "/";
            }}
            className="inline-flex items-center justify-center rounded-xl border border-input bg-background px-5 py-2.5 text-xs sm:text-sm font-bold text-foreground transition-colors hover:bg-accent cursor-pointer"
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Cinebid — Live Movie Auction House" },
      { name: "description", content: "Curate your cinematic slate. Bid in live auctions against rival producers." },
      { name: "author", content: "Cinebid Studio" },
      { property: "og:title", content: "Cinebid — Live Movie Auction House" },
      { property: "og:description", content: "Curate your cinematic slate. Bid in live auctions against rival producers." },
      { property: "og:image", content: "/cinebid-logo.jpg" },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:image", content: "/cinebid-logo.jpg" },
    ],
    links: [
      {
        rel: "stylesheet",
        href: appCss,
      },
      { rel: "icon", href: "/favicon.svg", type: "image/svg+xml" },
      { rel: "alternate icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "apple-touch-icon", href: "/cinebid-logo.jpg" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  return (
    <QueryClientProvider client={queryClient}>
      {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
      <Outlet />
    </QueryClientProvider>
  );
}
