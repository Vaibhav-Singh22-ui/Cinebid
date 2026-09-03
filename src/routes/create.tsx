import { createFileRoute } from "@tanstack/react-router";
import { GameForm } from "@/components/game-screens";
export const Route = createFileRoute("/create")({
  validateSearch: (search: Record<string, unknown>) => ({
    game: typeof search.game === "string" ? search.game : "cinema",
  }),
  head: () => ({
    meta: [
      { title: "Create an Auction Room — Cinebid & IPL Hub" },
      { name: "description", content: "Host a private movie or IPL cricket auction room for your friends." },
      { property: "og:title", content: "Create an Auction Room — Cinebid & IPL Hub" },
      {
        property: "og:description",
        content: "Host a private movie or IPL cricket auction room for your friends.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreatePage,
});

function CreatePage() {
  const { game } = Route.useSearch();
  return <GameForm mode="create" initialGame={game} />;
}
