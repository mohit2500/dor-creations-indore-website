import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/site/CategoryPage";
import pLehenga from "@/assets/product-lehenga.jpg";

export const Route = createFileRoute("/lehengas")({
  head: () => ({
    meta: [
      { title: "Lehengas — डोर Creation Indore" },
      { name: "description", content: "Designer lehengas — silk, embroidered, festive — by डोर Creation, Indore." },
      { property: "og:title", content: "Lehengas — डोर Creation" },
      { property: "og:description", content: "Festive & designer lehengas, made for every celebration." },
      { property: "og:image", content: pLehenga },
    ],
  }),
  component: () => (
    <CategoryPage
      title="Lehengas"
      subtitle="From festive flair to wedding-night glamour — every lehenga tells a story."
      match={["lehenga"]}
      bannerImg={pLehenga}
    />
  ),
});
