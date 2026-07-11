'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';
import { Logo } from '@/components/ui/Logo';

const SESSION_KEY = 'tomouh_splash_shown';
const VISIBLE_MS = 2400;

export function SplashScreen({ children }: { children: ReactNode }) {
  const [show, setShow] = useState(true);

  useEffect(() => {
    let seen = false;
    try {
      seen = !!sessionStorage.getItem(SESSION_KEY);
    } catch {
      // sessionStorage unavailable (e.g. privacy mode) — just show it once per page.
    }

    if (seen) {
      setShow(false);
      return;
    }

    try {
      sessionStorage.setItem(SESSION_KEY, '1');
    } catch {
      // ignore
    }

    const timer = setTimeout(() => setShow(false), VISIBLE_MS);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            key="splash"
            initial={{ y: 0 }}
            exit={{ y: '-100%' }}
            transition={{ duration: 0.85, ease: [0.76, 0, 0.24, 1] }}
            className="fixed inset-0 z-[200] flex items-center justify-center overflow-hidden bg-[#0A0630]"
          >
            <div className="relative flex items-center justify-center">
              <motion.div
                initial={{ opacity: 0.25, scale: 0.6 }}
                animate={{ opacity: [0.25, 0.7, 0.4], scale: [0.6, 1.3, 1.1] }}
                transition={{ duration: 1.8, ease: 'easeOut' }}
                className="absolute h-56 w-56 rounded-full bg-secondary-600/50 blur-3xl"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0.82 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
                className="relative"
              >
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.7, duration: 0.6 }}
                  className="absolute -inset-4 rounded-[28px]"
                  style={{
                    boxShadow: '0 0 0 1.5px rgba(240,108,0,0.7), 0 0 30px rgba(240,108,0,0.45)',
                  }}
                />
                <Logo variant="splash" className="relative z-10" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
