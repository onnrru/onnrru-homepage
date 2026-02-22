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
                this.baseSize = Math.random() * 1.5 + 0.5;
                this.size = this.baseSize;
                this.vx = (Math.random() - 0.5) * 0.15;
                this.vy = (Math.random() - 0.5) * 0.15;

                // Randomized darkness and initial opacity
                this.baseOpacity = Math.random() * 0.3 + 0.05;
                this.opacity = 0; // Start invisible for fade-in
                this.targetOpacity = this.baseOpacity;

                this.life = 0;
                this.maxLife = Math.random() * 200 + 200;

                // Behavior type: 0 = Fading, 1 = Expanding
                this.type = Math.random() > 0.6 ? 1 : 0;
                this.growthRate = this.type === 1 ? Math.random() * 0.02 + 0.01 : 0;
            }

            update() {
                this.life++;
                this.x += this.vx;
                this.y += this.vy;

                // Fade in
                if (this.life < 50) {
                    this.opacity = (this.life / 50) * this.targetOpacity;
                }
                // Fade out
                else if (this.life > this.maxLife - 100) {
                    const progress = (this.life - (this.maxLife - 100)) / 100;
                    this.opacity = this.targetOpacity * (1 - progress);
                    if (this.type === 1) {
                        this.size += this.growthRate * 2; // Accelerate growth as it fades
                    }
                }

                if (this.life >= this.maxLife) {
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
            const count = Math.min(80, (width * height) / 20000);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            // Subtle grain texture
            ctx.fillStyle = 'rgba(0, 0, 0, 0.01)';
            for (let i = 0; i < 20; i++) {
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
        <div className="relative w-full h-screen overflow-hidden bg-white flex items-center font-sans tracking-tight">
            <canvas
                ref={canvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none opacity-40"
            />

            <div className="container mx-auto px-10 md:px-24 flex flex-col md:flex-row items-center md:items-start justify-between relative z-10">
                {/* Left: Title */}
                <motion.div
                    initial={{ opacity: 0, x: -30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full md:w-1/2 mb-12 md:mb-0 text-center md:text-left"
                >
                    <h1 className="text-5xl md:text-7xl font-extralight text-black leading-[1.1]">
                        A New <br />
                        <span className="font-light">Perspective</span> <br />
                        on <span className="font-normal italic serif">What Matters</span>
                    </h1>
                </motion.div>

                {/* Right: Description & Button */}
                <motion.div
                    initial={{ opacity: 0, x: 30 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 1.5, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full md:w-1/3 flex flex-col items-center md:items-start text-center md:text-left"
                >
                    <p className="text-sm md:text-base text-gray-500 font-light mb-12 leading-relaxed break-keep max-w-sm">
                        본질 위에 새로운 시선을 더합니다.<br />
                        삶의 가치와 공간을 가다듬어 그 여유와 비전을 함께 나눕니다.
                    </p>

                    <a
                        href="/pizza"
                        className="group relative px-12 py-5 overflow-hidden rounded-full border border-black/10 hover:border-black transition-colors duration-700"
                    >
                        <span className="relative z-10 text-[10px] font-bold text-black tracking-[0.3em] group-hover:text-white transition-colors duration-500">
                            ENTER PROJECT
                        </span>
                        <motion.div
                            className="absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out"
                        />
                    </a>
                </motion.div>
            </div>

            {/* Minimal Corner Labels */}
            <div className="absolute top-10 left-10 hidden md:block">
                <span className="text-[10px] text-gray-300 font-light tracking-[0.4em] uppercase">ONNRRU / VISION 2026</span>
            </div>
        </div>
    );
};

export default LandingPage;
