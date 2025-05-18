/**
 * Generates avatar details for participants based on their name and Pokémon team
 */

import { Pokemon } from "../types";

/**
 * Get initials from a participant name
 * @param name The participant's name
 * @returns Up to 2 initials from the name
 */
export function getInitials(name: string): string {
  if (!name) return "TR";
  
  const initials = name
    .split(" ")
    .filter(Boolean)
    .map(word => word[0]?.toUpperCase() || "")
    .join("")
    .slice(0, 2);
    
  return initials || "?";  // Default to "TR" (for Trainer) if no initials could be extracted
}

/**
 * Create a simple hash from a string
 * @param str The string to hash
 * @returns A number hash
 */
function simpleHash(str: string): number {
  let hash = 0;
  if (!str || str.length === 0) return hash;
  
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  
  return Math.abs(hash);
}

/**
 * Generate a color based on the participant's team
 * @param team The participant's Pokémon team
 * @returns A hex color code
 */
export function getAvatarColor(team: Pokemon[]): string {
  // Curated palette of nice, vibrant, and visually distinct colors
  const palette = [
    '#F87171', // Red
    '#FBBF24', // Amber
    '#34D399', // Green
    '#60A5FA', // Blue
    '#A78BFA', // Purple
    '#F472B6', // Pink
    '#FCD34D', // Yellow
    '#38BDF8', // Sky
    '#4ADE80', // Emerald
    '#FCA5A5', // Rose
    '#FDBA74', // Orange
    '#818CF8', // Indigo
    '#A3E635', // Lime
    '#F9A8D4', // Fuchsia
    '#6EE7B7', // Teal
    '#FDE68A', // Light Yellow
    '#C4B5FD', // Light Purple
    '#FECACA', // Light Red
    '#BBF7D0', // Light Green
    '#BFDBFE', // Light Blue
  ];

  if (!team || team.length === 0) return palette[3]; // Default to blue

  // Create a string representation of the team to hash
  const teamString = team
    .map(pokemon => pokemon.name || pokemon.id?.toString() || "")
    .filter(Boolean)
    .join(",");

  const hash = simpleHash(teamString);
  const color = palette[hash % palette.length];
  return color;
}

/**
 * Generate a complete avatar URL for a participant based on their name and team
 * @param name The participant's name
 * @param team The participant's Pokémon team
 * @returns A URL for the avatar image using ui-avatars.com
 */
export function generateAvatarUrl(name: string, team: Pokemon[]): string {
  const initials = encodeURIComponent(getInitials(name));
  const color = encodeURIComponent(getAvatarColor(team).replace('#', ''));
  
  return `https://ui-avatars.com/api/?name=${initials}&background=${color}&color=fff&rounded=true`;
} 