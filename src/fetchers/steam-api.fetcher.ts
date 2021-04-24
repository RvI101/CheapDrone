import got from 'got';
import { SteamIdRecord } from '../types/steam-id.types';

export const getSteamPrice = (record: SteamIdRecord, cc: string) => {
  if (record.appId) {
    return getSteamAppPrice(record.appId, cc);
  } else if (record.subId) {
    return getSteamPackagePrice(record.subId, cc);
  }
};

export const getSteamAppPrice = async (appId: string, cc: string) => {
  const url = 'http://store.steampowered.com/api/appdetails/';
  const config = {
    headers: {},
    searchParams: {
      appids: appId,
      filters: 'price_overview,basic',
      cc: cc,
    },
  };

  try {
    const priceResponse = await got.get(url, config).json<any>();
    return priceResponse[appId]?.data?.price_overview?.final / 100.0;
  } catch (error) {
    console.error();
    return null;
  }
};

export const getSteamPackagePrice = async (subId: string, cc: string) => {
  const url = 'http://store.steampowered.com/api/packagedetails/';
  const config = {
    headers: {},
    searchParams: {
      packageids: subId,
      cc: cc,
    },
  };
  try {
    const priceResponse = await got.get(url, config).json<any>();
    return Number(priceResponse[subId]?.data?.price?.final) / 100.0;
  } catch (error) {
    console.error();
    return null;
  }
};
