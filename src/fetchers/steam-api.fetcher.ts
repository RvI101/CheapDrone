import got from 'got';

export const getSteamPrice = async (appId: string, cc: string) => {
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
    return got.get(url, config).json<any>();
  } catch (error) {
    console.error();
    return {};
  }
};
