import { createFileRoute } from "@tanstack/react-router";
import { LandingScreen } from "@/components/game-screens";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Movie Auction — Cinebid" },
      {
        name: "description",
        content: "Bid on iconic films and build the winning movie portfolio.",
      },
      { property: "og:title", content: "Movie Auction — Cinebid" },
      {
        property: "og:description",
        content: "Bid on iconic films and build the winning movie portfolio.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

// IMPORTANT: Replace this placeholder. See ./README.md for routing conventions.
function Index() {
  return <LandingScreen />;
}
