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
            if (!ctx) return;

            // Background: Faint trail effect for "Ink Bloom" persistence
            ctx.fillStyle = 'rgba(253, 253, 253, 0.04)';
            ctx.fillRect(0, 0, width, height);

            // Subtle paper grain
            ctx.fillStyle = 'rgba(0, 0, 0, 0.02)';
            for (let i = 0; i < 50; i++) {
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }

            const res = 4;
            const cols = Math.ceil(width / res) + 2;
            const rows = Math.ceil(height / res) + 2;

            // Efficient rendering using ImageData
            const imgData = ctx.getImageData(0, 0, width, height);
            const pixels = imgData.data;

            for (let r = 0; r < rows; r += 2) {
                for (let c = 0; c < cols; c += 2) {
                    const idx = r * cols + c;
                    const val = rippleData[idx];

                    if (Math.abs(val) > 1) {
                        const x = c * res;
                        const y = r * res;
                        const opacity = Math.min(100, Math.floor(Math.abs(val) / 10));

                        for (let dy = 0; dy < 4; dy++) {
                            for (let dx = 0; dx < 4; dx++) {
                                const px = x + dx;
                                const py = y + dy;
                                if (px < width && py < height) {
                                    const pIdx = (py * width + px) * 4;
                                    pixels[pIdx] = 0;     // R
                                    pixels[pIdx + 1] = 0; // G
                                    pixels[pIdx + 2] = 0; // B
                                    pixels[pIdx + 3] = Math.max(pixels[pIdx + 3], opacity); // A
                                }
                            }
                        }
                    }
                }
            }
            ctx.putImageData(imgData, 0, 0);
        };

        const animate = () => {
            update();
            draw();
            requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        // Initial burst: Multiple drops on load to ensure user sees it immediately
        setTimeout(() => {
            for (let i = 0; i < 3; i++) {
                setTimeout(() => {
                    dropAt(
                        width / 2 + (Math.random() - 0.5) * 200,
                        height / 2 + (Math.random() - 0.5) * 200,
                        4,
                        2048
                    );
                }, i * 500);
            }
        }, 1000);

        // One central "Ink Drop" every 4 seconds for frequent visual feedback
        const intervalId = setInterval(() => {
            // Target center-ish for the main branding drop
            // Enhanced natural bloom with random variation
            const radius = 4 + Math.random() * 2;
            const strength = 1500 + Math.random() * 1000;
            dropAt(width / 2 + (Math.random() - 0.5) * 100, height / 2 + (Math.random() - 0.5) * 100, radius, strength);
        }, 4000);

        // Remove mousemove event listener as per request
        // canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resize);
            // canvas.removeEventListener('mousemove', handleMouseMove);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-white flex items-center justify-center font-sans" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full"
            />

            <div className="z-10 text-center px-6 max-w-4xl pointer-events-none select-none">
                <motion.div
                    initial={{ opacity: 0, scale: 1.05 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 3, ease: [0.22, 1, 0.36, 1] }}
                >
                    <h1 className="text-gray-900 text-4xl md:text-6xl font-serif font-black tracking-[0.4em] mb-4 opacity-95">
                        ONNRRU
                    </h1>

                    <div className="space-y-8">
                        <p className="text-gray-600 text-xl md:text-2xl font-serif italic tracking-widest mb-12">
                            A New Perspective on What Matters
                        </p>

                        <p className="text-gray-800 text-lg md:text-2xl font-medium tracking-tight leading-relaxed balance max-w-2xl mx-auto border-t border-gray-100 pt-12">
                            본질 위에 새로운 시선을 더합니다.<br />
                            삶의 가치와 공간을 가다듬어<br />
                            그 여유와 비전을 함께 나눕니다.
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

            {/* Background Accent Removed */}
        </div>
    );
};

export default LandingPage;
