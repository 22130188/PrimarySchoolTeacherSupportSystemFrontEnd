import { useEffect, useRef } from 'react';

/**
 * @returns {React.RefObject} ref — gắn vào element chứa các icon
 */
export function useParallax() {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleMouseMove = (e) => {
      const rect = container.getBoundingClientRect();
      const mouseX = e.clientX - rect.left - rect.width / 2;
      const mouseY = e.clientY - rect.top - rect.height / 2;

      container.querySelectorAll('.parallax-icon').forEach((el, i) => {
        const depth = 0.015 + (i % 3) * 0.005;
        el.style.transform = `translate(${mouseX * depth}px, ${mouseY * depth}px)`;
      });
    };

    container.addEventListener('mousemove', handleMouseMove);
    return () => container.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return containerRef;
}
