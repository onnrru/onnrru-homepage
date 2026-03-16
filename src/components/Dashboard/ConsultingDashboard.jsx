import React, { useState } from 'react';
import { motion } from 'framer-motion';
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

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans pt-16">
            {/* Dashboard Layout Container */}
            {/* On mobile: overflow-y-auto to allow scrolling the stacked items. On desktop: flex-row, overflow-hidden */}
            <div className="flex-1 w-full bg-gray-100 flex flex-col md:flex-row md:overflow-hidden overflow-y-auto pb-safe">
                
                {/* 1. Map (Always Top on Mobile, Right side on Desktop) */}
                <div className="w-full h-[50vh] min-h-[400px] md:h-full md:flex-1 relative order-1">
                    <MapSection />
                    {/* Bottom Analysis Panel Overlay (Desktop Only - overlay behaviour, on mobile we want it to stack naturally if possible, or stay absolute if we handle spacing) */}
                    {/* To make it stack on mobile, we can conditionally render it here or below. 
                        Let's keep the animation but change position on mobile so it doesn't overlap */}
                    <motion.div
                        initial={false}
                        animate={{ y: isAnalysisOpen ? 0 : '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="hidden md:block absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-2xl overflow-hidden will-change-transform"
                    >
                        <BottomPanel />
                    </motion.div>
                </div>

                {/* 2. Sidebar - Property Info */}
                {isSidebarOpen && (
                    <div className="w-full md:w-[30%] md:min-w-[320px] md:max-w-[450px] order-2 md:order-none border-t md:border-t-0 md:border-l border-gray-200 bg-white z-20 shadow-xl md:shadow-none md:overflow-y-auto flex-shrink-0 flex flex-col">
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>
                )}

                {/* 3. BottomPanel Stack on Mobile */}
                <div className="w-full order-3 md:hidden">
                    {/* On mobile, we just render it in the flow if it's open, or conditionally display it. 
                        Since the user wants it to stack below the sidebar naturally */}
                    {isAnalysisOpen && (
                         <div className="w-full shadow-lg border-t border-gray-200">
                             <BottomPanel />
                         </div>
                    )}
                </div>
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
