import { createFileRoute } from "@tanstack/react-router";
import { CategoryPage } from "@/components/site/CategoryPage";
import pBridal from "@/assets/product-bridal.jpg";

export const Route = createFileRoute("/bridal")({
  head: () => ({
    meta: [
      { title: "Bridal Wear — डोर Creation Indore" },
      { name: "description", content: "Hand-crafted bridal lehengas, couture and custom bridal ensembles by डोर Creation, Indore." },
      { property: "og:title", content: "Bridal Wear — डोर Creation" },
      { property: "og:description", content: "Once-in-a-lifetime bridal couture, hand-finished in Indore." },
      { property: "og:image", content: pBridal },
    ],
  }),
  component: () => (
    <CategoryPage
      title="Bridal Wear"
      subtitle="Once-in-a-lifetime couture, hand-finished for your forever moment."
      match={["bridal"]}
      bannerImg={pBridal}
    />
  ),
});
