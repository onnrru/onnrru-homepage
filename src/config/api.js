export const API_CONFIG = {
    // Base URLs (Proxied in Vite)
    EUM_BASE_URL: '/api/eum',
    VWORLD_BASE_URL: '/api/vworld',
    VWORLD_MAP_URL: '/api/vworld', // Corrected: Use api.vworld.kr for WMTS/Tiles

    // Keys
    VWORLD_KEY: 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04',

    // Eum Endpoints
    ENDPOINTS: {
        LULAW: '/Web/Rest/OP/luLawInfo', // 토지이용규제
        LANDUSE: '/Web/Rest/OP/searchLunCd', // 토지이용행위
        RESTRICT: '/Web/Rest/OP/arLandUseInfo', // 행위제한정보
        NOTICE: '/Web/Rest/OP/arMapList', // 고시정보
        GUIDE: '/Web/Rest/OP/ebGuideBookList', // 쉬운규제안내서
        DEVLIST: '/Web/Rest/OP/isDevList', // 개발인허가목록
    }
};
