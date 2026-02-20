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

    // Safe number parsing that handles "1,234.5"
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

    const unwrapNed = (data) => {
        if (!data) return null;
        if (data.pnu || data.lndpclAr || data.lndpcl_ar || data.ladAr) return data;
        const candidates = [
            data?.response?.body?.items?.item,
            data?.response?.body?.items,
            data?.response?.result?.items,
            data?.response?.result?.featureCollection?.features,
            data?.landCharacteristics
        ];
        for (const c of candidates) {
            if (!c) continue;
            if (Array.isArray(c)) {
                return c.length > 0 ? c[0] : null;
            }
            if (typeof c === 'object') return c;
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

    const fetchLandCharacteristics = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const pnu = normalizePnu(pnuRaw);
        const domain = getVworldDomain();
        const url = `/api/vworld/ned/data/getLandCharacteristics`;

        try {
            const res = await axios.get(url, {
                params: { key, domain, pnu, format: 'json', numOfRows: 10, pageNo: 1 }
            });
            const d = unwrapNed(safeJson(res.data) ?? res.data);
            if (d) return d;
        } catch (e) {
            console.warn("REST API fail, trying WFS...", e);
        }
        return null;
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
        return {
            prposArea1Nm: pick('prpos_area_1_nm'),
            prposArea2Nm: pick('prpos_area_2_nm'),
            ladUseSittnNm: pick('lad_use_sittn_nm'),
            roadSideCodeNm: pick('road_side_code_nm'),
            pblntfPclnd: pick('pblntf_pclnd'),
            lndcgrCodeNm: pick('lndcgrCodeNm') || pick('indcgr_code_nm'),
            lndpclAr: pick('lndpclAr') || pick('ldplc_ar') || pick('lad_ar')
        };
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

    useEffect(() => {
        const run = async () => {
            const repPnu = normalizePnu(picked.representative?.pnu || selectedAddress?.pnu);
            if (!repPnu) { setData({ basic: null, regulation: null }); return; }

            setLoading(true); setError(null);
            try {
                let d = await fetchLandCharacteristics(repPnu);
                if (!d) {
                    try { d = await fetchLandCharacteristicsWFS(repPnu); } catch { }
                }

                if (!d) throw new Error("No Data");

                const jimok = first(
                    d.lndcgrCodeNm, d.lndcgr_code_nm,
                    d.indcgrCodeNm, d.indcgr_code_nm,
                    d.jimok, '-'
                );

                // Use parseNum to handle comma-separated strings
                const area = parseNum(first(
                    d.lndpclAr, d.lndpcl_ar,
                    d.ldplcAr, d.ldplc_ar,
                    d.ladAr, d.lad_ar,
                    d.parea, 0
                ));

                const price = parseNum(first(
                    d.pblntfPclnd, d.pblntf_pclnd,
                    d.jiga, 0
                ));

                const usage = first(
                    d.ladUseSittnNm, d.lad_use_sittn_nm,
                    d.ladUse, '-'
                );

                const road = first(
                    d.roadSideCodeNm, d.road_side_code_nm,
                    d.roadSide, '-'
                );

                const uses = [
                    first(d.prposArea1Nm, d.prpos_area_1_nm, d.prposArea1),
                    first(d.prposArea2Nm, d.prpos_area_2_nm, d.prposArea2)
                ].filter(v => v && !/지정되지\s*않음/.test(v));

                setData({
                    basic: {
                        jimok: jimok,
                        area: area,
                        price: price,
                        ladUse: usage,
                        roadSide: road
                    },
                    regulation: { uses: uses }
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

    // Parcel Meta
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
                        try {
                            const d = await fetchLandCharacteristics(pnu) || await fetchLandCharacteristicsWFS(pnu);
                            if (d) {
                                return [pnu, {
                                    area: parseNum(first(d.lndpclAr, d.lndpcl_ar, d.ldplc_ar, 0)),
                                    jimok: first(d.lndcgrCodeNm, d.lndcgr_code_nm, d.indcgrCodeNm, '-')
                                }];
                            }
                            return [pnu, { area: 0, jimok: '-' }];
                        } catch {
                            return [pnu, { area: 0, jimok: '-' }];
                        }
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
                                                {(data.basic?.area !== null && data.basic?.area !== undefined) ? `${Number(data.basic.area).toLocaleString()} m²` : '-'}
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

                                                    const displayArea = (dArea !== null && dArea !== undefined) ? Number(dArea).toLocaleString() : '-';

                                                    return (
                                                        <tr key={idx}>
                                                            <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                            <td className="p-2 font-medium">{extractDongRiBunji(p.addr)}</td>
                                                            <td className="p-2 text-right">{dJimok}</td>
                                                            <td className="p-2 text-right font-bold">{displayArea}</td>
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
