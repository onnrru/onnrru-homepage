import React, { useState } from 'react';
import { motion } from 'framer-motion';

const ConsultingGroup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleLogin = (e) => {
        e.preventDefault();
        alert('Login functionality to be implemented.');
    };

    return (
        <div className="w-full min-h-screen flex items-center justify-center bg-paper relative overflow-hidden">
            {/* Background elements */}
            <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] bg-ink/5 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-accent/5 rounded-full blur-3xl pointer-events-none"></div>

            <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8 }}
                className="bg-white p-12 rounded-3xl shadow-xl w-full max-w-md relative z-10 border border-gray-100"
            >
                <div className="text-center mb-10">
                    <span className="text-xs font-bold tracking-widest text-ink/40 uppercase mb-3 block">Real Estate Service</span>
                    <h2 className="text-3xl font-serif text-ink mb-2">Consulting Login</h2>
                    <p className="text-ink/60 text-sm">Please sign in to access professional services.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-6">
                    <div>
                        <label className="block text-xs font-bold uppercase text-ink/70 mb-2">Email Address</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-ink focus:ring-0 transition-colors outline-none text-ink placeholder-ink/30"
                            placeholder="name@company.com"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold uppercase text-ink/70 mb-2">Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl bg-gray-50 border border-gray-100 focus:border-ink focus:ring-0 transition-colors outline-none text-ink placeholder-ink/30"
                            placeholder="••••••••"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full py-4 bg-ink text-white rounded-xl font-bold hover:bg-ink-light transition-colors shadow-lg shadow-ink/20 mt-4"
                    >
                        Sign In
                    </button>
                </form>

                <div className="mt-8 text-center">
                    <a href="#" className="text-xs text-ink/50 hover:text-ink transition-colors border-b border-transparent hover:border-ink/50">Forgot password?</a>
                </div>
            </motion.div>
        </div>
    );
};

export default ConsultingGroup;
