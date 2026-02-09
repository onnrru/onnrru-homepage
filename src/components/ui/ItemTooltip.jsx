import React from 'react';
import { createPortal } from 'react-dom';
import { RARITY, STAT_LABELS, formatStat } from '../../data/items';

const ItemTooltip = ({ item, position }) => {
    if (!item || !position) return null;

    // Filter relevant stats to display
    // Exclude internal keys if any, though our stats object is mostly clean
    const validStats = Object.entries(item.stats).filter(([key, val]) => {
        // Filter out base item props that are not numeric stats if needed
        // But currently stats object has { minDmg, maxDmg, str, ... }
        // We might want to separate "Base" from "Bonus"?
        // For now, just list everything nicely.
        // Skip 'name', 'icon' etc if they leaked into stats (they shouldn't have)
        return STAT_LABELS[key] !== undefined && val !== 0;
    });

    const isUnique = item.rarity === RARITY.UNIQUE;

    return createPortal(
        <div
            className="fixed z-[100] pointer-events-none bg-black/90 border border-gray-600 rounded p-3 shadow-2xl flex flex-col gap-1 w-48 text-xs backdrop-blur-md"
            style={{
                top: position.y + 10,
                left: position.x + 10,
            }}
        >
            {/* Header */}
            <div className={`font-bold text-sm ${item.rarity.color} border-b border-gray-700 pb-1 mb-1`}>
                {item.name}
            </div>

            {/* Rarity & Slot */}
            <div className="text-gray-400 text-[10px] uppercase flex justify-between">
                <span>{item.rarity.name}</span>
                <span>{item.slot}</span>
            </div>

            {/* Stats */}
            <div className="flex flex-col gap-0.5 mt-1">
                {validStats.map(([key, val]) => (
                    <div key={key} className="flex justify-between items-center text-gray-200">
                        <span className="text-gray-400 capitalize">{STAT_LABELS[key] || key}</span>
                        <span className={`font-mono ${(key === 'lifesteal' || key === 'manasteal' || key === 'reflect') ? 'text-amber-400' :
                                (key === 'str' || key === 'dex' || key === 'vit' || key === 'mag') ? 'text-blue-300' : 'text-white'
                            }`}>
                            {formatStat(key, val)}
                        </span>
                    </div>
                ))}
            </div>

            {/* Unique Flavor / Value */}
            {isUnique && (
                <div className="text-amber-500/80 italic mt-2 text-[10px] border-t border-gray-800 pt-1">
                    Special Item
                </div>
            )}

            <div className="text-yellow-600 mt-2 text-right">
                🪙 {item.value} G
            </div>
        </div>,
        document.body
    );
};

export default ItemTooltip;
