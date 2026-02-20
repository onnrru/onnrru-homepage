import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress, selectedParcels }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('regulation'); // 'regulation', 'notice', 'guide', 'devlist'

    // [Multi-Selection] Representative Parcel & Total Area
    const { representativeParcel, totalArea } = React.useMemo(() => {
        const parcels = Array.isArray(selectedParcels) && selectedParcels.length > 0
            ? selectedParcels
            : (selectedAddress?.pnu ? [{ properties: { ...selectedAddress, parea: selectedAddress.area, jiga: selectedAddress.price } }] : []);

        if (parcels.length === 0) return { representativeParcel: null, totalArea: 0 };

        // 1. Find Representative (Max Area)
        const rep = parcels.reduce((best, cur) => {
            const aBest = parseFloat(best?.properties?.parea) || 0;
            const aCur = parseFloat(cur?.properties?.parea) || 0;
            return aCur > aBest ? cur : best;
        }, parcels[0]);

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

    // State for image
    const [mapImageUrl, setMapImageUrl] = useState(null);

    // Helper: Short Jibun Address
    const shortJibun = (addr = '') => {
        const s = String(addr).trim();
        const m = s.match(/([가-힣0-9]+(?:동|리))\s+(\d+(?:-\d+)?)/);
        if (m) return `${m[1]} ${m[2]}`;
        const parts = s.split(/\s+/);
        if (parts.length >= 2) {
            const last = parts[parts.length - 1];
            const prev = parts[parts.length - 2];
            if (/\d/.test(last) && /(동|리)$/.test(prev)) return `${prev} ${last}`;
        }
        return s;
    };

    // Fetch Data Effect
    useEffect(() => {
        const fetchData = async () => {
            // Use Representative Parcel PNU if available, else selectedAddress
            const targetPnu = representativeParcel?.properties?.pnu || selectedAddress?.pnu;
            if (!targetPnu) {
                // If no selection at all
                if (!selectedAddress) {
                    setData({ basic: null, regulation: null, notice: [], guide: [], devlist: [] });
                    setMapImageUrl(null);
                    return;
                }
            }

            setLoading(true);
            setError(null);

            // Coordinates for VWorld Image (Representative or Selected)
            const targetX = representativeParcel?.properties?.x || selectedAddress?.x;
            const targetY = representativeParcel?.properties?.y || selectedAddress?.y;

            if (targetX && targetY) {
                const apiKey = API_CONFIG.VWORLD_KEY;
                const layers = 'lt_c_aisryc,lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun';
                const x = parseFloat(targetX);
                const y = parseFloat(targetY);
                const delta = 0.002;
                const bbox = `${x - delta},${y - delta},${x + delta},${y + delta}`;
                const finalImgUrl = `${API_CONFIG.VWORLD_BASE_URL}/req/image?service=image&request=getmap&key=${apiKey}&format=png&bbox=${bbox}&crs=EPSG:4326&width=500&height=400&layers=${layers}`;
                setMapImageUrl(finalImgUrl);
            } else {
                setMapImageUrl(null);
            }

            // Pre-fill basic info from Representative Parcel
            // Use VWorld properties if available (more reliable for UNM/JIMOK)
            const props = representativeParcel?.properties || {};
            const initialBasic = {
                jimok: props.jimok || selectedAddress?.jimok || '-',
                area: props.parea || selectedAddress?.area || '-',
                price: props.jiga || selectedAddress?.price || '-',
                zone: props.unm || selectedAddress?.zone || '-' // VWorld Zone
            };

            setData(prev => ({ ...prev, basic: initialBasic }));

            try {
                if (!targetPnu) throw new Error("PNU 없음");

                // 1. Regulations (luLawInfo) - Optional for detailed zoning list
                if (activeTab === 'regulation') {
                    const luResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.LULAW}`, {
                        params: { pnu: targetPnu, format: 'xml' }
                    });
                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(luResponse.data, "text/xml");

                    const errCode = xmlDoc.getElementsByTagName("error_code")[0]?.textContent;
                    if (errCode) console.warn(`LuLawInfo API Warning: ${errCode}`);

                    // We rely on VWorld 'unm' for primary zoning, but check API for others
                    const uses = Array.from(xmlDoc.getElementsByTagName("PRPOS_AREA_DSTRC_NM")).map(node => node.textContent);

                    // Allow 0 values
                    const jimokXml = xmlDoc.getElementsByTagName("JIMOK_NM")[0]?.textContent;
                    const areaXml = xmlDoc.getElementsByTagName("JIBUN_AREA")[0]?.textContent;
                    const priceXml = xmlDoc.getElementsByTagName("JIGA")[0]?.textContent;

                    setData(prev => ({
                        ...prev,
                        basic: {
                            ...prev.basic,
                            // Update only if XML has valid data, otherwise keep VWorld/Address data
                            jimok: jimokXml || prev.basic.jimok,
                            area: areaXml || prev.basic.area,
                            price: priceXml || prev.basic.price
                        },
                        regulation: { uses }
                    }));
                }

                // 2. Notice
                if (activeTab === 'notice') {
                    const noticeResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.NOTICE}`, { params: { pnu: targetPnu } });
                    const nParser = new DOMParser();
                    const nXml = nParser.parseFromString(noticeResponse.data, "text/xml");
                    const notices = Array.from(nXml.getElementsByTagName("Map")).map(item => ({
                        title: item.getElementsByTagName("LCNM")[0]?.textContent || "고시",
                        summary: item.getElementsByTagName("NOTIFI_NM")[0]?.textContent || "-",
                        date: item.getElementsByTagName("NOTIFI_DE")[0]?.textContent || "-",
                        author: item.getElementsByTagName("LOCGOV_MANAGE_NM")[0]?.textContent || "-"
                    }));
                    setData(prev => ({ ...prev, notice: notices }));
                }

                // 3. Guide
                if (activeTab === 'guide') {
                    const gResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.GUIDE}`, { params: { pnu: targetPnu } });
                    const gXml = new DOMParser().parseFromString(gResponse.data, "text/xml");
                    const guides = Array.from(gXml.getElementsByTagName("GuideBook")).map(item => ({
                        cat: item.getElementsByTagName("CATE_NM")[0]?.textContent,
                        facil: item.getElementsByTagName("FACIL_NM")[0]?.textContent,
                        desc: item.getElementsByTagName("DESCRIPTION")[0]?.textContent,
                        url: item.getElementsByTagName("ACCESS_URL")[0]?.textContent
                    }));
                    setData(prev => ({ ...prev, guide: guides }));
                }

                // 4. DevList
                if (activeTab === 'devlist') {
                    const dResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.DEVLIST}`, {
                        params: { pnu: targetPnu, pageNo: 1, numOfRows: 10 }
                    });
                    if (dResponse.data && dResponse.data.list) {
                        setData(prev => ({ ...prev, devlist: dResponse.data.list }));
                    }
                }

            } catch (err) {
                console.error("Sidebar API Error:", err);
                const errMsg = err.response ? `Status: ${err.response.status}` : err.message;
                // Keep basic data if we have it
                if (!initialBasic.jimok || initialBasic.jimok === '-') {
                    setError(`정보 로딩 실패: ${errMsg}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, representativeParcel, selectedAddress]);

    // Data Helpers
    const hasArea = (val) => val !== null && val !== undefined && val !== '-';
    const hasPrice = (val) => val !== null && val !== undefined && val !== '-';

    return (
        <div className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[800px]' : 'w-[350px]'}`}>
            {/* Header: Target Site Info */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 mb-1">대상지 정보</h2>
                {representativeParcel ? (
                    <>
                        <div className="text-xl font-bold text-ink font-serif mb-2 break-keep">
                            {representativeParcel.properties?.road || representativeParcel.properties?.addr || '주소 정보 없음'}
                            {selectedParcels && selectedParcels.length > 1 && (
                                <span className="text-sm font-normal text-gray-500 ml-1">
                                    (외 {selectedParcels.length - 1}필지)
                                </span>
                            )}
                        </div>
                        <div className="text-sm text-gray-500">
                            {representativeParcel.properties?.addr || '-'}
                        </div>
                    </>
                ) : (
                    <div className="text-xl font-bold text-ink font-serif mb-2">주소 선택 필요</div>
                )}
            </div>

            {/* Content Section */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Expand Toggle */}
                <div className="p-6 pb-2 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">토지이음 분석 정보</h3>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-2 rounded-full hover:bg-gray-100 text-gray-500 transition-transform ${isExpanded ? 'rotate-180 bg-gray-100' : ''}`}
                        title={isExpanded ? "축소하기" : "상세보기 (확대)"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                {/* Tabs */}
                {isExpanded && (
                    <div className="px-6 border-b border-gray-200 flex gap-4 overflow-x-auto scrollbar-hide">
                        {[{ id: 'regulation', label: '규제정보' }, { id: 'notice', label: '고시정보' }, { id: 'guide', label: '쉬운규제안내' }, { id: 'devlist', label: '개발인허가' }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-ink text-ink' : 'border-transparent text-gray-400 hover:text-gray-600'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                <div className="flex-1 p-6 overflow-y-auto">
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">{error}</div>}

                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
                    ) : (
                        <>
                            {activeTab === 'regulation' && (
                                <div className="space-y-6">
                                    {/* 1. Basic Table */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600 w-1/3">지목</th>
                                                    <td className="py-3 px-4 text-gray-800 font-bold">{data.basic?.jimok || '-'}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">면적</th>
                                                    {/* Display Total Area Here if Multi-Selected, or Rep Area */}
                                                    <td className="py-3 px-4 text-gray-800">
                                                        {hasArea(totalArea) ? `${totalArea.toLocaleString()} m²` : '-'}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">개별공시지가</th>
                                                    <td className="py-3 px-4 text-gray-800">{hasPrice(data.basic?.price) ? `${Number(data.basic.price).toLocaleString()} 원/m²` : '-'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 2. Zoning / Regulations List (Priority: VWorld Zone > API) */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-ink rounded-full"></span>
                                            국토계획법 및 타법령에 따른 지역·지구 등
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {/* Primary: VWorld Zone string split by space or comma */}
                                            {data.basic?.zone && data.basic.zone !== '-' && (
                                                <span className="px-2.5 py-1 bg-indigo-50 text-indigo-700 text-xs font-medium rounded-full border border-indigo-100">
                                                    {data.basic.zone}
                                                </span>
                                            )}

                                            {/* Secondary: API List (prevent duplicates if possible, simpler to just show) */}
                                            {data.regulation?.uses && data.regulation.uses.length > 0 ? (
                                                data.regulation.uses.map((use, i) => (
                                                    <span key={`${use}-${i}`} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                                        {use}
                                                    </span>
                                                ))
                                            ) : (
                                                !data.basic?.zone && <div className="text-gray-400 text-xs">해당 정보 없음</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 3. Land Specification Table (New) */}
                                    {selectedParcels && selectedParcels.length > 0 && (
                                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                                            <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                                <span className="w-1 h-4 bg-ink rounded-full"></span>
                                                토지명세표
                                            </h4>
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-xs text-left">
                                                    <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                                                        <tr>
                                                            <th className="p-2 text-center w-10">No</th>
                                                            <th className="p-2">지번</th>
                                                            <th className="p-2 text-right">면적(m²)</th>
                                                            <th className="p-2 text-center">지목</th>
                                                            <th className="p-2 text-right">공시지가</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-gray-100">
                                                        {selectedParcels.map((p, idx) => (
                                                            <tr key={p.properties?.pnu || idx} className="hover:bg-gray-50 transition-colors">
                                                                <td className="p-2 text-center text-gray-500">{idx + 1}</td>
                                                                <td className="p-2 font-medium">{shortJibun(p.properties?.addr)}</td>
                                                                <td className="p-2 text-right">{parseFloat(p.properties?.parea || 0).toLocaleString()}</td>
                                                                <td className="p-2 text-center">{p.properties?.jimok || '-'}</td>
                                                                <td className="p-2 text-right text-gray-600">{parseFloat(p.properties?.jiga || 0).toLocaleString()}</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                    <tfoot className="bg-gray-50 font-bold border-t border-gray-200">
                                                        <tr>
                                                            <td className="p-2 text-center" colSpan={2}>합계</td>
                                                            <td className="p-2 text-right text-blue-700">{totalArea.toLocaleString()}</td>
                                                            <td className="p-2" colSpan={2}></td>
                                                        </tr>
                                                    </tfoot>
                                                </table>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. Land Use Map (Representative) */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-ink rounded-full"></span>
                                            토지이용규제 확인도면 (용도지역)
                                        </h4>
                                        <div className="w-full aspect-video bg-gray-100 rounded overflow-hidden relative border border-gray-300">
                                            {mapImageUrl ? (
                                                <img src={mapImageUrl} alt="토지이용계획확인도" className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">도면 로드 실패</div>'; }} />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">도면 정보 없음</div>
                                            )}
                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">VWorld</div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 text-right">* VWorld 연속주제도 기반 (실제와 다를 수 있음)</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notice' && (
                                <div className="space-y-3">
                                    {data.notice.length > 0 ? data.notice.map((item, i) => (
                                        <div key={i} className="border-b border-gray-100 pb-3 last:border-0"><div className="font-bold text-sm text-gray-800">{item.summary}</div><div className="text-xs text-gray-500 mt-1">{item.date} | {item.author}</div></div>
                                    )) : <div className="text-center text-gray-400 text-xs py-10">데이터 없음</div>}
                                </div>
                            )}
                            {activeTab === 'guide' && (
                                <div className="space-y-3">
                                    {data.guide.length > 0 ? data.guide.map((item, i) => (
                                        <div key={i} className="bg-green-50 p-3 rounded border border-green-100"><div className="text-xs font-bold text-green-700 mb-1">{item.facil}</div><div className="text-xs text-gray-600">{item.desc}</div></div>
                                    )) : <div className="text-center text-gray-400 text-xs py-10">데이터 없음</div>}
                                </div>
                            )}
                            {activeTab === 'devlist' && (
                                <div className="space-y-3">
                                    {data.devlist.length > 0 ? data.devlist.map((item, i) => (
                                        <div key={i} className="bg-gray-50 p-3 rounded border border-gray-200"><div className="text-sm font-bold text-gray-800">{item.lcNm}</div><div className="text-xs text-gray-500 mt-1">{item.devlopActionPurps}</div></div>
                                    )) : <div className="text-center text-gray-400 text-xs py-10">데이터 없음</div>}
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {!isExpanded && (
                <div className="p-4 border-t border-gray-200">
                    <button className="w-full py-3 bg-ink text-white rounded-lg font-medium shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                        <span>📄 상세 보고서 생성</span>
                    </button>
                </div>
            )}
        </div>
    );
};

export default Sidebar;
