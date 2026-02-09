import React, { useState, useEffect, useRef } from 'react';
import { sigunguData } from '../../data/sigunguData';

const AddressSearch = ({ onSelect }) => {
    const [searchTerm, setSearchTerm] = useState('서울특별시 송파구 문정동 18');
    const [isOpen, setIsOpen] = useState(false);
    const [filteredData, setFilteredData] = useState([]);
    const wrapperRef = useRef(null);

    useEffect(() => {
        // Filter logic could be more complex, but simple match for now
        if (!searchTerm) {
            setFilteredData([]);
            return;
        }

        const lowerTerm = searchTerm.toLowerCase();
        const results = sigunguData.filter(item =>
            item.sido.includes(lowerTerm) ||
            item.sigungu.includes(lowerTerm) ||
            (item.sido + ' ' + item.sigungu).includes(lowerTerm)
        ).slice(0, 5); // Limit to 5 results for now

        setFilteredData(results);
    }, [searchTerm]);

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

    const handleSelect = (item) => {
        setSearchTerm(`${item.sido} ${item.sigungu}`);
        setIsOpen(false);
        // Trigger parent callback
        if (onSelect) {
            onSelect(item);
        }
        console.log("Selected Area Code:", item.code);
    };

    return (
        <div className="relative w-full" ref={wrapperRef}>
            <div className="relative">
                <span className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </span>
                <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setIsOpen(true);
                    }}
                    onFocus={() => setIsOpen(true)}
                    placeholder="지번을 입력하세요 (예: 서울특별시 송파구 문정동 18)"
                    className="w-full pl-12 pr-4 py-2.5 bg-gray-50 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-ink focus:border-transparent transition-all shadow-inner text-sm"
                />
                {/* Clear Button */}
                {searchTerm && (
                    <button
                        onClick={() => setSearchTerm('')}
                        className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                    >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                    </button>
                )}
            </div>

            {/* Dropdown Results */}
            {isOpen && filteredData.length > 0 && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl border border-gray-100 overflow-hidden z-50 animate-fade-in">
                    <div className="max-h-60 overflow-y-auto">
                        {filteredData.map((item) => (
                            <button
                                key={item.code}
                                onClick={() => handleSelect(item)}
                                className="w-full text-left px-5 py-3 hover:bg-gray-50 flex items-center justify-between group transition-colors"
                            >
                                <span className="text-sm text-gray-700">
                                    <span className="font-bold text-ink">{item.sido}</span> {item.sigungu}
                                </span>
                                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded group-hover:bg-white transition-colors">
                                    Code: {item.code}
                                </span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AddressSearch;
