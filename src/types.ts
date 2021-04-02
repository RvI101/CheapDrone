export interface GameSearchResult {
  gameID: string;
  steamAppID: string;
  cheapest: number;
  cheapestDealID: string;
  external: string;
  internalName: string;
  thumb: string;
}
export interface GameInfo {
  storeID: string;
  gameID: string;
  name: string;
  steamAppID: string;
  salePrice: number;
  retailPrice: number;
  steamRatingText: string;
  steamRatingPercent: string;
  steamRatingCount: string;
  metacriticScore: string;
  metacriticLink: string;
  releaseDate: Date;
  publisher: string;
  steamworks: string;
  thumb: string;
}

export interface DealLookupResult {
  gameInfo: GameInfo;
  cheapestPrice: {
    price: number;
    date: Date;
  };
}

export interface DealStubResult {
  storeID: number;
  dealID: string;
  price: number;
  retailPrice: number;
  savings: number;
}

export interface GameLookupResult {
  info: {
    title: string;
    steamAppID: string;
    thumb: string;
  };
  cheapestPriceEver: {
    price: number;
    date: number;
  };
  deals: DealStubResult[];
}
