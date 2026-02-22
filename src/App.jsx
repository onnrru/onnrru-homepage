import React from 'react';
import { BrowserRouter as Router, Routes, Route, useNavigate, useLocation } from 'react-router-dom';
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

import LandingPage from './components/Sections/LandingPage';

// Page Wrapper for transitions
const PageWrapper = ({ children, transitionType = "default" }) => {
  const transitions = {
    default: {
      initial: { opacity: 0, x: 20 },
      animate: { opacity: 1, x: 0 },
      exit: { opacity: 0, x: -20 },
      transition: { duration: 0.5, ease: "easeInOut" }
    },
    expand: {
      initial: { opacity: 0, scaleX: 0 },
      animate: { opacity: 1, scaleX: 1 },
      exit: { opacity: 0, scaleX: 0 },
      transition: { duration: 0.7, ease: [0.22, 1, 0.36, 1] }
    },
    fade: {
      initial: { opacity: 0 },
      animate: { opacity: 1 },
      exit: { opacity: 0 },
      transition: { duration: 0.8 }
    }
  };

  const selected = transitions[transitionType] || transitions.default;

  return (
    <motion.div
      initial={selected.initial}
      animate={selected.animate}
      exit={selected.exit}
      transition={selected.transition}
      className="min-h-screen w-full origin-center"
    >
      {children}
    </motion.div>
  );
};

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
  <PageWrapper transitionType="expand">
    <ConsultingDashboard />
  </PageWrapper>
);

const LandingPageView = () => (
  <PageWrapper transitionType="fade">
    <LandingPage />
  </PageWrapper>
);

const TestPageView = () => (
  <PageWrapper>
    <TestPage />
  </PageWrapper>
);

function AppContent() {
  const location = useLocation();
  const isLanding = location.pathname === '/';

  return (
    <div className={`font-sans text-ink bg-paper min-h-screen overflow-x-hidden ${isLanding ? 'bg-black' : ''}`}>
      {!isLanding && <Navbar />}
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<LandingPageView />} />
          <Route path="/pizza" element={<PizzaPage />} />
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
      {!isLanding && <Footer />}
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
