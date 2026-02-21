import React, { createContext, useContext, useState, useEffect } from 'react';

const DashboardContext = createContext();

export const useDashboard = () => {
    const context = useContext(DashboardContext);
    if (!context) {
        throw new Error('useDashboard must be used within a DashboardProvider');
    }
    return context;
};

export const DashboardProvider = ({ children }) => {
    const [selectedAddress, setSelectedAddress] = useState(null);
    const [selectedParcels, setSelectedParcels] = useState([]);
    const [isAnalysisOpen, setIsAnalysisOpen] = useState(false);
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [analyzedApartments, setAnalyzedApartments] = useState([]);
    const [parcelPickMode, setParcelPickMode] = useState(false);

    // Auto-open sidebar on selection
    useEffect(() => {
        if (selectedAddress || (selectedParcels && selectedParcels.length > 0)) {
            setIsSidebarOpen(true);
        }
    }, [selectedAddress, selectedParcels]);

    const value = {
        selectedAddress,
        setSelectedAddress,
        selectedParcels,
        setSelectedParcels,
        isAnalysisOpen,
        setIsAnalysisOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        analyzedApartments,
        setAnalyzedApartments,
        parcelPickMode,
        setParcelPickMode
    };

    return (
        <DashboardContext.Provider value={value}>
            {children}
        </DashboardContext.Provider>
    );
};
