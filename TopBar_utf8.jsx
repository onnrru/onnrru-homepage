import { useNavigate } from 'react-router-dom';
import AddressSearch from './AddressSearch'; // Import new component

const TopBar = ({ onAddressSelect }) => {
    const navigate = useNavigate();

    return (
        <div className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-3 md:px-6 shadow-sm z-20">
            {/* Left: Logo/Title or Breadcrumb */}
            <button
                onClick={() => navigate('/')}
                className="flex items-center gap-2 md:gap-4 hover:opacity-80 transition-opacity whitespace-nowrap"
            >
                <div className="text-lg md:text-xl font-bold text-ink font-serif tracking-tight cursor-pointer">
                    ?쒓껐媛숈씠 ?⑤쪟
                </div>
                <span className="text-gray-300 hidden sm:inline">|</span>
                <div className="text-xs md:text-sm text-gray-500 hidden sm:block">Professional Analysis</div>
            </button>

            {/* Center: Search Bar */}
            <div className="flex-1 max-w-2xl mx-2 md:mx-12">
                <AddressSearch onSelect={onAddressSelect} />
            </div>

            {/* Right: User/Login */}
            <div className="flex items-center gap-2 md:gap-4 flex-shrink-0">
                <button className="p-1.5 md:p-2 text-gray-400 hover:text-ink transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 md:h-6 md:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                    </svg>
                </button>
                <div className="h-7 w-7 md:h-8 md:w-8 rounded-full bg-ink text-white flex items-center justify-center font-serif font-bold text-sm md:text-base">
                    O
                </div>
            </div>
        </div>
    );
};

export default TopBar;
