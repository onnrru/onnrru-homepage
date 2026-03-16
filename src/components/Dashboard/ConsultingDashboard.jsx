import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MapSection from './MapSection';
import BottomPanel from './BottomPanel';

import { DashboardProvider, useDashboard } from '../../context/DashboardContext';

const DashboardContent = () => {
    const {
        selectedAddress,
        setSelectedAddress,
        selectedParcels,
        setSelectedParcels,
        isAnalysisOpen,
        setIsAnalysisOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        analyzedApartments,
        setAnalyzedApartments
    } = useDashboard();

    const hasMobileContent = isSidebarOpen || isAnalysisOpen;

    return (
        // Restored pt-16 to push the layout below the fixed top Navbar (h-16).
        // Using h-full because the parent in App.jsx now handles h-screen and overflow-hidden.
        <div className="h-full w-full bg-gray-50 flex flex-col font-sans pt-16">
            {/* Dashboard Layout Container */}
            <div className="flex-1 w-full bg-gray-100 flex flex-col md:flex-row overflow-hidden pb-safe relative">
                
                {/* 1. LEFT/TOP COLUMN (Map + Desktop BottomPanel) */}
                {/* On Mobile: Map takes fixed h-[45vh] if there's content below, else takes flex-1. Desktop: flex-1 */}
                <div className={`w-full flex flex-col order-1 overflow-hidden relative flex-none md:flex-1 ${hasMobileContent ? 'h-[45vh] md:h-full' : 'h-full flex-1'}`}>
                    
                    {/* Map Area */}
                    <div className="flex-1 relative min-h-[150px]">
                        <MapSection />
                    </div>

                    {/* Desktop Bottom Analysis Panel (Relative positioning, shrinks map instead of overlay) */}
                    <AnimatePresence>
                        {isAnalysisOpen && (
                            <motion.div
                                initial={{ height: 0, opacity: 0 }}
                                animate={{ height: 'auto', opacity: 1 }}
                                exit={{ height: 0, opacity: 0 }}
                                transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                                className="hidden md:block w-full flex-none overflow-y-auto max-h-[50vh] bg-white border-t border-gray-200 z-10 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] relative"
                            >
                                <BottomPanel />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>

                {/* 2. RIGHT/BOTTOM COLUMN (Sidebar + Mobile BottomPanel) */}
                {hasMobileContent && (
                    <div className={`w-full md:w-[30%] md:min-w-[320px] md:max-w-[450px] flex flex-col order-2 border-t md:border-t-0 md:border-l border-gray-200 bg-gray-50 z-20 overflow-y-auto md:overflow-hidden flex-1 md:flex-none ${!isSidebarOpen ? 'md:hidden' : ''}`}>
                        
                        {/* Sidebar */}
                        {isSidebarOpen && (
                            <div className="w-full flex-none h-auto md:h-full md:flex-1 md:overflow-y-auto bg-white">
                                <Sidebar
                                    isOpen={isSidebarOpen}
                                    onClose={() => setIsSidebarOpen(false)}
                                />
                            </div>
                        )}

                        {/* Mobile Analysis Panel (Stacked below Sidebar) */}
                        {isAnalysisOpen && (
                            <div className="w-full md:hidden flex-none bg-white border-t border-gray-200 shadow-sm mt-1">
                                <BottomPanel />
                            </div>
                        )}
                    </div>
                )}

            </div>
        </div>
    );
};

const ConsultingDashboard = () => {
    return (
        <DashboardProvider>
            <DashboardContent />
        </DashboardProvider>
    );
};

export default ConsultingDashboard;
