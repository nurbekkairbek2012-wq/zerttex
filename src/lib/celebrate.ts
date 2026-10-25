import confetti from 'canvas-confetti';

const reduce = () => typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

/** Two-sided confetti burst in the brand colours (sun gold, Kolsai teal, steppe ink). */
export function celebrate() {
  if (reduce()) return;
  const colors = ['#F4B400', '#0B7C86', '#15233F', '#FFFFFF', '#38B2BB'];
  const end = Date.now() + 900;
  (function frame() {
    confetti({ particleCount: 6, angle: 60, spread: 70, origin: { x: 0, y: 0.7 }, colors });
    confetti({ particleCount: 6, angle: 120, spread: 70, origin: { x: 1, y: 0.7 }, colors });
    if (Date.now() < end) requestAnimationFrame(frame);
  })();
  setTimeout(() => confetti({ particleCount: 140, spread: 100, startVelocity: 45, origin: { y: 0.55 }, colors }), 250);
}
