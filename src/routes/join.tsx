import { createFileRoute } from "@tanstack/react-router";
import { GameForm } from "@/components/game-screens";

export const Route = createFileRoute("/join")({
  validateSearch: (search: Record<string, unknown>) => ({
    game: typeof search["game"] === "string" ? search["game"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Join an Auction Room — Cinebid & IPL Hub" },
      { name: "description", content: "Join your friends in a live movie or IPL cricket auction room." },
      { property: "og:title", content: "Join an Auction Room — Cinebid & IPL Hub" },
      { property: "og:description", content: "Join your friends in a live movie or IPL cricket auction room." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: JoinPage,
});

function JoinPage() {
  const { game } = Route.useSearch();
  return <GameForm mode="join" initialGame={game} />;
}

