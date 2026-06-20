
import React from 'react';
import { ChevronLeft } from 'lucide-react';

interface BackToDashboardProps {
  onBack: () => void;
  color?: string;
}

export const BackToDashboard: React.FC<BackToDashboardProps> = ({ onBack, color = 'white' }) => {
  return (
    <button
      onClick={onBack}
      className="flex items-center space-x-2 px-4 py-2 text-[10px] font-black tracking-widest uppercase italic transition-all hover:opacity-70"
      style={{ color }}
    >
      <ChevronLeft size={14} strokeWidth={3} />
      <span className="lava-hot-text">Back to Dashboard</span>
    </button>
  );
};
