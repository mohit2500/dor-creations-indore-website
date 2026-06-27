import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/site/CategoryPage";
import pSuit from "@/assets/product-suit.jpg";

export const Route = createFileRoute("/suits")({
  head: () => ({
    meta: [
      { title: "Suits — डोर Creation Indore" },
      { name: "description", content: "Anarkali, straight and embroidered suits — luxury everyday ethnic wear by डोर Creation." },
      { property: "og:title", content: "Suits — डोर Creation" },
      { property: "og:description", content: "Anarkali, straight & embroidered suits for everyday elegance." },
      { property: "og:image", content: pSuit },
    ],
  }),
  component: () => (
    <CategoryPage
      title="Suits"
      subtitle="Anarkali, straight cuts and embroidered classics — your everyday elegance."
      match={["suit"]}
      bannerImg={pSuit}
    />
  ),
});
