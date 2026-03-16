import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-ink text-white/60 h-10 flex items-center justify-center border-t border-white/5">
            <div className="container mx-auto px-4 flex flex-wrap items-center justify-center gap-x-4">
                <h5 className="text-sm font-serif text-white m-0">온 류</h5>
                <p className="text-[10px] opacity-50 m-0">
                    &copy; {new Date().getFullYear()} OnnRRu. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
