import { createFileRoute } from "@tanstack/react-router";
import { AuctionScreen } from "@/components/game-screens";
export const Route = createFileRoute("/game/$roomCode")({
  head: () => ({
    meta: [
      { title: "Live Movie Auction — Cinebid" },
      { name: "description", content: "Place your bids and win cinematic classics." },
      { property: "og:title", content: "Live Movie Auction — Cinebid" },
      { property: "og:description", content: "Place your bids and win cinematic classics." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <AuctionScreen roomCode={Route.useParams().roomCode} />,
});
