import { describe, test, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import MatchCard from '../../../components/MatchCard';
import { Match } from '../../../types';
import * as AppContextModule from '../../../context/AppContext';

// Mock the useAppContext hook
vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

describe('MatchCard Component', () => {
  // Regular match fixture
  const regularMatch: Match = {
    id: 'match1',
    round: 1,
    participant1Id: 'player1',
    participant2Id: 'player2',
    result: null,
    public: true,
  };

  // BYE match fixture (only one participant)
  const byeMatch: Match = {
    id: 'match2',
    round: 1,
    participant1Id: 'player1',
    participant2Id: null,
    result: 'bye',
    public: true,
  };

  const mockShowBattle = vi.fn();

  // Mock context values
  const mockContextValue = {
    getParticipantById: vi.fn((id) => {
      if (id === 'player1') {
        return {
          id: 'player1',
          name: 'Player One',
          title: 'Champion',
          team: [
            { name: 'Pikachu', sprite: 'pikachu.png' }
          ]
        };
      } else if (id === 'player2') {
        return {
          id: 'player2',
          name: 'Player Two',
          title: 'Rival',
          team: [
            { name: 'Charizard', sprite: 'charizard.png' }
          ]
        };
      }
      return undefined;
    }),
    updateMatchResult: vi.fn(),
    toggleMatchPublic: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (AppContextModule.useAppContext as ReturnType<typeof vi.fn>).mockReturnValue(mockContextValue);
  });

  test('renders regular match with clickable VS button in public view', async () => {
    render(<MatchCard match={regularMatch} publicView={true} onShowBattle={mockShowBattle} />);
    screen.debug();
    // Log all test IDs in the DOM
    const allTestIds = Array.from(document.querySelectorAll('[data-testid]')).map(el => el.getAttribute('data-testid'));
    // eslint-disable-next-line no-console
    console.log('All test IDs in DOM:', allTestIds);
    // Use querySelector as a fallback
    const card = document.body.querySelector('[data-testid="match-card"]');
    expect(card).toBeTruthy();
    const vsButton = card.querySelector('[data-testid="vs-button"]');
    expect(vsButton).toBeTruthy();
    fireEvent.click(vsButton);
    expect(mockShowBattle).toHaveBeenCalledTimes(1);
  });

  test('renders BYE match with disabled VS in public view', async () => {
    render(<MatchCard match={byeMatch} publicView={true} onShowBattle={mockShowBattle} />);
    screen.debug();
    const card = document.body.querySelector('[data-testid="match-card"]');
    expect(card).toBeTruthy();
    const vsDisabled = card.querySelector('[data-testid="vs-disabled"]');
    expect(vsDisabled).toBeTruthy();
    expect(vsDisabled.textContent).toBe('VS');
    const vsButton = card.querySelector('[data-testid="vs-button"]');
    expect(vsButton).toBeNull();
    expect(mockShowBattle).not.toHaveBeenCalled();
  });

  test('shows correct BYE indicators', async () => {
    render(<MatchCard match={byeMatch} publicView={true} />);
    screen.debug();
    const card = document.body.querySelector('[data-testid="match-card"]');
    expect(card).toBeTruthy();
    const zzzElement = Array.from(card.querySelectorAll('span')).find(el => el.textContent.includes('ZZZ'));
    expect(zzzElement).toBeTruthy();
    const byeText = Array.from(card.querySelectorAll('span')).find(el => el.textContent.includes('— BYE —'));
    expect(byeText).toBeTruthy();
    const sleepingMessage = Array.from(card.querySelectorAll('span')).find(el => el.textContent.includes('Duerme esta ronda'));
    expect(sleepingMessage).toBeTruthy();
  });

  test('does not allow setting results for BYE matches', async () => {
    render(<MatchCard match={byeMatch} />);
    screen.debug();
    const card = document.body.querySelector('[data-testid="match-card"]');
    expect(card).toBeTruthy();
    // For BYE matches, result buttons are not rendered, only the result and edit button
    const player1WinButton = Array.from(card.querySelectorAll('button')).find(el => el.textContent.includes('Gana'));
    expect(player1WinButton).toBeUndefined();
    const tieButton = Array.from(card.querySelectorAll('button')).find(el => el.textContent.includes('Empate'));
    expect(tieButton).toBeUndefined();
    const player2Button = Array.from(card.querySelectorAll('button')).find(el => el.textContent.includes('Player Two Gana'));
    expect(player2Button).toBeUndefined();
    // Check for result text
    const resultText = Array.from(card.querySelectorAll('span')).find(el => el.textContent.includes('Bye'));
    expect(resultText).toBeTruthy();
  });
}); 