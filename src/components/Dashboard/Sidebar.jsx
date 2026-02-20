import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import MiniMap from './MiniMap';

const Sidebar = ({ selectedAddress, selectedParcels }) => {
    const [specOpen, setSpecOpen] = useState(false);
    const [charOpen, setCharOpen] = useState(true);

    const [landUseWmsUrl, setLandUseWmsUrl] = useState(null);
    const [showLandUseWms, setShowLandUseWms] = useState(true);

    const [data, setData] = useState({ basic: null, regulation: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [parcelMeta, setParcelMeta] = useState({});

    const toggleSpec = () => {
        const next = !specOpen;
        setSpecOpen(next);
        setCharOpen(!next);
    };

    const getVworldDomain = () => window.location.hostname;

    const safeJson = (maybe) => {
        if (typeof maybe === 'string') {
            try { return JSON.parse(maybe); } catch { return null; }
        }
        return maybe;
    };

    // Helper to find first non-empty value
    const first = (...vals) => {
        for (const v of vals) {
            if (v === 0) return 0;
            const sv = String(v || '').trim();
            if (sv !== '' && sv !== 'null' && sv !== 'undefined' && sv !== '지정되지않음' && sv !== '지정되지 않음' && sv !== 'NaN') return v;
        }
        return null;
    };

    const parseNum = (val) => {
        if (val === null || val === undefined) return 0;
        if (typeof val === 'number') return val;
        const s = String(val).replace(/,/g, '').trim();
        const n = parseFloat(s);
        return isNaN(n) ? 0 : n;
    };

    const normalizePnu = (pnu) => {
        const s = String(pnu || '').replace(/[^\d]/g, '');
        if (s.length >= 19) return s.slice(0, 19);
        return s;
    };

    // DEEP SEARCH to find keys in any structure
    const findInJson = (obj, keyRegex) => {
        if (!obj) return null;
        if (typeof obj !== 'object') return null;

        // Exact or current level match
        for (const key of Object.keys(obj)) {
            if (keyRegex.test(key)) return obj[key];
        }

        // Recursive
        for (const key of Object.keys(obj)) {
            if (typeof obj[key] === 'object') {
                const found = findInJson(obj[key], keyRegex);
                if (found) return found;
            }
        }
        return null;
    };

    const extractDongRiBunji = (fullAddr = '') => {
        const m = String(fullAddr).match(/([가-힣0-9]+(?:동|리|읍|면))\s+(\d+(?:-\d+)?)/);
        if (m) return `${m[1]} ${m[2]}`;
        const tokens = String(fullAddr).trim().split(/\s+/);
        if (tokens.length >= 2) return `${tokens[tokens.length - 2]} ${tokens[tokens.length - 1]}`;
        return fullAddr || '-';
    };

    // API 1: LadfrlList (Backup Area/Jimok)
    const fetchLadfrl = async (pnu) => {
        const key = API_CONFIG.VWORLD_KEY;
        const domain = getVworldDomain();
        const url = `/api/vworld/ned/data/ladfrlList`;
        try {
            const res = await axios.get(url, {
                params: { key, domain, pnu, format: 'json', numOfRows: 10, pageNo: 1 },
                timeout: 2000
            });
            const d = safeJson(res.data) ?? res.data;
            if (d) {
                const jimok = findInJson(d, /^(lndcgrCodeNm|lndcgr_code_nm|jimok)$/);
                const area = findInJson(d, /^(lndpclAr|lndpcl_ar|ladAr|lad_ar)$/);
                if (jimok || area) return { jimok, area: parseNum(area) };
            }
        } catch (e) { /* ignore */ }
        return null;
    };

    // API 2: LandCharacteristics (Main)
    const fetchLandCharacteristics = async (pnu) => {
        const key = API_CONFIG.VWORLD_KEY;
        const domain = getVworldDomain();
        const url = `/api/vworld/ned/data/getLandCharacteristics`;
        try {
            const res = await axios.get(url, {
                params: { key, domain, pnu, format: 'json', numOfRows: 10, pageNo: 1 },
                timeout: 3000
            });
            const d = safeJson(res.data) ?? res.data;
            // Use findInJson for flat extraction
            return d;
        } catch (e) { /* ignore */ }
        return null;
    };

    // API 3: WFS (XML Fallback)
    const fetchLandCharacteristicsWFS = async (pnu) => {
        const key = API_CONFIG.VWORLD_KEY;
        // WFS proxy endpoint assumed or direct usage
        const url = `/api/vworld/ned/wfs/getLandCharacteristicsWFS`;
        try {
            const res = await axios.get(url, {
                params: {
                    key, domain: getVworldDomain(), typename: 'dt_d194', pnu,
                    maxFeatures: 1, resultType: 'results', srsName: 'EPSG:4326'
                },
                responseType: 'text',
                timeout: 4000
            });
            const xml = new DOMParser().parseFromString(String(res.data || ''), 'text/xml');
            const pick = (name) => {
                const els = xml.getElementsByTagName('*');
                for (let i = 0; i < els.length; i++) {
                    if (els[i].localName === name) return els[i].textContent?.trim() ?? null;
                }
                return null;
            };

            // Check success
            if (pick('pnu') || pick('lad_ar') || pick('lndpcl_ar')) {
                return {
                    isWfs: true,
                    jimok: pick('lndcgr_code_nm') || pick('indcgr_code_nm'),
                    area: pick('lndpcl_ar') || pick('lad_ar') || pick('ldplc_ar'),
                    price: pick('pblntf_pclnd') || pick('jiga'),
                    usage: pick('lad_use_sittn_nm') || pick('lad_use'),
                    road: pick('road_side_code_nm') || pick('road_side'),
                    use1: pick('prpos_area_1_nm'),
                    use2: pick('prpos_area_2_nm')
                };
            }
        } catch (e) { /* ignore */ }
        return null;
    };

    const picked = React.useMemo(() => {
        const listData = Array.isArray(selectedParcels) && selectedParcels.length > 0
            ? selectedParcels.map(p => ({
                pnu: normalizePnu(p?.properties?.pnu),
                addr: p?.properties?.addr || p?.properties?.address || '',
                feature: p
            }))
            : (selectedAddress?.pnu ? [{
                pnu: normalizePnu(selectedAddress.pnu),
                addr: selectedAddress.parcelAddr || selectedAddress.address || '',
                feature: null
            }] : []);

        const representative = listData[0] || null;
        return { list: listData, representative };
    }, [selectedParcels, selectedAddress]);

    // MAIN DATA FETCH (Sequential REST -> WFS)
    useEffect(() => {
        const run = async () => {
            const repPnu = normalizePnu(picked.representative?.pnu || selectedAddress?.pnu);
            if (!repPnu) { setData({ basic: null, regulation: null }); return; }

            setLoading(true); setError(null);

            // 1. Try Main REST
            let d = await fetchLandCharacteristics(repPnu);
            let source = 'main';

            // 2. Try Backup Ladfrl if main empty
            let lad = null;
            if (!findInJson(d, /^(lndpclAr|lndpcl_ar|ladAr)$/)) {
                lad = await fetchLadfrl(repPnu);
                if (lad) source = 'lad';
            }

            // 3. Try WFS if ALL else fails
            let wfs = null;
            if (source === 'main' && !lad && !findInJson(d, /^(lndpclAr|lndpcl_ar|ladAr)$/)) {
                wfs = await fetchLandCharacteristicsWFS(repPnu);
                if (wfs) source = 'wfs';
            }

            // EXTRACT with Deep Search or Direct Use
            let finalJimok, finalArea, finalPrice, finalUsage, finalRoad, uses = [];

            if (source === 'wfs' && wfs) {
                finalJimok = wfs.jimok;
                finalArea = parseNum(wfs.area);
                finalPrice = parseNum(wfs.price);
                finalUsage = wfs.usage;
                finalRoad = wfs.road;
                uses = [wfs.use1, wfs.use2];
            } else {
                // Combine Main + Lad
                // Main D extraction
                const dJimok = findInJson(d, /^(lndcgrCodeNm|lndcgr_code_nm|indcgrCodeNm|jimok)$/);
                const dArea = findInJson(d, /^(lndpclAr|lndpcl_ar|ldplc_ar|ladAr|lad_ar|parea)$/);
                const dPrice = findInJson(d, /^(pblntfPclnd|pblntf_pclnd|jiga)$/);
                const dUsage = findInJson(d, /^(ladUseSittnNm|lad_use_sittn_nm|ladUse)$/);
                const dRoad = findInJson(d, /^(roadSideCodeNm|road_side_code_nm|roadSide)$/);
                const dPrpos1 = findInJson(d, /^(prposArea1Nm|prpos_area_1_nm|prposArea1)$/);
                const dPrpos2 = findInJson(d, /^(prposArea2Nm|prpos_area_2_nm|prposArea2)$/);

                finalJimok = lad?.jimok || dJimok || '-';
                finalArea = lad?.area || parseNum(dArea);
                finalPrice = parseNum(dPrice);
                finalUsage = dUsage || '-';
                finalRoad = dRoad || '-';
                uses = [dPrpos1, dPrpos2];
            }

            uses = uses.filter(v => v && !/지정되지\s*않음/.test(v) && v !== '-');

            setData({
                basic: {
                    jimok: finalJimok,
                    area: finalArea,
                    price: finalPrice,
                    ladUse: finalUsage,
                    roadSide: finalRoad
                },
                regulation: { uses: uses }
            });

            // WMS is always same
            const wmsUrl = `${API_CONFIG.VWORLD_BASE_URL}/ned/wms/getLandUseWMS?key=${encodeURIComponent(API_CONFIG.VWORLD_KEY)}&domain=${encodeURIComponent(getVworldDomain())}&pnu=${encodeURIComponent(repPnu)}`;
            setLandUseWmsUrl(wmsUrl);
            setShowLandUseWms(true);

            setLoading(false);
        };
        run();
    }, [picked.representative?.pnu, selectedAddress?.pnu]);

    // META FETCH
    useEffect(() => {
        const list = picked.list || [];
        if (list.length === 0) { setParcelMeta({}); return; }

        let active = true;
        (async () => {
            try {
                const pairs = await Promise.all(
                    list.map(async (p) => {
                        const pnu = normalizePnu(p.pnu);
                        if (!pnu) return [null, null];

                        let cPrpos = [];
                        let d = await fetchLadfrl(pnu);

                        const c = await fetchLandCharacteristics(pnu);
                        if (c) {
                            const cUse1 = findInJson(c, /^(prposArea1Nm|prpos_area_1_nm|prposArea1)$/);
                            const cUse2 = findInJson(c, /^(prposArea2Nm|prpos_area_2_nm|prposArea2)$/);
                            if (cUse1) cPrpos.push(cUse1);
                            if (cUse2) cPrpos.push(cUse2);
                        }

                        if (!d && c) {
                            // Try simple characteristics logic if lad fails
                            const cJimok = findInJson(c, /^(lndcgrCodeNm|lndcgr_code_nm|jimok)$/);
                            const cArea = findInJson(c, /^(lndpclAr|lndpcl_ar|ladAr)$/);
                            if (cJimok || cArea) {
                                d = { jimok: cJimok, area: parseNum(cArea) };
                            }
                        }

                        if (d) {
                            return [pnu, { ...d, uses: cPrpos }];
                        }
                        return [pnu, { area: 0, jimok: '-', uses: cPrpos }];
                    })
                );
                if (!active) return;
                const next = {};
                for (const [pnu, v] of pairs) if (pnu && v) next[pnu] = v;
                setParcelMeta(next);
            } catch (e) { console.warn('Meta fill fail:', e); }
        })();
        return () => { active = false; };
    }, [picked.list.map(x => x.pnu).join('|')]);

    const totalAr = Object.values(parcelMeta).reduce((sum, v) => sum + (v.area || 0), 0);
    const displayTotal = totalAr > 0 ? totalAr : (data.basic?.area || 0);

    // Combine Uses from main and all parcels
    const allUsesSet = new Set(data.regulation?.uses || []);
    Object.values(parcelMeta).forEach(v => {
        if (v.uses) v.uses.forEach(u => allUsesSet.add(u));
    });
    const finalCombinedUses = Array.from(allUsesSet).filter(v => v && !/지정되지\s*않음/.test(v) && v !== '-');

    const hdrAddr = selectedAddress?.roadAddr || selectedAddress?.address || picked.representative?.addr || '-';
    const hdrExtra = picked.list.length > 1 ? ` 외 ${picked.list.length - 1}필지` : '';

    const activeFeature = picked.representative?.feature || (selectedParcels && selectedParcels[0]) || null;
    const mx = selectedAddress?.x || selectedAddress?.lon;
    const my = selectedAddress?.y || selectedAddress?.lat;

    return (
        <div className="bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 w-[350px]">
            {/* OpenLayers MiniMap */}
            <div className="p-4 bg-white">
                <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200 relative shadow-inner">
                    {(mx && my)
                        ? <MiniMap x={mx} y={my} feature={activeFeature} />
                        : <div className="w-full h-full bg-gray-100 flex items-center justify-center text-gray-300 text-xs">위치 정보 없음</div>
                    }
                </div>
            </div>

            <div className="p-6 pt-2 border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">대상지 정보</h2>
                <div className="text-xl font-bold text-gray-900 font-serif break-keep leading-tight">
                    {picked.representative ? `${hdrAddr}${hdrExtra}` : '주소를 선택하세요'}
                </div>
            </div>

            <div className="flex-1 p-5 space-y-6 bg-white overflow-y-auto">
                {loading && !data.basic ? (
                    <div className="flex justify-center py-20 opacity-30">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {error && <div className="p-3 bg-red-50 text-red-600 text-[10px] rounded border border-red-100">{error}</div>}

                        <section>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                국토계획법 및 타법령 지역·지구 등
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {finalCombinedUses.length > 0 ? (
                                    finalCombinedUses.map((use, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100">{use}</span>
                                    ))
                                ) : <div className="text-gray-400 text-xs italic">정보 없음</div>}
                            </div>
                        </section>

                        {!specOpen && (
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
                                                <td className="py-3.5 px-4 text-gray-800 font-bold tracking-tight">
                                                    {(data.basic?.area !== null && data.basic?.area !== undefined) ?
                                                        `${Number(data.basic.area).toLocaleString()} m² (${(Number(data.basic.area) * 0.3025).toLocaleString(undefined, { maximumFractionDigits: 2 })} py)`
                                                        : '-'}
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
                        )}

                        {picked.list.length > 0 && (
                            <section className="bg-gray-50/50 rounded-xl border border-gray-200 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                        토지명세표
                                    </h4>
                                    <button onClick={toggleSpec} className="text-xs font-bold text-ink hover:underline">
                                        {specOpen ? '간략히' : '상세보기'}
                                    </button>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold mb-1">총 필지수</div>
                                        <div className="text-lg font-bold text-ink">{picked.list.length}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold mb-1">합계 면적</div>
                                        <div className="text-sm font-bold text-blue-700 tracking-tight">
                                            {displayTotal.toLocaleString()} m² <span className="text-xs text-gray-500 font-normal">({(displayTotal * 0.3025).toLocaleString(undefined, { maximumFractionDigits: 2 })} py)</span>
                                        </div>
                                    </div>
                                </div>
                                {specOpen && (
                                    <div className="overflow-x-auto mt-4 bg-white rounded-lg border border-gray-100">
                                        <table className="w-full text-[10px] text-left">
                                            <thead className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100">
                                                <tr>
                                                    <th className="p-2 text-center w-8">No</th>
                                                    <th className="p-2">지번</th>
                                                    <th className="p-2 text-right">지목</th>
                                                    <th className="p-2 text-right">면적(m²)</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {picked.list.map((p, idx) => {
                                                    const meta = parcelMeta[normalizePnu(p.pnu)] || {};
                                                    const dJimok = first(meta.jimok, p.jimok, '-');
                                                    const dArea = first(meta.area, p.area, null);

                                                    const displayArea = (dArea !== null && dArea !== undefined) ? Number(dArea).toLocaleString() : '-';

                                                    return (
                                                        <tr key={idx}>
                                                            <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                            <td className="p-2 font-medium">{extractDongRiBunji(p.addr)}</td>
                                                            <td className="p-2 text-right">{dJimok}</td>
                                                            <td className="p-2 text-right">
                                                                <div className="font-bold">{displayArea}</div>
                                                                {displayArea !== '-' && <div className="text-[9px] text-gray-400">({(Number(dArea) * 0.3025).toLocaleString(undefined, { maximumFractionDigits: 2 })} py)</div>}
                                                            </td>
                                                        </tr>
                                                    );
                                                })}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {landUseWmsUrl && showLandUseWms && !specOpen && (
                            <section>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                    토지이용계획도
                                </h4>
                                <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative shadow-inner">
                                    <img src={landUseWmsUrl} alt="Plan" className="w-full h-full object-contain" onError={() => setShowLandUseWms(false)} />
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
