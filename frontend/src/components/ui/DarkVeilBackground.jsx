import React from 'react';
import DarkVeil from './DarkVeil';

export function DarkVeilBackground({ children, className = '' }) {
  return (
    <div className={`relative min-h-screen ${className}`}>
      {/* WebGL Dark Veil Background */}
      <div className="fixed inset-0 -z-10 h-full w-full">
        <DarkVeil 
          hueShift={0}
          noiseIntensity={0.05}
          scanlineIntensity={0}
          speed={0.3}
          scanlineFrequency={0}
          warpAmount={0.3}
          resolutionScale={1}
        />
      </div>
      
      {/* Content */}
      <div className="relative z-0">
        {children}
      </div>
    </div>
  );
}
