import React, { useState, useRef, useEffect } from 'react';
import { motion, useAnimation } from 'framer-motion';

const DiceSlingshot = ({ onThrowComplete, zones = [] }) => {
    const diceRef = useRef(null);
    const containerRef = useRef(null);
    const controls = useAnimation();

    const [isDragging, setIsDragging] = useState(false);
    const [diceValue, setDiceValue] = useState(6);
    const [isThrown, setIsThrown] = useState(false);
    const [targetZoneColor, setTargetZoneColor] = useState('text-white');

    // Anchor & Drag State
    const [anchorPos, setAnchorPos] = useState({ x: 0, y: 0 });
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 }); // Mouse relative to Anchor

    // Initialize Anchor
    useEffect(() => {
        const updateAnchor = () => {
            if (containerRef.current) {
                const rect = containerRef.current.getBoundingClientRect();
                // Fixed Anchor: Bottom Center (25% from bottom)
                setAnchorPos({
                    x: rect.left + rect.width / 2,
                    y: rect.bottom - (rect.height * 0.25)
                });
            }
        };
        updateAnchor();
        window.addEventListener('resize', updateAnchor);
        return () => window.removeEventListener('resize', updateAnchor);
    }, []);

    const MAX_DRAG = 150;
    const POWER_MULT = 4.0; // Multiplier for throw distance

    const handlePointerDown = (e) => {
        if (isThrown) return;
        const { clientX, clientY } = e;

        // "Remote" Drag: Touching anywhere starts the drag relative to the anchor
        // This restores the "responsive" feel of the first version
        setIsDragging(true);

        // We track the *initial* touch point to calculate delta
        // But we rely on the pointer move to update `dragOffset`
        // Setting an initial 'ghost' offset to 0
        setDragOffset({ x: 0, y: 0 });

        // Store click start for delta calc (we need a ref or state for startDragPos if we want true delta)
        // Actually, let's use the layout state: 
        // We want the Dice to SNAP to the finger? Or relative?
        // User said: "Pull back opposite...". 
        // Relative is best. "Touch, then Pull".
        // Use a ref for dragOrigin to avoid re-renders just for the start point
        containerRef.current.dataset.startX = clientX;
        containerRef.current.dataset.startY = clientY;
    };

    const handlePointerMove = (e) => {
        if (!isDragging || isThrown) return;
        const { clientX, clientY } = e;

        const startX = parseFloat(containerRef.current.dataset.startX || clientX);
        const startY = parseFloat(containerRef.current.dataset.startY || clientY);

        let dx = clientX - startX;
        let dy = clientY - startY;

        // Clamp Drag
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist > MAX_DRAG) {
            const ratio = MAX_DRAG / dist;
            dx *= ratio;
            dy *= ratio;
        }

        setDragOffset({ x: dx, y: dy });

        const targetX = anchorPos.x - dx * POWER_MULT;
        const targetY = anchorPos.y - dy * POWER_MULT;

        checkZoneOverlap(targetX, targetY);
    };

    const checkZoneOverlap = (x, y) => {
        let bestZone = null;
        let minRadius = Infinity;

        for (const zone of zones) {
            const dx = x - zone.absX;
            const dy = y - zone.absY;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist <= zone.radius) {
                if (zone.radius < minRadius) {
                    minRadius = zone.radius;
                    bestZone = zone;
                }
            }
        }

        if (bestZone) {
            if (bestZone.id === 'red') setTargetZoneColor('text-red-500');
            else if (bestZone.id === 'yellow') setTargetZoneColor('text-yellow-400');
            else if (bestZone.id === 'green') setTargetZoneColor('text-green-500');
            else setTargetZoneColor('text-white');
        } else {
            setTargetZoneColor('text-white');
        }
    };

    // Trigger Animation when isThrown becomes true
    useEffect(() => {
        if (isThrown) {
            const animateThrow = async () => {
                // Final Calculation based on state at release
                const targetX = anchorPos.x - dragOffset.x * POWER_MULT;
                const targetY = anchorPos.y - dragOffset.y * POWER_MULT;

                // Rolling Number Effect
                const rollInterval = setInterval(() => {
                    setDiceValue(Math.ceil(Math.random() * 6));
                }, 50);

                // Animate Throw
                await controls.start({
                    x: targetX,
                    y: targetY,
                    rotate: 720 * 2,
                    scale: [1, 1.5, 1], // Arc effect
                    transition: { duration: 0.6, ease: "circOut" }
                });

                clearInterval(rollInterval);
                const finalValue = Math.ceil(Math.random() * 6);
                setDiceValue(finalValue);

                // Visual Pause before Hit Registration
                setTimeout(() => {
                    onThrowComplete(finalValue, { x: targetX, y: targetY });
                }, 400);
            };

            animateThrow();
        }
    }, [isThrown, controls, anchorPos, dragOffset, POWER_MULT, onThrowComplete]);

    const handlePointerUp = () => {
        if (!isDragging || isThrown) return;
        setIsDragging(false);
        setIsThrown(true); // Triggers the effect above
    };

    // Trajectory Visualization
    // From Dice (Current Drag Pos) -> To Target
    const diceX = anchorPos.x + dragOffset.x;
    const diceY = anchorPos.y + dragOffset.y;

    const trajEndX = anchorPos.x - dragOffset.x * POWER_MULT;
    const trajEndY = anchorPos.y - dragOffset.y * POWER_MULT;

    // Draw line from Dice to Expected Landing
    const trajLength = Math.sqrt(
        Math.pow(trajEndX - diceX, 2) +
        Math.pow(trajEndY - diceY, 2)
    );
    const trajAngle = Math.atan2(trajEndY - diceY, trajEndX - diceX) * 180 / Math.PI;

    return (
        <div
            ref={containerRef}
            className="absolute inset-0 z-30 cursor-crosshair touch-none"
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerLeave={handlePointerUp}
        >
            {/* Anchor / Ready State */}
            {!isDragging && !isThrown && (
                <div
                    className="absolute transform -translate-x-1/2 -translate-y-1/2 flex flex-col items-center animate-pulse"
                    style={{ left: anchorPos.x, top: anchorPos.y }}
                >
                    <div className="w-16 h-16 bg-white/20 border-4 border-white/50 rounded-2xl flex items-center justify-center backdrop-blur-md shadow-[0_0_20px_rgba(255,255,255,0.3)]">
                        <span className="text-3xl font-bold text-white/90">🎲</span>
                    </div>
                    <div className="mt-2 text-white/50 text-xs font-mono">PULL & RELEASE</div>
                </div>
            )}

            {isDragging && !isThrown && (
                <>
                    {/* Trajectory Guide (Arrow from Dice) */}
                    <div
                        className={`absolute origin-left h-2 flex items-center overflow-visible pointer-events-none ${targetZoneColor}`}
                        style={{
                            left: diceX,
                            top: diceY,
                            width: trajLength,
                            transform: `translate(0, -50%) rotate(${trajAngle}deg)`,
                            opacity: 0.9,
                            zIndex: 20
                        }}
                    >
                        {/* Dashed Line */}
                        <div className="w-full h-1 bg-current border-t-2 border-dashed border-current opacity-60"></div>

                        {/* Arrow Head */}
                        <div className="absolute right-0 w-4 h-4 border-t-4 border-r-4 border-current transform rotate-45 translate-x-1/2"></div>

                        {/* Target Circle (Landing Spot) */}
                        <div className="absolute right-0 translate-x-1/2 w-12 h-12 border-2 border-dashed border-current rounded-full animate-spin-slow opacity-50"></div>
                    </div>

                    {/* Drag String (Elastic) */}
                    <svg className="absolute inset-0 pointer-events-none overflow-visible z-10">
                        <line
                            x1={anchorPos.x} y1={anchorPos.y}
                            x2={diceX} y2={diceY}
                            stroke="rgba(255,255,255,0.4)" strokeWidth="3"
                            strokeDasharray="5,5"
                        />
                    </svg>

                    {/* The Dice (Being Dragged) */}
                    <motion.div
                        initial={{ scale: 1 }}
                        style={{
                            position: 'absolute',
                            left: diceX,
                            top: diceY,
                            pointerEvents: 'none',
                            zIndex: 40
                        }}
                        className="transform -translate-x-1/2 -translate-y-1/2"
                    >
                        <div className={`
                            w-14 h-14 bg-white rounded-xl shadow-[0_0_20px_rgba(255,255,255,0.6)] 
                            flex items-center justify-center border-2 border-current ${targetZoneColor}
                        `}>
                            <span className="text-2xl font-bold text-black">{diceValue}</span>
                        </div>
                    </motion.div>
                </>
            )}

            {/* Flying Dice (Animation) */}
            {isThrown && (
                <motion.div
                    ref={diceRef}
                    animate={controls}
                    initial={{ x: anchorPos.x + dragOffset.x, y: anchorPos.y + dragOffset.y }}
                    className="absolute w-12 h-12 bg-white rounded-xl shadow-[0_0_10px_white] flex items-center justify-center z-40 transform -translate-x-1/2 -translate-y-1/2"
                >
                    <span className="text-2xl font-bold text-black">{diceValue}</span>
                </motion.div>
            )}
        </div>
    );
};

export default DiceSlingshot;
