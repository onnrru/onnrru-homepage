import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress, selectedParcels }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [specOpen, setSpecOpen] = useState(false);
    const [miniMapUrl, setMiniMapUrl] = useState(null);
    const [landUseWmsUrl, setLandUseWmsUrl] = useState(null);
    const [showLandUseWms, setShowLandUseWms] = useState(true);

    // --- Utility Functions ---
    const first = (...vals) => {
        for (const v of vals) {
            if (v === 0) return 0;
            if (v !== null && v !== undefined && String(v).trim() !== '') return v;
        }
        return null;
    };

    const normalizePnu = (pnu) => {
        const s = String(pnu || '').replace(/[^\d]/g, '');
        if (s.length >= 19) return s.slice(0, 19);
        return s;
    };

    const unwrapNed = (data) => {
        // Safe navigation for various VWorld response formats
        const r = data?.response?.result ?? data?.result ?? data;
        if (Array.isArray(r)) return r[0] ?? null;
        if (Array.isArray(r?.items)) return r.items[0] ?? null;
        if (Array.isArray(r?.item)) return r.item[0] ?? null;
        if (Array.isArray(r?.features)) return r.features[0]?.properties ?? r.features[0] ?? null;
        if (r && typeof r === 'object' && !r.response) return r;
        return null;
    };

    const extractDongRiBunji = (fullAddr = '') => {
        const m = String(fullAddr).match(/([가-힣0-9]+(?:동|리|읍|면))\s+(\d+(?:-\d+)?)/);
        if (m) return `${m[1]} ${m[2]}`;
        const tokens = String(fullAddr).trim().split(/\s+/);
        if (tokens.length >= 2) return `${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`;
        return fullAddr || '-';
    };

    // --- Memoized Values ---
    const picked = React.useMemo(() => {
        const list = Array.isArray(selectedParcels) && selectedParcels.length > 0
            ? selectedParcels.map(p => ({
                pnu: p?.properties?.pnu,
                addr: p?.properties?.addr || '',
                jimok: p?.properties?.jimok || '',
                area: Number(p?.properties?.parea || 0),
                price: Number(p?.properties?.jiga || 0),
            }))
            : (selectedAddress?.pnu ? [{
                pnu: selectedAddress.pnu,
                addr: selectedAddress.parcelAddr || selectedAddress.address || '',
                jimok: selectedAddress.jimok || '',
                area: Number(selectedAddress.area || 0),
                price: Number(selectedAddress.price || 0)
            }] : []);

        if (list.length === 0) return { list: [], representative: null, totalArea: 0 };

        const totalArea = list.reduce((sum, item) => sum + item.area, 0);
        const representative = [...list].sort((a, b) => b.area - a.area)[0];

        return { list, representative, totalArea };
    }, [selectedParcels, selectedAddress]);

    // --- State Management ---
    const [data, setData] = useState({
        basic: null,
        regulation: null,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // --- Data Fetching Helpers ---
    const fetchLandCharacteristics = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const domain = window.location.hostname; // Reverted to hostname
        const pnu = normalizePnu(pnuRaw);
        const url = `/api/vworld/ned/data/getLandCharacteristics`;

        const res = await axios.get(url, {
            params: { key, domain, pnu, format: 'json' },
            responseType: 'json'
        });

        console.log('NED raw response:', res.data); // Added logging as requested

        const d = unwrapNed(res.data);
        if (!d) throw new Error('NED JSON record not found');

        return {
            pnu: first(d.pnu, pnu),
            indcgr_code_nm: first(
                d.indcgr_code_nm, d.indcgrCodeNm,
                d.lndcgr_code_nm, d.lndcgrCodeNm,
                d.lndcgr_code_nm_nm, d.lndcgrCodeNmNm,
                d.jimok, d.JIMOK
            ),
            ldplc_ar: first(
                d.ldplc_ar, d.ldplcAr,
                d.lndplc_ar, d.lndplcAr,
                d.lndpcl_ar, d.lndpclAr,
                d.lndpclArea,
                d.indcgr_ar, d.indcgrAr,
                d.ar, d.area
            ),
            pblntf_pclnd: first(d.pblntf_pclnd, d.pblntfPclnd, d.pblntf_pclnd_nm, d.jiga, d.JIGA),
            prpos_area_1_nm: first(d.prpos_area_1_nm, d.prposArea1Nm),
            prpos_area_2_nm: first(d.prpos_area_2_nm, d.prposArea2Nm),
            lad_use_sittn_nm: first(d.lad_use_sittn_nm, d.ladUseSittnNm),
            road_side_code_nm: first(d.road_side_code_nm, d.roadSideCodeNm)
        };
    };

    const fetchLandCharacteristicsWFS = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const domain = window.location.hostname;
        const pnu = normalizePnu(pnuRaw);
        const url = `/api/vworld/ned/wfs/getLandCharacteristicsWFS`;

        const res = await axios.get(url, {
            params: {
                key, domain, typename: 'dt_d194', pnu,
                maxFeatures: 1, resultType: 'results', srsName: 'EPSG:4326',
                output: 'text/xml; subtype=gml/2.1.2'
            },
            responseType: 'text'
        });

        const text = String(res.data || '');
        console.log('WFS raw head:', text.slice(0, 200));

        if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) {
            throw new Error('VWorld WFS returned HTML');
        }

        const xml = new DOMParser().parseFromString(text, 'text/xml');
        const ex1 = xml.getElementsByTagName('ServiceException')[0]?.textContent?.trim();
        const ex2 = xml.getElementsByTagName('ExceptionText')[0]?.textContent?.trim();
        if (ex1 || ex2) throw new Error(ex1 || ex2);

        const pickLocal = (localName) => {
            const els = xml.getElementsByTagName('*');
            for (let i = 0; i < els.length; i++) {
                if (els[i].localName === localName) return els[i].textContent?.trim() ?? null;
            }
            return null;
        };

        return {
            pnu: pickLocal('pnu') || pnu,
            indcgr_code_nm: pickLocal('indcgr_code_nm'),
            ldplc_ar: pickLocal('ldplc_ar'),
            pblntf_pclnd: pickLocal('pblntf_pclnd'),
            prpos_area_1_nm: pickLocal('prpos_area_1_nm'),
            prpos_area_2_nm: pickLocal('prpos_area_2_nm'),
            lad_use_sittn_nm: pickLocal('lad_use_sittn_nm'),
            road_side_code_nm: pickLocal('road_side_code_nm')
        };
    };

    // --- Effects ---
    // Minimap Effect
    useEffect(() => {
        // Robust coordinate check (fallback to lon/lat if x/y missing)
        const x = Number(selectedAddress?.x || selectedAddress?.lon);
        const y = Number(selectedAddress?.y || selectedAddress?.lat);
        if (!x || !y) { setMiniMapUrl(null); return; }

        const key = API_CONFIG.VWORLD_KEY;
        const size = 400; // Slightly larger for better clarity
        const delta = 0.0015;
        const bbox = `${x - delta},${y - delta},${x + delta},${y + delta}`;

        // Simplified layer list for better stability (City/Cadastral)
        const layers = [
            'LT_C_UQ111', 'LT_C_UQ112', 'LT_C_UQ113', 'LT_C_UQ114',
            'LP_PA_CBND_BUBUN'
        ].join(',');

        // Using VWORLD_MAP_URL via proxy path
        const url = `/api/vworld/req/image?service=image&request=getmap&key=${key}&format=png&crs=EPSG:4326&bbox=${bbox}&width=${size}&height=${size}&layers=${layers}`;
        setMiniMapUrl(url);
    }, [selectedAddress?.x, selectedAddress?.y, selectedAddress?.lon, selectedAddress?.lat]);

    // Data Fetch Effect
    useEffect(() => {
        const run = async () => {
            const 대표Pnu = normalizePnu(picked.representative?.pnu || selectedAddress?.pnu);
            if (!대표Pnu) {
                setData({ basic: null, regulation: null });
                setLandUseWmsUrl(null);
                return;
            }

            setLoading(true);
            setError(null);

            try {
                let c;
                try {
                    c = await fetchLandCharacteristics(대표Pnu);
                } catch (jsonErr) {
                    console.warn("NED JSON failed, trying WFS:", jsonErr);
                    c = await fetchLandCharacteristicsWFS(대표Pnu);
                }

                // Robust mapping with fallbacks to representative object
                const area = first(c.ldplc_ar, picked.representative?.area, null);
                const jimok = first(c.indcgr_code_nm, picked.representative?.jimok, '-');
                const price = first(c.pblntf_pclnd, picked.representative?.price, null);

                setData({
                    basic: {
                        jimok,
                        area: area ? Number(area) : null,
                        price: price ? Number(price) : null,
                        ladUse: c.lad_use_sittn_nm || '-',
                        roadSide: c.road_side_code_nm || '-'
                    },
                    regulation: {
                        uses: [c.prpos_area_1_nm, c.prpos_area_2_nm].filter(Boolean)
                    }
                });

                const key = API_CONFIG.VWORLD_KEY;
                const domain = window.location.hostname;
                const url = `${API_CONFIG.VWORLD_BASE_URL}/ned/wms/getLandUseWMS?key=${encodeURIComponent(key)}&domain=${encodeURIComponent(domain)}&pnu=${encodeURIComponent(대표Pnu)}`;
                setLandUseWmsUrl(url);
                setShowLandUseWms(true);

            } catch (err) {
                console.error("Sidebar Loading Error:", err);
                setError(`정보 로딩 오류: ${err.message}`);
            } finally {
                setLoading(false);
            }
        };

        run();
    }, [picked.representative?.pnu, selectedAddress?.pnu]);

    // --- Rendering ---
    const 대표필지 = picked.representative;
    const 대표도로주소 = selectedAddress?.roadAddr || 대표필지?.addr || '-';
    const 외필지표시 = picked.list.length > 1 ? ` 외 ${picked.list.length - 1}필지` : '';

    return (
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[800px]' : 'w-[350px]'}`}>

            {/* 0. Mini Map (Square) */}
            {miniMapUrl && (
                <div className="p-4 bg-white">
                    <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200 relative bg-gray-50 shadow-inner">
                        <img
                            src={miniMapUrl}
                            alt="미니맵"
                            className="w-full h-full object-cover"
                            onError={() => {
                                console.warn("Minimap load failed");
                                setMiniMapUrl(null);
                            }}
                        />
                        {/* Target Marker (Center) */}
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                        </div>
                        <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 text-white text-[9px] rounded backdrop-blur-sm">
                            VWorld
                        </div>
                    </div>
                </div>
            )}

            {/* 1. Header: Target Site Info */}
            <div className="p-6 pt-2 border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">대상지 정보</h2>
                <div className="text-xl font-bold text-gray-900 font-serif break-keep leading-tight">
                    {대표필지 ? `${대표도로주소}${외필지표시}` : '주소 선택 필요'}
                </div>
                {대표필지?.addr && (
                    <div className="text-sm text-gray-500 mt-1">
                        {대표필지.addr}
                    </div>
                )}
            </div>

            {/* Content Body */}
            <div className="flex-1 p-6 space-y-8 bg-white overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                        <p className="text-xs text-gray-400">네트워크에서 데이터 추출 중...</p>
                    </div>
                ) : (
                    <>
                        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">{error}</div>}

                        {/* 2. Zoning Section */}
                        <section>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                국토계획법 및 타법령 지역·지구 등
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {data.regulation?.uses && data.regulation.uses.length > 0 ? (
                                    data.regulation.uses.map((use, i) => (
                                        <span key={`${use}-${i}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100">
                                            {use}
                                        </span>
                                    ))
                                ) : (
                                    <div className="text-gray-400 text-xs italic">해당 정보 없음</div>
                                )}
                            </div>
                        </section>

                        {/* 3. Land Characteristics Table */}
                        <section>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                토지 기본특성
                            </h4>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <th className="bg-gray-50/50 py-3.5 px-4 text-left font-medium text-gray-500 w-1/3">지목</th>
                                            <td className="py-3.5 px-4 text-gray-800 font-bold">{data.basic?.jimok || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3.5 px-4 text-left font-medium text-gray-500">면적</th>
                                            <td className="py-3.5 px-4 text-gray-800 font-bold">
                                                {data.basic?.area ? `${Number(data.basic.area).toLocaleString()} m²` : '-'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3.5 px-4 text-left font-medium text-gray-500">공시지가</th>
                                            <td className="py-3.5 px-4 text-gray-800 font-bold">
                                                {data.basic?.price ? `${Number(data.basic.price).toLocaleString()} 원/m²` : '-'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3.5 px-4 text-left font-medium text-gray-500">이용상황</th>
                                            <td className="py-3.5 px-4 text-gray-800">{data.basic?.ladUse || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3.5 px-4 text-left font-medium text-gray-500">도로접면</th>
                                            <td className="py-3.5 px-4 text-gray-800">{data.basic?.roadSide || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 4. Land Specification (Collapsible) */}
                        {picked.list.length > 0 && (
                            <section className="bg-gray-50/50 rounded-xl border border-gray-200 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                        토지명세표
                                    </h4>
                                    <button
                                        onClick={() => setSpecOpen(!specOpen)}
                                        className="text-xs font-bold text-ink hover:underline flex items-center gap-1"
                                    >
                                        {specOpen ? '간략히' : '상세보기'}
                                        <svg className={`w-3 h-3 transition-transform ${specOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">총 필지수</div>
                                        <div className="text-lg font-bold text-ink">{picked.list.length} <span className="text-xs font-normal text-gray-400">필지</span></div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1 tracking-tighter">합계 면적</div>
                                        <div className="text-lg font-bold text-blue-700">{picked.totalArea.toLocaleString()} <span className="text-xs font-normal text-gray-400">m²</span></div>
                                    </div>
                                </div>

                                {specOpen && (
                                    <div className="overflow-x-auto mt-4 bg-white rounded-lg border border-gray-100">
                                        <table className="w-full text-[10px] text-left">
                                            <thead className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                                                <tr>
                                                    <th className="p-2 text-center w-8 text-[9px]">No</th>
                                                    <th className="p-2">지번</th>
                                                    <th className="p-2 text-right">면적</th>
                                                    <th className="p-2 text-center">지목</th>
                                                    <th className="p-2 text-right">지가</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {picked.list.map((p, idx) => (
                                                    <tr key={p.pnu || idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                        <td className="p-2 font-medium">{extractDongRiBunji(p.addr)}</td>
                                                        <td className="p-2 text-right">{p.area.toLocaleString()}</td>
                                                        <td className="p-2 text-center">{p.jimok || '-'}</td>
                                                        <td className="p-2 text-right text-gray-400">
                                                            {p.price ? p.price.toLocaleString() : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-blue-50/30 font-bold border-t border-blue-100">
                                                <tr>
                                                    <td className="p-2 text-center" colSpan={2}>합계</td>
                                                    <td className="p-2 text-right text-blue-700">{picked.totalArea.toLocaleString()}</td>
                                                    <td className="p-2" colSpan={2}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* 5. Land Use Plan Map */}
                        {landUseWmsUrl && showLandUseWms && (
                            <section>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                    토지이용계획도
                                </h4>
                                <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative shadow-inner">
                                    <img
                                        src={landUseWmsUrl}
                                        alt="토지이용계획도"
                                        className="w-full h-full object-contain"
                                        onError={() => setShowLandUseWms(false)}
                                    />
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 text-white text-[9px] rounded backdrop-blur-sm">WMS</div>
                                </div>
                                <p className="mt-2 text-[10px] text-gray-400 text-right italic font-serif">* 국계법/타법령 기반</p>
                            </section>
                        )}
                    </>
                )}
            </div>

            {/* 6. Footer Action */}
            <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                <button className="w-full py-4 bg-ink text-white rounded-xl font-bold shadow-xl hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                    <span>📄 상세 분석 보고서 생성</span>
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
