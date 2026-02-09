import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const MonsterDisplay = ({
    monsters,
    isBoss,
    onZonesUpdate,
    gameState,
    combatBalance = { zoneScale: 1.0, allowedFaces: [] }
}) => {
    const containerRef = useRef(null);

    // Base Radius for Green Zone (Standard 60px -> Scaled)
    // Red: 10% (Min 12px), Yellow: 50%
    // Spec: "R_g >= 60px" logic but scaled.
    const finalGreenRadius = Math.max(60, 60 * combatBalance.zoneScale);
    const finalYellowRadius = finalGreenRadius * 0.5;
    const finalRedRadius = Math.max(12, finalGreenRadius * 0.1);

    // Update Zones for Hit Detection
    useEffect(() => {
        if (!monsters || (monsters.length === 0 && !isBoss)) return;

        const updateZones = () => {
            if (!containerRef.current) return;
            const rect = containerRef.current.getBoundingClientRect();

            const newZones = [];

            if (isBoss) {
                // Boss Zones (Center)
                const centerX = rect.left + rect.width / 2;
                const centerY = rect.top + rect.height / 2;

                newZones.push({ id: 'red', absX: centerX, absY: centerY, radius: finalRedRadius });
                newZones.push({ id: 'yellow', absX: centerX, absY: centerY, radius: finalYellowRadius });
                newZones.push({ id: 'green', absX: centerX, absY: centerY, radius: finalGreenRadius });
            } else {
                // Mob Zones
                monsters.forEach(mob => {
                    // Mob position logic is CSS based (top/left).
                    const mx = rect.left + (rect.width * mob.x / 100);
                    const my = rect.top + (rect.height * mob.y / 100);
                    newZones.push({ id: mob.id, absX: mx, absY: my, radius: finalGreenRadius });
                });
            }
            onZonesUpdate(newZones);
        };

        updateZones();
        const interval = setInterval(updateZones, 100);
        window.addEventListener('resize', updateZones);
        return () => {
            clearInterval(interval);
            window.removeEventListener('resize', updateZones);
        };
    }, [monsters, isBoss, finalGreenRadius, finalYellowRadius, finalRedRadius, onZonesUpdate]);

    return (
        <div ref={containerRef} className="relative w-full h-full">
            {/* Miss Guard / Allowed Faces Indicator */}
            <div className="absolute top-4 right-4 bg-black/60 p-2 rounded-lg border border-white/20 z-10">
                <div className="text-[10px] text-gray-400 mb-1 uppercase tracking-wider">Miss Guard</div>
                <div className="flex gap-1">
                    {combatBalance.allowedFaces.length > 0 ? (
                        combatBalance.allowedFaces.map(face => (
                            <span key={face} className="w-5 h-5 flex items-center justify-center bg-blue-900/50 text-blue-200 text-xs font-bold rounded border border-blue-500/30">
                                {face}
                            </span>
                        ))
                    ) : (
                        <span className="text-gray-500 text-xs">None</span>
                    )}
                </div>
            </div>

            {isBoss ? (
                // BOSS RENDER
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
                    {/* Zone Visuals */}
                    <div className="absolute rounded-full border border-green-500/30 bg-green-500/10 animate-pulse"
                        style={{ width: finalGreenRadius * 2, height: finalGreenRadius * 2 }} />
                    <div className="absolute rounded-full border border-yellow-500/40 bg-yellow-500/10"
                        style={{ width: finalYellowRadius * 2, height: finalYellowRadius * 2 }} />
                    <div className="absolute rounded-full border-2 border-red-500/60 bg-red-500/20 shadow-[0_0_15px_red]"
                        style={{ width: finalRedRadius * 2, height: finalRedRadius * 2 }} />

                    {/* Boss Sprite */}
                    <div className="relative z-10 w-32 h-32 bg-gray-900 rounded-full flex items-center justify-center shadow-2xl border border-gray-700">
                        <span className="text-6xl drop-shadow-md">👹</span>
                        <div className="absolute -bottom-3 bg-red-900/80 text-white text-xs px-2 py-0.5 rounded border border-red-500/50">BOSS</div>
                    </div>
                </div>
            ) : (
                // MOB PACK RENDER
                monsters.map(mob => (
                    <div
                        key={mob.id}
                        className="absolute w-16 h-16 transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                        style={{ left: `${mob.x}%`, top: `${mob.y}%` }}
                    >
                        {/* Mob Hit Zone Visual (Optional, helps player know they can hit) */}
                        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 rounded-full border border-green-500/20"
                            style={{ width: finalGreenRadius * 2, height: finalGreenRadius * 2 }} />

                        <div className="w-full h-full flex flex-col items-center justify-center relative">
                            <div className="w-12 h-1 bg-gray-800 mb-1 rounded overflow-hidden border border-gray-600">
                                <div className="h-full bg-red-500" style={{ width: `${(mob.hp / mob.maxHp) * 100}%` }}></div>
                            </div>
                            <div className="w-10 h-10 bg-gray-800 rounded-full border border-gray-600 flex items-center justify-center shadow-md">
                                <span className="text-xl">👿</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
        </div>
    );
};

export default MonsterDisplay;
