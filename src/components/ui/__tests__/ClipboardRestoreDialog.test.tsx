import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ClipboardRestoreDialog } from '../ClipboardRestoreDialog';
import { storageService } from '../../../services/storageService';
import { useToast } from '../../../hooks/use-toast';
import { useAppContext } from '../../../context/AppContext';

// Mock dependencies
jest.mock('../../../services/storageService', () => ({
  storageService: {
    createBackup: jest.fn()
  }
}));

jest.mock('../../../hooks/use-toast', () => ({
  useToast: jest.fn()
}));

jest.mock('../../../context/AppContext', () => ({
  useAppContext: jest.fn()
}));

describe('ClipboardRestoreDialog', () => {
  const mockToast = { toast: jest.fn() };
  const mockSetParticipants = jest.fn();
  const mockSetTournament = jest.fn();
  const mockOnClose = jest.fn();
  
  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (useAppContext as jest.Mock).mockReturnValue({
      setParticipants: mockSetParticipants,
      setTournament: mockSetTournament
    });
  });

  test('renders nothing when isOpen is false', () => {
    const { container } = render(
      <ClipboardRestoreDialog isOpen={false} onClose={mockOnClose} />
    );
    expect(container).toBeEmptyDOMElement();
  });

  test('renders dialog when isOpen is true', () => {
    render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    
    expect(screen.getByText('Restaurar Backup del Portapapeles')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Pegue el JSON aquí...')).toBeInTheDocument();
    expect(screen.getByText('Cancelar')).toBeInTheDocument();
    expect(screen.getByText('Restaurar')).toBeInTheDocument();
  });

  test('calls onClose when Cancel button is clicked', () => {
    render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Cancelar'));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows error toast when submitting empty text', () => {
    render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    
    fireEvent.click(screen.getByText('Restaurar'));
    
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error',
      variant: 'destructive'
    }));
  });

  test('restores data from valid JSON', () => {
    const validData = {
      participants: [{ id: '1', name: 'Player 1', title: 'Champion', team: [] }],
      tournament: { rounds: 4, currentRound: 1, matches: [] }
    };
    
    render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    
    const textarea = screen.getByPlaceholderText('Pegue el JSON aquí...');
    fireEvent.change(textarea, { target: { value: JSON.stringify(validData) } });
    
    fireEvent.click(screen.getByText('Restaurar'));
    
    expect(storageService.createBackup).toHaveBeenCalledTimes(1);
    expect(mockSetParticipants).toHaveBeenCalledWith(validData.participants);
    expect(mockSetTournament).toHaveBeenCalledWith(validData.tournament);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Restauración exitosa'
    }));
    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  test('shows error toast on invalid JSON format', () => {
    render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    
    const textarea = screen.getByPlaceholderText('Pegue el JSON aquí...');
    fireEvent.change(textarea, { target: { value: '{invalid json' } });
    
    fireEvent.click(screen.getByText('Restaurar'));
    
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
    
    render(<ClipboardRestoreDialog isOpen={true} onClose={mockOnClose} />);
    
    const textarea = screen.getByPlaceholderText('Pegue el JSON aquí...');
    fireEvent.change(textarea, { target: { value: JSON.stringify(invalidData) } });
    
    fireEvent.click(screen.getByText('Restaurar'));
    
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: 'Error de restauración',
      variant: 'destructive'
    }));
    expect(mockOnClose).not.toHaveBeenCalled();
  });
}); 