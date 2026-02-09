import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';

const Sidebar = ({ selectedAddress }) => {
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeTab, setActiveTab] = useState('regulation'); // 'regulation' or 'notice'

    // Data States
    const [data, setData] = useState({
        regulation: null,
        notice: [],
        guide: [],
        devlist: []
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Fetch Data Effect
    useEffect(() => {
        const fetchData = async () => {
            if (!activeTab) return;
            // For 'guide', we don't necessarily need an address, but for others we do
            if (activeTab !== 'guide' && !selectedAddress?.code) return;

            setLoading(true);
            setError(null);

            try {
                let endpoint = '';
                let params = {};

                if (activeTab === 'notice') {
                    endpoint = '/map'; // Using map endpoint for notices/map info
                    params = { areaCd: selectedAddress.code, PageNo: 1 };
                } else if (activeTab === 'guide') {
                    endpoint = '/guide';
                } else if (activeTab === 'devlist') {
                    endpoint = '/devlist';
                    params = { areaCd: selectedAddress.code, PageNo: 1 };
                }

                if (endpoint) {
                    const response = await axios.get(`${API_CONFIG.BASE_URL}${endpoint}`, { params });

                    if (activeTab === 'devlist') {
                        // isDevList returns JSON
                        setData(prev => ({ ...prev, devlist: response.data.list || [] }));
                    } else if (activeTab === 'guide') {
                        // guide returns XML usually
                        if (typeof response.data === 'string') {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(response.data, "text/xml");
                            const items = Array.from(xmlDoc.getElementsByTagName("GuideBook")).map(item => ({
                                cat: item.getElementsByTagName("CATE_NM")[0]?.textContent,
                                facil: item.getElementsByTagName("FACIL_NM")[0]?.textContent,
                                desc: item.getElementsByTagName("DESCRIPTION")[0]?.textContent,
                                url: item.getElementsByTagName("ACCESS_URL")[0]?.textContent,
                            }));
                            setData(prev => ({ ...prev, guide: items }));
                        }
                    } else if (activeTab === 'notice') {
                        // map returns XML
                        if (typeof response.data === 'string') {
                            const parser = new DOMParser();
                            const xmlDoc = parser.parseFromString(response.data, "text/xml");
                            const items = Array.from(xmlDoc.getElementsByTagName("Map")).map(item => ({
                                title: item.getElementsByTagName("LCNM")[0]?.textContent || "고시정보",
                                author: item.getElementsByTagName("LOCGOV_MANAGE_NM")[0]?.textContent || "지자체",
                                date: item.getElementsByTagName("NOTIFI_DE")[0]?.textContent || "-",
                                summary: item.getElementsByTagName("NOTIFI_NM")[0]?.textContent || "-"
                            }));
                            setData(prev => ({ ...prev, notice: items }));
                        }
                    }
                }
            } catch (err) {
                console.error("API Fetch Error:", err);
                setError("데이터를 불러오는 중 오류가 발생했습니다.");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [activeTab, selectedAddress]);

    return (
        <div
            className={`bg-white border-r border-gray-200 flex flex-col h-full overflow-y-auto z-10 transition-all duration-300 ease-in-out ${isExpanded ? 'w-[800px]' : 'w-[350px]'}`}
        >
            {/* Header: Target Site Info */}
            <div className="p-6 border-b border-gray-100 flex-shrink-0">
                <h2 className="text-lg font-bold text-gray-800 mb-1">대상지 정보</h2>
                <div className="text-2xl font-bold text-ink font-serif mb-2">
                    {selectedAddress ? `${selectedAddress.sigungu} ${selectedAddress.sigungu.endsWith('구') ? '' : ''} ${selectedAddress.sido !== '세종특별자치시' ? '' : ''}` : '주소 선택 필요'}
                    {/* A bit hacky display logic, better: */}
                    {selectedAddress ? selectedAddress.sigungu : '-'}
                </div>
                <div className="text-sm text-gray-500">
                    {selectedAddress ? selectedAddress.sido : '-'}
                    {selectedAddress ? ` (코드: ${selectedAddress.code})` : ''}
                </div>
            </div>

            {/* Section: Basic Info Table (Always Visible unless expanded covers it, but let's hide it in expanded mode to match the "screenshot form" request which implies a change of view) */}
            <div className={`p-6 border-b border-gray-100 flex-shrink-0 ${isExpanded ? 'hidden' : 'block'}`}>
                <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4">기본 정보</h3>
                <div className="space-y-3">
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">지목</span>
                        <span className="text-sm font-medium text-gray-900 bg-gray-100 px-2 py-0.5 rounded">대</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">면적</span>
                        <span className="text-sm font-medium text-gray-900">7,062.7 m²</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">개별공시지가</span>
                        <span className="text-sm font-medium text-gray-900">8,053,000원/m²</span>
                    </div>
                    {/* New: FAR/BCR */}
                    <div className="flex justify-between items-center border-t border-dashed border-gray-100 pt-2 mt-2">
                        <span className="text-sm text-gray-600">건폐율 (법정)</span>
                        <span className="text-sm font-bold text-blue-600">50%</span>
                    </div>
                    <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">용적률 (법정)</span>
                        <span className="text-sm font-bold text-blue-600">250%</span>
                    </div>
                </div>
            </div>

            {/* Section: Toji-Eum Info (Expandable) */}
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

                {/* Tabs (Visible Only When Expanded) */}
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

                {/* Content: Conditional Rendering */}
                {isExpanded ? (
                    // === EXPANDED VIEW ===
                    <div className="flex-1 p-6 animate-fade-in overflow-y-auto bg-white">

                        {loading && (
                            <div className="flex items-center justify-center p-10">
                                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
                            </div>
                        )}

                        {!loading && activeTab === 'regulation' && (
                            // --- Tab 1: Regulations ---
                            <div className="border border-gray-300 text-sm">
                                {/* Row 1 */}
                                <div className="flex border-b border-gray-300">
                                    <div className="w-32 bg-gray-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">소재지</div>
                                    <div className="flex-1 p-3 flex items-center font-medium">서울특별시 송파구 문정동 18번지</div>
                                </div>
                                {/* Row 2 */}
                                <div className="flex border-b border-gray-300">
                                    <div className="w-32 bg-gray-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">지목</div>
                                    <div className="flex-1 p-3 flex items-center border-r border-gray-300">
                                        대 <span className="ml-2 w-4 h-4 rounded-full bg-gray-400 text-white text-[10px] flex items-center justify-center">?</span>
                                    </div>
                                    <div className="w-32 bg-gray-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">면적</div>
                                    <div className="flex-1 p-3 flex items-center">7,062.7 m²</div>
                                </div>
                                {/* Row 3 */}
                                <div className="flex border-b border-gray-300">
                                    <div className="w-32 bg-gray-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">개별공시지가(m²)</div>
                                    <div className="flex-1 p-3 flex items-center gap-2">
                                        8,053,000원 (2025/01)
                                        <button className="px-2 py-0.5 bg-gray-600 text-white text-xs rounded">연도별보기</button>
                                        <a href="https://www.realtyprice.kr" target="_blank" rel="noreferrer" className="text-blue-500 hover:underline flex items-center text-xs">
                                            REB 한국부동산원 부동산 공시가격 알리미
                                        </a>
                                    </div>
                                </div>
                                {/* Row 4: Zoning */}
                                <div className="flex border-b border-gray-300">
                                    <div className="w-32 bg-gray-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">
                                        지구지역등<br />지정여부
                                    </div>
                                    <div className="flex-1 flex flex-col">
                                        <div className="flex border-b border-gray-200">
                                            <div className="w-40 p-3 border-r border-gray-200 text-gray-600">「국토의 계획 및 이용에 관한 법률」에 따른 지역·지구등</div>
                                            <div className="flex-1 p-3 font-medium text-blue-700 flex flex-wrap gap-1">
                                                <a href="http://www.eum.go.kr/web/ar/dic/dicDicList.jsp?keyword=도시지역" target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-900 border-b border-blue-200">도시지역</a>,
                                                <a href="http://www.eum.go.kr/web/ar/dic/dicDicList.jsp?keyword=제3종일반주거지역" target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-900 border-b border-blue-200 ml-1">제3종일반주거지역</a>,
                                                <a href="http://www.eum.go.kr/web/ar/dic/dicDicList.jsp?keyword=도로" target="_blank" rel="noreferrer" className="hover:underline hover:text-blue-900 border-b border-blue-200 ml-1">도로(접함)</a>
                                            </div>
                                        </div>
                                        <div className="flex">
                                            <div className="w-40 p-3 border-r border-gray-200 text-gray-600">다른 법령 등에 따른 지역·지구등</div>
                                            <div className="flex-1 p-3 text-gray-800 leading-relaxed flex flex-wrap gap-1">
                                                {[
                                                    '가축사육제한구역',
                                                    '교육환경보호구역',
                                                    '대공방어협조구역(위탁고도:77-257m)',
                                                    '비행안전제2구역(전술)',
                                                    '과밀억제권역'
                                                ].map((term, i) => (
                                                    <span key={i} className="inline-flex items-center">
                                                        <a
                                                            href={`http://www.eum.go.kr/web/ar/dic/dicDicList.jsp?keyword=${term.split('(')[0]}`}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="hover:underline hover:text-ink border-b border-gray-300"
                                                        >
                                                            {term}
                                                        </a>
                                                        {i < 4 && <span className="mr-1">,</span>}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                {/* Row 5: BCR/FAR (Custom Addition) */}
                                <div className="flex border-b border-gray-300 bg-yellow-50/50">
                                    <div className="w-32 bg-yellow-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">
                                        건폐율 / 용적률<br />(법정 한도)
                                    </div>
                                    <div className="flex-1 p-3 flex items-center gap-8">
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">건폐율</span>
                                            <span className="font-bold text-lg text-ink">50% 이하</span>
                                        </div>
                                        <div className="flex flex-col">
                                            <span className="text-xs text-gray-500">용적률</span>
                                            <span className="font-bold text-lg text-ink">250% 이하</span>
                                        </div>
                                        <div className="text-xs text-gray-400 ml-auto">
                                            * 조례에 따라 다를 수 있음
                                        </div>
                                    </div>
                                </div>
                                {/* Row 6: Map Image */}
                                <div className="flex h-80">
                                    <div className="w-32 bg-gray-50 p-3 font-bold flex items-center justify-center border-r border-gray-300">
                                        확인도면
                                    </div>
                                    <div className="flex-1 relative bg-gray-100 overflow-hidden group">
                                        <a
                                            href="https://www.eum.go.kr/"
                                            target="_blank"
                                            rel="noreferrer"
                                            className="absolute top-2 left-2 z-10 bg-black/70 text-white px-3 py-1 text-xs rounded hover:bg-black flex items-center gap-1 shadow-lg"
                                            title="클릭 후 '문정동 18'을 검색하세요 (직접 링크 제한됨)"
                                        >
                                            <span>이음지도로 보기 (메인)</span>
                                            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                        </a>
                                        {/* Mock Map Image Representation */}
                                        <div className="absolute inset-0 flex items-center justify-center text-gray-400">
                                            <div className="text-center">
                                                <p className="mb-2">지적도 / 용도지역 도면</p>
                                                <div className="w-64 h-64 border-4 border-yellow-400 bg-white mx-auto relative opacity-50">
                                                    <div className="absolute top-0 right-0 w-1/3 h-full bg-pink-200/50 border-l border-red-300"></div>
                                                    <div className="absolute bottom-0 left-0 w-full h-1/4 bg-gray-200"></div>
                                                    <div className="absolute top-1/2 left-1/2 w-4 h-4 bg-red-500 rounded-full border-2 border-white transform -translate-x-1/2 -translate-y-1/2"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'notice' && (
                            // --- Tab 2: Notices ---
                            <div className="animate-fade-in">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-ink pl-3">최근 고시단축 정보 (API)</h3>
                                <div className="space-y-4">
                                    {data.notice && data.notice.length > 0 ? (
                                        data.notice.map((notice, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                                <div className="flex justify-between items-start mb-2">
                                                    <h4 className="text-sm font-bold text-ink leading-snug flex-1 mr-4">{notice.summary}</h4>
                                                    <span className="text-xs text-gray-400 whitespace-nowrap">{notice.date}</span>
                                                </div>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 bg-white border border-gray-200 rounded text-[10px] text-gray-500 font-medium">
                                                        {notice.author}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">
                                                    {notice.title}
                                                </p>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-10">
                                            {selectedAddress ? "데이터가 없습니다." : "주소를 선택해주세요."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                        {!loading && activeTab === 'guide' && (
                            // --- Tab 3: Easy Regulation Guide ---
                            <div className="animate-fade-in">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-ink pl-3">쉬운규제안내서 (API)</h3>
                                <div className="space-y-4">
                                    {data.guide && data.guide.length > 0 ? (
                                        data.guide.map((guide, idx) => (
                                            <div key={idx} className="bg-green-50/50 border border-green-100 rounded-lg p-4">
                                                <div className="flex items-center gap-2 mb-2">
                                                    <span className="px-2 py-0.5 bg-green-100 text-green-700 text-[10px] rounded font-bold">{guide.cat}</span>
                                                    <h4 className="text-sm font-bold text-gray-800">{guide.facil}</h4>
                                                </div>
                                                <p className="text-xs text-gray-600 leading-relaxed mb-3">
                                                    {guide.desc}
                                                </p>
                                                {guide.url && (
                                                    <a href={guide.url} target="_blank" rel="noreferrer" className="text-xs text-green-600 hover:underline flex items-center gap-1">
                                                        자세히 보기 <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path></svg>
                                                    </a>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-10">데이터가 없습니다.</div>
                                    )}
                                </div>
                            </div>
                        )}


                        {!loading && activeTab === 'devlist' && (
                            // --- Tab 4: Development Permit List ---
                            <div className="animate-fade-in">
                                <h3 className="text-sm font-bold text-gray-800 mb-4 border-l-4 border-ink pl-3">개발행위 허가내역 (API)</h3>
                                <div className="space-y-4">
                                    {data.devlist && data.devlist.length > 0 ? (
                                        data.devlist.map((dev, idx) => (
                                            <div key={idx} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                                <div className="flex justify-between mb-2">
                                                    <span className="text-[10px] text-gray-500 bg-white border border-gray-200 px-2 py-0.5 rounded">허가일: {dev.prmisnDe}</span>
                                                    <span className="text-xs font-bold text-ink">{dev.devlopActionPurps || dev.seCdNm}</span>
                                                </div>
                                                <h4 className="text-sm font-bold text-gray-800 mb-1">{dev.lcNm}</h4>
                                                <div className="flex justify-between items-center text-xs text-gray-600">
                                                    <span>지목: {dev.lndcgrNm}</span>
                                                    <span>면적: {dev.ar}m²</span>
                                                </div>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center text-gray-500 py-10">
                                            {selectedAddress ? "데이터가 없습니다." : "주소를 선택해주세요."}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}

                    </div>
                ) : (
                    // === COLLAPSED VIEW (Summary Cards) ===
                    <div className="p-6 pt-0 space-y-4 animate-fade-in">
                        <div className="bg-blue-50 border border-blue-100 rounded-lg p-3">
                            <div className="text-xs text-blue-500 font-bold mb-1">국토계획법</div>
                            <div className="text-sm text-blue-900 font-medium">도시지역</div>
                            <div className="text-sm text-blue-900 font-medium">제3종일반주거지역</div>
                            <div className="text-sm text-blue-900 font-medium">도로(접함)</div>
                        </div>

                        <div className="bg-gray-50 border border-gray-100 rounded-lg p-3">
                            <div className="text-xs text-gray-500 font-bold mb-1">다른 법령</div>
                            <ul className="text-xs text-gray-700 space-y-1 list-disc pl-4">
                                <li>가축사육제한구역</li>
                                <li>교육환경보호구역</li>
                                <li>대공방어협조구역</li>
                                <li>비행안전제2구역(전술)</li>
                                <li>과밀억제권역</li>
                            </ul>
                        </div>

                        <div className="flex gap-2">
                            <button
                                onClick={() => { setIsExpanded(true); setActiveTab('notice'); }}
                                className="flex-1 py-2 border border-orange-200 bg-orange-50 text-orange-700 text-xs rounded hover:bg-orange-100 transition-colors"
                            >
                                최근 고시 확인
                            </button>
                            <a href="http://www.eum.go.kr" target="_blank" rel="noreferrer" className="flex-1 text-center py-2 border border-gray-300 text-gray-600 text-xs rounded hover:bg-gray-50 transition-colors">
                                토지이음 ↗
                            </a>
                        </div>
                    </div>
                )}
            </div>

            {/* Download/Action (Visible in Both, but style varies slightly) */}
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
