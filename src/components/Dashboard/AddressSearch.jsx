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

        try {
            // Perform parallel search for both ROAD and PARCEL address types
            const searchTypes = ['ROAD', 'PARCEL'];
            const requests = searchTypes.map(type =>
                axios.get(`${API_CONFIG.VWORLD_BASE_URL}/req/search`, {
                    params: {
                        service: 'search',
                        request: 'search',
                        version: '2.0',
                        crs: 'EPSG:4326',
                        size: '10',
                        page: '1',
                        query: searchTerm,
                        type: 'ADDRESS',
                        category: type,
                        format: 'json',
                        errorformat: 'json',
                        key: API_CONFIG.VWORLD_KEY,
                        domain: 'https://onnrru.com' // Domain required for authorized keys
                    }
                })
            );

            // Use Promise.allSettled to ensure one failure doesn't break everything
            const responses = await Promise.allSettled(requests);

            let allItems = [];
            responses.forEach(result => {
                if (result.status === 'fulfilled') {
                    const response = result.value;
                    // Safely check for nested properties
                    if (
                        response.data &&
                        response.data.response &&
                        response.data.response.status === 'OK' &&
                        response.data.response.result &&
                        response.data.response.result.items
                    ) {
                        allItems = [...allItems, ...response.data.response.result.items];
                    }
                }
            });

            // Deduplicate items based on ID
            const uniqueItems = Array.from(new Map(allItems.map(item => [item.id, item])).values());

            if (uniqueItems.length > 0) {
                const formattedItems = uniqueItems.map(item => {
                    let pnu = null;
                    let code = null;
                    let sigunguCode = null;

                    if (item.address.structure) {
                        const { level2, level4AC } = item.address.structure;

                        // Try to match Sigungu Code
                        if (level2) {
                            const found = sigunguData.find(s => s.sigungu === level2 || (level2 && s.sigungu.includes(level2)));
                            if (found) {
                                sigunguCode = found.code;
                                code = found.code;
                            }
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
                setResults([]);
            }

        } catch (error) {
            console.error("Search Error:", error);
            setResults([]);
        } finally {
            setLoading(false);
        }
    };

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
                    placeholder="주소를 입력하세요 (예: 문정동 18)"
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
