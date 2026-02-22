import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    const canvasRef = useRef(null);
    const containerRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        let width, height;
        let rippleData = [];
        let rippleBuffer = [];
        const damping = 0.96; // Slightly more damped for a thicker, ink-like feel

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            const res = 4;
            const cols = Math.ceil(width / res) + 2;
            const rows = Math.ceil(height / res) + 2;
            rippleData = new Float32Array(cols * rows);
            rippleBuffer = new Float32Array(cols * rows);
        };

        const dropAt = (x, y, radius = 2, strength = 512) => {
            const res = 4;
            const col = Math.floor(x / res) + 1;
            const row = Math.floor(y / res) + 1;
            const cols = Math.ceil(width / res) + 2;

            for (let i = -radius; i <= radius; i++) {
                for (let j = -radius; j <= radius; j++) {
                    const idx = (row + i) * cols + (col + j);
                    if (idx >= 0 && idx < rippleData.length) {
                        rippleData[idx] += strength;
                    }
                }
            }
        };

        const update = () => {
            const res = 4;
            const cols = Math.ceil(width / res) + 2;
            const rows = Math.ceil(height / res) + 2;

            for (let r = 1; r < rows - 1; r++) {
                for (let c = 1; c < cols - 1; c++) {
                    const idx = r * cols + c;
                    rippleBuffer[idx] = (
                        (rippleData[idx - 1] +
                            rippleData[idx + 1] +
                            rippleData[idx - cols] +
                            rippleData[idx + cols]) / 2 - rippleBuffer[idx]
                    ) * damping;
                }
            }

            // Swap buffers
            const temp = rippleData;
            rippleData = rippleBuffer;
            rippleBuffer = temp;
        };

        const draw = () => {
            // Background: Paper-like faint texture
            ctx.fillStyle = '#fdfdfd';
            ctx.fillRect(0, 0, width, height);

            // Subtle paper grain (optional, but good for "premium")
            ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
            for (let i = 0; i < 100; i++) {
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }

            const res = 4;
            const cols = Math.ceil(width / res) + 2;
            const rows = Math.ceil(height / res) + 2;

            // Draw ink-like ripples: Darker strokes with variable opacity
            ctx.lineWidth = 1.2;

            // We draw horizontal "ink strokes" that follow the ripple displacement
            for (let r = 1; r < rows - 2; r += 3) {
                ctx.beginPath();
                let hasMovement = false;
                for (let c = 1; c < cols - 1; c++) {
                    const idx = r * cols + c;
                    const val = rippleData[idx];

                    if (Math.abs(val) > 0.1) hasMovement = true;

                    const x = (c - 1) * res;
                    const y = (r - 1) * res + (val * 0.08); // Slight vertical offset to create wave effect

                    // Opacity based on displacement magnitude for "ink bleeding" feel
                    const alpha = Math.min(1, Math.abs(val) / 64);
                    if (c === 1) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }

                if (hasMovement) {
                    ctx.strokeStyle = `rgba(30, 30, 30, ${0.05 + Math.random() * 0.05})`; // Variable faint ink lines
                    ctx.stroke();
                }
            }
        };

        const animate = () => {
            update();
            draw();
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        // One central "Ink Drop" every 6 seconds as requested
        const intervalId = setInterval(() => {
            // Target center-ish for the main branding drop
            dropAt(width / 2 + (Math.random() - 0.5) * 100, height / 2 + (Math.random() - 0.5) * 100, 3, 1024);
        }, 6000);

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            dropAt(x, y, 1, 48);
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-white flex items-center justify-center font-sans" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-none"
            />

            <div className="z-10 text-center px-6 max-w-4xl pointer-events-none select-none">
                <motion.div
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-gray-900 text-3xl md:text-5xl font-serif font-black tracking-[0.3em] mb-12 opacity-90">
                        ONNRRU
                    </h1>

                    <div className="w-8 h-[1px] bg-gray-900/10 mx-auto mb-12" />

                    <div className="space-y-6">
                        <p className="text-gray-800 text-lg md:text-xl font-medium tracking-tight leading-relaxed balance">
                            온류(ONNRRU)는 공간의 가치와 본질을 탐구하며,<br />
                            더 나은 삶의 방식을 제안하는 기업입니다.
                        </p>
                        <p className="text-gray-500 text-sm md:text-base font-light tracking-wide leading-relaxed opacity-80">
                            우리는 보이지 않는 흐름을 읽고,<br />
                            당신의 일상에 지속 가능한 변화를 일으키고자 합니다.
                        </p>
                    </div>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2, duration: 2 }}
                    className="mt-20"
                >
                    <a
                        href="/pizza"
                        className="pointer-events-auto inline-block bg-gray-900 px-10 py-4 rounded-full text-white text-[10px] font-bold tracking-[0.2em] hover:bg-gray-800 hover:scale-105 transition-all duration-500 shadow-lg shadow-gray-200"
                    >
                        EXPLORE EXPERIENCE
                    </a>
                </motion.div>
            </div>

            {/* Faint vine-like or ink-wash corner accent (Optional for 수묵화 feel) */}
            <div className="absolute bottom-0 right-0 w-64 h-64 opacity-[0.03] pointer-events-none rotate-180">
                <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 100 Q 20 20 100 0 L 100 100 Z" /></svg>
            </div>
        </div>
    );
};

export default LandingPage;
