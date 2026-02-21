import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { GameProvider } from './context/GameContext';
import MainGameLayout from './components/Layout/MainGameLayout';
import Navbar from './components/Layout/Navbar';
import Hero from './components/Sections/Hero';
import About from './components/Sections/About';
import Menu from './components/Sections/Menu';
import Locations from './components/Sections/Locations';
import Footer from './components/Layout/Footer';
import ConsultingDashboard from './components/Dashboard/ConsultingDashboard';
import TestPage from './components/TestPage';
import { motion, AnimatePresence } from 'framer-motion';

// Page Wrapper for transitions
const PageWrapper = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, x: 20 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -20 }}
    transition={{ duration: 0.5, ease: "easeInOut" }}
    className="min-h-screen w-full"
  >
    {children}
  </motion.div>
);

// Pizza Group (Hero + Menu + Locations)
const PizzaPage = () => (
  <PageWrapper>
    <Hero />
    <Menu />
    <Locations />
  </PageWrapper>
);

const AboutPage = () => (
  <PageWrapper>
    <About />
  </PageWrapper>
);

const ConsultingPage = () => (
  <PageWrapper>
    <ConsultingDashboard />
  </PageWrapper>
);

const TestPageView = () => (
  <PageWrapper>
    <TestPage />
  </PageWrapper>
);

function AppContent() {
  const location = useLocation();

  return (
    <div className="font-sans text-ink bg-paper min-h-screen overflow-x-hidden">
      <Navbar />
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<PizzaPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/consulting" element={<ConsultingPage />} />
          <Route path="/test" element={<TestPageView />} />
          <Route path="/game" element={
            <GameProvider>
              <MainGameLayout />
            </GameProvider>
          } />
        </Routes>
      </AnimatePresence>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <Router>
      <AppContent />
    </Router>
  );
}

export default App;
