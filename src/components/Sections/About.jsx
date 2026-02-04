import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const About = () => {
    const [hoveredIndex, setHoveredIndex] = useState(null);

    const features = [
        {
            title: "온류와 함께하는 변화와 성장",
            subtitle: "About OnnRRu",
            desc: "온류는 현대 세상에서 정보가 넘쳐나고, 때로는 원하지 않는 정보까지 우리에게 끊임없이 전달되는 상황을 인식하고 있습니다.\n\n이러한 환경 속에서 온류는 정보를 선별하고, 깊이 생각하여 필요한 것을 능동적으로 찾아 활용하는 능력을 강조합니다.\n\n최근 인공지능, Chat GPT, 메타버스와 같은 기술 혁신이 다양한 분야를 바꾸고 있습니다.\n\n이에, 온류는 특정 분야에 얽매이지 않고, 지식의 경계를 넓혀 항상 배움의 자세를 가지고 노력함으로써 성장하고자 하며, 온라인 서비스와 가상공간 서비스 등 다양한 분야의 서비스를 준비하고 있습니다.\n\n한편, 이러한 변화 속에서 오프라인 서비스는 적은 관심으로 점차 사라질 위기에 처해질 수 있음도 알고 있습니다.\n\n그럼에도 불구하고, 온류는 진심을 담아 제공하던 진실된 오프라인 서비스는 지속적으로 유지하기 위해 노력할 것 입니다.\n\n온류는 항상 고객 여러분과 함께 성장하고 싶습니다. 고객의 요구와 기대를 충족시키기 위해 열정을 가지고 노력할 것이며, 오프라인 서비스의 진심과 진실성을 전하며 함께 나아가겠습니다.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
            )
        },
        {
            title: "제대로 된 피자 전문점",
            subtitle: "Our Craft",
            desc: "\"파파밸리피자\"는 백화점(현대/롯데/갤러리아/신세계) 전문 식당가에서 오랜기간 인정 받아 왔습니다.\n\n\"파파밸리피자 송파파크하비오점\"은 송파구 문정동 파크하비오 1층에 위치한 로드숍으로서 \"파크하비오 워터킹덤/호텔/가든파이브/찜질방/메가박스/법조단지/문정동 장지동 거주\"의 고객들이 만족할 수 있는 프리미엄을 제공합니다.\n\n\"잠실롯데월드/토이저러스/롯데타워/석촌호수/아쿠아리움/키자니아/잠실동 석촌동 거주\"의 고객들이 즐거운 외출과 나들이를 할 수 있도록, \"파파밸리피자 잠실롯데마트점\"은 6층(제타플렉스 잠실점)에서도 오랜기간 백화점에서 검증된 피자를 바로 구워 드실 수 있는 최상의 공간을 제공합니다.\n\n온류가 직접 운영하는 위 두 매장은 배달 위주로 변화하는 피자 시장에도 불구하고, 매장에서 갓 구운 피자(숙성도우/자연치즈/주문후요리)를 맛볼 수 있도록 항상 기본에 충실하고 최선을 다하여 엄격하게 관리하고 있습니다.\n\n송파구에 오면 꼭 들러봐야하는 제대로 된 피자 전문점이 되기 위해 노력하고 있습니다.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"></path></svg>
            )
        },
        {
            title: "컨설팅 서비스",
            subtitle: "New Perspective",
            desc: "새로운 관점으로. 온류는 급격히 변화하는 세상과 전혀 다른 관점의 시각들을 받아들이고, 끊임없이 배우고 습득한 것을 함께 나누어 실행하고자 합니다. 부동개발 사업성검토 컨설팅 및 다양한 비즈니스 인사이트를 제공합니다.",
            icon: (
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
            )
        }
    ];

    return (
        <section id="about" className="scroll-mt-20 py-16 bg-paper relative overflow-hidden">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="mb-20 text-center max-w-3xl mx-auto"
                >
                    <span className="text-sm font-bold tracking-widest text-ink/40 uppercase mb-4 block">Who We Are</span>
                    <h3 className="text-4xl md:text-5xl font-serif text-ink mb-6 leading-tight">
                        Connecting Traditional Values<br />with Future Innovation
                    </h3>
                </motion.div>

                {/* Horizontal Accordion Container */}
                <div className="flex flex-col md:flex-row gap-4 h-auto md:h-[500px]">
                    {features.map((feature, index) => {
                        const isHovered = hoveredIndex === index;
                        // Determine flex value:
                        // If nothing hovered: everyone is 1
                        // If hovered: Hovered is 3.5, others are 0.8
                        const flexValue = hoveredIndex === null ? 1 : (isHovered ? 3.5 : 0.8);

                        return (
                            <motion.div
                                key={index}
                                layout
                                onHoverStart={() => setHoveredIndex(index)}
                                onHoverEnd={() => setHoveredIndex(null)}
                                initial={false}
                                animate={{ flex: flexValue }}
                                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                                className={`relative rounded-3xl overflow-hidden border border-gray-100 shadow-sm cursor-pointer transition-colors duration-500
                                    ${isHovered ? 'bg-white shadow-xl ring-1 ring-ink/5' : 'bg-white/60 hover:bg-white'}
                                `}
                            >
                                {/* Background Image for First Card */}
                                {index === 0 && (
                                    <div
                                        className="absolute inset-0 bg-[url('/imgs/about-bg.png')] bg-cover bg-center transition-opacity duration-500 opacity-20 group-hover:opacity-40 pointer-events-none mix-blend-multiply"
                                    />
                                )}
                                {/* Background Image for Second Card */}
                                {index === 1 && (
                                    <div
                                        className="absolute inset-0 bg-[url('/imgs/craft-bg.jpg')] bg-cover bg-center transition-opacity duration-500 opacity-20 group-hover:opacity-40 pointer-events-none mix-blend-multiply"
                                    />
                                )}
                                {/* Background Image for Third Card */}
                                {index === 2 && (
                                    <div
                                        className="absolute inset-0 bg-[url('/imgs/consulting-bg.png')] bg-cover bg-center transition-opacity duration-500 opacity-20 group-hover:opacity-40 pointer-events-none mix-blend-multiply"
                                    />
                                )}
                                <div className="h-full w-full p-8 flex flex-col relative whitespace-normal z-10">
                                    {/* Header / Icon Area */}
                                    <div className="flex items-start justify-between mb-4">
                                        <div className={`p-3 rounded-2xl transition-colors duration-300 ${isHovered ? 'bg-gray-100 text-accent' : 'bg-gray-50 text-ink/40'}`}>
                                            {feature.icon}
                                        </div>
                                        {/* Subtle Index Number */}
                                        <span className={`text-sm font-bold tracking-widest uppercase transition-colors duration-300 ${isHovered ? 'text-ink/40' : 'text-ink/20'}`}>
                                            0{index + 1}
                                        </span>
                                    </div>

                                    {/* Main Content Area */}
                                    <div className="mt-auto min-w-[200px]"> {/* Min-width prevents text squashing animation */}
                                        <h5 className={`text-xs font-bold uppercase tracking-wider mb-2 transition-colors duration-300 ${isHovered ? 'text-ink/60' : 'text-ink/30'}`}>
                                            {feature.subtitle}
                                        </h5>
                                        {/* Title: Scales with hover */}
                                        <motion.h4
                                            className="font-bold text-ink mb-4 whitespace-normal"
                                            animate={{
                                                fontSize: isHovered ? "1.875rem" : "1.5rem",
                                                color: isHovered ? "#0B1019" : "rgba(11, 16, 25, 0.7)"
                                            }}
                                        >
                                            {feature.title}
                                        </motion.h4>

                                        {/* Description: Revealing animation */}
                                        <AnimatePresence>
                                            {isHovered && (
                                                <motion.div
                                                    initial={{ opacity: 0, height: 0 }}
                                                    animate={{ opacity: 1, height: 'auto' }}
                                                    exit={{ opacity: 0, height: 0 }}
                                                    transition={{ duration: 0.3 }}
                                                >
                                                    <p className="text-ink/70 leading-relaxed font-light text-sm md:text-base border-t border-ink/5 pt-4 whitespace-pre-line">
                                                        {feature.desc}
                                                    </p>
                                                </motion.div>
                                            )}
                                        </AnimatePresence>

                                        {/* Spacer for unhovered state to maintain some layout consistency */}
                                        {!isHovered && hoveredIndex !== null && (
                                            <div className="h-0 opacity-0" aria-hidden="true" />
                                        )}
                                    </div>

                                    {/* Background Decor Element */}
                                    <div className={`absolute -right-10 -bottom-10 w-40 h-40 bg-gray-50 rounded-full blur-3xl transition-opacity duration-500 pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`} />
                                </div>
                            </motion.div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
};

export default About;
