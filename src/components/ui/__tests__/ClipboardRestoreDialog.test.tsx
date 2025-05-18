import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClipboardRestoreDialog } from '../ClipboardRestoreDialog';
import { storageService } from '../../../services/storageService';
import { useToast } from '../../../hooks/use-toast';
import { useAppContext } from '../../../context/AppContext';
import { vi, describe, test, expect, beforeEach } from 'vitest';

// Mock dependencies
vi.mock('../../../services/storageService', () => ({
  storageService: {
    createBackup: vi.fn()
  }
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

describe('ClipboardRestoreDialog', () => {
  const mockToast = { toast: vi.fn() };
  const mockSetParticipants = vi.fn();
  const mockSetTournament = vi.fn();
  const mockOnClose = vi.fn();
  
  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue(mockToast);
    (useAppContext as ReturnType<typeof vi.fn>).mockReturnValue({
      setParticipants: mockSetParticipants,
      setTournament: mockSetTournament
    });
  });

  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ClipboardRestoreDialog isOpen={false} onClose={mockOnClose} />
    );
    expect(container.innerHTML).toBe('');
  });

  test('renders dialog when isOpen is true', () => {
    const { container } = render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    // Find dialog container
    const dialog = container.querySelector('.bg-white.rounded-lg.shadow-lg');
    expect(dialog).toBeTruthy();
    // Find h2
    const h2 = dialog.querySelector('h2');
    expect(h2).toBeTruthy();
    expect(h2.textContent).toContain('Restaurar Backup del Portapapeles');
    // Find textarea
    const textarea = dialog.querySelector('textarea');
    expect(textarea).toBeTruthy();
    expect(textarea.placeholder).toBe('Pegue el JSON aquí...');
    // Find Cancelar and Restaurar buttons
    const buttons = Array.from(dialog.querySelectorAll('button'));
    const cancelarButton = buttons.find(btn => btn.textContent.trim() === 'Cancelar');
    const restaurarButton = buttons.find(btn => btn.textContent.trim() === 'Restaurar');
    expect(cancelarButton).toBeTruthy();
    expect(restaurarButton).toBeTruthy();
  });

  test('calls onClose when Cancel button is clicked', () => {
    const { container } = render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    const dialog = container.querySelector('.bg-white.rounded-lg.shadow-lg');
    const cancelarButton = Array.from(dialog.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Cancelar');
    expect(cancelarButton).toBeTruthy();
    fireEvent.click(cancelarButton);
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('Restaurar button is disabled when textarea is empty', () => {
    const { container } = render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    const dialog = container.querySelector('.bg-white.rounded-lg.shadow-lg');
    const restaurarButton = Array.from(dialog.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Restaurar');
    expect(restaurarButton).toBeTruthy();
    expect(restaurarButton?.hasAttribute('disabled')).toBe(true);
  });

  test('restores data from valid JSON', () => {
    const validData = {
      participants: [{ id: '1', name: 'Player 1', title: 'Champion', team: [] }],
      tournament: { rounds: 4, currentRound: 1, matches: [] }
    };
    
    const { container } = render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    const dialog = container.querySelector('.bg-white.rounded-lg.shadow-lg');
    const textarea = dialog.querySelector('textarea');
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea, { target: { value: JSON.stringify(validData) } });
    const restaurarButton = Array.from(dialog.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Restaurar');
    expect(restaurarButton).toBeTruthy();
    fireEvent.click(restaurarButton);
    expect(storageService.createBackup).toHaveBeenCalledTimes(1);
    expect(mockSetParticipants).toHaveBeenCalledWith(validData.participants);
    expect(mockSetTournament).toHaveBeenCalledWith(validData.tournament);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: expect.stringMatching(/Restauración exitosa|Backup restaurado/)
    }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows error toast on invalid JSON format', () => {
    const { container } = render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    const dialog = container.querySelector('.bg-white.rounded-lg.shadow-lg');
    const textarea = dialog.querySelector('textarea');
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea, { target: { value: '{invalid json' } });
    const restaurarButton = Array.from(dialog.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Restaurar');
    expect(restaurarButton).toBeTruthy();
    fireEvent.click(restaurarButton);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error de restauración',
      variant: 'destructive'
    }));
    expect(mockOnClose).not.toHaveBeenCalled();
  });

  test('shows error toast on JSON with missing required fields', () => {
    const invalidData = { 
      someOtherData: 'test'
      // Missing participants and tournament
    };
    
    const { container } = render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    const dialog = container.querySelector('.bg-white.rounded-lg.shadow-lg');
    const textarea = dialog.querySelector('textarea');
    expect(textarea).toBeTruthy();
    fireEvent.change(textarea, { target: { value: JSON.stringify(invalidData) } });
    const restaurarButton = Array.from(dialog.querySelectorAll('button')).find(btn => btn.textContent.trim() === 'Restaurar');
    expect(restaurarButton).toBeTruthy();
    fireEvent.click(restaurarButton);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error de restauración',
      variant: 'destructive'
    }));
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 