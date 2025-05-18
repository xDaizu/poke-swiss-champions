import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BackupManager } from '../BackupManager';
import { storageService } from '../../../services/storageService';
import { useToast } from '../../../hooks/use-toast';
import { useAppContext } from '../../../context/AppContext';

// Mock dependencies
jest.mock('../../../services/storageService', () => ({
  storageService: {
    getLastBackupTime: jest.fn(),
    createBackup: jest.fn(),
    restoreFromBackup: jest.fn()
  }
}));

jest.mock('../../../hooks/use-toast', () => ({
  useToast: jest.fn()
}));

jest.mock('../../../context/AppContext', () => ({
  useAppContext: jest.fn()
}));

jest.mock('../ClipboardRestoreDialog', () => ({
  ClipboardRestoreDialog: ({ isOpen, onClose }) => 
    isOpen ? <div data-testid="mock-dialog">Restore Dialog <button onClick={onClose}>Close</button></div> : null
}));

// Mock navigator.clipboard
const mockClipboard = {
  writeText: jest.fn(() => Promise.resolve())
};
Object.assign(navigator, {
  clipboard: mockClipboard
});

describe('BackupManager', () => {
  const mockToast = { toast: jest.fn() };
  const mockParticipants = [{ id: '1', name: 'Test', title: 'Champion', team: [] }];
  const mockTournament = { rounds: 4, currentRound: 1, matches: [] };
  const mockLastBackup = new Date('2023-01-01T12:00:00');

  beforeEach(() => {
    jest.clearAllMocks();
    (useToast as jest.Mock).mockReturnValue(mockToast);
    (useAppContext as jest.Mock).mockReturnValue({ 
      participants: mockParticipants, 
      tournament: mockTournament 
    });
    (storageService.getLastBackupTime as jest.Mock).mockReturnValue(mockLastBackup);
  });

  test('renders with last backup time', () => {
    render(<BackupManager />);
    expect(screen.getByText(/Last backup:/)).toBeInTheDocument();
    expect(screen.getByText(/Copiar backup al portapapeles/)).toBeInTheDocument();
    expect(screen.getByText(/Restaurar backup del portapapeles/)).toBeInTheDocument();
  });
  
  test('creates a backup when the create button is clicked', () => {
    render(<BackupManager />);
    fireEvent.click(screen.getByText('Create Backup'));
    
    expect(storageService.createBackup).toHaveBeenCalledTimes(1);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Backup created"
    }));
  });
  
  test('restores a backup when the restore button is clicked', () => {
    (storageService.restoreFromBackup as jest.Mock).mockReturnValue(true);
    
    render(<BackupManager />);
    fireEvent.click(screen.getByText('Restore Backup'));
    
    expect(storageService.restoreFromBackup).toHaveBeenCalledTimes(1);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Backup restored"
    }));
  });

  test('copies data to clipboard when copy button is clicked', async () => {
    render(<BackupManager />);
    fireEvent.click(screen.getByText('Copiar backup al portapapeles'));
    
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      
      // Verify the JSON string passed to clipboard contains the correct data
      const clipboardData = JSON.parse(mockClipboard.writeText.mock.calls[0][0]);
      expect(clipboardData).toHaveProperty('participants', mockParticipants);
      expect(clipboardData).toHaveProperty('tournament', mockTournament);
      expect(clipboardData).toHaveProperty('version', '1.0');
      expect(clipboardData).toHaveProperty('exportDate');
    });
    
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Backup copiado"
    }));
  });
  
  test('handles clipboard copy failure', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
    
    render(<BackupManager />);
    fireEvent.click(screen.getByText('Copiar backup al portapapeles'));
    
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error al copiar",
        variant: "destructive"
      }));
    });
  });
  
  test('opens the restore dialog when the restore from clipboard button is clicked', () => {
    render(<BackupManager />);
    fireEvent.click(screen.getByText('Restaurar backup del portapapeles'));
    
    expect(screen.getByTestId('mock-dialog')).toBeInTheDocument();
  });
  
  test('closes the restore dialog', () => {
    render(<BackupManager />);
    fireEvent.click(screen.getByText('Restaurar backup del portapapeles'));
    fireEvent.click(screen.getByText('Close'));
    
    expect(screen.queryByTestId('mock-dialog')).not.toBeInTheDocument();
  });
}); 