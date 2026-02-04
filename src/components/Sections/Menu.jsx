import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

const menuItems = [
    // Pizza (Web)
    { id: 1, category: 'pizza', title: 'Personal Pizza', desc: '이탈리안콤보 / 그릭치킨베이컨 / 불고기프리미엄', img: '/imgs/web-1.jpg', span: 'col-span-1 md:col-span-2' },
    { id: 2, category: 'pizza', title: 'Square Special', desc: '특별한 숙성도우 & 최고급 프리미엄 치즈', img: '/imgs/web-2.jpg', span: 'col-span-1' },
    { id: 3, category: 'pizza', title: 'Cheese Pizza', desc: '풍부한 치즈의 맛', img: '/imgs/web-3.jpg', span: 'col-span-1' },
    { id: 4, category: 'pizza', title: 'Signature Pizza', desc: '온류의 시그니처', img: '/imgs/web-4.jpg', span: 'col-span-1 md:col-span-2' },

    // Side & Set (Mixed for Bento)
    { id: 5, category: 'side', title: 'Oven Spaghetti', desc: '미국산 프리미엄 자연치즈의 특별함', img: '/imgs/advertising-2.jpg', span: 'col-span-1' },
    { id: 9, category: 'set', title: 'Family Set', desc: '온 가족이 함께 즐기는 행복한 세트', img: '/imgs/branding-1.jpg', span: 'col-span-1 md:col-span-2 row-span-2' },
    { id: 6, category: 'side', title: 'Chicken Wings', desc: '바삭하고 짭조름한 윙', img: '/imgs/advertising-1.jpg', span: 'col-span-1' },
    { id: 7, category: 'side', title: 'PASZZA', desc: '치즈크러스트 도우 속 파스타의 만남', img: '/imgs/advertising-3.jpg', span: 'col-span-1' },
    { id: 10, category: 'set', title: 'Couple Set', desc: '연인을 위한 완벽한 구성', img: '/imgs/branding-2.jpg', span: 'row-span-1' },

    // Restored Items
    { id: 11, category: 'set', title: 'Party Set', desc: '모임과 파티를 위한 풍성한 메뉴', img: '/imgs/branding-3.jpg', span: 'col-span-1' },
    { id: 8, category: 'side', title: 'Side Platter', desc: '다양한 사이드 메뉴를 한번에', img: '/imgs/advertising-4.jpg', span: 'col-span-1' },
    { id: 12, category: 'set', title: 'Lunch Set', desc: '가볍고 든든하게 즐기는 런치', img: '/imgs/branding-4.jpg', span: 'col-span-1 md:col-span-2' },
    { id: 13, category: 'set', title: 'Special Offer', desc: '기간 한정 특별 할인 세트', img: '/imgs/branding-5.jpg', span: 'col-span-1' },
];

const Menu = () => {
    const [filter, setFilter] = useState('all');

    const filteredItems = filter === 'all'
        ? menuItems
        : menuItems.filter(item => item.category === filter);

    return (
        <section id="menu" className="scroll-mt-20 py-16 bg-gray-50/50">
            <div className="container mx-auto px-6">
                <div className="flex flex-col md:flex-row justify-between items-end mb-16">
                    <div>
                        <span className="text-sm font-bold tracking-widest text-ink/40 uppercase mb-4 block">Product Showcase</span>
                        <h3 className="text-4xl md:text-5xl font-serif text-ink mb-2">2026 Menu Collection</h3>
                    </div>

                    <div className="flex space-x-1 mt-8 md:mt-0 bg-gray-200/50 p-1 rounded-full">
                        {['all', 'pizza', 'side', 'set'].map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setFilter(cat)}
                                className={`px-6 py-2 rounded-full text-sm font-medium transition-all duration-300 ${filter === cat
                                    ? 'bg-white text-ink shadow-sm'
                                    : 'text-ink/50 hover:text-ink'
                                    }`}
                            >
                                {cat.charAt(0).toUpperCase() + cat.slice(1)}
                            </button>
                        ))}
                    </div>
                </div>

                <motion.div
                    layout
                    className={`grid grid-cols-1 md:grid-cols-3 gap-6 ${filter !== 'all' ? 'auto-rows-auto' : 'auto-rows-[300px]'}`}
                >
                    <AnimatePresence mode='popLayout'>
                        {filteredItems.map((item) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, scale: 0.95 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                transition={{ duration: 0.4 }}
                                className={`group relative overflow-hidden rounded-3xl bg-white shadow-sm hover:shadow-xl transition-all duration-500 cursor-pointer ${filter === 'all' ? item.span : 'col-span-1 h-[300px]'}`}
                            >
                                {/* Standard Image Card */}
                                <>
                                    <img
                                        src={item.img}
                                        alt={item.title}
                                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-90 transition-opacity duration-300 flex flex-col justify-end p-8">
                                        <span className="text-xs font-bold text-white/60 uppercase tracking-widest mb-2">{item.category}</span>
                                        <h4 className="text-white text-2xl font-bold mb-1 group-hover:text-white transition-colors">{item.title}</h4>
                                        <p className="text-white/80 font-light text-sm line-clamp-2">
                                            {item.desc}
                                        </p>
                                    </div>
                                </>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </motion.div>
            </div>
        </section>
    );
};

export default Menu;
