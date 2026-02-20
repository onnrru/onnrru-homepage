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

    // Helper: Short Jibun Address (Dong/Li + Number extraction)
    const shortJibun = (addr = '') => {
        const tokens = String(addr).split(/\s+/).filter(Boolean);
        // Find last token ending with '동' or '리' that has a subsequent token (number)
        for (let i = tokens.length - 1; i >= 0; i--) {
            if (/[동리]$/.test(tokens[i]) && tokens[i + 1]) {
                // If next token looks like a number (e.g., 123, 123-4)
                if (/^\d+(-\d+)?$/.test(tokens[i + 1])) return `${tokens[i]} ${tokens[i + 1]}`;
            }
        }
        // Fallback: take last two tokens
        return tokens.slice(-2).join(' ');
    };

    // Fetch Data Effect
    useEffect(() => {
        const fetchData = async () => {
            // Priority: Representative Parcel PNU > Selected Address PNU
            const targetPnu = representativeParcel?.properties?.pnu || selectedAddress?.pnu;
            if (!targetPnu) {
                if (!selectedAddress) {
                    setData({ basic: null, regulation: null, notice: [], guide: [], devlist: [] });
                    return;
                }
            }

            setLoading(true);
            setError(null);

            // Pre-fill basic info from selection
            const props = representativeParcel?.properties || {};
            const initialBasic = {
                jimok: props.jimok || selectedAddress?.jimok || '-',
                area: props.parea || selectedAddress?.area || '-',
                price: props.jiga || selectedAddress?.price || '-',
                zone: props.unm || selectedAddress?.zone || '-',
                bcr: '-', // 건폐율
                far: '-'  // 용적률
            };

            setData(prev => ({ ...prev, basic: initialBasic }));

            try {
                if (!targetPnu) throw new Error("PNU 없음");

                // 1. Regulations (luLawInfo with Code Search)
                if (activeTab === 'regulation') {
                    const areaCd = targetPnu.substring(0, 5);
                    const zoneString = props.unm || selectedAddress?.zone || '';
                    // Split zone names (e.g., "제1종일반주거지역, 가축사육제한구역")
                    const candidates = zoneString.split(/[,\/]/).map(s => s.trim()).filter(Boolean);

                    let ucodes = [];
                    // A. Search Codes for each candidate name
                    for (const uname of candidates) {
                        try {
                            const sr = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.SEARCHZONE}`, {
                                params: { areaCd, uname, format: 'xml' }
                            });
                            const sXml = new DOMParser().parseFromString(sr.data, "text/xml");
                            const foundUcode = sXml.getElementsByTagName("UCODE")[0]?.textContent;
                            if (foundUcode) ucodes.push(foundUcode);
                        } catch (e) {
                            console.warn(`SearchZone failed for ${uname}:`, e);
                        }
                    }

                    const ucodeList = ucodes.join(',');
                    let uses = [];
                    let bcr = '-', far = '-';

                    // B. Fetch Law Info if codes found
                    if (ucodeList) {
                        const luResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.LULAW}`, {
                            params: { areaCd, ucodeList, format: 'xml' }
                        });
                        const xmlDoc = new DOMParser().parseFromString(luResponse.data, "text/xml");
                        uses = Array.from(xmlDoc.getElementsByTagName("PRPOS_AREA_DSTRC_NM")).map(node => node.textContent);

                        // C. Fetch Restriction Info (BCR/FAR)
                        // Try with first ucode
                        if (ucodes.length > 0) {
                            try {
                                const arResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.RESTRICT}`, {
                                    params: { areaCd, ucode: ucodes[0], format: 'xml' }
                                });
                                const arXml = new DOMParser().parseFromString(arResponse.data, "text/xml");
                                bcr = arXml.getElementsByTagName("BLD_CVRG_RAT")[0]?.textContent || '-';
                                far = arXml.getElementsByTagName("FLR_AR_RAT")[0]?.textContent || '-';
                            } catch (e) {
                                console.warn("BCR/FAR fetch failed:", e);
                            }
                        }
                    }

                    setData(prev => ({
                        ...prev,
                        basic: {
                            ...prev.basic,
                            bcr: bcr !== '-' ? `${bcr}%` : '-',
                            far: far !== '-' ? `${far}%` : '-'
                        },
                        regulation: { uses: uses.length > 0 ? uses : (candidates.length > 0 ? candidates : []) }
                    }));
                }

                // 2. Notice
                if (activeTab === 'notice') {
                    const noticeResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.NOTICE}`, { params: { pnu: targetPnu } });
                    const nXml = new DOMParser().parseFromString(noticeResponse.data, "text/xml");
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
                if (!initialBasic.jimok || initialBasic.jimok === '-') {
                    setError(`정보 로딩 실패: ${errMsg}`);
                }
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, representativeParcel, selectedAddress]);

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
            <div className="flex-1 flex flex-col min-h-0 bg-white">
                <div className="flex-1 p-6 overflow-y-auto">
                    {error && <div className="mb-4 p-3 bg-red-50 text-red-600 text-xs rounded border border-red-100">{error}</div>}

                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div></div>
                    ) : (
                        <>
                            {activeTab === 'regulation' && (
                                <div className="space-y-6">
                                    {/* 1. Zoning / Regulations List (MOVED UP) */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-ink rounded-full"></span>
                                            국토계획법 및 타법령에 따른 지역·지구 등
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {data.regulation?.uses && data.regulation.uses.length > 0 ? (
                                                data.regulation.uses.map((use, i) => (
                                                    <span key={`${use}-${i}`} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                                        {use}
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="text-gray-400 text-xs">해당 정보 없음</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Basic Table (MOVED DOWN) */}
                                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                                        <table className="w-full text-sm">
                                            <tbody>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600 w-1/3">지목</th>
                                                    <td className="py-3 px-4 text-gray-800 font-bold">{data.basic?.jimok || '-'}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">면적</th>
                                                    <td className="py-3 px-4 text-gray-800">
                                                        {hasArea(totalArea) ? `${totalArea.toLocaleString()} m²` : '-'}
                                                    </td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">개별공시지가</th>
                                                    <td className="py-3 px-4 text-gray-800">{hasPrice(data.basic?.price) ? `${Number(data.basic.price).toLocaleString()} 원/m²` : '-'}</td>
                                                </tr>
                                                <tr className="border-b border-gray-100">
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">건폐율</th>
                                                    <td className="py-3 px-4 text-gray-800 font-bold text-blue-700">{data.basic?.bcr || '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">용적률</th>
                                                    <td className="py-3 px-4 text-gray-800 font-bold text-blue-700">{data.basic?.far || '-'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 3. Land Specification Table */}
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

            {/* Bottom Actions: Toggle & Detailed Report */}
            <div className="p-4 border-t border-gray-200 bg-gray-50">
                {/* Header Row with Toggle Button (MOVED TO BOTTOM) */}
                <div className="mb-4 flex justify-between items-center">
                    <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">토지이음 분석정보 →</h3>
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className={`p-2 rounded-full hover:bg-gray-200 text-gray-600 transition-transform ${isExpanded ? 'rotate-180 bg-gray-200' : 'bg-white border border-gray-200 shadow-sm'}`}
                        title={isExpanded ? "축소하기" : "상세보기 (확대)"}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                        </svg>
                    </button>
                </div>

                {isExpanded && (
                    <div className="mb-4 flex gap-2 overflow-x-auto scrollbar-hide">
                        {[{ id: 'regulation', label: '규제' }, { id: 'notice', label: '고시' }, { id: 'guide', label: '안내' }, { id: 'devlist', label: '개발' }].map(tab => (
                            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`px-4 py-2 text-xs font-bold rounded-lg border transition-colors ${activeTab === tab.id ? 'bg-ink text-white border-ink' : 'bg-white text-gray-400 border-gray-200 hover:text-gray-600'}`}>
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {!isExpanded && (
                    <button className="w-full py-3 bg-ink text-white rounded-lg font-medium shadow-lg hover:bg-black transition-all flex items-center justify-center gap-2">
                        <span>📄 상세 보고서 생성</span>
                    </button>
                )}
            </div>
        </div>
    );
};

export default Sidebar;
