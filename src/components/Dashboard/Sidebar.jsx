import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress, selectedParcels }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('notice'); // 'notice', 'guide', 'devlist'
    const [showSpecTable, setShowSpecTable] = useState(false);
    const [landUseWmsUrl, setLandUseWmsUrl] = useState(null);
    const [landUseWmsOk, setLandUseWmsOk] = useState(true);

    // [Multi-Selection] Representative Parcel & Total Area
    const { representativeParcel, totalArea } = React.useMemo(() => {
        const parcels = Array.isArray(selectedParcels) && selectedParcels.length > 0
            ? selectedParcels
            : (selectedAddress?.pnu ? [{ properties: { ...selectedAddress, parea: selectedAddress.area, jiga: selectedAddress.price } }] : []);

        if (parcels.length === 0) return { representativeParcel: null, totalArea: 0 };

        // 1. Find Representative (Max Area)
        const rep = [...parcels].sort((a, b) => (parseFloat(b.properties?.parea) || 0) - (parseFloat(a.properties?.parea) || 0))[0];

        // 2. Calculate Total Area
        const total = parcels.reduce((sum, p) => sum + (parseFloat(p?.properties?.parea) || 0), 0);

        return { representativeParcel: rep, totalArea: total };
    }, [selectedParcels, selectedAddress]);

    // Data States
    const [data, setData] = useState({
        basic: null,
        regulation: null,
        notice: [],
        guide: [],
        devlist: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Helper: Pick first valid value from keys
    const pickFirst = (obj, keys) => {
        for (const k of keys) {
            const v = obj?.[k];
            if (v !== undefined && v !== null && v !== '') return v;
        }
        return null;
    };

    // Helper: Precise Address extraction (Dong/Li + Number)
    const extractDongRiBunji = (addr = '') => {
        const m = String(addr).match(/([가-힣]+[동리])\s*(\d+(?:-\d+)*)/);
        if (m) return `${m[1]} ${m[2]}`;
        const parts = String(addr).trim().split(/\s+/);
        if (parts.length >= 2) return `${parts[parts.length - 2]} ${parts[parts.length - 1]}`;
        return addr || '-';
    };

    // Fetch Data Effect
    useEffect(() => {
        const fetchData = async () => {
            const targetPnu = representativeParcel?.properties?.pnu || selectedAddress?.pnu;
            if (!targetPnu) {
                if (!selectedAddress) {
                    setData({ basic: null, regulation: null, notice: [], guide: [], devlist: [] });
                    setLandUseWmsUrl(null);
                    return;
                }
            }

            setLoading(true);
            setError(null);

            try {
                const apiKey = API_CONFIG.VWORLD_KEY;
                const nedUrl = `${API_CONFIG.VWORLD_BASE_URL}/ned/data/getLandCharacteristics`;

                const res = await axios.get(nedUrl, {
                    params: {
                        key: apiKey,
                        pnu: targetPnu,
                        format: 'json',
                        domain: window.location.hostname
                    }
                });

                const root = res.data?.response?.result || res.data?.result || res.data;

                // Parsing with candidates
                const jimok = pickFirst(root, ['jimokNm', 'JIMOK_NM', 'jimok', 'JIMOK']) || representativeParcel?.properties?.jimok || '-';
                const area = pickFirst(root, ['landArea', 'LAND_AREA', 'parea', 'PAREA', 'area']) || representativeParcel?.properties?.parea || '-';
                const jiga = pickFirst(root, ['pblntfPclnd', 'JIGA', 'jiga', 'price']) || representativeParcel?.properties?.jiga || '-';
                const zone1 = pickFirst(root, ['prposAreaNm1', 'PRPOS_AREA_NM1', 'use1']);
                const zone2 = pickFirst(root, ['prposAreaNm2', 'PRPOS_AREA_NM2', 'use2']);
                const landUseArr = [
                    pickFirst(root, ['landUse', 'LAND_USE']),
                    pickFirst(root, ['lndcgr', 'LND_CGR'])
                ].filter(Boolean);
                const landUse = landUseArr.length > 0 ? landUseArr[0] : '-';
                const roadSide = pickFirst(root, ['roadSide', 'ROAD_SIDE', 'rdSide', 'RD_SIDE']) || '-';

                setData(prev => ({
                    ...prev,
                    basic: { jimok, area, price: jiga, landUse, roadSide },
                    regulation: { uses: [zone1, zone2].filter(Boolean) }
                }));

                // 2. Land Use WMS Map
                const wmsUrl = `${API_CONFIG.VWORLD_BASE_URL}/ned/wms/getLandUseWMS?key=${apiKey}&pnu=${targetPnu}`;
                setLandUseWmsOk(true);
                setLandUseWmsUrl(wmsUrl);

            } catch (err) {
                console.error("NED API Error:", err);
                // Fallback to feature properties if NED fails
                const props = representativeParcel?.properties || selectedAddress || {};
                setData(prev => ({
                    ...prev,
                    basic: {
                        jimok: props.jimok || '-',
                        area: props.parea || props.area || '-',
                        price: props.jiga || props.price || '-',
                        landUse: '-',
                        roadSide: '-'
                    },
                    regulation: { uses: [props.unm || props.zone].filter(Boolean) }
                }));
                setLandUseWmsUrl(null);
            } finally {
                setLoading(false);
            }

            // Background Fetch: Notice, Guide, DevList
            if (targetPnu) {
                try {
                    const noticeResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.NOTICE}`, { params: { pnu: targetPnu } });
                    const nXml = new DOMParser().parseFromString(noticeResponse.data, "text/xml");
                    const notices = Array.from(nXml.getElementsByTagName("Map")).map(item => ({
                        summary: item.getElementsByTagName("NOTIFI_NM")[0]?.textContent || "-",
                        date: item.getElementsByTagName("NOTIFI_DE")[0]?.textContent || "-"
                    }));
                    setData(prev => ({ ...prev, notice: notices }));
                } catch (e) { }
            }
        };

        fetchData();
    }, [representativeParcel, selectedAddress]);

    const hasValue = (val) => val !== null && val !== undefined && val !== '-';

    // UI Formatting
    const repAddress = representativeParcel?.properties?.road || representativeParcel?.properties?.addr || selectedAddress?.roadAddr || selectedAddress?.address;
    const extraPCount = selectedParcels && selectedParcels.length > 1 ? ` 외 ${selectedParcels.length - 1}필지` : '';

    return (
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[800px]' : 'w-[350px]'}`}>
            {/* 1. Header: Target Area Info */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0 bg-white shadow-sm">
                <h2 className="text-xs font-bold text-ink uppercase tracking-wider mb-2">대상지 정보</h2>
                <div className="text-xl font-bold text-gray-900 font-serif break-keep leading-tight">
                    {repAddress || '주소 선택 필요'}{extraPCount}
                </div>
                {representativeParcel?.properties?.addr && (
                    <div className="text-sm text-gray-500 mt-1">
                        {representativeParcel.properties.addr}
                    </div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 p-6 space-y-8 bg-white overflow-y-auto">
                {loading ? (
                    <div className="flex flex-col items-center justify-center h-full py-10">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mb-4"></div>
                        <p className="text-xs text-gray-400">데이터를 불러오는 중...</p>
                    </div>
                ) : (
                    <>
                        {/* 2. Zoning Section */}
                        <section>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-ink rounded-full"></span>
                                국토계획법 및 타법령 지역·지구 등
                            </h4>
                            <div className="flex flex-wrap gap-2">
                                {data.regulation?.uses && data.regulation.uses.length > 0 ? (
                                    data.regulation.uses.map((use, i) => (
                                        <span key={`${use}-${i}`} className="px-3 py-1.5 bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-blue-100">
                                            {use}
                                        </span>
                                    ))
                                ) : (
                                    <div className="text-gray-400 text-xs italic">정보 없음</div>
                                )}
                            </div>
                        </section>

                        {/* 3. Land Characteristics Table */}
                        <section>
                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <span className="w-1 h-4 bg-ink rounded-full"></span>
                                토지 기본특성
                            </h4>
                            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                <table className="w-full text-sm">
                                    <tbody className="divide-y divide-gray-100">
                                        <tr>
                                            <th className="bg-gray-50/50 py-3 px-4 text-left font-medium text-gray-500 w-1/3">지목</th>
                                            <td className="py-3 px-4 text-gray-800 font-bold">{data.basic?.jimok || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3 px-4 text-left font-medium text-gray-500">면적</th>
                                            <td className="py-3 px-4 text-gray-800 font-bold">
                                                {hasValue(data.basic?.area) ? `${Number(data.basic.area).toLocaleString()} m²` : '-'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3 px-4 text-left font-medium text-gray-500">공시지가</th>
                                            <td className="py-3 px-4 text-gray-800 font-bold">
                                                {hasValue(data.basic?.price) ? `${Number(data.basic.price).toLocaleString()} 원/m²` : '-'}
                                            </td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3 px-4 text-left font-medium text-gray-500">이용상황</th>
                                            <td className="py-3 px-4 text-gray-800">{data.basic?.landUse || '-'}</td>
                                        </tr>
                                        <tr>
                                            <th className="bg-gray-50/50 py-3 px-4 text-left font-medium text-gray-500">도로접면</th>
                                            <td className="py-3 px-4 text-gray-800">{data.basic?.roadSide || '-'}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </section>

                        {/* 4. Land Specification (Collapsible) */}
                        {selectedParcels && selectedParcels.length > 0 && (
                            <section className="bg-gray-50/50 rounded-xl border border-gray-200 p-4">
                                <div className="flex justify-between items-center mb-3">
                                    <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                        <span className="w-1 h-4 bg-ink rounded-full"></span>
                                        토지명세표
                                    </h4>
                                    <button
                                        onClick={() => setShowSpecTable(!showSpecTable)}
                                        className="text-xs font-bold text-ink hover:underline flex items-center gap-1"
                                    >
                                        {showSpecTable ? '상세 숨기기' : '상세 보기'}
                                        <svg className={`w-3 h-3 transition-transform ${showSpecTable ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-4 mb-3">
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">총 필지수</div>
                                        <div className="text-lg font-bold text-ink">{selectedParcels.length} <span className="text-sm font-normal text-gray-500">필지</span></div>
                                    </div>
                                    <div className="bg-white p-3 rounded-lg border border-gray-100 shadow-sm">
                                        <div className="text-[10px] text-gray-400 font-bold uppercase mb-1">합계 면적</div>
                                        <div className="text-lg font-bold text-blue-700">{totalArea.toLocaleString()} <span className="text-sm font-normal text-gray-500">m²</span></div>
                                    </div>
                                </div>

                                {showSpecTable && (
                                    <div className="overflow-x-auto mt-4 bg-white rounded-lg border border-gray-100">
                                        <table className="w-full text-[11px] text-left">
                                            <thead className="bg-gray-50 text-gray-400 font-bold border-b border-gray-100 uppercase tracking-tighter">
                                                <tr>
                                                    <th className="p-2 text-center w-8">No</th>
                                                    <th className="p-2">지번</th>
                                                    <th className="p-2 text-right">면적</th>
                                                    <th className="p-2 text-center">지목</th>
                                                    <th className="p-2 text-right">공시지가</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-gray-50">
                                                {selectedParcels.map((p, idx) => (
                                                    <tr key={p.properties?.pnu || idx} className="hover:bg-gray-50 transition-colors">
                                                        <td className="p-2 text-center text-gray-400">{idx + 1}</td>
                                                        <td className="p-2 font-medium break-all">{extractDongRiBunji(p.properties?.addr)}</td>
                                                        <td className="p-2 text-right">{parseFloat(p.properties?.parea || 0).toLocaleString()}</td>
                                                        <td className="p-2 text-center">{p.properties?.jimok || '-'}</td>
                                                        <td className="p-2 text-right text-gray-500">
                                                            {hasValue(p.properties?.jiga) ? Number(p.properties.jiga).toLocaleString() : '-'}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                            <tfoot className="bg-blue-50/30 font-bold border-t border-blue-100">
                                                <tr>
                                                    <td className="p-2 text-center" colSpan={2}>합계</td>
                                                    <td className="p-2 text-right text-blue-700">{totalArea.toLocaleString()}</td>
                                                    <td className="p-2" colSpan={2}></td>
                                                </tr>
                                            </tfoot>
                                        </table>
                                    </div>
                                )}
                            </section>
                        )}

                        {/* 5. Land Use Plan Map (Self-hiding) */}
                        {landUseWmsUrl && landUseWmsOk && (
                            <section>
                                <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                    <span className="w-1 h-4 bg-ink rounded-full"></span>
                                    토지이용계획도
                                </h4>
                                <div className="w-full aspect-video bg-gray-50 rounded-xl overflow-hidden border border-gray-200 relative shadow-inner">
                                    <img
                                        src={landUseWmsUrl}
                                        alt="토지이용계획도"
                                        className="w-full h-full object-contain"
                                        onError={() => setLandUseWmsOk(false)}
                                    />
                                    <div className="absolute bottom-2 right-2 px-1.5 py-0.5 bg-black/40 text-white text-[9px] rounded backdrop-blur-sm">VWorld NED</div>
                                </div>
                                <p className="mt-2 text-[10px] text-gray-400 text-right italic font-serif">* 국토교통부 NSDI 데이터센터 기반</p>
                            </section>
                        )}
                    </>
                )}
            </div>

            {/* 6. Bottom Actions: Toggle & Detailed Report */}
            <div className="p-4 border-t border-gray-200 bg-gray-50/50">
                <div className="mb-4 flex justify-between items-center group cursor-pointer" onClick={() => setIsExpanded(!isExpanded)}>
                    <h3 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        토지이음 분석정보 →
                        <svg className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" />
                        </svg>
                    </h3>
                    <div className="h-px flex-1 bg-gray-200 mx-4"></div>
                </div>

                {isExpanded && (
                    <div className="mb-6 bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                        <div className="flex border-b border-gray-100">
                            {[{ id: 'notice', label: '고시' }, { id: 'guide', label: '안내' }, { id: 'devlist', label: '개발' }].map(tab => (
                                <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`flex-1 py-3 text-xs font-bold transition-colors ${activeTab === tab.id ? 'bg-ink text-white' : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'}`}>
                                    {tab.label}
                                </button>
                            ))}
                        </div>
                        <div className="p-4 max-h-[300px] overflow-y-auto">
                            {activeTab === 'notice' && (
                                <div className="space-y-4">
                                    {data.notice.length > 0 ? data.notice.map((item, i) => (
                                        <div key={i} className="group border-b border-gray-50 pb-2 last:border-0">
                                            <div className="font-bold text-[11px] text-gray-800 group-hover:text-ink transition-colors">{item.summary}</div>
                                            <div className="text-[10px] text-gray-400 mt-1">{item.date}</div>
                                        </div>
                                    )) : <div className="text-center text-gray-400 text-[11px] py-10">데이터 없음</div>}
                                </div>
                            )}
                            {['guide', 'devlist'].includes(activeTab) && (
                                <div className="text-center text-gray-400 text-[11px] py-10 px-4">해당 탭 정보는 상세보고서에서 확인 가능합니다.</div>
                            )}
                        </div>
                    </div>
                )}

                {!isExpanded && (
                    <button className="w-full py-3.5 bg-ink text-white rounded-xl font-bold shadow-xl hover:bg-black hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2">
                        <span>📄상세 분석 보고서 생성</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
