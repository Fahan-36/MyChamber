import { useEffect, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { AnimatePresence, motion } from 'framer-motion';
import AppRouter from './routes/AppRouter';
import IntroSplash from './components/common/IntroSplash';

function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Toaster
        position="top-right"
        toastOptions={{
          className: 'rounded-2xl text-sm',
          style: { background: '#0f172a', color: '#e2e8f0' },
        }}
      />
      <AnimatePresence mode="wait">
        {showSplash ? (
          <motion.div key="splash" exit={{ opacity: 0 }}>
            <IntroSplash />
          </motion.div>
        ) : (
          <motion.div key="app" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            <AppRouter />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

export default App;
