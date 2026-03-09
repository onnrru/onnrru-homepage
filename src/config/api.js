export const API_CONFIG = {
    // Base URLs
    EUM_BASE_URL: '/api/eum', // Use Proxy for Mixed Content & CORS
    VWORLD_BASE_URL: '/api/vworld', // Keep proxy for Data API (CORS)
    VWORLD_MAP_URL: '/api/vworld', // Route through Proxy for key injection
    MOLIT_BASE_URL: '/api/molit',

    // Keys
    VWORLD_KEY: 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04',
    MOLIT_KEY: 'F359ED4A-0FCB-3F3D-AB0B-0F58879EEA04',

    // Endpoints
    ENDPOINTS: {
        SEARCHZONE: '/Web/Rest/OP/searchZone', // 지역지구 코드 검색
        LULAW: '/Web/Rest/OP/luLawInfo', // 토지이용규제
        LANDUSE: '/Web/Rest/OP/searchLunCd', // 토지이용행위
        RESTRICT: '/Web/Rest/OP/arLandUseInfo', // 행위제한정보
        NOTICE: '/Web/Rest/OP/arMapList', // 고시정보
        GUIDE: '/Web/Rest/OP/ebGuideBookList', // 쉬운규제안내서
        DEVLIST: '/Web/Rest/OP/isDevList', // 개발인허가목록
        APT_TRADE: '/1613000/RTMSDataSvcAptTradeDev/getRTMSDataSvcAptTradeDev' // 아파트 매매 실거래 상세 자료
    }
};
