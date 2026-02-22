import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

const TypingText = ({ text, delay = 0, speed = 40 }) => {
    const [displayedText, setDisplayedText] = useState('');

    useEffect(() => {
        let timeout;
        if (delay > 0) {
            timeout = setTimeout(() => startTyping(), delay);
        } else {
            startTyping();
        }

        function startTyping() {
            let i = 0;
            const timer = setInterval(() => {
                setDisplayedText(text.slice(0, i + 1));
                i++;
                if (i >= text.length) {
                    clearInterval(timer);
                }
            }, speed);
            return () => clearInterval(timer);
        }

        return () => clearTimeout(timeout);
    }, [text, delay, speed]);

    return (
        <span className="inline-block min-h-[1.5em]">
            {displayedText}
        </span>
    );
};

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
                this.baseSize = Math.random() * 2 + 1.2;
                this.size = this.baseSize;
                this.vx = (Math.random() - 0.5) * 0.12;
                this.vy = (Math.random() - 0.5) * 0.12;

                this.baseOpacity = Math.random() * 0.4 + 0.2;
                this.opacity = 0;
                this.targetOpacity = this.baseOpacity;

                this.life = 0;
                this.maxLife = Math.random() * 300 + 300;

                this.type = Math.random() > 0.6 ? 1 : 0;
                this.growthRate = this.type === 1 ? Math.random() * 0.02 + 0.01 : 0;
            }

            update() {
                this.life++;
                this.x += this.vx;
                this.y += this.vy;

                if (this.life < 80) {
                    this.opacity = (this.life / 80) * this.targetOpacity;
                }
                else if (this.life > this.maxLife - 120) {
                    const progress = (this.life - (this.maxLife - 120)) / 120;
                    this.opacity = this.targetOpacity * (1 - progress);
                    if (this.type === 1) {
                        this.size += this.growthRate * 2.5;
                    }
                }

                if (this.life >= this.maxLife) {
                    this.reset();
                }
            }

            draw() {
                ctx.shadowBlur = 1;
                ctx.shadowColor = `rgba(0, 0, 0, ${this.opacity * 0.5})`;
                ctx.fillStyle = `rgba(0, 0, 0, ${this.opacity})`;
                ctx.beginPath();
                ctx.arc(this.x, this.y, this.size, 0, Math.PI * 2);
                ctx.fill();
                ctx.shadowBlur = 0;
            }
        }

        const initParticles = () => {
            particles = [];
            const count = Math.min(60, (width * height) / 25000);
            for (let i = 0; i < count; i++) {
                particles.push(new Particle());
            }
        };

        const animate = () => {
            ctx.clearRect(0, 0, width, height);

            ctx.fillStyle = 'rgba(0, 0, 0, 0.015)';
            for (let i = 0; i < 15; i++) {
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
                className="absolute inset-0 w-full h-full pointer-events-none opacity-50"
            />

            <div className="relative z-10 text-center px-6 max-w-4xl flex flex-col items-center">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center"
                >
                    <span className="text-xs font-bold text-gray-400 tracking-[0.5em] uppercase mb-4">ONNRRU</span>

                    <h1 className="text-4xl md:text-5xl font-extralight text-black mb-10 leading-tight">
                        A New Perspective on <span className="font-normal">What Matters</span>
                    </h1>

                    <div className="text-sm md:text-base text-gray-500 font-light mb-16 leading-loose break-keep flex flex-col items-center space-y-1">
                        <TypingText text="본질 위에 새로운 시선을 더합니다." delay={1000} speed={50} />
                        <TypingText text="삶의 가치와 공간을 가다듬어" delay={3000} speed={50} />
                        <TypingText text="그 여유와 비전을 함께 나눕니다." delay={5000} speed={50} />
                    </div>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 6.5, duration: 1.5 }}
                    >
                        <a
                            href="/pizza"
                            className="group relative inline-block px-12 py-5 overflow-hidden rounded-full border border-black/10 hover:border-black transition-colors duration-700"
                        >
                            <span className="relative z-10 text-[10px] font-bold text-black tracking-[0.4em] group-hover:text-white transition-colors duration-500">
                                ENTER PROJECT
                            </span>
                            <div className="absolute inset-0 bg-black pointer-events-none translate-y-full group-hover:translate-y-0 transition-transform duration-500 ease-out" />
                        </a>
                    </motion.div>
                </motion.div>
            </div>
        </div>
    );
};

export default LandingPage;
