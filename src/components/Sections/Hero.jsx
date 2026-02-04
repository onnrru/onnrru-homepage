import React from 'react';
import { motion } from 'framer-motion';

const Hero = () => {
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
                        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold font-serif text-ink mb-6 leading-tight">
                            Why flavor seekers<br />
                            choose <span className="text-ink-light">OnnRRu</span>
                        </h1>

                        <p className="text-lg text-ink/70 font-light max-w-xl leading-relaxed">
                            OnnRRu takes pizza crafting to the next level,
                            helping you taste beautiful, premium, and
                            authentic flavors like never before.
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
                            className="group inline-flex items-center px-8 py-4 bg-transparent border border-gray-300 rounded-full text-ink font-medium transition-all hover:bg-ink hover:text-white hover:border-ink"
                        >
                            Explore Menu
                            <svg className="w-4 h-4 ml-2 transform group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </a>
                    </motion.div>
                </div>
            </div>

            {/* Bottom: 3 Cards (Carousel-like) */}
            <div className="container mx-auto px-6 z-10 w-full">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <motion.div
                        initial={{ opacity: 0, y: 50 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.5 }}
                        className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-lg flex flex-col p-6"
                    >
                        <div className="flex justify-between items-center mb-3 flex-shrink-0">
                            <h4 className="text-lg font-bold text-ink">최신 블로그 리뷰</h4>
                            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
                        </div>
                        <div className="flex-grow flex flex-col justify-between space-y-2">
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
                                    url: "https://search.naver.com/search.naver?ssc=tab.blog.all&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%20%EC%9E%A0%EC%8B%A4&sm=tab_opt&nso=so%3Add%2Cp%3Aall",
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
                                        <h5 className="text-sm font-bold text-ink/80 group-hover/link:text-ink group-hover/link:underline leading-tight line-clamp-1 mb-1">
                                            {post.text}
                                        </h5>
                                        <p className="text-xs text-gray-500 line-clamp-1 leading-snug font-light">
                                            {post.snippet}
                                        </p>
                                    </div>
                                    <div className="w-12 h-12 flex-shrink-0 rounded-md overflow-hidden bg-gray-100 border border-gray-100">
                                        <img src={post.img} alt="review" className="w-full h-full object-cover group-hover/link:scale-110 transition-transform" />
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {[
                        { title: 'Square Special', img: '/imgs/web-2.jpg', desc: 'Deep dish delight.' },
                        { title: 'Family Set', img: '/imgs/branding-1.jpg', desc: 'Share the joy.' }
                    ].map((item, index) => (
                        <motion.div
                            key={index + 1}
                            initial={{ opacity: 0, y: 50 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.8, delay: 0.5 + ((index + 1) * 0.2) }}
                            className="relative aspect-[4/3] rounded-3xl overflow-hidden bg-white shadow-lg cursor-pointer group"
                        >
                            <img src={item.img} alt={item.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex flex-col justify-end p-8">
                                <h3 className="text-white text-2xl font-bold mb-1">{item.title}</h3>
                                <p className="text-white/80 font-light">{item.desc}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Hero;
