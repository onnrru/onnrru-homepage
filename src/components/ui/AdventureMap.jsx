import React from 'react';

const STAGES = [
    { id: 1, name: 'Training Ground', hazard: 1, icon: '⚀' },
    { id: 2, name: 'Goblin Forest', hazard: 2, icon: '⚁' },
    { id: 3, name: 'Dark Cave', hazard: 3, icon: '⚂' },
    { id: 4, name: 'Dragon Peak', hazard: 5, icon: '⚄' },
];

const AdventureMap = () => {
    return (
        <div className="h-full flex items-center gap-4 overflow-x-auto px-2">
            <div className="flex-shrink-0 text-gray-400 font-bold text-xs uppercase writing-vertical px-2 border-r border-gray-700">
                World Map
            </div>

            {STAGES.map(stage => (
                <button
                    key={stage.id}
                    className="
                        group relative w-32 h-full bg-gray-800 border border-gray-700 rounded-lg 
                        flex flex-col items-center justify-center p-2
                        hover:bg-gray-700 hover:border-yellow-500 transition-all
                    "
                >
                    <div className="text-2xl mb-1 group-hover:scale-110 transition-transform">{stage.icon}</div>
                    <div className="text-xs font-bold text-center text-gray-300 group-hover:text-white leading-tight">
                        {stage.name}
                    </div>

                    {/* Hazard Level */}
                    <div className="absolute top-1 right-1 flex gap-0.5">
                        {Array(stage.hazard).fill(0).map((_, i) => (
                            <div key={i} className="w-1 h-1 rounded-full bg-red-500"></div>
                        ))}
                    </div>

                    {/* Preview Loot (Optional) */}
                    <div className="absolute bottom-1 w-full flex justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <span className="text-[10px]">🎁</span>
                    </div>
                </button>
            ))}
        </div>
    );
};

export default AdventureMap;
