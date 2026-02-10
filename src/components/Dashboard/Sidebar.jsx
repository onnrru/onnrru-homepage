import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('regulation'); // 'regulation', 'notice', 'guide', 'devlist'

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

    // Fetch Data Effect
    useEffect(() => {
        const fetchData = async () => {
            if (!selectedAddress) return;

            // Only proceed if PNU is available
            const pnu = selectedAddress.pnu;
            if (!pnu) {
                setError("토지 정보를 조회하려면 '지번 주소'를 선택해주세요.");
                setData({
                    basic: null,
                    regulation: null,
                    notice: [],
                    guide: [],
                    devlist: []
                });
                setMapImageUrl(null);
                return;
            }

            setLoading(true);
            setError(null);

            // Construct Static Map Image URL (Zoning Plan)
            // Center is from selectedAddress (x, y are usually EPSG:4326 from search)
            if (selectedAddress.x && selectedAddress.y) {
                const apiKey = API_CONFIG.VWORLD_KEY;
                const layers = 'lt_c_aisryc,lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun'; // Zoning + Cadastral
                // VWorld Static Image API
                // https://api.vworld.kr/req/image?service=image&request=getmap&key=[KEY]&format=png&bbox=[BBOX]&crs=[CRS]&width=[WIDTH]&height=[HEIGHT]&layers=[LAYERS]&styles=[STYLES]
                // Or better: Use WMS GetMap with CENTER if available? No, standard WMS needs BBOX.
                // We need to calculate BBOX from X,Y for a small area (e.g. +/- 0.002 degrees ~ 200m)

                const x = parseFloat(selectedAddress.x);
                const y = parseFloat(selectedAddress.y);
                const delta = 0.002; // Approx 200m
                const bbox = `${x - delta},${y - delta},${x + delta},${y + delta}`;

                const imgUrl = `${API_CONFIG.VWORLD_BASE_URL}/req/image?service=image&request=getmap&key=${apiKey}&format=png&bbox=${bbox}&crs=EPSG:4326&width=400&height=300&layers=${layers}&styles=lt_c_aisryc,lp_pa_cbnd_bubun,lp_pa_cbnd_bonbun`;
                // Note: Styles might need to be empty or specific. 'default' usually works.
                // VWorld WMS for 'lt_c_aisryc' usually has style 'lt_c_aisryc'.
                const finalImgUrl = `https://api.vworld.kr/req/image?service=image&request=getmap&key=${apiKey}&format=png&bbox=${bbox}&crs=EPSG:4326&width=500&height=400&layers=${layers}`;

                setMapImageUrl(finalImgUrl);
            } else {
                setMapImageUrl(null);
            }

            try {
                // 1. Basic Info / Regulations (luLawInfo)
                // Endpoint: /Web/Rest/OP/luLawInfo?pnu=...
                if (activeTab === 'regulation' || !data.basic) {
                    const luResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.LULAW}`, {
                        params: { pnu: pnu, format: 'xml' }
                    });

                    const parser = new DOMParser();
                    const xmlDoc = parser.parseFromString(luResponse.data, "text/xml");

                    // Check for API Error in XML
                    const errCode = xmlDoc.getElementsByTagName("error_code")[0]?.textContent;
                    if (errCode) {
                        throw new Error(`API Error: ${xmlDoc.getElementsByTagName("message")[0]?.textContent}`);
                    }

                    const jimok = xmlDoc.getElementsByTagName("JIMOK_NM")[0]?.textContent || '-';
                    const area = xmlDoc.getElementsByTagName("JIBUN_AREA")[0]?.textContent || '-';
                    const price = xmlDoc.getElementsByTagName("JIGA")[0]?.textContent || '-';
                    const uses = Array.from(xmlDoc.getElementsByTagName("PRPOS_AREA_DSTRC_NM")).map(node => node.textContent);

                    setData(prev => ({
                        ...prev,
                        basic: { jimok, area, price },
                        regulation: { uses }
                    }));
                }

                // 2. Notice (arMapList)
                if (activeTab === 'notice') {
                    const noticeResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.NOTICE}`, {
                        params: { pnu: pnu }
                    });
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

                // 3. Guide (ebGuideBookList)
                if (activeTab === 'guide') {
                    const gResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.GUIDE}`, { params: { pnu: pnu } });
                    const gParser = new DOMParser();
                    const gXml = gParser.parseFromString(gResponse.data, "text/xml");
                    const guides = Array.from(gXml.getElementsByTagName("GuideBook")).map(item => ({
                        cat: item.getElementsByTagName("CATE_NM")[0]?.textContent,
                        facil: item.getElementsByTagName("FACIL_NM")[0]?.textContent,
                        desc: item.getElementsByTagName("DESCRIPTION")[0]?.textContent,
                        url: item.getElementsByTagName("ACCESS_URL")[0]?.textContent
                    }));
                    setData(prev => ({ ...prev, guide: guides }));
                }

                // 4. DevList (isDevList)
                if (activeTab === 'devlist') {
                    const dResponse = await axios.get(`${API_CONFIG.EUM_BASE_URL}${API_CONFIG.ENDPOINTS.DEVLIST}`, {
                        params: { pnu: pnu, pageNo: 1, numOfRows: 10 }
                    });
                    // Assuming JSON for DevList based on typical VWorld/Eum usage parity
                    if (dResponse.data && dResponse.data.list) {
                        setData(prev => ({ ...prev, devlist: dResponse.data.list }));
                    } else if (typeof dResponse.data === 'string') {
                        // Fallback if XML
                        // ... parsing logic if needed
                    }
                }

            } catch (err) {
                console.error("Sidebar API Error:", err);
                const errMsg = err.response
                    ? `Status: ${err.response.status} (${err.response.statusText})`
                    : err.message;
                setError(`정보 로딩 실패: ${errMsg}. 프록시/API 키를 확인해주세요.`);
            } finally {
                setLoading(false);
            }
        };

        if (selectedAddress) {
            fetchData();
        }
    }, [activeTab, selectedAddress]);

    return (
        <div
            className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[800px]' : 'w-[350px]'}`}
        >
            {/* Header: Target Site Info */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 mb-1">대상지 정보</h2>
                <div className="text-xl font-bold text-ink font-serif mb-2 break-keep">
                    {selectedAddress ? (selectedAddress.roadAddr || selectedAddress.address) : '주소 선택 필요'}
                </div>
                <div className="text-sm text-gray-500">
                    {selectedAddress ? (selectedAddress.parcelAddr || '-') : '-'}
                </div>
            </div>



            {/* Section: Specific Info (Expandable) */}
            <div className="flex-1 flex flex-col min-h-0">
                {/* Header Row with Toggle Button */}
                <div className="p-6 pb-2 flex justify-between items-center bg-gray-50/50">
                    <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider">
                        토지이음 분석 정보
                    </h3>
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
                        {[
                            { id: 'regulation', label: '규제정보' },
                            { id: 'notice', label: '고시정보' },
                            { id: 'guide', label: '쉬운규제안내' },
                            { id: 'devlist', label: '개발인허가' }
                        ].map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={`py-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${activeTab === tab.id ? 'border-ink text-ink' : 'border-transparent text-gray-400 hover:text-gray-600'}`}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                )}

                {/* Content */}
                <div className="flex-1 p-6 overflow-y-auto">
                    {loading ? (
                        <div className="flex items-center justify-center h-full">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                        </div>
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
                                                    <td className="py-3 px-4 text-gray-800">{data.basic?.area ? `${Number(data.basic.area).toLocaleString()} m²` : '-'}</td>
                                                </tr>
                                                <tr>
                                                    <th className="bg-gray-50 py-3 px-4 text-left font-medium text-gray-600">개별공시지가</th>
                                                    <td className="py-3 px-4 text-gray-800">{data.basic?.price ? `${Number(data.basic.price).toLocaleString()} 원/m²` : '-'}</td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>

                                    {/* 2. Zoning / Regulations List */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-ink rounded-full"></span>
                                            국토계획법 및 타법령에 따른 지역·지구 등
                                        </h4>
                                        <div className="flex flex-wrap gap-2">
                                            {data.regulation?.uses && data.regulation.uses.length > 0 ? (
                                                data.regulation.uses.map((use, i) => (
                                                    <span key={i} className="px-2.5 py-1 bg-blue-50 text-blue-700 text-xs font-medium rounded-full border border-blue-100">
                                                        {use}
                                                    </span>
                                                ))
                                            ) : (
                                                <div className="text-gray-400 text-xs">해당 정보 없음</div>
                                            )}
                                        </div>
                                    </div>

                                    {/* 2. Confirmation Drawing (Map) */}
                                    <div className="bg-white rounded-lg border border-gray-200 p-4">
                                        <h4 className="font-bold text-gray-800 mb-3 flex items-center gap-2">
                                            <span className="w-1 h-4 bg-ink rounded-full"></span>
                                            토지이용규제 확인도면 (용도지역)
                                        </h4>
                                        <div className="w-full aspect-video bg-gray-100 rounded overflow-hidden relative border border-gray-300">
                                            {mapImageUrl ? (
                                                <img
                                                    src={mapImageUrl}
                                                    alt="토지이용계획확인도"
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => {
                                                        e.target.style.display = 'none';
                                                        e.target.parentElement.innerHTML = '<div class="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">도면 로드 실패 (VWorld API)</div>';
                                                    }}
                                                />
                                            ) : (
                                                <div className="absolute inset-0 flex items-center justify-center text-gray-400 text-xs">
                                                    도면 정보 없음
                                                </div>
                                            )}
                                            <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/50 text-white text-[10px] rounded">VWorld</div>
                                        </div>
                                        <p className="mt-2 text-xs text-gray-500 text-right">* VWorld 연속주제도 기반 (실제와 다를 수 있음)</p>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'notice' && (
                                <div className="space-y-3">
                                    {data.notice.map((item, i) => (
                                        <div key={i} className="border-b border-gray-100 pb-3 last:border-0">
                                            <div className="font-bold text-sm text-gray-800">{item.summary}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.date} | {item.author}</div>
                                        </div>
                                    ))}
                                    {data.notice.length === 0 && <div className="text-center text-gray-400 text-xs py-10">데이터 없음</div>}
                                </div>
                            )}

                            {activeTab === 'guide' && (
                                <div className="space-y-3">
                                    {data.guide.map((item, i) => (
                                        <div key={i} className="bg-green-50 p-3 rounded border border-green-100">
                                            <div className="text-xs font-bold text-green-700 mb-1">{item.facil}</div>
                                            <div className="text-xs text-gray-600">{item.desc}</div>
                                        </div>
                                    ))}
                                    {data.guide.length === 0 && <div className="text-center text-gray-400 text-xs py-10">데이터 없음</div>}
                                </div>
                            )}

                            {activeTab === 'devlist' && (
                                <div className="space-y-3">
                                    {data.devlist.map((item, i) => (
                                        <div key={i} className="bg-gray-50 p-3 rounded border border-gray-200">
                                            <div className="text-sm font-bold text-gray-800">{item.lcNm}</div>
                                            <div className="text-xs text-gray-500 mt-1">{item.devlopActionPurps}</div>
                                        </div>
                                    ))}
                                    {data.devlist.length === 0 && <div className="text-center text-gray-400 text-xs py-10">데이터 없음</div>}
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
