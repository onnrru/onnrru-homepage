import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress, selectedParcels }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [specOpen, setSpecOpen] = useState(false);
    const [charOpen, setCharOpen] = useState(true);

    const [miniMapUrl, setMiniMapUrl] = useState(null);
    const [landUseWmsUrl, setLandUseWmsUrl] = useState(null);
    const [showLandUseWms, setShowLandUseWms] = useState(true);

    const toggleSpec = () => {
        const next = !specOpen;
        setSpecOpen(next);
        setCharOpen(!next);
    };

    const toggleChar = () => {
        const next = !charOpen;
        setCharOpen(next);
        setSpecOpen(!next);
    };

    const getVworldDomain = () => window.location.origin;

    const safeJson = (maybe) => {
        if (typeof maybe === 'string') {
            try { return JSON.parse(maybe); } catch { return null; }
        }
        return maybe;
    };

    const first = (...vals) => {
        for (const v of vals) {
            if (v === 0) return 0;
            if (v !== null && v !== undefined && String(v).trim() !== '' && v !== '지정되지않음' && v !== '지정되지 않음') return v;
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
        const paths = [
            data?.response?.body?.items?.item?.[0],
            data?.response?.body?.items?.[0],
            data?.response?.result?.items?.[0],
            data?.response?.result?.item?.[0],
            data?.body?.items?.[0],
            data?.result?.items?.[0],
            data?.items?.[0],
            data?.item?.[0],
            data?.features?.[0]?.properties,
            data?.features?.[0],
            data?.response?.result,
            data?.result,
            data
        ];
        for (const p of paths) {
            if (p && typeof p === 'object' && !Array.isArray(p)) {
                if (p.pnu || p.pblntf_pclnd || p.ldplc_ar || p.lndcgr_code_nm || p.indcgr_code_nm || p.jimok || p.lndpcl_ar || p.parea || p.area) {
                    return p;
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

    const picked = React.useMemo(() => {
        const listData = Array.isArray(selectedParcels) && selectedParcels.length > 0
            ? selectedParcels.map(p => {
                const props = p?.properties || {};
                return {
                    pnu: props.pnu,
                    addr: props.addr || props.address || '',
                    jimok: first(props.jimok, props.indcgr_code_nm, props.lndcgr_code_nm, props.jimok_nm, props.lndcgr_nm, '-'),
                    area: Number(first(props.parea, props.area, props.ldplc_ar, props.lndpcl_ar, props.lndcl_ar, 0)),
                    price: Number(first(props.jiga, props.price, props.pblntf_pclnd, 0)),
                };
            })
            : (selectedAddress?.pnu ? [{
                pnu: selectedAddress.pnu,
                addr: selectedAddress.parcelAddr || selectedAddress.address || '',
                jimok: first(selectedAddress.jimok, selectedAddress.indcgr_code_nm, selectedAddress.lndcgr_code_nm, '-'),
                area: Number(first(selectedAddress.area, selectedAddress.parea, selectedAddress.ldplc_ar, 0)),
                price: Number(first(selectedAddress.price, selectedAddress.jiga, 0))
            }] : []);

        const totalArea = listData.reduce((sum, item) => sum + item.area, 0);
        const representative = [...listData].sort((a, b) => b.area - a.area)[0] || null;

        return { list: listData, representative, totalArea };
    }, [selectedParcels, selectedAddress]);

    const [data, setData] = useState({ basic: null, regulation: null });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const fetchLandCharacteristics = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const domain = getVworldDomain();
        const pnu = normalizePnu(pnuRaw);
        const url = `/api/vworld/ned/data/getLandCharacteristics`;

        const res = await axios.get(url, { params: { key, domain, pnu, format: 'json' } });
        const payload = safeJson(res.data) ?? res.data;
        const d = unwrapNed(payload);
        if (!d) throw new Error('NED JSON record not found');

        return {
            pnu: first(d.pnu, pnu),
            indcgr_code_nm: first(d.indcgr_code_nm, d.indcgrCodeNm, d.lndcgr_code_nm, d.jimok_nm, d.jimok, d.lndcgr_nm),
            ldplc_ar: first(d.ldplc_ar, d.ldplcAr, d.lndpcl_ar, d.lndpclAr, d.ar, d.area, d.parea, d.PAREA, d.lndcl_ar),
            pblntf_pclnd: first(d.pblntf_pclnd, d.pblntfPclnd, d.jiga, d.JIGA),
            prpos_area_1_nm: first(d.prpos_area_1_nm, d.prposArea1Nm),
            prpos_area_2_nm: first(d.prpos_area_2_nm, d.prposArea2Nm),
            lad_use_sittn_nm: first(d.lad_use_sittn_nm, d.ladUseSittnNm),
            road_side_code_nm: first(d.road_side_code_nm, d.roadSideCodeNm)
        };
    };

    const fetchLandCharacteristicsWFS = async (pnuRaw) => {
        const key = API_CONFIG.VWORLD_KEY;
        const domain = getVworldDomain();
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
        if (text.trim().startsWith('<!DOCTYPE html') || text.trim().startsWith('<html')) throw new Error('HTML returned');

        const xml = new DOMParser().parseFromString(text, 'text/xml');
        const pickLocal = (name) => {
            const els = xml.getElementsByTagName('*');
            for (let i = 0; i < els.length; i++) if (els[i].localName === name) return els[i].textContent?.trim() ?? null;
            return null;
        };

        return {
            pnu: pickLocal('pnu') || pnu,
            indcgr_code_nm: first(pickLocal('indcgr_code_nm'), pickLocal('lndcgr_code_nm'), pickLocal('jimok_nm')),
            ldplc_ar: first(pickLocal('ldplc_ar'), pickLocal('lndpcl_ar'), pickLocal('ar'), pickLocal('area')),
            pblntf_pclnd: pickLocal('pblntf_pclnd'),
            prpos_area_1_nm: pickLocal('prpos_area_1_nm'),
            prpos_area_2_nm: pickLocal('prpos_area_2_nm'),
            lad_use_sittn_nm: pickLocal('lad_use_sittn_nm'),
            road_side_code_nm: pickLocal('road_side_code_nm')
        };
    };

    useEffect(() => {
        const x = Number(selectedAddress?.x || selectedAddress?.lon);
        const y = Number(selectedAddress?.y || selectedAddress?.lat);
        if (!x || !y) { setMiniMapUrl(null); return; }

        const key = API_CONFIG.VWORLD_KEY;
        const domain = getVworldDomain();
        const size = 400;
        const delta = 0.0008;
        const bboxWMS = `${y - delta},${x - delta},${y + delta},${x + delta}`;

        const params = `SERVICE=WMS&REQUEST=GetMap&VERSION=1.3.0` +
            `&CRS=EPSG:4326&BBOX=${encodeURIComponent(bboxWMS)}` +
            `&WIDTH=${size}&HEIGHT=${size}&FORMAT=image/png&TRANSPARENT=FALSE` +
            `&EXCEPTIONS=text/xml&KEY=${key}&DOMAIN=${encodeURIComponent(domain)}`;

        // 'white' for White Map (백지도)
        const layers = ['white', 'LT_C_UQ111', 'LT_C_UQ112', 'LT_C_UQ113', 'LP_PA_CBND_BUBUN'].join(',');
        const url = `/api/vworld/req/wms?${params}&LAYERS=${encodeURIComponent(layers)}`;

        setMiniMapUrl(url);
    }, [selectedAddress?.x, selectedAddress?.y, selectedAddress?.lon, selectedAddress?.lat]);

    useEffect(() => {
        const run = async () => {
            const 대표Pnu = normalizePnu(picked.representative?.pnu || selectedAddress?.pnu);
            if (!대표Pnu) { setData({ basic: null, regulation: null }); setLandUseWmsUrl(null); return; }

            setLoading(true); setError(null);
            try {
                let c;
                try { c = await fetchLandCharacteristics(대표Pnu); }
                catch (e) { c = await fetchLandCharacteristicsWFS(대표Pnu); }

                setData({
                    basic: {
                        jimok: first(c.indcgr_code_nm, picked.representative?.jimok, '-'),
                        area: Number(first(c.ldplc_ar, picked.representative?.area, 0)),
                        price: Number(first(c.pblntf_pclnd, picked.representative?.price, 0)),
                        ladUse: c.lad_use_sittn_nm || '-',
                        roadSide: c.road_side_code_nm || '-'
                    },
                    regulation: {
                        uses: [c.prpos_area_1_nm, c.prpos_area_2_nm].filter(v => v && v !== '지정되지않음' && v !== '지정되지 않음')
                    }
                });

                const key = API_CONFIG.VWORLD_KEY;
                const url = `${API_CONFIG.VWORLD_BASE_URL}/ned/wms/getLandUseWMS?key=${encodeURIComponent(key)}&domain=${encodeURIComponent(getVworldDomain())}&pnu=${encodeURIComponent(대표Pnu)}`;
                setLandUseWmsUrl(url);
                setShowLandUseWms(true);
            } catch (err) {
                console.error("Sidebar Error:", err);
                setError(`정보 로딩 오류`);
            } finally { setLoading(false); }
        };
        run();
    }, [picked.representative?.pnu, selectedAddress?.pnu]);

    const 대표필지 = picked.representative;
    const 대표도로주소 = selectedAddress?.roadAddr || 대표필지?.addr || '-';
    const 외필지표시 = picked.list.length > 1 ? ` 외 ${picked.list.length - 1}필지` : '';

    return (
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[800px]' : 'w-[350px]'}`}>

            {miniMapUrl && (
                <div className="p-4 bg-white">
                    <div className="w-full aspect-square rounded-xl overflow-hidden border border-gray-200 relative bg-white shadow-inner">
                        <img
                            src={miniMapUrl}
                            alt="민이맵"
                            className="w-full h-full object-cover"
                            onError={() => setMiniMapUrl(null)}
                        />
                        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                            <div className="w-3.5 h-3.5 rounded-full bg-red-500 border-2 border-white shadow-lg animate-pulse" />
                        </div>
                    </div>
                </div>
            )}

            <div className="p-6 pt-2 border-b border-gray-100 flex-shrink-0 bg-white">
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">대상지 정보</h2>
                <div className="text-xl font-bold text-gray-900 font-serif break-keep leading-tight">
                    {대표필지 ? `${대표도로주소}${외필지표시}` : '주소 선택 필요'}
                </div>
            </div>

            <div className="flex-1 p-6 space-y-8 bg-white overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                    </div>
                ) : (
                    <>
                        {error && <div className="p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">{error}</div>}

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

                        <section>
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                    <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                    토지 기본특성
                                </h4>
                                <button onClick={toggleChar} className="text-[10px] font-bold text-gray-400 hover:text-ink">
                                    {charOpen ? '간략히' : '상세히'}
                                </button>
                            </div>

                            {charOpen && (
                                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm transition-all">
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
                            )}
                        </section>

                        {picked.list.length > 0 && (
                            <section className="bg-gray-50/50 rounded-xl border border-gray-200 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1.5 h-4 bg-ink rounded-full"></span>
                                        토지명세표
                                    </h4>
                                    <button
                                        onClick={toggleSpec}
                                        className="text-xs font-bold text-ink hover:underline flex items-center gap-1"
                                    >
                                        {specOpen ? '간략히' : '상세보기'}
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">총 필지수</div>
                                        <div className="text-lg font-bold text-ink">{picked.list.length}</div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">합계 면적</div>
                                        <div className="text-lg font-bold text-blue-700">{picked.totalArea.toLocaleString()} m²</div>
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
                                                {picked.list.map((p, idx) => (
                                                    <tr key={p.pnu || idx}>
                                                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                        <td className="p-2 font-medium">{extractDongRiBunji(p.addr)}</td>
                                                        <td className="p-2 text-right">{p.jimok || '-'}</td>
                                                        <td className="p-2 text-right font-bold">{p.area.toLocaleString()}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

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
                                </div>
                            </section>
                        )}
                    </>
                )}
            </div>

            <div className="p-6 border-t border-gray-100 bg-gray-50/50 mt-auto">
                <button className="w-full py-4 bg-ink text-white rounded-xl font-bold">
                    📄 상세 분석 보고서 생성
                </button>
            </div>
        </div>
    );
};

export default Sidebar;
