import { useNavigate, useLocation } from 'react-router-dom';
import { useDashboard } from '../../context/DashboardContext';

const TopBar = () => {
    const navigate = useNavigate();
    const location = useLocation();

    const navLinks = [
        { name: 'ABOUT', href: '/about' },
        {
            name: (
                <span className="flex flex-col items-center">
                    <span className="text-[10px] font-bold opacity-60">PapavalleyPizza X</span>
                    <span className="text-sm font-black tracking-tighter text-ink/40">ONNRRU</span>
                </span>
            ),
            href: '/',
            isBrand: true
        },
        { name: 'Consulting', href: '/consulting' },
        { name: 'Test', href: '/test' },
    ];

    const handleNavigation = (e, href) => {
        e.preventDefault();
        navigate(href);
    };

    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-6 shadow-sm z-50">
            {/* Left: Logo */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity whitespace-nowrap"
            >
                <div className="text-xl font-bold text-ink font-serif tracking-tight">
                    한결같이 온류
                </div>
            </button>

            {/* Right: Integrated Menu (Matching Navbar) */}
            <div className="flex items-center space-x-6 lg:space-x-10">
                <div className="flex items-center space-x-8 lg:space-x-10">
                    {navLinks.map((link) => (
                        <a
                            key={link.name}
                            href={link.href}
                            onClick={(e) => handleNavigation(e, link.href)}
                            className={`uppercase tracking-wider hover:text-ink transition-colors relative group cursor-pointer leading-tight
                                ${link.isBrand ? 'text-ink' : 'text-[11px] text-ink/70 font-bold'}
                                ${location.pathname === link.href ? 'text-ink' : ''}
                            `}
                        >
                            <span className="whitespace-pre-line text-center block">
                                {link.name}
                            </span>
                            <span className={`absolute left-0 bottom-[-4px] h-[2px] bg-ink transition-all group-hover:w-full ${location.pathname === link.href ? 'w-full' : 'w-0'}`}></span>
                        </a>
                    ))}
                </div>

                {/* Social Icons (matching Navbar) */}
                <div className="flex items-center space-x-3 border-l border-ink/10 pl-6">
                    <a href="https://www.instagram.com/papahabio/" target="_blank" rel="noreferrer" className="text-ink/60 hover:text-pink-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z" /></svg>
                    </a>
                    <a href="https://www.facebook.com/people/%ED%8C%8C%ED%8C%8C%EB%B0%B8%EB%A6%AC%ED%94%BC%EC%9E%90-%EB%A1%AF%EB%8D%B0%EB%A7%88%ED%8A%B8%EC%9E%A0%EC%8B%A4%EC%A0%90/100063804047171/#" target="_blank" rel="noreferrer" className="text-ink/60 hover:text-blue-600 transition-colors">
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" /></svg>
                    </a>
                </div>
            </div>
        </div>
    );
};

export default TopBar;
