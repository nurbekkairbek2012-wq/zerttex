import {
  animate, motion, useInView, useMotionTemplate, useMotionValue, useScroll, useSpring, useTransform,
  type HTMLMotionProps,
} from 'framer-motion';
import { Fragment, createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';

const ease = [0.16, 1, 0.3, 1] as const;

/** Rises and fades in when it scrolls into view. */
export function Reveal({ children, delay = 0, y = 40, className, ...rest }: { children: ReactNode; delay?: number; y?: number; className?: string } & HTMLMotionProps<'div'>) {
  return (
    <motion.div
      className={className}
      initial={{ opacity: 0, y }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.9, delay, ease }}
      {...rest}
    >
      {children}
    </motion.div>
  );
}

/** Headline that reveals word by word from behind a mask. */
export function SplitText({ text, className, delay = 0, as = 'h1' }: { text: string; className?: string; delay?: number; as?: 'h1' | 'h2' }) {
  const Tag = motion[as];
  const words = text.split(' ');
  return (
    <Tag className={className} aria-label={text} initial="hidden" whileInView="show" viewport={{ once: true }}>
      {words.map((w, i) => (
        <Fragment key={i}>
          <span className="split__mask" aria-hidden="true">
            <motion.span
              className="split__word"
              variants={{ hidden: { y: '110%', rotate: 6 }, show: { y: '0%', rotate: 0 } }}
              transition={{ duration: 0.9, delay: delay + i * 0.07, ease }}
            >
              {w}
            </motion.span>
          </span>
          {i < words.length - 1 ? ' ' : ''}
        </Fragment>
      ))}
    </Tag>
  );
}

/** Number that counts up when it becomes visible. */
export function CountUp({ to, prefix = '', suffix = '', decimals = 0, duration = 2, group = true }: { to: number; prefix?: string; suffix?: string; decimals?: number; duration?: number; group?: boolean }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: '-40px' });
  const [v, setV] = useState(0);
  useEffect(() => {
    if (!inView) return;
    const c = animate(0, to, { duration, ease: [0.22, 1, 0.36, 1], onUpdate: setV });
    return () => c.stop();
  }, [inView, to, duration]);
  return (
    <span ref={ref}>
      {prefix}
      {v.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals, useGrouping: group })}
      {suffix}
    </span>
  );
}

/** Card that tilts in 3D toward the cursor, with a moving light reflection. */
export function TiltCard({ children, className, max = 10 }: { children: ReactNode; className?: string; max?: number }) {
  const x = useMotionValue(0.5);
  const y = useMotionValue(0.5);
  const rx = useSpring(useTransform(y, [0, 1], [max, -max]), { stiffness: 200, damping: 18 });
  const ry = useSpring(useTransform(x, [0, 1], [-max, max]), { stiffness: 200, damping: 18 });
  const gx = useTransform(x, [0, 1], ['0%', '100%']);
  const gy = useTransform(y, [0, 1], ['0%', '100%']);
  const shine = useMotionTemplate`radial-gradient(600px circle at ${gx} ${gy}, rgba(255,255,255,0.22), transparent 40%)`;
  return (
    <motion.div
      className={`tilt ${className ?? ''}`}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      onPointerMove={(e) => {
        const r = e.currentTarget.getBoundingClientRect();
        x.set((e.clientX - r.left) / r.width);
        y.set((e.clientY - r.top) / r.height);
      }}
      onPointerLeave={() => {
        x.set(0.5);
        y.set(0.5);
      }}
      whileHover={{ scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {children}
      <motion.span className="tilt__shine" style={{ background: shine }} aria-hidden="true" />
    </motion.div>
  );
}

/** Thin progress bar at the top of the page that follows scrolling. */
export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 120, damping: 30 });
  return <motion.div className="scroll-progress" style={{ scaleX }} aria-hidden="true" />;
}

/** Endless horizontal strip. */
export function Marquee({ children, speed = 40 }: { children: ReactNode; speed?: number }) {
  return (
    <div className="marquee" aria-hidden="true">
      <motion.div className="marquee__track" animate={{ x: ['0%', '-50%'] }} transition={{ duration: speed, ease: 'linear', repeat: Infinity }}>
        {children}
        {children}
      </motion.div>
    </div>
  );
}

/** Route change animation. */
export function PageTransition({ children }: { children: ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.55, ease }}
    >
      {children}
    </motion.div>
  );
}

// ---------- toasts ----------
interface Toast {
  id: number;
  text: string;
}
const ToastCtx = createContext<(text: string) => void>(() => undefined);
export const useToast = () => useContext(ToastCtx);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Toast[]>([]);
  const push = useCallback((text: string) => {
    const id = Date.now() + Math.random();
    setItems((t) => [...t, { id, text }]);
    setTimeout(() => setItems((t) => t.filter((x) => x.id !== id)), 3200);
  }, []);
  return (
    <ToastCtx.Provider value={push}>
      {children}
      <div className="toasts" role="status" aria-live="polite">
        {items.map((t) => (
          <motion.div key={t.id} className="toast" initial={{ opacity: 0, y: 30, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={{ type: 'spring', stiffness: 300, damping: 22 }}>
            {t.text}
          </motion.div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}

export { motion, ease };
