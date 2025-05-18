import React from 'react';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { BackupManager } from '../BackupManager';
import { ClipboardRestoreDialog } from '../ClipboardRestoreDialog';
import { storageService } from '../../../services/storageService';
import { useToast } from '../../../hooks/use-toast';
import { useAppContext } from '../../../context/AppContext';
import '@testing-library/jest-dom';

// Mock dependencies
// @ts-ignore - We're intentionally mocking modules
jest.mock('../../../services/storageService', () => ({
  storageService: {
    getLastBackupTime: jest.fn().mockReturnValue(new Date('2023-01-01')),
    createBackup: jest.fn(),
    restoreFromBackup: jest.fn()
  }
}));

// @ts-ignore - We're intentionally mocking modules
jest.mock('../../../hooks/use-toast', () => ({
  useToast: jest.fn().mockReturnValue({
    toast: jest.fn()
  })
}));

// Create a wrapper component that includes both BackupManager and ClipboardRestoreDialog
// to test the integration between them
const ClipboardBackupTestWrapper = () => {
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  
  // Replace ClipboardRestoreDialog in BackupManager with direct manipulation of state
  // @ts-ignore - We're overriding the module for testing
  BackupManager.prototype.openRestoreDialog = () => setIsDialogOpen(true);
  // @ts-ignore - We're overriding the module for testing
  BackupManager.prototype.closeRestoreDialog = () => setIsDialogOpen(false);
  
  return (
    <>
      <BackupManager />
      {isDialogOpen && <ClipboardRestoreDialog isOpen={true} onClose={() => setIsDialogOpen(false)} />}
    </>
  );
};

// Mock data
const mockParticipants = [{ id: '1', name: 'Test Player', title: 'Champion', team: [] }];
const mockTournament = { rounds: 4, currentRound: 1, matches: [] };

// Mock clipboard API
const mockClipboardData = { data: '' };
const originalClipboard = { ...navigator.clipboard };
Object.assign(navigator, {
  clipboard: {
    writeText: jest.fn((text) => {
      mockClipboardData.data = text;
      return Promise.resolve();
    }),
    readText: jest.fn(() => Promise.resolve(mockClipboardData.data))
  }
});

// Mock AppContext
// @ts-ignore - We're intentionally mocking modules
jest.mock('../../../context/AppContext', () => ({
  useAppContext: jest.fn().mockReturnValue({
    participants: mockParticipants,
    tournament: mockTournament,
    setParticipants: jest.fn(),
    setTournament: jest.fn()
  })
}));

describe('Clipboard Backup Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockClipboardData.data = '';
  });
  
  afterAll(() => {
    // Restore original navigator.clipboard
    Object.assign(navigator, { clipboard: originalClipboard });
  });

  test('Full clipboard backup and restore flow', async () => {
    render(<ClipboardBackupTestWrapper />);
    
    // Step 1: Copy to clipboard
    fireEvent.click(screen.getByText('Copiar backup al portapapeles'));
    
    // Wait for clipboard write to complete
    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalled();
    });
    
    // Verify data was copied to clipboard
    const clipboardData = JSON.parse(mockClipboardData.data);
    expect(clipboardData).toHaveProperty('participants');
    expect(clipboardData).toHaveProperty('tournament');
    
    // Step 2: Open restore dialog
    fireEvent.click(screen.getByText('Restaurar backup del portapapeles'));
    
    // Check that dialog is open
    expect(screen.getByText('Restaurar Backup del Portapapeles')).toBeInTheDocument();
    
    // Step 3: Paste data and restore
    const textarea = screen.getByPlaceholderText('Pegue el JSON aquí...');
    fireEvent.change(textarea, {
      target: { value: mockClipboardData.data }
    });
    
    // Step 4: Submit the form
    fireEvent.click(screen.getByText('Restaurar'));
    
    // Verify backup was created before import
    expect(storageService.createBackup).toHaveBeenCalled();
    
    // Verify data was set correctly
    const { setParticipants, setTournament } = useAppContext();
    expect(setParticipants).toHaveBeenCalledWith(mockParticipants);
    expect(setTournament).toHaveBeenCalledWith(mockTournament);
  });
}); 