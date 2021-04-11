export type GameSearchResult = {
  id: string;
  plain: string;
  title: string;
};
export type ShopMinimal = {
  id: string;
  name: string;
};
export type GamePriceResult = {
  price_new: number;
  price_old: number;
  price_cut: number;
  url: string;
  shop: ShopMinimal;
  drm: string[];
};
