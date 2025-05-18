import React from 'react';
import { AvatarFallback } from './avatar';
import { getInitials, getAvatarColor } from '@/lib/avatar';
import { Pokemon } from '@/types';

interface ParticipantAvatarFallbackProps {
  name: string;
  team: Pokemon[];
  className?: string;
}

export const ParticipantAvatarFallback: React.FC<ParticipantAvatarFallbackProps> = ({ 
  name, 
  team,
  className 
}) => {
  const initials = getInitials(name);
  const backgroundColor = getAvatarColor(team);
  
  return (
    <AvatarFallback 
      className={className}
      style={{ backgroundColor }}
    >
      {initials}
    </AvatarFallback>
  );
}; 