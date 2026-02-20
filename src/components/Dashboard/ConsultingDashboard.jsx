import React from 'react';
import { motion } from 'framer-motion';
import TopBar from './TopBar';
import Sidebar from './Sidebar';
import MapSection from './MapSection';
import BottomPanel from './BottomPanel';

const ConsultingDashboard = () => {
    const [selectedAddress, setSelectedAddress] = React.useState(null);
    // [Multi-Selection] Lifted State for multiple parcels
    const [selectedParcels, setSelectedParcels] = React.useState([]);

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
                <div className="flex-1 flex flex-col min-w-0">
                    {/* Map Area */}
                    <div className="flex-1 relative">
                        <MapSection
                            selectedAddress={selectedAddress}
                            onAddressSelect={setSelectedAddress}
                            selectedParcels={selectedParcels}
                            onParcelsChange={setSelectedParcels}
                        />
                    </div>

                    {/* Bottom Analysis Panel */}
                    <motion.div
                        initial={{ y: 100, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5, duration: 0.5 }}
                    >
                        <BottomPanel selectedAddress={selectedAddress} />
                    </motion.div>
                </div>
            </div>
        </div>
    );
};

export default ConsultingDashboard;
