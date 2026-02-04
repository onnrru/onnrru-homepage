import React from 'react';

const Footer = () => {
    return (
        <footer className="bg-ink text-white/60 py-12 border-t border-white/5">
            <div className="container mx-auto px-6 text-center">
                <h5 className="text-xl font-serif text-white mb-8">온 류</h5>

                <p className="text-xs opacity-50">
                    &copy; {new Date().getFullYear()} OnnRRu. All rights reserved.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
