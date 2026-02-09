import React, { useState } from 'react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

const StatsPanel = () => {
    const { playerStats, level, xp, requiredXp, statPoints, assignStat, gold } = useGame();
    const [showDetails, setShowDetails] = useState(false);

    // Initial load check
    if (!playerStats.str) return <div className="p-4 text-gray-500">Loading Stats...</div>;

    const StatRow = ({ label, value, icon, color, statKey }) => (
        <div className="flex justify-between items-center mb-2 p-2 bg-gray-800 rounded border border-gray-700 hover:border-gray-500 transition-colors">
            <div className="flex items-center gap-2">
                <span className="text-xl">{icon}</span>
                <span className={`font-bold text-sm uppercase tracking-wider ${color}`}>{label}</span>
            </div>
            <div className="flex items-center gap-2">
                <span className="font-mono text-lg">{value}</span>
                {statPoints > 0 && (
                    <button
                        onClick={() => assignStat(statKey)}
                        className="w-5 h-5 flex items-center justify-center bg-yellow-600 text-black font-bold rounded text-xs hover:bg-yellow-500"
                    >
                        +
                    </button>
                )}
            </div>
        </div>
    );

    return (
        <div className="h-full flex flex-col p-2">
            {/* Header / Level / XP */}
            <div className="mb-4 border-b border-gray-700 pb-2">
                <div className="flex justify-between items-center mb-1">
                    <span className="font-serif text-yellow-500 text-lg">Lv. {level}</span>
                    <span className="text-yellow-400 font-mono text-xs">💰 {gold}</span>
                </div>
                {/* XP Bar */}
                <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden">
                    <div className="h-full bg-blue-500" style={{ width: `${(xp / requiredXp) * 100}%` }}></div>
                </div>
                <div className="text-[10px] text-right text-gray-500 mt-1">{xp} / {requiredXp} XP</div>

                {statPoints > 0 && (
                    <div className="text-center text-xs text-yellow-400 font-bold mt-1 bg-yellow-900/30 p-1 rounded animate-pulse">
                        POINTS AVAILABLE: {statPoints}
                    </div>
                )}
            </div>

            {/* Core Attributes */}
            <div className="space-y-1">
                <StatRow label="Strength" value={playerStats.str} icon="💪" color="text-red-400" statKey="str" />
                <StatRow label="Dexterity" value={playerStats.dex} icon="🦵" color="text-green-400" statKey="dex" />
                <StatRow label="Vitality" value={playerStats.vit} icon="❤️" color="text-pink-400" statKey="vit" />
                <StatRow label="Energy" value={playerStats.mag} icon="🔮" color="text-blue-400" statKey="mag" />
            </div>

            {/* Divider */}
            <div className="my-4 border-t border-gray-700"></div>

            {/* Combat Stats Summary */}
            <div className="grid grid-cols-2 gap-2 text-xs text-gray-300">
                <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-500">Damage</div>
                    <div className="text-lg font-bold text-white">{playerStats.minDmg}-{playerStats.maxDmg}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-500">Attack Spd</div>
                    <div className="text-lg font-bold text-white">{(playerStats.attackSpeed * 100).toFixed(0)}%</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-500">HP</div>
                    <div className="text-lg font-bold text-red-400">{playerStats.hp}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center">
                    <div className="text-gray-500">Mana</div>
                    <div className="text-lg font-bold text-blue-400">{playerStats.mp}</div>
                </div>
                <div className="bg-gray-800 p-2 rounded text-center col-span-2">
                    <div className="text-gray-500">Magic Boost</div>
                    <div className="text-lg font-bold text-purple-400">+{playerStats.magicDmgBonus} Dmg</div>
                </div>
            </div>

            {/* Resistances (Optional/Expanded) */}
            <button
                onClick={() => setShowDetails(!showDetails)}
                className="mt-auto w-full py-2 bg-gray-800 hover:bg-gray-700 text-xs text-gray-400 rounded transition-colors"
            >
                {showDetails ? 'Hide Details' : 'Show Details'}
            </button>

            <AnimatePresence>
                {showDetails && (
                    <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden mt-2 bg-black/50 rounded p-2 text-xs"
                    >
                        <div className="flex justify-between"><span className="text-red-400">Fire Res:</span> 0%</div>
                        <div className="flex justify-between"><span className="text-blue-400">Cold Res:</span> 0%</div>
                        <div className="flex justify-between"><span className="text-yellow-400">Light Res:</span> 0%</div>
                        <div className="flex justify-between"><span className="text-green-400">Poison Res:</span> 0%</div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

export default StatsPanel;
