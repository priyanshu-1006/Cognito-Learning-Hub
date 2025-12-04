// --- FILE: `src/components/FloatingIconsBackground.jsx` ---
import React from 'react';

// Define SVG icons as components for reusability
const AtomIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="1"/><path d="M20.2 20.2c2.04-2.03.02-5.91-4.04-9.96"/><path d="M3.8 3.8c-2.04 2.03-.02 5.91 4.04 9.96"/><path d="M9.96 4.04C5.91 8.1.03 10.12 3.8 14.16"/><path d="M14.16 20.2c4.05-4.04 2.03-8.08-1.74-12.12"/></svg>;
const GlobeIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>;
const BookIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>;
const CalculatorIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="8" y1="6" x2="16" y2="6"/><line x1="16" y1="14" x2="16" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/></svg>;
const PaletteIcon = () => <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><circle cx="13.5" cy="6.5" r=".5"/><circle cx="17.5" cy="10.5" r=".5"/><circle cx="8.5" cy="7.5" r=".5"/><circle cx="6.5" cy="12.5" r=".5"/><path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.926 0 1.648-.746 1.648-1.688 0-.437-.18-.835-.477-1.093l-7.071-7.071a1.5 1.5 0 0 1 2.121-2.121z"/></svg>;

const icons = [
  { component: AtomIcon, size: 40, duration: 20, delay: 0, left: '10%' },
  { component: GlobeIcon, size: 20, duration: 25, delay: 5, left: '20%' },
  { component: BookIcon, size: 30, duration: 18, delay: 2, left: '30%' },
  { component: CalculatorIcon, size: 50, duration: 22, delay: 7, left: '40%' },
  { component: PaletteIcon, size: 25, duration: 30, delay: 1, left: '50%' },
  { component: AtomIcon, size: 35, duration: 15, delay: 9, left: '60%' },
  { component: GlobeIcon, size: 45, duration: 28, delay: 3, left: '70%' },
  { component: BookIcon, size: 20, duration: 19, delay: 6, left: '80%' },
  { component: CalculatorIcon, size: 30, duration: 24, delay: 4, left: '90%' },
];

export default function FloatingIconsBackground() {
  return (
    <div className="floating-icons">
      {icons.map((icon, i) => {
        const IconComponent = icon.component;
        return (
          <span
            key={i}
            style={{
              left: icon.left,
              width: icon.size,
              height: icon.size,
              animationDuration: `${icon.duration}s`,
              animationDelay: `${icon.delay}s`,
            }}
          >
            <IconComponent />
          </span>
        );
      })}
    </div>
  );
}
