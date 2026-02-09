import React from 'react';
import { useGame } from '../../context/GameContext';
import { ITEM_SLOTS, RARITY } from '../../data/items';

import ItemTooltip from './ItemTooltip';

const InventoryPanel = () => {
    const { inventory, equipItem, equipment, unequipItem } = useGame();

    // Tooltip State
    const [hoveredItem, setHoveredItem] = React.useState(null);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

    const handleMouseEnter = (e, item) => {
        setHoveredItem(item);
        setTooltipPos({ x: e.clientX, y: e.clientY });
    };

    const handleMouseMove = (e) => {
        if (hoveredItem) {
            setTooltipPos({ x: e.clientX, y: e.clientY });
        }
    };

    const handleMouseLeave = () => {
        setHoveredItem(null);
    };

    // 30 Slots grid
    const slots = Array(30).fill(null);
    inventory.forEach((item, i) => { slots[i] = item; });

    // Equipment Display (Mini Paper doll for quick unequip?)
    // Let's focus on Grid first.

    return (
        <div className="h-full flex gap-2">
            {/* Tooltip Portal */}
            <ItemTooltip item={hoveredItem} position={tooltipPos} />

            {/* Inventory Grid */}
            <div className="flex-1 bg-gray-950 p-2 rounded border border-gray-700 overflow-y-auto">
                <h4 className="text-xs text-gray-400 mb-2 uppercase">Inventory</h4>
                <div className="grid grid-cols-6 gap-1">
                    {slots.map((item, idx) => (
                        <div
                            key={idx}
                            draggable={!!item}
                            onDragStart={(e) => {
                                if (item) {
                                    e.dataTransfer.setData('item', JSON.stringify(item));
                                    e.dataTransfer.effectAllowed = 'move';
                                }
                            }}
                            onMouseEnter={(e) => item && handleMouseEnter(e, item)}
                            onMouseMove={handleMouseMove}
                            onMouseLeave={handleMouseLeave}
                            onClick={() => item && equipItem(item)}
                            className={`
                                aspect-square bg-gray-900 border border-gray-800 rounded
                                flex items-center justify-center relative cursor-move
                                hover:border-gray-500 hover:bg-gray-800 transition-colors
                                ${item ? 'border-gray-600' : ''}
                            `}
                        >
                            {item && (
                                <>
                                    <span className="text-xl">{item.icon}</span>
                                    {/* Rarity Border */}
                                    <div className={`absolute inset-0 border-2 rounded pointer-events-none opacity-50 ${item.rarity === RARITY.UNIQUE ? 'border-amber-600' :
                                        item.rarity === RARITY.RARE ? 'border-yellow-400' :
                                            item.rarity === RARITY.MAGIC ? 'border-blue-400' : 'border-transparent'
                                        }`}></div>
                                </>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Actions Panel */}
            <div className="w-24 flex flex-col gap-2">
                <ActionButton label="Buy" color="bg-green-700" />
                <ActionButton label="Sell" color="bg-yellow-700" />
                <ActionButton label="Gamble" color="bg-purple-700" />
                <ActionButton label="Craft" color="bg-blue-700" />
                <div className="flex-1"></div>
                <div className="text-[10px] text-gray-500 text-center">
                    Drag or Click to Equip
                </div>
            </div>
        </div>
    );
};

const ActionButton = ({ label, color }) => (
    <button className={`w-full py-2 rounded text-xs font-bold uppercase shadow text-white/90 hover:text-white hover:brightness-110 transition-all ${color}`}>
        {label}
    </button>
);

export default InventoryPanel;
