import { createFileRoute } from "@tanstack/react-router";
import { GameForm } from "@/components/game-screens";
export const Route = createFileRoute("/join")({
  head: () => ({
    meta: [
      { title: "Join a Movie Auction — Cinebid" },
      { name: "description", content: "Join your friends in a live movie auction room." },
      { property: "og:title", content: "Join a Movie Auction — Cinebid" },
      { property: "og:description", content: "Join your friends in a live movie auction room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <GameForm mode="join" />,
});
