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
        const damping = 0.98;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;

            // Initialize ripple grids based on resolution
            // Using a lower resolution grid for performance and scaling up
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
            ctx.clearRect(0, 0, width, height);

            // Draw background (Black/White gradient for depth)
            const grad = ctx.createRadialGradient(width / 2, height / 2, 0, width / 2, height / 2, width);
            grad.addColorStop(0, '#1a1a1a');
            grad.addColorStop(1, '#050505');
            ctx.fillStyle = grad;
            ctx.fillRect(0, 0, width, height);

            const res = 4;
            const cols = Math.ceil(width / res) + 2;
            const rows = Math.ceil(height / res) + 2;

            // Simple ray tracing simulation for ripples
            // We iterate through the grid and draw points or use putImageData for efficiency
            // For a "premium" feel, we'll draw subtle light reflections
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;

            for (let r = 1; r < rows - 2; r += 2) {
                ctx.beginPath();
                for (let c = 1; c < cols - 1; c++) {
                    const idx = r * cols + c;
                    const val = rippleData[idx];
                    const x = (c - 1) * res;
                    const y = (r - 1) * res + (val * 0.05); // Displace Y based on ripple height
                    if (c === 1) ctx.moveTo(x, y);
                    else ctx.lineTo(x, y);
                }
                ctx.stroke();
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

        // 5s interval drops
        const intervalId = setInterval(() => {
            const rx = Math.random() * width;
            const ry = Math.random() * height;
            dropAt(rx, ry, 1, 256);
        }, 5000);

        const handleMouseMove = (e) => {
            const rect = canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            dropAt(x, y, 1, 64);
        };

        canvas.addEventListener('mousemove', handleMouseMove);

        return () => {
            window.removeEventListener('resize', resize);
            canvas.removeEventListener('mousemove', handleMouseMove);
            clearInterval(intervalId);
        };
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-black flex items-center justify-center" ref={containerRef}>
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full cursor-none"
            />

            <div className="z-10 text-center px-6 max-w-4xl pointer-events-none">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 2, ease: "easeOut" }}
                >
                    <h1 className="text-white text-4xl md:text-6xl font-serif font-bold tracking-[0.2em] mb-8">
                        ONNRRU
                    </h1>
                    <div className="w-12 h-[1px] bg-white/30 mx-auto mb-8" />
                    <p className="text-white/70 text-base md:text-lg font-light leading-relaxed tracking-wide balance">
                        온류(ONNRRU)는 공간과 경험을 연결하는 프리미엄 라이프스타일 브랜드입니다.
                        <br className="hidden md:block" />
                        잔잔한 물결이 퍼지듯, 우리의 제안이 당신의 일상에 기분 좋은 변화를 가져다 주기를 바랍니다.
                    </p>
                </motion.div>

                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 2.5, duration: 1.5 }}
                    className="mt-16"
                >
                    <a
                        href="/pizza"
                        className="pointer-events-auto inline-block border border-white/20 px-8 py-3 rounded-full text-white/50 text-xs tracking-widest hover:bg-white hover:text-black hover:border-white transition-all duration-700"
                    >
                        ENTER EXPERIENCE
                    </a>
                </motion.div>
            </div>

            {/* Subtle overlay to enhance contrast */}
            <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-transparent via-transparent to-black/40" />
        </div>
    );
};

export default LandingPage;
