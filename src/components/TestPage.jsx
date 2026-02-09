import React from 'react';
import Navbar from './Layout/Navbar';
import Footer from './Layout/Footer';

const TestPage = () => {
    return (
        <div className="font-sans text-ink bg-paper min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1 container mx-auto px-6 py-24">
                <h1 className="text-4xl font-bold mb-8">Test Page</h1>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                    <p className="text-lg text-gray-600 mb-4">
                        이 페이지는 컴포넌트 테스트를 위한 공간입니다.
                    </p>
                    {/* Add components to test here */}
                    <div className="p-10 border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center text-gray-400">
                        Test Area
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default TestPage;
