import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress, selectedParcels }) => {
    const [specOpen, setSpecOpen] = useState(false);
    const [charOpen, setCharOpen] = useState(true);

    const [miniMapUrl, setMiniMapUrl] = useState(null);
    const [landUseWmsUrl, setLandUseWmsUrl] = useState(null);
    const [showLandUseWms, setShowLandUseWms] = useState(true);

    const [data, setData] = useState({ basic: null, regulation: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const [parcelMeta, setParcelMeta] = useState({}); // { [pnu]: { area, jimok } }

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

    const first = (...vals) => {
        for (const v of vals) {
            if (v === 0) return 0;
            const sv = String(v || '').trim();
            if (sv !== '' && sv !== 'null' && sv !== 'undefined' && sv !== '지정되지않음' && sv !== '지정되지 않음') return v;
        }
        return null;
    };

    const normalizePnu = (pnu) => {
        const s = String(pnu || '').replace(/[^\d]/g, '');
        if (s.length >= 19) return s.slice(0, 19);
        return s;
    };

    const unwrapNed = (data) => {
        if (!data) return null;
        const candidates = [
            data?.response?.body?.items?.item,
            data?.response?.body?.items,
            data?.response?.result?.items,
            data?.response?.result?.item,
            data?.response?.result,
            data?.body?.items,
            data?.result?.items,
            data?.items,
            data?.item,
            data?.result,
            data
        ];
        for (const candidate of candidates) {
            if (!candidate) continue;

            // Critical: Only return if it contains actual land data fields
            // Checking logic restored as requested in v4.1
            if (Array.isArray(candidate)) {
                if (candidate.length > 0 && typeof candidate[0] === 'object') {
                    const item = candidate[0];
                    if (item && (item.pnu || item.ladAr || item.lad_ar || item.ldplc_ar || item.indcgr_code_nm || item.jimok || item.parea)) {
                        return item;
                    }
                }
                continue;
            }
            if (typeof candidate === 'object') {
                if (candidate.pnu || candidate.ladAr || candidate.lad_ar || candidate.ldplc_ar || candidate.indcgr_code_nm || candidate.jimok || candidate.parea) {
                    return candidate;
                }
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

    // --- Definitive APIs (with fallback support) ---

    // Note: If this fails, we return null so the main loop can fallback
    const fetchAreaOfLandCategory = async (pnuRaw) => {
        try {
            const key = API_CONFIG.VWORLD_KEY;
            const pnu = normalizePnu(pnuRaw);
            const domain = getVworldDomain();
            const url = `/api/vworld/ned/data/getAreaOfLandCategory`;

            // Timeout to prevent hanging if proxy is bad
            const res = await axios.get(url, { params: { key, domain, pnu, format: 'json' }, timeout: 3000 });
            const payload = safeJson(res.data) ?? res.data;
            const d = unwrapNed(payload);

            // If the specific API returns data, use it. If not, return null.
            if (!d) return null;

            const ar = Number(first(d.ladAr, d.lad_ar, d.ldplc_ar, d.area, 0));
            const ji = first(d.indcgrCodeNm, d.indcgr_code_nm, d.lndcgrCodeNm, d.jimok, '-');

            if (ar === 0 && ji === '-') return null; // Treat empty as fail
            return { ladAr: ar, indcgrCodeNm: ji };
        } catch (e) {
            console.warn("fetchAreaOfLandCategory failed, using standard fallback", e);
            return null;
        }
    };

    const fetchLandCharacteristics = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const pnu = normalizePnu(pnuRaw);
        const url = `/api/vworld/ned/data/getLandCharacteristics`;
        const res = await axios.get(url, { params: { key, domain: getVworldDomain(), pnu, format: 'json' } });
        const d = unwrapNed(safeJson(res.data) ?? res.data);
        if (!d) throw new Error('Characteristics not found');
        return d;
    };

    const fetchLandCharacteristicsWFS = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const pnu = normalizePnu(pnuRaw);
        const url = `/api/vworld/ned/wfs/getLandCharacteristicsWFS`;
        const res = await axios.get(url, {
            params: {
                key, domain: getVworldDomain(), typename: 'dt_d194', pnu,
                maxFeatures: 1, resultType: 'results', srsName: 'EPSG:4326',
                output: 'text/xml; subtype=gml/2.1.2'
            },
            responseType: 'text'
        });
        const xml = new DOMParser().parseFromString(String(res.data || ''), 'text/xml');
        const pick = (name) => {
            const els = xml.getElementsByTagName('*');
            for (let i = 0; i < els.length; i++) if (els[i].localName === name) return els[i].textContent?.trim() ?? null;
            return null;
        };
        const pnuFetched = pick('pnu');
        if (!pnuFetched && !pick('indcgr_code_nm')) throw new Error('WFS Empty');
        return {
            prpos_area_1_nm: pick('prpos_area_1_nm'),
            prpos_area_2_nm: pick('prpos_area_2_nm'),
            lad_use_sittn_nm: pick('lad_use_sittn_nm'),
            road_side_code_nm: pick('road_side_code_nm'),
            pblntf_pclnd: pick('pblntf_pclnd'),
            indcgr_code_nm: pick('indcgr_code_nm'),
            ldplc_ar: pick('ldplc_ar')
        };
    };

    // --- Memoized Logic ---
    const picked = React.useMemo(() => {
        const listData = Array.isArray(selectedParcels) && selectedParcels.length > 0
            ? selectedParcels.map(p => ({
                pnu: normalizePnu(p?.properties?.pnu),
                addr: p?.properties?.addr || p?.properties?.address || '',
                jimok: '-',
                area: 0
            }))
            : (selectedAddress?.pnu ? [{
                pnu: normalizePnu(selectedAddress.pnu),
                addr: selectedAddress.parcelAddr || selectedAddress.address || '',
                jimok: '-',
                area: 0
            }] : []);

        const representative = listData[0] || null;
        return { list: listData, representative };
    }, [selectedParcels, selectedAddress]);

    // --- Effects ---

    // 1. Minimap (Cadastral Z19)
    useEffect(() => {
        const x = Number(selectedAddress?.x || selectedAddress?.lon);
        const y = Number(selectedAddress?.y || selectedAddress?.lat);
        if (!x || !y) { setMiniMapUrl(null); return; }

        const delta = 0.00035;
        const bbox = `${x - delta},${y - delta},${x + delta},${y + delta}`;
        const key = API_CONFIG.VWORLD_KEY;
        const domain = getVworldDomain();
        const size = 420;
        const layers = 'LP_PA_CBND_BUBUN';

        // NOTE: Manual construction to ensure correct encoding of VWorld params
        const url = `/api/vworld/req/image?service=image&request=getmap` +
            `&key=${encodeURIComponent(key)}` +
            `&domain=${encodeURIComponent(domain)}` +
            `&crs=EPSG:4326&bbox=${encodeURIComponent(bbox)}` +
            `&width=${size}&height=${size}` +
            `&format=png&transparent=false&bgcolor=0xFFFFFF` +
            `&layers=${encodeURIComponent(layers)}`;
        setMiniMapUrl(url);
    }, [selectedAddress?.x, selectedAddress?.y, selectedAddress?.lon, selectedAddress?.lat]);

    // 2. Main Data Loading
    useEffect(() => {
        const run = async () => {
            const repPnu = normalizePnu(picked.representative?.pnu || selectedAddress?.pnu);
            if (!repPnu) { setData({ basic: null, regulation: null }); return; }

            setLoading(true); setError(null);
            try {
                // (A) Characteristics First (most reliable standard API)
                let d;
                try { d = await fetchLandCharacteristics(repPnu); }
                catch { d = await fetchLandCharacteristicsWFS(repPnu); }

                // (B) Try Area/Jimok Definitive (Optional Enforcer)
                const areaPack = await fetchAreaOfLandCategory(repPnu);

                // Merge Data: Prefer AreaPack if available, otherwise use Standard Characteristics
                const finalJimok = areaPack?.indcgrCodeNm
                    ? areaPack.indcgrCodeNm
                    : first(d.indcgr_code_nm, d.indcgrCodeNm, d.lndcgrCodeNm, d.jimok, '-');

                const finalArea = areaPack?.ladAr
                    ? areaPack.ladAr
                    : Number(first(d.ldplc_ar, d.ldplcAr, d.lad_ar, d.ladAr, d.area, 0));

                setData({
                    basic: {
                        jimok: finalJimok || '-',
                        area: finalArea,
                        price: Number(first(d.pblntf_pclnd, d.pblntfPclnd, d.jiga, 0)),
                        ladUse: first(d.lad_use_sittn_nm, d.ladUseSittnNm, '-'),
                        roadSide: first(d.road_side_code_nm, d.roadSideCodeNm, '-')
                    },
                    regulation: {
                        uses: [d.prpos_area_1_nm, d.prpos_area_2_nm].filter(v => v && !/지정되지\s*않음/.test(v))
                    }
                });

                const wmsUrl = `${API_CONFIG.VWORLD_BASE_URL}/ned/wms/getLandUseWMS?key=${encodeURIComponent(API_CONFIG.VWORLD_KEY)}&domain=${encodeURIComponent(getVworldDomain())}&pnu=${encodeURIComponent(repPnu)}`;
                setLandUseWmsUrl(wmsUrl);
                setShowLandUseWms(true);
            } catch (err) {
                console.error("Sidebar Error:", err);
                setError('정보 조회 실패');
            } finally { setLoading(false); }
        };
        run();
    }, [picked.representative?.pnu, selectedAddress?.pnu]);

    // 3. Parcel Meta (List) - with similar resiliency
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

                        // Try Main Data Reuse
                        if (normalizePnu(picked.representative?.pnu) === pnu && data.basic?.area) {
                            return [pnu, { area: data.basic.area, jimok: data.basic.jimok }];
                        }

                        // Try Cache Fetch
                        let ar = 0;
                        let ji = '-';
                        const aPack = await fetchAreaOfLandCategory(pnu);
                        if (aPack) {
                            ar = aPack.ladAr;
                            ji = aPack.indcgrCodeNm;
                        } else {
                            // If definitive fails, try standard (lightweight fallback if possible, or just accept currently no data)
                            // For list items, we might skip the heavy standard fetch to save requests, 
                            // OR we assume if definitive failed globally, it fails here too.
                            // Let's try standard WFS as a lightweight backup for list items if needed? 
                            // Only if essential. For now, trust aPack or 0 (to avoid N+1 heavy calls).
                        }
                        return [pnu, { area: ar, jimok: ji }];
                    })
                );
                if (!active) return;
                const next = {};
                for (const [pnu, v] of pairs) if (pnu && v) next[pnu] = v;
                setParcelMeta(next);
            } catch (e) { console.warn('Meta fill fail:', e); }
        })();
        return () => { active = false; };
    }, [picked.list.map(x => x.pnu).join('|'), data.basic?.area, data.basic?.jimok]);

    const totalAr = Object.values(parcelMeta).reduce((sum, v) => sum + (v.area || 0), 0);
    const displayTotal = totalAr > 0 ? totalAr : (data.basic?.area || 0);

    const hdrAddr = selectedAddress?.roadAddr || picked.representative?.addr || '-';
    const hdrExtra = picked.list.length > 1 ? ` 외 ${picked.list.length - 1}필지` : '';

    return (
        <div className="bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 w-[350px]">
            {miniMapUrl && (
                <div className="p-4 bg-white">
                    <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200 relative bg-white shadow-inner">
                        <img src={miniMapUrl} alt="Minimap" className="w-full h-full object-cover" />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-4 h-4 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 pt-2 border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">대상지 정보</h2>
                <div className="text-xl font-bold text-gray-900 font-serif break-keep leading-tight">
                    {picked.representative ? `${hdrAddr}${hdrExtra}` : '주소를 선택하세요'}
                </div>
            </div>

            <div className="flex-1 p-6 space-y-8 bg-white overflow-y-auto">
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
                                {data.regulation?.uses.length > 0 ? (
                                    data.regulation.uses.map((use, i) => (
                                        <span key={i} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-[11px] font-bold rounded-lg border border-blue-100">{use}</span>
                                    ))
                                ) : <div className="text-gray-400 text-xs italic">정보 없음</div>}
                            </div>
                        </section>

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
                                        <div className="text-lg font-bold text-blue-700">{displayTotal.toLocaleString()} m²</div>
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
                                                    return (
                                                        <tr key={idx}>
                                                            <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                            <td className="p-2 font-medium">{extractDongRiBunji(p.addr)}</td>
                                                            <td className="p-2 text-right">{dJimok}</td>
                                                            <td className="p-2 text-right font-bold">{dArea != null ? Number(dArea).toLocaleString() : '-'}</td>
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

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                <button className="w-full py-4 bg-ink text-white rounded-xl font-bold shadow-xl hover:bg-black transition-all">
                    📄 상세 분석 보고서 생성
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
