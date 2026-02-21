import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useDashboard } from '../../context/DashboardContext';
import { ALL_LAYERS, QUICK_LAYER_IDS, BASIC_LAYERS } from '../../config/layers';
import AddressSearch from './AddressSearch';

const MapControls = ({
    handleZoom,
    measureMode, setMeasureMode,
    radiusMode, toggleRadiusMode,
    clearAll,
    showMapTypes, setShowMapTypes,
    showZones, setShowZones,
    mapType, setMapType,
    showHybrid, setShowHybrid,
    toggleLayer,
    activeLayers,
    showLayerMenu, setShowLayerMenu,
    categories,
    selectedCategory, setSelectedCategory
}) => {
    const {
        isSidebarOpen, setIsSidebarOpen,
        isAnalysisOpen, setIsAnalysisOpen,
        parcelPickMode, setParcelPickMode,
        setSelectedAddress
    } = useDashboard();

    const [showOptions, setShowOptions] = useState(false);
    return (
        <div className="absolute top-4 right-4 z-20 pointer-events-auto flex flex-col gap-2 items-end max-w-[90vw]">
            <div className="flex items-center gap-2">
                {/* Search Bar: Occupies 1/3 when relevant or just fixed size for compact look */}
                <div className="w-[300px] md:w-[400px]">
                    <AddressSearch onSelect={setSelectedAddress} />
                </div>

                {/* Options Toggle and Controls Area */}
                <div className="flex items-center bg-white/95 backdrop-blur-sm rounded-full shadow-lg border border-gray-200 p-1 h-11 relative z-20 transition-all">
                    {/* Toggle Button */}
                    <button
                        onClick={() => setShowOptions(!showOptions)}
                        className={`h-full px-4 rounded-full text-[12px] font-bold transition-all flex items-center gap-2 shadow-sm
                            ${showOptions ? 'bg-ink text-white' : 'bg-gray-50 text-ink hover:bg-gray-100'}`}
                    >
                        <span>옵션보기</span>
                        <svg className={`w-3 h-3 transition-transform duration-300 ${showOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                    </button>

                    {/* Extended Controls: Shown only when showOptions is true */}
                    <AnimatePresence>
                        {showOptions && (
                            <motion.div
                                initial={{ opacity: 0, width: 0, x: 20 }}
                                animate={{ opacity: 1, width: 'auto', x: 0 }}
                                exit={{ opacity: 0, width: 0, x: 20 }}
                                transition={{ duration: 0.3, ease: "easeOut" }}
                                className="flex items-center overflow-hidden h-full"
                            >
                                <div className="w-px h-5 bg-gray-300 mx-2 flex-shrink-0"></div>
                                <div className="flex items-center h-full px-1">
                                    <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`px-3 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${isSidebarOpen ? 'text-ink bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`} title="사이드바 정보창 토글">
                                        대상지 정보
                                    </button>
                                    <button onClick={() => setIsAnalysisOpen(!isAnalysisOpen)} className={`px-3 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${isAnalysisOpen ? 'text-ink bg-gray-100' : 'text-gray-600 hover:bg-gray-100'}`} title="하단 실거래가 분석 패널 토글">
                                        실거래가 분석
                                    </button>

                                    <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>

                                    <button onClick={() => handleZoom(1)} className="w-8 h-full rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600" title="확대">
                                        +
                                    </button>
                                    <button onClick={() => handleZoom(-1)} className="w-8 h-full rounded hover:bg-gray-100 transition-colors flex items-center justify-center text-gray-600" title="축소">
                                        -
                                    </button>

                                    <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>

                                    <button onClick={() => { setMeasureMode(measureMode === 'distance' ? null : 'distance'); setParcelPickMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${measureMode === 'distance' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="거리 재기">
                                        거리
                                    </button>
                                    <button onClick={() => { setMeasureMode(measureMode === 'area' ? null : 'area'); setParcelPickMode(false); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${measureMode === 'area' ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="면적 재기">
                                        면적
                                    </button>
                                    <button onClick={() => { setMeasureMode(null); setParcelPickMode(false); toggleRadiusMode(); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${radiusMode ? 'bg-red-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="반경 그리기">
                                        반경
                                    </button>
                                    <button onClick={() => { setMeasureMode(null); setParcelPickMode((v) => !v); }} className={`px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap ${parcelPickMode ? 'bg-emerald-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`} title="지번 다중선택">
                                        멀티지번
                                    </button>

                                    <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>

                                    <button onClick={clearAll} className="px-2.5 h-full rounded text-[11px] font-bold transition-colors whitespace-nowrap text-gray-500 hover:bg-red-50 hover:text-red-500" title="모두 지우기">
                                        지우기
                                    </button>

                                    <div className="w-px h-5 bg-gray-300 mx-1 flex-shrink-0"></div>

                                    <div className="flex items-center gap-1 h-full bg-gray-50 rounded p-0.5">
                                        <button
                                            onClick={() => setShowMapTypes(!showMapTypes)}
                                            className={`px-3 h-full text-[11px] font-bold rounded transition-colors whitespace-nowrap
                                                ${showMapTypes ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            지도종류
                                        </button>
                                        <button
                                            onClick={() => setShowZones(!showZones)}
                                            className={`px-3 h-full text-[11px] font-bold rounded transition-colors whitespace-nowrap
                                                ${showZones ? 'bg-white text-gray-800 shadow-sm' : 'bg-transparent text-gray-500 hover:bg-gray-200'}`}
                                        >
                                            지역지구
                                        </button>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>

            {/* Sub Row 1: Base Map Types, Hybrid, and Cadastral */}
            {showMapTypes && (
                <div className="flex items-center w-max gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 p-1 h-8 animate-fade-in-down relative z-10 transition-all origin-top-right transform">
                    <div className="flex items-center">
                        {[
                            { id: 'base', label: '일반지도' },
                            { id: 'gray', label: '백지도' },
                            { id: 'midnight', label: '야간' }
                        ].map((type) => (
                            <button
                                key={type.id}
                                onClick={() => setMapType(type.id)}
                                className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                    ${mapType === type.id
                                        ? 'bg-gray-800 text-white shadow-sm'
                                        : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                            >
                                {type.label}
                            </button>
                        ))}
                    </div>

                    <div className="w-px h-4 bg-gray-300 mx-0.5"></div>

                    <div className="flex bg-gray-100 rounded p-0.5 h-full">
                        <button
                            onClick={() => setMapType('satellite')}
                            className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                ${mapType === 'satellite'
                                    ? 'bg-gray-800 text-white shadow-sm'
                                    : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                        >
                            위성지도
                        </button>
                        <button
                            onClick={() => setShowHybrid(!showHybrid)}
                            className={`px-2 h-full text-[10px] font-bold rounded transition-colors whitespace-nowrap
                                ${showHybrid ? 'bg-blue-600 text-white shadow-sm' : 'bg-transparent text-gray-600 hover:bg-gray-200'}`}
                        >
                            명칭
                        </button>
                    </div>

                    <div className="w-px h-4 bg-gray-300 mx-0.5"></div>

                    <button
                        onClick={() => toggleLayer('LP_PA_CBND_BUBUN')}
                        className={`px-2.5 h-full text-[10px] font-bold rounded shadow-sm border transition-all whitespace-nowrap
                            ${activeLayers.includes('LP_PA_CBND_BUBUN')
                                ? 'bg-indigo-600 text-white border-indigo-600'
                                : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                    >
                        지적도
                    </button>
                </div>
            )}

            {/* Sub Row 2: Basic Area Layers */}
            {showZones && (
                <div className="flex items-center w-max gap-1 bg-white/95 backdrop-blur-sm rounded-lg shadow-md border border-gray-100 p-1 h-8 animate-fade-in-down relative z-10 transition-all origin-top-right transform">
                    <button
                        onClick={() => setShowLayerMenu(true)}
                        className="px-2 h-full text-[10px] font-bold rounded shadow-sm border transition-all whitespace-nowrap bg-gray-900 text-white hover:bg-gray-800 border-gray-800"
                    >
                        전체레이어
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1"></div>

                    <div className="flex gap-0.5 h-full">
                        {BASIC_LAYERS.map((id) => {
                            const layer = ALL_LAYERS.find((l) => l.id === id);
                            if (!layer) return null;
                            const isActive = activeLayers.includes(id);
                            return (
                                <button
                                    key={id}
                                    onClick={() => toggleLayer(id)}
                                    className={`px-1.5 h-full text-[10px] font-bold rounded transition-all whitespace-nowrap overflow-hidden text-ellipsis
                                        ${isActive
                                            ? 'bg-teal-600 text-white shadow-sm'
                                            : 'bg-transparent text-gray-600 hover:bg-gray-100'}`}
                                    title={layer.label}
                                >
                                    {layer.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {/* Full Layer Modal */}
            {showLayerMenu && (
                <div
                    className="fixed inset-0 z-50 bg-black/20 backdrop-blur-[1px] flex justify-end"
                    onClick={() => setShowLayerMenu(false)}
                >
                    <div
                        className="w-[320px] h-full bg-white shadow-2xl flex flex-col animate-slide-left pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                            <h3 className="font-bold text-gray-800 text-sm">전체 레이어 목록</h3>
                            <button onClick={() => setShowLayerMenu(false)} className="p-1 rounded-full hover:bg-gray-200 text-gray-500">
                                ✕
                            </button>
                        </div>

                        <div className="p-2 border-b border-gray-100 flex gap-1 overflow-x-auto no-scrollbar">
                            {categories.map((cat) => (
                                <button
                                    key={cat}
                                    onClick={() => setSelectedCategory(cat)}
                                    className={`px-3 py-1 text-[11px] font-bold rounded-full whitespace-nowrap transition-colors
                                        ${selectedCategory === cat ? 'bg-gray-800 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        <div className="flex-1 overflow-y-auto p-3 space-y-6">
                            {['용도지역', '용도지구', '용도구역', '도시계획', '환경/산림', '재해/안전', '수자원/해양', '행정/기타'].map((category) => {
                                if (selectedCategory !== '전체' && selectedCategory !== category) return null;
                                const categoryLayers = ALL_LAYERS.filter(
                                    (l) => l.category === category && !['LP_PA_CBND_BUBUN', ...BASIC_LAYERS].includes(l.id)
                                );
                                if (categoryLayers.length === 0) return null;

                                return (
                                    <div key={category}>
                                        <h4 className="text-[11px] font-bold text-gray-400 mb-2 border-b border-gray-100 pb-1 sticky top-0 bg-white/95 backdrop-blur z-10">
                                            {category}
                                        </h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            {categoryLayers.map((layer) => {
                                                const isActive = activeLayers.includes(layer.id);
                                                return (
                                                    <button
                                                        key={layer.id}
                                                        onClick={() => toggleLayer(layer.id)}
                                                        className={`px-2 py-2 text-[11px] font-medium rounded border transition-all text-left flex items-center justify-between group
                                                            ${isActive
                                                                ? 'bg-indigo-50 text-indigo-700 border-indigo-200 ring-1 ring-indigo-200'
                                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-300 hover:bg-gray-50'}`}
                                                    >
                                                        <span className="truncate">{layer.label}</span>
                                                        {isActive && <div className="w-1.5 h-1.5 rounded-full bg-indigo-500"></div>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default MapControls;
