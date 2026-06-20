import React from 'react';

export const SurfBackground = () => {
  return (
    <div 
      className="fixed inset-0 z-[-2] overflow-hidden pointer-events-none select-none" 
      style={{
        backgroundColor: '#030307',
        backgroundImage: `
          radial-gradient(ellipse at top left, #050014 0%, transparent 65%),
          radial-gradient(ellipse at bottom right, #02040A 0%, transparent 55%),
          radial-gradient(ellipse at center, #000000 0%, transparent 70%)
        `
      }}
    >
      {/* High-Definition Static Grid Layer */}
      <div 
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255, 255, 255, 0.05) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
        }}
      />
    </div>
  );
};
