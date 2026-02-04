import React from 'react';
import { motion } from 'framer-motion';

const Reviews = () => {
    // Links to actual Naver Search Results
    const blogSearchUrl = "https://search.naver.com/search.naver?where=blog&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%ED%9B%84%EA%B8%B0";
    const parkHabioUrl = "https://m.place.naver.com/restaurant/1649363852/review/visitor";
    const jamsilLotteUrl = "https://m.place.naver.com/restaurant/1050556556/review/visitor";

    // Mock Data for Blog Posts - Styled to look like Naver Mobile View
    const blogPosts = [
        {
            id: 1,
            title: '문정동 맛집 파파밸리피자 파크하비오점 아이와 함께',
            desc: '지난 주말 아이들과 함께 다녀온 문정동 ...',
            date: '2023.11.12.',
            blogName: '행복한 일상',
            thumb: '/imgs/branding-1.jpg',
            link: 'https://search.naver.com/search.naver?where=blog&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4'
        },
        {
            id: 2,
            title: '잠실 롯데마트 제타플렉스 맛집 파파밸리피자',
            desc: '잠실 롯데마트 6층에 위치한 파파밸리피자...',
            date: '2023.11.08.',
            blogName: '맛있는 여행',
            thumb: '/imgs/branding-2.jpg',
            link: 'https://search.naver.com/search.naver?where=blog&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%EC%9E%A0%EC%8B%A4%EB%A1%AF%EB%8D%B0'
        },
        {
            id: 3,
            title: '송파 파크하비오 피자 맛집 추천, 단체 주문 가능',
            desc: '회사 점심시간에 단체로 주문해서 먹었는데...',
            date: '2023.10.29.',
            blogName: '직장인 라이프',
            thumb: '/imgs/branding-3.jpg',
            link: 'https://search.naver.com/search.naver?where=blog&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4'
        },
    ];

    return (
        <section id="reviews" className="py-24 bg-[#F5F6F8] relative"> {/* Naver Light Gray Background */}
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-12 flex flex-col md:flex-row justify-between items-end"
                >
                    <div>
                        <div className="flex items-center space-x-2 mb-2">
                            <span className="w-6 h-6 bg-[#03C75A] text-white flex items-center justify-center font-black text-xs rounded-sm">N</span>
                            <span className="text-sm font-bold tracking-widest text-[#03C75A] uppercase">Naver Smart Place</span>
                        </div>
                        <h3 className="text-3xl md:text-4xl font-bold text-ink">Real Reviews</h3>
                    </div>
                </motion.div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Column 1: Blog Search Result Simulation */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col"
                    >
                        <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-white">
                            <h4 className="font-bold text-lg text-ink">최신 블로그 리뷰</h4>
                            <a href={blogSearchUrl} target="_blank" rel="noreferrer" className="text-xs text-gray-500 hover:text-ink flex items-center">
                                더보기 <svg className="w-3 h-3 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path></svg>
                            </a>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {blogPosts.map((post) => (
                                <a
                                    key={post.id}
                                    href={post.link}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="block p-5 hover:bg-gray-50 transition-colors group"
                                >
                                    <div className="flex justify-between gap-4">
                                        <div className="flex-1">
                                            <h5 className="text-[15px] font-bold text-ink mb-1 line-clamp-2 leading-snug group-hover:underline decoration-1 underline-offset-2">
                                                {post.title}
                                            </h5>
                                            <p className="text-xs text-gray-500 line-clamp-2 mb-2 font-light">
                                                {post.desc}
                                            </p>
                                            <div className="flex items-center space-x-2 text-[11px] text-gray-400">
                                                <span className="font-medium text-gray-600">{post.blogName}</span>
                                                <span className="w-[1px] h-2 bg-gray-300"></span>
                                                <span>{post.date}</span>
                                            </div>
                                        </div>
                                        <div className="w-20 h-20 rounded-lg bg-gray-100 overflow-hidden flex-shrink-0 border border-gray-100">
                                            <img src={post.thumb} alt="thumb" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                        </div>
                                    </div>
                                </a>
                            ))}
                        </div>
                    </motion.div>

                    {/* Column 2: Park Habio Reviews */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col p-6 relative group"
                    >
                        <a href={parkHabioUrl} target="_blank" rel="noreferrer" className="absolute inset-0 z-20"></a>

                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                                <svg className="w-full h-full text-ink" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-ink">파파밸리피자 파크하비오점</h4>
                                <p className="text-xs text-gray-500">서울 송파구 송파대로 111</p>
                            </div>
                        </div>

                        <div className="mt-auto text-center py-4 border-t border-b border-gray-50 mb-4">
                            <div className="flex justify-center items-center space-x-1 mb-2">
                                <svg className="w-6 h-6 text-[#03C75A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                <span className="text-3xl font-bold text-ink">4.87</span>
                                <span className="text-sm text-gray-400 font-light">/ 5</span>
                            </div>
                            <div className="flex justify-center gap-4 text-xs">
                                <span className="text-gray-600">방문자 리뷰 <b className="text-ink">782</b></span>
                                <span className="w-[1px] h-3 bg-gray-300 self-center"></span>
                                <span className="text-gray-600">블로그 리뷰 <b className="text-ink">45</b></span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="bg-gray-50 px-3 py-2 rounded-lg text-xs text-gray-600 flex items-center">
                                <span className="font-bold text-ink mr-2">"맛있어요"</span>
                                <span className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden"><span className="block h-full bg-[#03C75A] w-[95%]"></span></span>
                                <span className="ml-2 text-gray-400">95%</span>
                            </div>
                            <div className="bg-gray-50 px-3 py-2 rounded-lg text-xs text-gray-600 flex items-center">
                                <span className="font-bold text-ink mr-2">"친절해요"</span>
                                <span className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden"><span className="block h-full bg-[#03C75A] w-[90%]"></span></span>
                                <span className="ml-2 text-gray-400">92%</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <span className="text-sm font-bold text-[#03C75A] border border-[#03C75A] px-6 py-2 rounded-full group-hover:bg-[#03C75A] group-hover:text-white transition-all">네이버 플레이스 보기</span>
                        </div>
                    </motion.div>

                    {/* Column 3: Jamsil Lotte Reviews */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden flex flex-col p-6 relative group"
                    >
                        <a href={jamsilLotteUrl} target="_blank" rel="noreferrer" className="absolute inset-0 z-20"></a>

                        <div className="flex items-center space-x-3 mb-6">
                            <div className="w-12 h-12 rounded-full bg-gray-50 border border-gray-100 flex items-center justify-center p-2">
                                <svg className="w-full h-full text-ink" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" /></svg>
                            </div>
                            <div>
                                <h4 className="text-lg font-bold text-ink">파파밸리피자 잠실롯데마트점</h4>
                                <p className="text-xs text-gray-500">서울 송파구 올림픽로 240</p>
                            </div>
                        </div>

                        <div className="mt-auto text-center py-4 border-t border-b border-gray-50 mb-4">
                            <div className="flex justify-center items-center space-x-1 mb-2">
                                <svg className="w-6 h-6 text-[#03C75A]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" /></svg>
                                <span className="text-3xl font-bold text-ink">4.92</span>
                                <span className="text-sm text-gray-400 font-light">/ 5</span>
                            </div>
                            <div className="flex justify-center gap-4 text-xs">
                                <span className="text-gray-600">방문자 리뷰 <b className="text-ink">1,204</b></span>
                                <span className="w-[1px] h-3 bg-gray-300 self-center"></span>
                                <span className="text-gray-600">블로그 리뷰 <b className="text-ink">312</b></span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="bg-gray-50 px-3 py-2 rounded-lg text-xs text-gray-600 flex items-center">
                                <span className="font-bold text-ink mr-2">"가성비 좋아요"</span>
                                <span className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden"><span className="block h-full bg-[#03C75A] w-[98%]"></span></span>
                                <span className="ml-2 text-gray-400">98%</span>
                            </div>
                            <div className="bg-gray-50 px-3 py-2 rounded-lg text-xs text-gray-600 flex items-center">
                                <span className="font-bold text-ink mr-2">"혼밥하기 좋아요"</span>
                                <span className="flex-1 bg-gray-200 h-1.5 rounded-full overflow-hidden"><span className="block h-full bg-[#03C75A] w-[95%]"></span></span>
                                <span className="ml-2 text-gray-400">95%</span>
                            </div>
                        </div>

                        <div className="mt-6 flex justify-center">
                            <span className="text-sm font-bold text-[#03C75A] border border-[#03C75A] px-6 py-2 rounded-full group-hover:bg-[#03C75A] group-hover:text-white transition-all">네이버 플레이스 보기</span>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Reviews;
