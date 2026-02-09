import React from 'react';
import { useGame } from '../../context/GameContext';
import { ITEM_SLOTS, RARITY } from '../../data/items';
import ItemTooltip from '../ui/ItemTooltip';

const EquipSlot = ({ slotName, item, onUnequip, iconPlaceholder, equipItem, onHover }) => {
    const handleDrop = (e) => {
        e.preventDefault();
        try {
            const data = e.dataTransfer.getData('item');
            if (!data) return;
            const droppedItem = JSON.parse(data);

            // Validation
            const isRing = droppedItem.slot === ITEM_SLOTS.RING_1; // Genereated rings are RING_1
            const isTargetRing = slotName === ITEM_SLOTS.RING_1 || slotName === ITEM_SLOTS.RING_2;

            if (droppedItem.slot === slotName || (isRing && isTargetRing)) {
                equipItem(droppedItem, slotName);
            } else {
                console.log("Invalid Slot", droppedItem.slot, slotName);
            }
        } catch (err) {
            console.error(err);
        }
    };

    return (
        <div
            onClick={() => onUnequip(slotName)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onMouseEnter={(e) => item && onHover(e, item)}
            onMouseMove={(e) => item && onHover(e, item)}
            onMouseLeave={(e) => onHover(e, null)}
            className="w-16 h-16 bg-gray-800 border-2 border-dashed border-gray-600 rounded-lg flex items-center justify-center relative cursor-pointer hover:border-gray-400 hover:bg-gray-700 transition-colors"
        >
            {item ? (
                <div className="flex flex-col items-center pointer-events-none">
                    <span className="text-2xl">{item.icon}</span>
                    <span className={`text-[10px] items-center ${item.rarity === RARITY.UNIQUE ? 'text-amber-500' :
                        item.rarity === RARITY.RARE ? 'text-yellow-400' :
                            item.rarity === RARITY.MAGIC ? 'text-blue-400' : 'text-gray-300'
                        }`}>{item.name.split(' ').pop()}</span>
                </div>
            ) : (
                <span className="text-2xl opacity-20 grayscale pointer-events-none">{iconPlaceholder}</span>
            )}
            <span className="absolute -bottom-4 text-[10px] text-gray-500 uppercase">{slotName}</span>
        </div>
    );
};

const EquipmentPanel = () => {
    const { equipment, unequipItem, equipItem } = useGame();

    // Tooltip State
    const [hoveredItem, setHoveredItem] = React.useState(null);
    const [tooltipPos, setTooltipPos] = React.useState({ x: 0, y: 0 });

    const handleHover = (e, item) => {
        if (item) {
            setHoveredItem(item);
            setTooltipPos({ x: e.clientX, y: e.clientY });
        } else {
            setHoveredItem(null);
        }
    };

    return (
        <div className="w-full h-full flex flex-col items-center justify-center bg-gray-900/50 backdrop-blur-sm p-8">
            <h2 className="text-2xl font-serif text-gray-300 mb-8">Equipment</h2>

            <ItemTooltip item={hoveredItem} position={tooltipPos} />

            <div className="grid grid-cols-3 gap-8 items-center">
                {/* Left Col */}
                <div className="flex flex-col gap-4">
                    <EquipSlot slotName={ITEM_SLOTS.GLOVES} item={equipment[ITEM_SLOTS.GLOVES]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="🧤" />
                    <EquipSlot slotName={ITEM_SLOTS.RING_1} item={equipment[ITEM_SLOTS.RING_1]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="💍" />
                    <EquipSlot slotName={ITEM_SLOTS.MAIN_HAND} item={equipment[ITEM_SLOTS.MAIN_HAND]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="⚔️" />
                </div>

                {/* Center Col */}
                <div className="flex flex-col gap-4 items-center">
                    <EquipSlot slotName={ITEM_SLOTS.HEAD} item={equipment[ITEM_SLOTS.HEAD]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="⛑️" />
                    <EquipSlot slotName={ITEM_SLOTS.ARMOR} item={equipment[ITEM_SLOTS.ARMOR]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="👕" />
                    <EquipSlot slotName={ITEM_SLOTS.AMULET} item={equipment[ITEM_SLOTS.AMULET]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="🧿" />
                    <EquipSlot slotName={ITEM_SLOTS.BOOTS} item={equipment[ITEM_SLOTS.BOOTS]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="👢" />
                </div>

                {/* Right Col */}
                <div className="flex flex-col gap-4">
                    <EquipSlot slotName={ITEM_SLOTS.OFF_HAND} item={equipment[ITEM_SLOTS.OFF_HAND]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="🛡️" />
                    <EquipSlot slotName={ITEM_SLOTS.RING_2} item={equipment[ITEM_SLOTS.RING_2]} onUnequip={unequipItem} equipItem={equipItem} onHover={handleHover} iconPlaceholder="💍" />
                </div>
            </div>
        </div>
    );
};

export default EquipmentPanel;
