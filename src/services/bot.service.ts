import { DI } from '../DI';
import { getLowestPrice, getPlainIdMap } from '../fetchers/itad-api.fetcher';
import { getSteamPrice } from '../fetchers/steam-api.fetcher';

export const generateUpdatedMsg = async (
  queryString: string
): Promise<string> => {
  const [title, cc, plain] = queryString.split('|');
  if (!title || !cc || !plain) {
    throw new Error(`Error parsing callback_data: ${queryString}`);
  }

  const appId = (await DI.steamIdRepo.getSteamIdRecord(plain))?.appId;
  switch (cc) {
    case 'IN':
      if (appId) {
        const priceResponse = await getSteamPrice(appId, cc);
        const indiaPrice =
          priceResponse[appId]?.data?.price_overview?.final_formatted ?? 'N/A';
        return `*${title}*\n_${indiaPrice}_ on Steam`;
      }
    case 'EU':
      const euPrice = (await getLowestPrice(plain, 'eu1', 'DE'))?.price_new;
      return `*${title}*\n_${euPrice}_ on Steam`;
    case 'US':
    default:
      const usPrice = (await getLowestPrice(plain, 'eu1', 'DE'))?.price_new;
      return `*${title}*\n_${usPrice}_ on Steam`;
  }
};

export const loadSteamIdRepo = async () => {
  const map = await getPlainIdMap('steam');
  DI.steamIdRepo.loadKeys(map);
};
