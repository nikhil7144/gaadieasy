import { heroPromotions } from "@/lib/data";

export function getHeroPromotion(categoryKey: string, placement: "homepage_hero" | "mini_home_banner" = "homepage_hero") {
  return heroPromotions.find(
    (promotion) =>
      promotion.active &&
      promotion.categoryKey === categoryKey &&
      (promotion.placement ?? "homepage_hero") === placement,
  );
}
