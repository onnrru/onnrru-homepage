import React, { useState } from 'react';
import { motion } from 'framer-motion';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MapSection from './MapSection';
import BottomPanel from './BottomPanel';

const ConsultingDashboard = () => {
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedParcels, setSelectedParcels] = useState([]);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <TopBar onAddressSelect={setSelectedAddress} />

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel */}
                <Sidebar
                    selectedAddress={selectedAddress}
                    selectedParcels={selectedParcels}
                />

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-gray-100">
                    {/* Map Area */}
                    <div className="absolute inset-0 z-0">
                        <MapSection
                            selectedAddress={selectedAddress}
                            onAddressSelect={setSelectedAddress}
                            selectedParcels={selectedParcels}
                            onParcelsChange={setSelectedParcels}
                        />
                    </div>

                    {/* Floating Toggle Button */}
                    <motion.div
                        initial={false}
                        animate={{ y: isAnalysisOpen ? -288 : 0 }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="absolute bottom-6 right-6 z-40"
                    >
                        <button
                            onClick={() => setIsAnalysisOpen(!isAnalysisOpen)}
                            className="bg-ink hover:bg-black text-white px-4 py-2.5 text-sm rounded-full shadow-[0_6px_15px_rgba(0,0,0,0.25)] font-bold flex items-center gap-1.5 border-[2px] border-white transition-colors"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className={`h-4 w-4 transition-transform duration-300 ${isAnalysisOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d={isAnalysisOpen ? "M19 9l-7 7-7-7" : "M5 15l7-7 7 7"} />
                            </svg>
                            {isAnalysisOpen ? "분석 닫기" : "실거래 분석표"}
                        </button>
                    </motion.div>

                    {/* Bottom Analysis Panel Overlay */}
                    <motion.div
                        initial={false}
                        animate={{ y: isAnalysisOpen ? 0 : '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-2xl overflow-hidden will-change-transform"
                    >
                        <BottomPanel selectedAddress={selectedAddress} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ConsultingDashboard;
