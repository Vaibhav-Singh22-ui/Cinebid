import { createFileRoute } from "@tanstack/react-router";
import { ResultsScreen } from "@/components/game-screens";
export const Route = createFileRoute("/results/$roomCode")({
  head: () => ({
    meta: [
      { title: "Movie Auction Results — Cinebid" },
      { name: "description", content: "Select your top five and discover the winner." },
      { property: "og:title", content: "Movie Auction Results — Cinebid" },
      { property: "og:description", content: "Select your top five and discover the winner." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: () => <ResultsScreen roomCode={Route.useParams().roomCode} />,
});
