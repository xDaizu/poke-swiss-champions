import React, { useState } from 'react';
import { X } from 'lucide-react';
import BattleCard from './BattleCard';

/**
 * Props for the BattleOverlay component
 */
interface BattleOverlayProps {
  /** The match data containing participant IDs */
  match: {
    id: string | number;
    participant1Id: string | number;
    participant2Id: string | number;
    [key: string]: any;
  };
  /** Callback function when the overlay is closed */
  onClose: () => void;
  /** Array of participants to look up by ID */
  participants: Array<{
    id: string | number;
    name: string;
    profileImage?: string;
    team?: any[];
    [key: string]: any;
  }>;
}

/**
 * Battle Overlay Component
 * 
 * Displays an animated battle overlay with two participant cards positioned opposite each other.
 * Includes animation when opening and closing the overlay.
 */
const BattleOverlay: React.FC<BattleOverlayProps> = ({ match, onClose, participants }) => {
  const [battleAnimatingOut, setBattleAnimatingOut] = useState(false);
  
  // Helper to get participant by id
  const getParticipant = (id: string | number) => {
    return participants.find(p => p.id === id);
  };
  
  if (!match) return null;
  const p1 = getParticipant(match.participant1Id);
  const p2 = getParticipant(match.participant2Id);
  
  /**
   * Handle closing the battle overlay with animations
   */
  const handleClose = () => {
    setBattleAnimatingOut(true);
    setTimeout(() => {
      onClose();
      setBattleAnimatingOut(false);
    }, 1000);
  };
  
  return (
    <div className={`fixed inset-0 z-50 flex flex-col min-h-screen bg-black/70 transition-opacity duration-1000 ${battleAnimatingOut ? 'opacity-0' : 'opacity-100'}`}>
      {/* Responsive battle fields: column on mobile, row on desktop */}
      <div className="flex flex-col md:flex-row w-full h-full flex-1">
        {/* Field 1 */}
        <div className="flex-1 flex items-center justify-center">
          <div className={`${battleAnimatingOut ? 'animate-exitLeftCard' : ''}`}
            style={{ zIndex: 2, width: '300px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BattleCard participant={p1} align="left" />
          </div>
        </div>
        {/* Field 2 */}
        <div className="flex-1 flex items-center justify-center">
          <div className={`${battleAnimatingOut ? 'animate-exitRightCard' : ''}`}
            style={{ zIndex: 2, width: '300px', height: '600px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <BattleCard participant={p2} align="right" />
          </div>
        </div>
      </div>
      <div className="flex justify-center pb-8">
        <button
          className={`mt-4 bg-white rounded-full shadow-lg p-3 flex items-center justify-center hover:bg-gray-200 transition-all duration-500 fixed bottom-4 ${battleAnimatingOut ? 'opacity-0 scale-0' : 'opacity-100 scale-100'}`}
          onClick={handleClose}
          aria-label="Cerrar batalla"
        >
          <X size={32} className="text-pokemon-red" />
        </button>
      </div>
    </div>
  );
};

export default BattleOverlay; 