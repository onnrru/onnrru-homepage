import React, { useEffect, useState } from 'react';
import { useGame } from '../../context/GameContext';
import { motion } from 'framer-motion';

const CharacterAvatar = () => {
    const { equipment } = useGame();
    // In a real app, we'd compose SVG/Canvas layers based on equipment.
    // For now, simple visual feedback.

    return (
        <div className="w-full h-full flex flex-col items-center justify-end pb-4 relative overflow-hidden">
            {/* Background Aura */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-50"></div>

            <div className="relative z-10 w-32 h-48 bg-gray-700/50 rounded-full flex items-center justify-center border-4 border-gray-600 shadow-2xl">
                <span className="text-4xl">🧍</span>

                {/* Visual Layers based on Equip */}
                {equipment.head && <div className="absolute top-0 text-2xl">⛑️</div>}
                {equipment.mainHand && <div className="absolute left-[-20px] top-20 text-2xl">⚔️</div>}
                {equipment.armor && <div className="absolute text-sm opacity-50">🛡️</div>}
            </div>

            <div className="mt-4 text-center">
                <h3 className="text-yellow-500 font-serif text-lg">Hero</h3>
                <p className="text-xs text-gray-400">Level 1 Adventurer</p>
            </div>

            {/* Footer / Floor effect */}
            <div className="absolute bottom-0 w-full h-8 bg-black/80 blur-lg"></div>
        </div>
    );
};

export default CharacterAvatar;
