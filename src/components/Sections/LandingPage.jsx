import React, { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

const LandingPage = () => {
    const canvasRef = useRef(null);

    useEffect(() => {
        const canvas = canvasRef.current;
        if (!canvas) return;
        const ctx = canvas.getContext('2d');
        let width, height;
        let particles = [];
        let animationFrameId;

        const resize = () => {
            width = window.innerWidth;
            height = window.innerHeight;
            canvas.width = width;
            canvas.height = height;
            initParticles();
        };

        class Particle {
            constructor() {
                this.reset();
            }

            reset() {
                this.x = Math.random() * width;
                this.y = Math.random() * height;
                this.size = Math.random() * 1.5 + 0.5;
                this.vx = (Math.random() - 0.5) * 0.2;
                this.vy = (Math.random() - 0.5) * 0.2;
                this.opacity = Math.random() * 0.3 + 0.1;
                this.life = Math.random() * 0.5 + 0.5;
            }

            update() {
                this.x += this.vx;
                this.y += this.vy;

                if (this.x < 0 || this.x > width || this.y < 0 || this.y > height) {
                    this.reset();
                }
            }

            draw() {
                ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        const initParticles = () => {
            particles = [];
            const count = Math.min(100, (width * height) / 15000);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Subtle grain texture
            ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
            for (let i = 0; i < 30; i++) {
                ctx.fillRect(Math.random() * width, Math.random() * height, 1, 1);
            }

            particles.forEach(p => {
                p.update();
                p.draw();
            });
            animationFrameId = requestAnimationFrame(animate);
        };

        window.addEventListener('resize', resize);
        resize();
        animate();

        return () => {
            window.removeEventListener('resize', resize);
            cancelAnimationFrame(animationFrameId);
        };
    }, []);

    return (
        <div className="relative w-full h-screen overflow-hidden bg-white flex items-center justify-center font-sans tracking-tight">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            />

            <div className="relative z-10 text-center px-6 max-w-4xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
                >
                    <h1 className="text-4xl md:text-6xl font-extralight text-black mb-8 leading-tight">
                        A New Perspective on <span className="font-normal">What Matters</span>
                    </h1>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.6, duration: 1.5 }}
                        className="flex flex-col items-center"
                    >
                        <p className="text-sm md:text-base text-gray-500 font-light max-w-lg mb-12 leading-relaxed break-keep">
                            본질 위에 새로운 시선을 더합니다.<br />
                            삶의 가치와 공간을 가가듬어 그 여유와 비전을 함께 나눕니다.
                        </p>

                        <a
                            href="/pizza"
                            className="group relative px-10 py-4 overflow-hidden rounded-full border border-black/10 hover:border-black transition-colors duration-500"
                        >
                            <span className="relative z-10 text-xs font-medium text-black tracking-[0.2em] group-hover:text-white transition-colors duration-500">
                                ENTER PROJECT
                            </span>
                            <motion.div
                                className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"
                            />
                        </a>
                    </motion.div>
                </motion.div>
            </div>

            {/* Minimal Corner Labels */}
            <div className="absolute top-10 left-10 hidden md:block">
                <span className="text-[10px] text-gray-300 font-light tracking-[0.3em] uppercase">ONNRRU / VISION 2026</span>
            </div>
            <div className="absolute bottom-10 right-10 hidden md:block">
                <span className="text-[10px] text-gray-300 font-light tracking-[0.3em] uppercase">Est. 2024</span>
            </div>
        </div>
    );
};

export default LandingPage;
