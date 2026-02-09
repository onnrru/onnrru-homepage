import React, { useState } from 'react';
import StatsPanel from '../ui/StatsPanel';
import CharacterAvatar from '../ui/CharacterAvatar';
import AdventureMap from '../ui/AdventureMap';
import InventoryPanel from '../ui/InventoryPanel';
import EquipmentPanel from './EquipmentPanel';
import BattleScene from '../../components/BattleGame'; // We reuse BattleGame as the scene
import { useGame } from '../../context/GameContext';

const MainGameLayout = () => {
    // Battle Mode State (Default to true)
    const [inBattle, setInBattle] = useState(true);

    return (
        <div className="h-screen w-screen bg-gray-950 text-white overflow-hidden flex font-sans select-none">

            {/* === LEFT COLUMN (20%) - Stats & Character === */}
            <div className="w-[20%] min-w-[250px] flex flex-col border-r-2 border-gray-800 bg-gray-900 z-20 shadow-2xl">
                {/* Stats Panel */}
                <div className="flex-1 border-b-2 border-gray-800 p-2 overflow-y-auto">
                    <StatsPanel />
                </div>
                {/* Avatar */}
                <div className="h-[40%] bg-gray-850 relative">
                    <CharacterAvatar />
                </div>
            </div>

            {/* === CENTER COLUMN (60%) - Main Battle Zone === */}
            <div className="flex-1 flex flex-col bg-black relative border-r-2 border-gray-800 z-10">
                {/* Main Battle Viewport */}
                <div className="flex-1 relative overflow-hidden">
                    <div className="absolute inset-0">
                        {inBattle ? <BattleScene /> : (
                            <div className="flex items-center justify-center h-full text-gray-500">
                                Select a stage to fight
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* === RIGHT COLUMN (20%) - Inventory & Equipment === */}
            <div className="w-[25%] min-w-[280px] flex flex-col bg-gray-900 z-20 shadow-2xl">
                {/* World Map (Top) */}
                <div className="h-48 border-b-2 border-gray-800 bg-gray-950 p-1">
                    <AdventureMap onStartBattle={() => setInBattle(true)} />
                </div>

                {/* Equipment (Middle) */}
                <div className="flex-1 border-b-2 border-gray-800 p-2 overflow-y-auto bg-gray-925">
                    <EquipmentPanel />
                </div>

                {/* Inventory (Bottom) */}
                <div className="h-[30%] bg-gray-900 p-2">
                    <InventoryPanel />
                </div>
            </div>

        </div>
    );
};

export default MainGameLayout;
