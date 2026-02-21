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
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [analyzedApartments, setAnalyzedApartments] = useState([]);

    // Auto-open sidebar on selection
    React.useEffect(() => {
        if (selectedAddress || (selectedParcels && selectedParcels.length > 0)) {
            setIsSidebarOpen(true);
        }
    }, [selectedAddress, selectedParcels]);

    return (
        <div className="h-screen w-screen bg-gray-50 flex flex-col font-sans overflow-hidden">
            <TopBar onAddressSelect={setSelectedAddress} />

            <div className="flex-1 flex overflow-hidden">
                {/* Left Panel */}
                {isSidebarOpen && (
                    <div className="absolute inset-y-0 left-0 z-40 w-full md:w-[350px] md:relative">
                        <Sidebar
                            selectedAddress={selectedAddress}
                            selectedParcels={selectedParcels}
                            onClose={() => setIsSidebarOpen(false)}
                        />
                    </div>
                )}

                {/* Main Content Area */}
                <div className="flex-1 relative flex flex-col min-w-0 overflow-hidden bg-gray-100">
                    {/* Map Area */}
                    <div className="absolute inset-0 z-0">
                        <MapSection
                            selectedAddress={selectedAddress}
                            onAddressSelect={setSelectedAddress}
                            selectedParcels={selectedParcels}
                            onParcelsChange={setSelectedParcels}
                            analyzedApartments={analyzedApartments}
                            isAnalysisOpen={isAnalysisOpen}
                            setIsAnalysisOpen={setIsAnalysisOpen}
                            isSidebarOpen={isSidebarOpen}
                            setIsSidebarOpen={setIsSidebarOpen}
                        />
                    </div>

                    {/* Bottom Analysis Panel Overlay */}
                    <motion.div
                        initial={false}
                        animate={{ y: isAnalysisOpen ? 0 : '100%' }}
                        transition={{ type: 'spring', bounce: 0, duration: 0.4 }}
                        className="absolute bottom-0 left-0 right-0 z-30 shadow-[0_-10px_40px_rgba(0,0,0,0.15)] rounded-t-2xl overflow-hidden will-change-transform"
                    >
                        <BottomPanel
                            selectedAddress={selectedAddress}
                            onAnalyzedDataChange={setAnalyzedApartments}
                        />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ConsultingDashboard;
