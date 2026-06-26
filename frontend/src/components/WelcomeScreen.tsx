import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import BlurText from './BlurText';
import { supabase } from '../lib/supabase';

function CountUpNumber({ end, delayMs, direction = 'top' }: { end: number, delayMs: number, direction?: 'top' | 'bottom' }) {
  const [count, setCount] = useState(0);
  
  useEffect(() => {
    if (end === 0) return;
    
    const timer = setTimeout(() => {
      let startTime: number | null = null;
      const duration = 1500; 
      const step = (timestamp: number) => {
        if (!startTime) startTime = timestamp;
        const progress = Math.min((timestamp - startTime) / duration, 1);
        const easeProgress = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress);
        setCount(Math.floor(easeProgress * end));
        if (progress < 1) {
          window.requestAnimationFrame(step);
        }
      };
      window.requestAnimationFrame(step);
    }, delayMs);
    
    return () => clearTimeout(timer);
  }, [end, delayMs]);

  const initialY = direction === 'top' ? -50 : 50;

  return (
    <motion.div
      initial={{ filter: 'blur(10px)', opacity: 0, y: initialY }}
      animate={{ filter: 'blur(0px)', opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay: delayMs / 1000 }}
      className="text-7xl font-black text-white tracking-tighter"
    >
      {count}
    </motion.div>
  );
}

export default function WelcomeScreen({ onComplete }: { onComplete: () => void }) {
  const [stats, setStats] = useState({ total: 0, resolved: 0 });
  
  useEffect(() => {
    async function fetchStats() {
      const { data, error } = await supabase.from('reports').select('status');
      if (data && !error) {
        const resolvedCount = data.filter(r => r.status === 'resolved').length;
        setStats({ total: data.length, resolved: resolvedCount });
      }
    }
    fetchStats();
    
    // Auto-dismiss after 3.5 seconds
    const timer = setTimeout(() => {
      onComplete();
    }, 3500);
    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-black text-white p-6 overflow-hidden">
      <div className="flex flex-col items-center">
        <BlurText 
          text="Welcome Daksh"
          delay={100}
          animateBy="words"
          direction="top"
          className="text-4xl font-bold mb-2 text-center tracking-tight"
        />
        <BlurText 
          text="The city needs your help!"
          delay={120}
          animateBy="words"
          direction="top"
          className="text-lg text-slate-400 mb-12 text-center"
        />
      </div>
      
      <div className="flex flex-col items-center gap-12 w-full max-w-sm">
        <div className="flex flex-col items-center justify-center w-full bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-sm">
          <BlurText 
            text="Reports submitted by you"
            delay={50}
            animateBy="words"
            direction="top"
            className="text-lg text-slate-300 mb-2 font-medium text-center"
          />
          <CountUpNumber 
            end={stats.total} 
            delayMs={400} 
            direction="top" 
          />
        </div>
        
        <div className="flex flex-col items-center justify-center w-full bg-white/5 rounded-2xl p-6 border border-white/10 shadow-2xl backdrop-blur-sm">
          <BlurText 
            text="Issues resolved because of you!"
            delay={50}
            animateBy="words"
            direction="bottom"
            className="text-lg text-slate-300 mb-2 font-medium text-center"
          />
          <CountUpNumber 
            end={stats.resolved} 
            delayMs={600} 
            direction="bottom" 
          />
        </div>
      </div>
    </div>
  )
}
