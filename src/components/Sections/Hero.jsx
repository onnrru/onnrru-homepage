import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const Hero = () => {
    const pizzaImages = [
        { img: '/imgs/web-1.jpg', title: 'Italian Combo', desc: 'Classic flavor.' },
        { img: '/imgs/web-2.jpg', title: 'Square Special', desc: 'Deep dish delight.' },
        { img: '/imgs/web-3.jpg', title: 'Cheese Mania', desc: 'Rich & Creamy.' },
        { img: '/imgs/web-4.jpg', title: 'Signature OnnRRu', desc: 'Our masterpiece.' },
        { img: '/imgs/advertising-1.jpg', title: 'Oven Spaghetti', desc: 'Perfect side.' },
        { img: '/imgs/branding-1.jpg', title: 'Family Box', desc: 'Joy for all.' }
    ];

    const [activeIndex, setActiveIndex] = useState(0);

    // Auto rotate every 6 seconds
    useEffect(() => {
        const interval = setInterval(() => {
            setActiveIndex((prev) => (prev + 1) % pizzaImages.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [pizzaImages.length]);

    const randomize = () => {
        const next = Math.floor(Math.random() * pizzaImages.length);
        setActiveIndex(next);
    };

    return (
        <section id="home" className="relative min-h-screen flex flex-col justify-between pt-24 pb-10 md:pt-32 overflow-hidden bg-paper">

            {/* Background Elements (Ink/Water Ripples) - Kept subtle */}
            <div className="absolute inset-0 z-0 pointer-events-none">
                <motion.div
                    className="absolute top-1/2 right-0 w-[800px] h-[800px] bg-gray-200/40 rounded-full blur-3xl opacity-50"
                    animate={{ scale: [1, 1.1, 1], opacity: [0.3, 0.5, 0.3] }}
                    transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
                    style={{ x: '30%', y: '-20%' }}
                />
            </div>

            <div className="container mx-auto px-6 z-10 flex-grow flex flex-col justify-center">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12">
                    {/* Left: Text Content */}
                    <motion.div
                        initial={{ opacity: 0, x: -30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="max-w-3xl"
                    >
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif text-ink mb-6 leading-[1.1] tracking-tight">
                            Why flavor seekers<br />
                            choose <span className="text-ink-light underline decoration-ink-light/20 underline-offset-8">OnnRRu</span>
                        </h1>

                        <p className="text-lg md:text-xl text-ink/70 font-light max-w-xl leading-relaxed">
                            OnnRRu takes pizza crafting to the next level,
                            helping you taste <span className="text-ink font-medium">beautiful, premium, and
                                authentic flavors</span> like never before.
                        </p>
                    </motion.div>

                    {/* Right: CTA Button */}
                    <motion.div
                        initial={{ opacity: 0, x: 30 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 1, delay: 0.3, ease: "easeOut" }}
                        className="mt-8 md:mt-0"
                    >
                        <a
                            href="#menu"
                            className="group inline-flex items-center px-8 py-4 bg-transparent border border-gray-300 rounded-full text-ink font-medium transition-all hover:bg-ink hover:text-white hover:border-ink shadow-sm"
                        >
                            Explore Menu
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </motion.div>
                </div>
            </div>

            {/* Bottom: 3 Cards (Carousel-like) */}
            <div className="container mx-auto px-6 z-10 w-full font-sans">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Column 1: Random Pizza Card (New) */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        onMouseEnter={randomize}
                        className="relative h-64 md:h-full rounded-3xl overflow-hidden bg-white shadow-lg cursor-pointer group"
                    >
                        <AnimatePresence mode="wait">
                            <motion.img
                                key={pizzaImages[activeIndex].img}
                                src={pizzaImages[activeIndex].img}
                                alt={pizzaImages[activeIndex].title}
                                initial={{ opacity: 0, scale: 1.05 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0 }}
                                transition={{ duration: 1.2, ease: "easeInOut" }}
                                className="absolute inset-0 w-full h-full object-cover"
                            />
                        </AnimatePresence>

                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent flex flex-col justify-end p-8">
                            <motion.h3
                                key={pizzaImages[activeIndex].title}
                                initial={{ y: 20, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-white text-2xl font-bold mb-1"
                            >
                                {pizzaImages[activeIndex].title}
                            </motion.h3>
                            <motion.p
                                key={pizzaImages[activeIndex].desc}
                                initial={{ y: 10, opacity: 0 }}
                                animate={{ y: 0, opacity: 1 }}
                                className="text-white/80 font-light"
                            >
                                {pizzaImages[activeIndex].desc}
                            </motion.p>
                        </div>
                    </motion.div>

                    {/* Column 2: Two Store Cards Stacked (Moved from Column 3) */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.7 }}
                        className="flex flex-col gap-4 h-full"
                    >
                        {[
                            {
                                name: "파파밸리피자 파크하비오점",
                                addr: "서울 송파구 송파대로 111",
                                rating: "4.87",
                                visit: "782",
                                blog: "45",
                                tag: "맛있어요",
                                percent: "95%",
                                url: "https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4%EC%A0%90"
                            },
                            {
                                name: "파파밸리피자 잠실롯데마트점",
                                addr: "서울 송파구 올림픽로 240",
                                rating: "4.92",
                                visit: "1,204",
                                blog: "312",
                                tag: "가성비 좋아요",
                                percent: "98%",
                                url: "https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%EC%9E%A0%EC%8B%A4%EB%A1%AF%EB%8D%B0%EB%A7%88%ED%8A%B8%EC%A0%90"
                            }
                        ].map((store, idx) => (
                            <a
                                key={idx}
                                href={store.url}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 bg-white rounded-3xl p-5 shadow-lg border border-gray-100 flex flex-col justify-between hover:border-ink-light/30 transition-all group/store"
                            >
                                <div className="flex items-center space-x-3 mb-3">
                                    <div className="w-10 h-10 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center p-2 text-ink">
                                        <svg fill="currentColor" viewBox="0 0 24 24" className="w-5 h-5"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center space-x-1 mb-1">
                                            <div className="w-3.5 h-3.5 bg-[#03C75A] rounded-[2px] flex items-center justify-center">
                                                <span className="text-[8px] font-black text-white leading-none">N</span>
                                            </div>
                                            <span className="text-[9px] font-bold text-[#03C75A]">네이버 플레이스</span>
                                        </div>
                                        <h4 className="text-sm font-bold text-ink group-hover/store:text-ink-light transition-colors truncate">{store.name}</h4>
                                        <p className="text-[10px] text-gray-400 font-light truncate">{store.addr}</p>
                                    </div>
                                </div>

                                <div className="text-center py-2 border-t border-b border-gray-50 my-2">
                                    <div className="flex justify-center items-center space-x-1 mb-1">
                                        <svg className="w-4 h-4 text-[#03C75A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                        <span className="text-xl font-bold text-ink">{store.rating}</span>
                                        <span className="text-[10px] text-gray-400 font-light">/ 5</span>
                                    </div>
                                    <div className="flex justify-center gap-3 text-[10px] text-gray-400">
                                        <span>방문자 <b className="text-ink font-bold">{store.visit}</b></span>
                                        <span className="w-[1px] h-2 bg-gray-200 self-center"></span>
                                        <span>블로그 <b className="text-ink font-bold">{store.blog}</b></span>
                                    </div>
                                </div>

                                <div className="bg-gray-50 px-3 py-2 rounded-xl text-[10px] text-gray-500 flex items-center">
                                    <span className="font-bold text-ink mr-2">"{store.tag}"</span>
                                    <div className="flex-1 bg-gray-200 h-1 rounded-full overflow-hidden">
                                        <div className="h-full bg-[#03C75A]" style={{ width: store.percent }}></div>
                                    </div>
                                    <span className="ml-2">{store.percent}</span>
                                </div>
                            </a>
                        ))}
                    </motion.div>

                    {/* Column 3: Latest Blog Reviews (Moved from Column 1) */}
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                        className="relative h-64 md:h-full rounded-3xl overflow-hidden bg-white shadow-lg flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                            <h4 className="text-lg font-bold text-ink tracking-tight">최신 블로그 리뷰</h4>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        </div>
                        <div className="flex-grow flex flex-col justify-between space-y-2 overflow-hidden">
                            {[
                                {
                                    text: "문정동 맛집 파파밸리피자 파크하비오점 만족스런 가족외식",
                                    snippet: "주말을 맞아 가족들과 함께 방문한 파파밸리피자! 풍부한 토핑과 바삭한 도우가 일품이었습니다. 아이들도 너무 좋아해서 재방문 의사 100%입니다.",
                                    url: "https://search.naver.com/search.naver?ssc=tab.blog.all&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90%20%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4&sm=tab_opt&nso=so%3Add%2Cp%3Aall",
                                    img: "/imgs/web-1.jpg"
                                },
                                {
                                    text: "파파밸리피자 파크하비오점 장지역 맛집 데이트",
                                    snippet: "분위기도 좋고 가성비도 훌륭한 파파밸리피자에서 데이트 즐기고 왔어요. 스퀘어 피자의 매력에 푹 빠져버렸네요. 송파 데이트 코스로 강추합니다!",
                                    url: "https://search.naver.com/search.naver?ssc=tab.blog.all&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90%20%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4&sm=tab_opt&nso=so%3Add%2Cp%3Aall",
                                    img: "/imgs/web-2.jpg"
                                },
                                {
                                    text: "잠실 토이저러스 노칠수 없는 파파밸리피자 잠실롯데마트점",
                                    snippet: "쇼핑하다 출출해서 들른 파파밸리피자. 갓 구운 피자의 냄새에 이끌려 들어갔는데 정말 맛있었어요. 혼자 먹기에도 부담 없는 사이즈라 좋았습니다.",
                                    url: "https://search.naver.com/search.naver?ssc=tab.blog.all&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%20%EC%9E%A0%EC%8B%A4&sm=tab_opt&nso=so%3Add%2Cp%3Aall",
                                    img: "/imgs/web-3.jpg"
                                },
                                {
                                    text: "롯데월드에서 가장 만족스런 외식 파파밸리피자 잠실롯데제타플렉스점",
                                    snippet: "잠실 롯데월드 갔다가 발견한 피자 맛집! 다양한 메뉴 중에서 고민하다가 시그니처 메뉴를 시켰는데 성공적이었어요. 직원분들도 친절하시고 매장도 깔끔해요.",
                                    url: "https://search.naver.com/search.naver?ssc=tab.blog.all&query=%ED%8C%8C%ED%8C%8F%EB%B0%B8%EB%A6%AC%20%EC%9E%A0%EC%8B%A4&sm=tab_opt&nso=so%3Add%2Cp%3Aall",
                                    img: "/imgs/web-4.jpg"
                                }
                            ].map((post, idx) => (
                                <a
                                    key={idx}
                                    href={post.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors group/link h-full"
                                >
                                    <div className="flex-1 min-w-0 flex flex-col justify-center">
                                        <h5 className="text-[11px] font-bold text-ink/80 group-hover/link:text-ink group-hover/link:underline leading-tight line-clamp-1 mb-0.5">
                                            {post.text}
                                        </h5>
                                        <p className="text-[10px] text-gray-500 line-clamp-1 leading-snug font-light">
                                            {post.snippet}
                                        </p>
                                    </div>
                                    <div className="w-10 h-10 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                        <img src={post.img} alt="review" className="w-full h-full object-cover group-hover/link:scale-110 transition-transform" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Hero;
