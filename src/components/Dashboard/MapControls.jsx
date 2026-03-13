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

    // Filter out basic layers and cadastral to show extra active layers
    const extraActiveLayers = activeLayers.filter(id => !['LP_PA_CBND_BUBUN', ...BASIC_LAYERS].includes(id));

    return (
        <div className="absolute top-4 right-4 left-4 z-20 pointer-events-none flex flex-col items-end gap-2">
            {/* Top Row: Search and Options Toggle */}
            <div className="w-full flex items-center justify-end gap-2 pointer-events-auto">
                <div className="flex-1 max-w-[600px] shadow-lg rounded-full overflow-hidden">
                    <AddressSearch onSelect={setSelectedAddress} />
                </div>
                
                <button
                    onClick={() => {
                        const next = !showOptions;
                        setShowOptions(next);
                        if (!next) {
                            setShowMapTypes(false);
                            setShowZones(false);
                        }
                    }}
                    className={`h-11 px-6 rounded-full text-[13px] font-bold transition-all flex items-center gap-2 shadow-xl border
                        ${showOptions 
                            ? 'bg-ink text-white border-ink' 
                            : 'bg-white/95 text-ink hover:bg-gray-50 border-gray-200 backdrop-blur-sm'}`}
                >
                    <span>{showOptions ? '옵션닫기' : '지도옵션'}</span>
                    <svg className={`w-3.5 h-3.5 transition-transform duration-300 ${showOptions ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                </button>
            </div>

            {/* Main Options Panel */}
            <AnimatePresence>
                {showOptions && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="w-full flex flex-col items-end gap-2 pointer-events-auto"
                    >
                        {/* Row 1: Dashboard and Basic Controls */}
                        <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl border border-gray-200 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                            <div className="flex items-center gap-1 px-1">
                                <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${isSidebarOpen ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    대상지 정보
                                </button>
                                <button onClick={() => setIsAnalysisOpen(!isAnalysisOpen)} className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-colors whitespace-nowrap ${isAnalysisOpen ? 'bg-gray-100 text-ink' : 'text-gray-500 hover:bg-gray-50'}`}>
                                    실거래가 분석
                                </button>
                                
                                <div className="w-px h-4 bg-gray-200 mx-1"></div>
                                
                                <div className="flex items-center">
                                    <button onClick={() => handleZoom(1)} className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-light">+</button>
                                    <button onClick={() => handleZoom(-1)} className="w-9 h-9 rounded-lg hover:bg-gray-100 text-gray-600 flex items-center justify-center text-lg font-light">-</button>
                                </div>

                                <div className="w-px h-4 bg-gray-200 mx-1"></div>

                                <button onClick={() => { setMeasureMode(measureMode === 'distance' ? null : 'distance'); setParcelPickMode(false); }} className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${measureMode === 'distance' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    거리재기
                                </button>
                                <button onClick={() => { setMeasureMode(measureMode === 'area' ? null : 'area'); setParcelPickMode(false); }} className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${measureMode === 'area' ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    면적재기
                                </button>
                                <button onClick={() => { setMeasureMode(null); setParcelPickMode(false); toggleRadiusMode(); }} className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${radiusMode ? 'bg-red-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    반경
                                </button>
                                <button onClick={() => { setMeasureMode(null); setParcelPickMode((v) => !v); }} className={`px-3 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap ${parcelPickMode ? 'bg-emerald-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}>
                                    멀티지번
                                </button>

                                <button onClick={clearAll} className="ml-2 px-3 py-2 rounded-lg text-[11px] font-bold text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors">지우기</button>
                            </div>

                            <div className="w-px h-6 bg-gray-200 mx-2"></div>

                            <div className="flex items-center gap-1.5 p-1 bg-gray-50/50 rounded-xl">
                                <button
                                    onClick={() => { setShowMapTypes(!showMapTypes); if(!showMapTypes) setShowZones(false); }}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap
                                        ${showMapTypes ? 'bg-white text-ink shadow-md border border-gray-100' : 'text-gray-500 hover:bg-white/50'}`}
                                >
                                    지도종류
                                </button>
                                <button
                                    onClick={() => { setShowZones(!showZones); if(!showZones) setShowMapTypes(false); }}
                                    className={`px-4 py-2 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap
                                        ${showZones ? 'bg-white text-ink shadow-md border border-gray-100' : 'text-gray-500 hover:bg-white/50'}`}
                                >
                                    지역지구
                                </button>
                            </div>
                        </div>

                        {/* Row 2: Map Types Row */}
                        <AnimatePresence>
                            {showMapTypes && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full"
                                >
                                    <div className="flex items-center gap-1">
                                        {[
                                            { id: 'base', label: '일반' },
                                            { id: 'gray', label: '백지도' },
                                            { id: 'midnight', label: '야간' },
                                            { id: 'satellite', label: '위성' }
                                        ].map((t) => (
                                            <button
                                                key={t.id} onClick={() => setMapType(t.id)}
                                                className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap
                                                    ${mapType === t.id ? 'bg-gray-800 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                            >
                                                {t.label}
                                            </button>
                                        ))}
                                    </div>
                                    <div className="w-px h-3 bg-gray-200 mx-1"></div>
                                    <div className="flex items-center gap-1">
                                        <button
                                            onClick={() => setShowHybrid(!showHybrid)}
                                            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap
                                                ${showHybrid ? 'bg-blue-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                        >
                                            명칭표기
                                        </button>
                                        <button
                                            onClick={() => toggleLayer('LP_PA_CBND_BUBUN')}
                                            className={`px-4 py-1.5 rounded-lg text-[11px] font-bold transition-all border whitespace-nowrap
                                                ${activeLayers.includes('LP_PA_CBND_BUBUN')
                                                    ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
                                                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}
                                        >
                                            지적
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        {/* Row 3: Zones Row */}
                        <AnimatePresence>
                            {showZones && (
                                <motion.div
                                    initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                                    className="flex flex-col items-end gap-1.5 w-full"
                                >
                                    <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-lg border border-gray-100 p-1.5 flex items-center gap-1 overflow-x-auto no-scrollbar max-w-full">
                                        <button
                                            onClick={() => setShowLayerMenu(true)}
                                            className="px-4 py-1.5 rounded-lg text-[11px] font-bold bg-gray-900 text-white hover:bg-black transition-colors whitespace-nowrap shadow-md"
                                        >
                                            전체보기
                                        </button>
                                        <div className="w-px h-3 bg-gray-200 mx-1"></div>
                                        <div className="flex items-center gap-1">
                                            {BASIC_LAYERS.map((id) => {
                                                const layer = ALL_LAYERS.find((l) => l.id === id);
                                                if (!layer) return null;
                                                const isActive = activeLayers.includes(id);
                                                return (
                                                    <button
                                                        key={id} onClick={() => toggleLayer(id)}
                                                        className={`px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap
                                                            ${isActive ? 'bg-teal-600 text-white shadow-md' : 'text-gray-600 hover:bg-gray-100'}`}
                                                    >
                                                        {layer.label}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Active Extra Layers Tags */}
                                    {extraActiveLayers.length > 0 && (
                                        <div className="bg-white/80 backdrop-blur-sm rounded-lg shadow-sm border border-gray-100 p-1.5 flex flex-wrap justify-end gap-1 max-w-full">
                                            <span className="text-[9px] font-bold text-gray-400 px-1 py-1 uppercase tracking-wider">활성 레이어:</span>
                                            {extraActiveLayers.map(id => {
                                                const layer = ALL_LAYERS.find(l => l.id === id);
                                                return (
                                                    <button
                                                        key={id} onClick={() => toggleLayer(id)}
                                                        className="px-2 py-1 bg-indigo-50 text-indigo-700 text-[10px] font-bold rounded flex items-center gap-1 hover:bg-red-50 hover:text-red-500 transition-colors border border-indigo-100"
                                                    >
                                                        {layer?.label || id}
                                                        <span className="text-[8px] opacity-60">✕</span>
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    )}
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </motion.div>
                )}
            </AnimatePresence>

            {/* Full Layer Modal - Keep same logic but styled to match */}
            {showLayerMenu && (
                <div
                    className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-sm flex justify-end"
                    onClick={() => setShowLayerMenu(false)}
                >
                    <motion.div
                        initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }}
                        className="w-[360px] h-full bg-white shadow-2xl flex flex-col pointer-events-auto"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50/50">
                            <div>
                                <h3 className="font-extrabold text-gray-900 text-base">전체 레이어</h3>
                                <p className="text-[10px] text-gray-400 font-medium">지도의 중첩 레이어를 선택하세요</p>
                            </div>
                            <button onClick={() => setShowLayerMenu(false)} className="w-8 h-8 rounded-full hover:bg-gray-200 flex items-center justify-center text-gray-500 transition-colors">✕</button>
                        </div>

                        {/* Categories Tab */}
                        <div className="p-3 border-b border-gray-100 flex gap-1.5 overflow-x-auto no-scrollbar bg-white">
                            {categories.map((cat) => (
                                <button
                                    key={cat} onClick={() => setSelectedCategory(cat)}
                                    className={`px-4 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-all border
                                        ${selectedCategory === cat ? 'bg-ink text-white border-ink shadow-md' : 'bg-gray-100 text-gray-500 border-transparent hover:bg-gray-200'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>

                        {/* Layer List */}
                        <div className="flex-1 overflow-y-auto p-4 space-y-8 bg-gray-50/30">
                            {['용도지역', '용도지구', '용도구역', '도시계획', '환경/산림', '재해/안전', '수자원/해양', '행정/기타'].map((category) => {
                                if (selectedCategory !== '전체' && selectedCategory !== category) return null;
                                const categoryLayers = ALL_LAYERS.filter(
                                    (l) => l.category === category && !['LP_PA_CBND_BUBUN', ...BASIC_LAYERS].includes(l.id)
                                );
                                if (categoryLayers.length === 0) return null;

                                return (
                                    <div key={category} className="space-y-3">
                                        <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] px-1">{category}</h4>
                                        <div className="grid grid-cols-1 gap-1.5">
                                            {categoryLayers.map((layer) => {
                                                const isActive = activeLayers.includes(layer.id);
                                                return (
                                                    <button
                                                        key={layer.id} onClick={() => toggleLayer(layer.id)}
                                                        className={`px-4 py-3 text-[12px] font-bold rounded-xl border transition-all text-left flex items-center justify-between group
                                                            ${isActive
                                                                ? 'bg-indigo-600 text-white border-indigo-600 shadow-lg scale-[1.02]'
                                                                : 'bg-white text-gray-600 border-gray-100 hover:border-gray-200 hover:bg-white shadow-sm'}`}
                                                    >
                                                        <span>{layer.label}</span>
                                                        {isActive && <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" /></svg>}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </motion.div>
                </div>
            )}
        </div>
    );
};

export default MapControls;
