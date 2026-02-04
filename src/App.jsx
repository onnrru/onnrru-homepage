import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import Navbar from './components/Layout/Navbar';
import Footer from './components/Layout/Footer';
import MainGroup from './components/Groups/MainGroup';
import ConsultingGroup from './components/Groups/ConsultingGroup';

function App() {
  const [activeGroup, setActiveGroup] = useState(0); // 0: Main, 1: Consulting

  // Slide variants
  const variants = {
    enter: (direction) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const swipeConfidenceThreshold = 10000;
  const swipePower = (offset, velocity) => {
    return Math.abs(offset) * velocity;
  };

  return (
    <div className="min-h-screen bg-paper text-ink font-sans selection:bg-ink selection:text-white overflow-x-hidden">
      {/* Navbar receives activeGroup setter to control navigation */}
      <Navbar activeGroup={activeGroup} setActiveGroup={setActiveGroup} />

      <main className="relative min-h-screen">
        <AnimatePresence initial={false} mode="wait" custom={activeGroup}>
          <motion.div
            key={activeGroup}
            custom={activeGroup}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              x: { type: "spring", stiffness: 300, damping: 30 },
              opacity: { duration: 0.2 }
            }}
            className="w-full"
          >
            {activeGroup === 0 ? <MainGroup /> : <ConsultingGroup />}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Footer only on Main Group? Or both? Usually Main. */}
      {activeGroup === 0 && <Footer />}
    </div>
  );
}

export default App;
