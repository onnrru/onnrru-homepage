export const API_CONFIG = {
  EUM_BASE_URL: '/api/eum',
  VWORLD_BASE_URL: '/api/vworld',
  VWORLD_MAP_URL: '/api/vworld', // Used for WMS (Data layers)
  MOLIT_BASE_URL: '/api/molit',
  
  // Direct VWorld access for faster tile loading (Bypassing proxy to avoid 502/504)
  VWORLD_DIRECT_URL: 'https://api.vworld.kr',
  VWORLD_API_KEY: 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04',

  ENDPOINTS: {
    SEARCHZONE: '/Web/Rest/OP/searchZone',
    LULAW: '/Web/Rest/OP/luLawInfo',
    LANDUSE: '/Web/Rest/OP/searchLunCd',
    RESTRICT: '/Web/Rest/OP/arLandUseInfo',
    NOTICE: '/Web/Rest/OP/arMapList',
    GUIDE: '/Web/Rest/OP/ebGuideBookList',
    DEVLIST: '/Web/Rest/OP/isDevList',
    APT_TRADE: '/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev'
  }
};
