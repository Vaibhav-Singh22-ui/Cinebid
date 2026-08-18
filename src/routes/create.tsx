import { createFileRoute } from "@tanstack/react-router";
import { GameForm } from "@/components/game-screens";
export const Route = createFileRoute("/create")({
  head: () => ({
    meta: [
      { title: "Create a Movie Auction — Cinebid" },
      { name: "description", content: "Host a private movie auction room for your friends." },
      { property: "og:title", content: "Create a Movie Auction — Cinebid" },
      {
        property: "og:description",
        content: "Host a private movie auction room for your friends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <GameForm mode="create" />,
});
