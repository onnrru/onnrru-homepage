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
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <TopBar />

            {/* Dashboard Layout Container */}
            <div className="flex-1 relative flex flex-col md:flex-row overflow-hidden">
                {/* Sidebar - Property Info (Conditional Visibility) */}
                {isSidebarOpen && (
                    <div className="w-full md:w-[400px] h-[50vh] md:h-full order-1 md:order-2 border-b md:border-b-0 md:border-l border-gray-200 bg-white z-20 shadow-xl md:shadow-none overflow-y-auto">
                        <Sidebar
                            isOpen={isSidebarOpen}
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>
                )}

                {/* Main Content (Map) */}
                <div className="flex-1 relative order-2 md:order-1 h-[50vh] md:h-full">
                    <MapSection />
                    {/* Bottom Analysis Panel Overlay */}
                    <motion.div
                        initial={false}
                        animate={{ y: isAnalysisOpen ? 0 : '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-2xl overflow-hidden will-change-transform"
                    >
                        <BottomPanel />
                    </motion.div>
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
