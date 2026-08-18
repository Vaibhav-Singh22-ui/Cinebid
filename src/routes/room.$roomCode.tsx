import { createFileRoute } from "@tanstack/react-router";
import { LobbyScreen } from "@/components/game-screens";
export const Route = createFileRoute("/room/$roomCode")({
  head: () => ({
    meta: [
      { title: "Movie Auction Lobby — Cinebid" },
      { name: "description", content: "Wait for players to join your live movie auction." },
      { property: "og:title", content: "Movie Auction Lobby — Cinebid" },
      { property: "og:description", content: "Wait for players to join your live movie auction." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <LobbyScreen roomCode={Route.useParams().roomCode} />,
});
