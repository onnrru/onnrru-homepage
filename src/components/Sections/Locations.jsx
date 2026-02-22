import React from 'react';
import { motion } from 'framer-motion';

const Locations = () => {
    return (
        <section id="locations" className="scroll-mt-20 py-16 bg-paper relative">
            <div className="container mx-auto px-6">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    className="mb-20 text-center"
                >
                    <span className="text-sm font-bold tracking-widest text-ink/40 uppercase mb-4 block">Visit Us</span>
                    <h3 className="text-4xl md:text-5xl font-serif text-ink mb-6">Our Locations</h3>
                    <div className="w-12 h-[1px] bg-ink mx-auto opacity-30"></div>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-12">
                    {/* Location 1: Park Habio */}
                    <motion.div
                        className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8 }}
                    >
                        {/* Map Area 1 */}
                        <div className="h-[300px] w-full bg-gray-100 relative">
                            <iframe
                                src="https://maps.google.com/maps?q=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4%EC%A0%90&hl=ko&z=15&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'grayscale(0%)' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Park Habio Map"
                            ></iframe>
                        </div>

                        {/* Info Area */}
                        <div className="p-8 flex-grow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-2xl font-bold text-ink">파파밸리피자 파크하비오점</h4>
                                    <span className="px-3 py-1 bg-ink text-white text-xs font-bold rounded-full">1F</span>
                                </div>
                                <p className="text-ink/70 mb-2 leading-relaxed">
                                    서울 송파구 송파대로 111, 파크하비오 110-112호<br />
                                    (문정동, 송파 파크하비오)
                                </p>
                                <p className="text-ink/50 text-sm mb-6">+82 02-2043-0700</p>
                            </div>
                            <div className="mt-6">
                                <div className="flex items-center space-x-2 mb-2 text-ink/40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-[10px] font-bold tracking-widest uppercase">네이버 플레이스</span>
                                </div>
                                <a href="https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%ED%8C%8C%ED%81%AC%ED%95%98%EB%B9%84%EC%98%A4%EC%A0%90" target="_blank" rel="noreferrer" className="inline-flex items-center px-6 py-4 bg-[#03C75A] text-white rounded-xl font-bold hover:bg-[#02b351] transition-colors shadow-sm hover:shadow-md text-lg">
                                    <svg className="w-6 h-6 mr-3 fill-current" viewBox="0 0 24 24"><path d="M16.273 17.5v-11h-4.25v6.927L7.75 6.5H3.5v11h4.25V10.5l4.273 7z" /></svg>
                                    파크하비오점
                                </a>
                            </div>
                        </div>
                    </motion.div>

                    {/* Location 2: Jamsil Lotte Mart */}
                    <motion.div
                        className="bg-white rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col"
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        {/* Map Area 2 */}
                        <div className="h-[300px] w-full bg-gray-100 relative">
                            <iframe
                                src="https://maps.google.com/maps?q=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%EC%9E%A0%EC%8B%A4%EB%A1%AF%EB%8D%B0%EB%A7%88%ED%8A%B8%EC%A0%90&hl=ko&z=15&output=embed"
                                width="100%"
                                height="100%"
                                style={{ border: 0, filter: 'grayscale(0%)' }}
                                allowFullScreen=""
                                loading="lazy"
                                referrerPolicy="no-referrer-when-downgrade"
                                title="Jamsil Lotte Mart Map"
                            ></iframe>
                        </div>

                        {/* Info Area */}
                        <div className="p-8 flex-grow flex flex-col justify-between">
                            <div>
                                <div className="flex justify-between items-start mb-4">
                                    <h4 className="text-2xl font-bold text-ink">파파밸리피자 잠실롯데마트점</h4>
                                    <span className="px-3 py-1 bg-ink text-white text-xs font-bold rounded-full">6F</span>
                                </div>
                                <p className="text-ink/70 mb-2 leading-relaxed">
                                    서울 송파구 올림픽로 240, 롯데마트 제타플렉스 6층<br />
                                    (잠실동, 롯데월드 인근)
                                </p>
                                <p className="text-ink/50 text-sm mb-6">+82 02-2143-1662</p>
                            </div>
                            <div className="mt-6">
                                <div className="flex items-center space-x-2 mb-2 text-ink/40">
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                    <span className="text-[10px] font-bold tracking-widest uppercase">네이버 플레이스</span>
                                </div>
                                <a href="https://search.naver.com/search.naver?sm=tab_hty.top&where=nexearch&query=%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90+%EC%9E%A0%EC%8B%A4%EB%A1%AF%EB%8D%B0%EB%A7%88%ED%8A%B8%EC%A0%90" target="_blank" rel="noreferrer" className="inline-flex items-center px-6 py-4 bg-[#03C75A] text-white rounded-xl font-bold hover:bg-[#02b351] transition-colors shadow-sm hover:shadow-md text-lg">
                                    <svg className="w-6 h-6 mr-3 fill-current" viewBox="0 0 24 24"><path d="M16.273 17.5v-11h-4.25v6.927L7.75 6.5H3.5v11h4.25V10.5l4.273 7z" /></svg>
                                    잠실롯데마트점
                                </a>
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </section>
    );
};

export default Locations;
