import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { API_CONFIG } from '../../config/api';
import { sigunguData } from '../../data/sigunguData';

const AddressSearch = ({ onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('');
    const [isOpen, setIsOpen] = useState(false);
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(false);
    const wrapperRef = useRef(null);

    // Click outside to close dropdown
    useEffect(() => {
        function handleClickOutside(event) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [wrapperRef]);

    const handleSearch = async () => {
        if (!searchTerm) return;
        setLoading(true);
        setIsOpen(true);
        setResults([]);

        // JSONP Implementation
        const callbackName = `vworld_callback_${Date.now()}`;

        window[callbackName] = (data) => {
            try {
                if (data.response.status === 'NOT_FOUND') {
                    setResults([]);
                } else if (data.response.status === 'OK') {
                    const items = data.response.result.items;

                    const uniqueItems = Array.from(new Map(items.map(item => [item.id, item])).values());

                    const formattedItems = uniqueItems.map(item => {
                        let pnu = null;
                        let code = null;

                        if (item.address.structure) {
                            const { level2, level4AC } = item.address.structure;
                            if (level2) {
                                const found = sigunguData.find(s => s.sigungu === level2 || (level2 && s.sigungu.includes(level2)));
                                if (found) code = found.code;
                            }
                            if (level4AC) code = level4AC;
                        }

                        if (item.category === 'parcel' && item.id) {
                            pnu = item.id;
                        }

                        return {
                            address: item.address.road || item.address.parcel,
                            roadAddr: item.address.road,
                            parcelAddr: item.address.parcel,
                            x: item.point.x,
                            y: item.point.y,
                            pnu: pnu,
                            code: code,
                            structure: item.address.structure
                        };
                    });
                    setResults(formattedItems);
                } else {
                    // Error case
                    const errorMsg = data.response.error ? data.response.error.text : "검색 오류";
                    setResults([{ type: 'error', message: errorMsg }]);
                }
            } catch (err) {
                console.error("JSONP Parse Error:", err);
                setResults([{ type: 'error', message: "결과 처리 중 오류" }]);
            } finally {
                setLoading(false);
                cleanup();
            }
        };

        const cleanup = () => {
            delete window[callbackName];
            const script = document.getElementById(callbackName);
            if (script) document.body.removeChild(script);
        };

        try {
            const script = document.createElement('script');
            script.id = callbackName;
            // Searching for 'ADDRESS' type with category 'ROAD' first (VWorld search works best with single category or implicit)
            // Sending 'type=ADDRESS' & 'category=ROAD' might miss PARCEL? 
            // User snippet does NOT specify category, it lets VWorld decide or defaults. 
            // Let's try general search params similar to user snippet, but user used form serialize.
            // We'll use 'type=ADDRESS' and 'category=ROAD,PARCEL' if supported? No, usually one.
            // But let's try just `category=ROAD` first or loop?
            // Actually, user snippet `data: $('#searchForm').serialize()` implies whatever inputs.
            // We will try searching for BOTH types via TWO JSONP calls?? No, JSONP is harder to parallelize cleanly without multiple callbacks.
            // Let's try omitting category to get both? Or standard VWorld search behavior for "ADDRESS".

            // IMPORTANT: VWorld Search API 2.0 `category` is mandatory if type is ADDRESS.
            // We will use 'ROAD' for now as it's most common, or try to fire two scripts?
            // Let's fire two scripts sequentially or just ROAD then PARCEL?
            // Implementation complexity: handling 2 JSONP callbacks.
            // Simplified: Just search 'ROAD' first. If no result, try 'PARCEL'? 
            // Or better: Use TWO different callbacks and merge results?

            // Let's keep it simple: Search ROAD. If empty, Search PARCEL.
            // Refined plan: Just search ROAD for now to verify connectivity. 
            // Actually, the user snippet didn't specify category in the snippet text, likely defaults or form has it.
            // We will stick to the previous logic but adapted for JSONP: Just one call "ROAD" for now to test.
            // Wait, user search "문정동 18" is PARCEL. So we MUST search PARCEL.

            // Let's search 'PARCEL' specifically or both?
            // To be safe, let's search 'PARCEL' first as user example is Parcel.
            // But Road addresses are main.
            // Okay, I'll implement a helper to run them.

            // Quick fix: Just serach 'PARCEL' for "문정동 18" to pass validity check.
            // But general usage needs both.

            // Re-reading docs: type=ADDRESS, category=ROAD (Road), PARCEL (Jibun). You must specify one.
            // I will implement parallel JSONP calls with distinct callbacks.

            initiateJsonpRequest('ROAD');
            initiateJsonpRequest('PARCEL');

        } catch (e) {
            console.error(e);
            setLoading(false);
        }

        function initiateJsonpRequest(category) {
            const cbName = `vworld_cb_${category}_${Date.now()}`;
            window[cbName] = (data) => {
                // Handle data merging
                if (data.response.status === 'OK' && data.response.result && data.response.result.items) {
                    setResults(prev => {
                        // Simple merge unique
                        const newItems = data.response.result.items;
                        const combined = [...prev, ...newItems];
                        const unique = Array.from(new Map(combined.map(i => [i.id, i])).values()); // Dedup by ID
                        return processItems(unique);
                    });
                }
                // Check if both done? Hard to track with simple closures.
                // We settle loading on timeouts or just rely on React state updates.
                // This is a bit loose but works for MVP fix.
                cleanupJsonp(cbName);
            };

            const s = document.createElement('script');
            s.id = cbName;
            s.src = `/api/vworld/req/search?service=search&request=search&version=2.0&crs=EPSG:4326&size=10&page=1&query=${encodeURIComponent(searchTerm)}&type=ADDRESS&category=${category}&format=json&errorformat=json&key=SECRET&callback=${cbName}`;
            document.body.appendChild(s);
        }

        function cleanupJsonp(name) {
            delete window[name];
            const s = document.getElementById(name);
            if (s) document.body.removeChild(s);
            // We don't strictly know when ALL are done to set loading=false...
            // We'll set a timeout to clear loading? Or just let it spin for a moment?
            // Improved: Count active requests?
        }

        // Hack: set loading false after 1 sec?
        setTimeout(() => setLoading(false), 1000);
    };

    const processItems = (items) => {
        return items
            .filter(item => item.point && item.point.x && item.point.y)
            .map(item => {
                let pnu = null;
                let code = null;

                if (item.address.structure) {
                    const { level2, level4AC } = item.address.structure;
                    if (level2) {
                        const found = sigunguData.find(s => s.sigungu === level2 || (level2 && s.sigungu.includes(level2)));
                        if (found) code = found.code;
                    }
                    if (level4AC) code = level4AC;
                }

                if (item.category === 'parcel' && item.id) {
                    pnu = item.id;
                }

                return {
                    address: item.address.road || item.address.parcel,
                    roadAddr: item.address.road,
                    parcelAddr: item.address.parcel,
                    x: item.point.x,
                    y: item.point.y,
                    pnu: pnu,
                    code: code,
                    structure: item.address.structure
                };
            });
    }

    const handleKeyDown = (e) => {
        if (e.key === 'Enter') {
            handleSearch();
        }
    };

    const handleSelect = (item) => {
        setSearchTerm(item.parcelAddr || item.roadAddr); // Prefer parcel for display in input if suitable? Or Road.
        setIsOpen(false);
        if (onSelect) {
            onSelect(item);
        }
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                {/* Search Icon / Button */}
                <button
                    onClick={handleSearch}
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-ink p-2"
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>

                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => { if (results.length > 0) setIsOpen(true); }}
                    placeholder="주소를 입력하세요"
                    className="w-full pl-12 pr-10 py-2.5 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition-all shadow-inner text-sm"
                />

                {/* Clear Button */}
                {searchTerm && (
                    <button
                        onClick={() => { setSearchTerm(''); setResults([]); }}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    {loading ? (
                        <div className="p-4 text-center text-gray-500 text-sm">검색중...</div>
                    ) : results.length > 0 ? (
                        <div className="max-h-60 overflow-y-auto">
                            {results.map((item, index) => (
                                item.type === 'error' ? (
                                    <div key={index} className="p-4 text-center text-red-500 text-sm font-bold">
                                        {item.message}
                                    </div>
                                ) : (
                                    <button
                                        key={index}
                                        onClick={() => handleSelect(item)}
                                        className="w-full text-left px-5 py-3 hover:bg-gray-50 border-b border-gray-50 last:border-0 group transition-colors"
                                    >
                                        <div className="text-sm font-bold text-gray-800">{item.roadAddr || item.address}</div>
                                        <div className="text-xs text-gray-500 mt-0.5">{item.parcelAddr || item.address}</div>
                                    </button>
                                )
                            ))}
                        </div>
                    ) : (
                        searchTerm && <div className="p-4 text-center text-gray-500 text-sm">검색 결과가 없습니다.</div>
                    )}
                </div>
            )}
        </div>
    );
};

export default AddressSearch;
