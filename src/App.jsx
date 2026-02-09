import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import MainGameLayout from './components/layout/MainGameLayout';
import Navbar from './components/layout/Navbar';
import Hero from './components/Sections/Hero';
import About from './components/Sections/About';
import Menu from './components/Sections/Menu';
import Reviews from './components/Sections/Reviews';
import Locations from './components/Sections/Locations';
import Footer from './components/layout/Footer';
import ConsultingDashboard from './components/Dashboard/ConsultingDashboard';
import TestPage from './components/TestPage';

// Landing Page Component (Original Website)
const Website = () => {
  return (
    <div className="font-sans text-ink bg-paper min-h-screen">
      <Navbar />
      <main>
        <Hero />
        <About />
        <Menu />
        <Reviews />
        <Locations />
      </main>
      <Footer />
    </div>
  );
};

function App() {
  return (
    <Router>
      <Routes>
        {/* Main Website Route */}
        <Route path="/" element={<Website />} />

        {/* Consulting Dashboard (New) */}
        <Route path="/consulting" element={<ConsultingDashboard />} />

        {/* Test Page */}
        <Route path="/test" element={<TestPage />} />

        {/* Legacy Game Route (Hidden/Optional) */}
        <Route path="/game" element={
          <GameProvider>
            <MainGameLayout />
          </GameProvider>
        } />
      </Routes>
    </Router>
  );
}

export default App;
