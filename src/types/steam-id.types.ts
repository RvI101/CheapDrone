export interface ISteamIdRecord {
  appId?: string;
  bundleId?: string;
  subId?: string;

  isBundle: () => boolean;
  isEmpty: () => boolean;
}

export class SteamIdRecord implements ISteamIdRecord {
  appId?: string;
  bundleId?: string;
  subId?: string;
  constructor(appId?: string, bundleId?: string, subId?: string) {
    this.appId = appId;
    this.bundleId = bundleId;
    this.subId = subId;
  }
  isBundle() {
    if (this.appId || this.subId) {
      return false;
    } else {
      return true;
    }
  }
  isEmpty() {
    if (!this.appId && !this.subId && !this.bundleId) {
      return true;
    } else {
      return false;
    }
  }
}
