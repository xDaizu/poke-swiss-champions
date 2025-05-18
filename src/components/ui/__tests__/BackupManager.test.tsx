import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, test, expect, beforeEach } from 'vitest';
import { BackupManager } from '../BackupManager';
import { storageService } from '../../../services/storageService';
import { useToast } from '../../../hooks/use-toast';
import { useAppContext } from '../../../context/AppContext';

// Mock dependencies
vi.mock('../../../services/storageService', () => ({
  storageService: {
    getLastBackupTime: vi.fn(),
    createBackup: vi.fn(),
    restoreFromBackup: vi.fn()
  }
}));

vi.mock('../../../hooks/use-toast', () => ({
  useToast: vi.fn()
}));

vi.mock('../../../context/AppContext', () => ({
  useAppContext: vi.fn()
}));

vi.mock('../ClipboardRestoreDialog', () => ({
  ClipboardRestoreDialog: ({ isOpen, onClose }) => 
    isOpen ? <div data-testid="mock-dialog">Restore Dialog <button onClick={onClose}>Close</button></div> : null
}));

// Mock navigator.clipboard
const mockClipboard = {
  writeText: vi.fn(() => Promise.resolve())
};

describe('BackupManager', () => {
  const mockToast = { toast: vi.fn() };
  const mockParticipants = [{ id: '1', name: 'Test', title: 'Champion', team: [] }];
  const mockTournament = { rounds: 4, currentRound: 1, matches: [] };
  const mockLastBackup = new Date('2023-01-01T12:00:00');

  beforeEach(() => {
    vi.clearAllMocks();
    (useToast as ReturnType<typeof vi.fn>).mockReturnValue(mockToast);
    (useAppContext as ReturnType<typeof vi.fn>).mockReturnValue({ 
      participants: mockParticipants, 
      tournament: mockTournament 
    });
    (storageService.getLastBackupTime as ReturnType<typeof vi.fn>).mockReturnValue(mockLastBackup);
    // Ensure clipboard is mocked for every test
    Object.assign(global.navigator, { clipboard: mockClipboard });
  });

  test('renders with last backup time', () => {
    const { container } = render(<BackupManager />);
    // Backup label
    const backupLabel = container.querySelector('p.text-sm.text-gray-500');
    expect(backupLabel).toBeTruthy();
    expect(backupLabel?.textContent).toContain('Último backup:');
    // Button: Crear Backup
    const crearButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Crear Backup');
    expect(crearButton).toBeTruthy();
    // Button: Restaurar Backup
    const restaurarButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Restaurar Backup');
    expect(restaurarButton).toBeTruthy();
    // Button: Copiar al portapapeles
    const copiarButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Copiar al portapapeles');
    expect(copiarButton).toBeTruthy();
    // Button: Restaurar del portapapeles
    const restaurarPortapapelesButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Restaurar del portapapeles');
    expect(restaurarPortapapelesButton).toBeTruthy();
  });
  
  test('creates a backup when the create button is clicked', () => {
    const { container } = render(<BackupManager />);
    const crearButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Crear Backup');
    expect(crearButton).toBeTruthy();
    if (crearButton) fireEvent.click(crearButton);
    expect(storageService.createBackup).toHaveBeenCalledTimes(1);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Backup created"
    }));
  });
  
  test('restores a backup when the restore button is clicked', () => {
    (storageService.restoreFromBackup as ReturnType<typeof vi.fn>).mockReturnValue(true);
    const { container } = render(<BackupManager />);
    const restaurarButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Restaurar Backup');
    expect(restaurarButton).toBeTruthy();
    if (restaurarButton) fireEvent.click(restaurarButton);
    expect(storageService.restoreFromBackup).toHaveBeenCalledTimes(1);
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Backup restored"
    }));
  });

  test('copies data to clipboard when copy button is clicked', async () => {
    const { container } = render(<BackupManager />);
    const copiarButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Copiar al portapapeles');
    expect(copiarButton).toBeTruthy();
    if (copiarButton) fireEvent.click(copiarButton);
    await waitFor(() => {
      expect(mockClipboard.writeText).toHaveBeenCalledTimes(1);
      // Verify the JSON string passed to clipboard contains the correct data
      const writeTextMock = mockClipboard.writeText as unknown as { mock: { calls: any[][] } };
      if (Array.isArray(writeTextMock.mock.calls) && writeTextMock.mock.calls.length > 0) {
        const clipboardData = JSON.parse(writeTextMock.mock.calls[0][0]);
        expect(clipboardData).toHaveProperty('participants', mockParticipants);
        expect(clipboardData).toHaveProperty('tournament', mockTournament);
        expect(clipboardData).toHaveProperty('version', '1.0');
        expect(clipboardData).toHaveProperty('exportDate');
      }
    });
    expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Backup copiado"
    }));
  });
  
  test('handles clipboard copy failure', async () => {
    mockClipboard.writeText.mockRejectedValueOnce(new Error('Clipboard error'));
    const { container } = render(<BackupManager />);
    const copiarButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Copiar al portapapeles');
    expect(copiarButton).toBeTruthy();
    if (copiarButton) fireEvent.click(copiarButton);
    await waitFor(() => {
      expect(mockToast.toast).toHaveBeenCalledWith(expect.objectContaining({
        title: "Error al copiar",
        variant: "destructive"
      }));
    });
  });
  
  test('opens the restore dialog when the restore from clipboard button is clicked', async () => {
    const { container } = render(<BackupManager />);
    const restaurarPortapapelesButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Restaurar del portapapeles');
    expect(restaurarPortapapelesButton).toBeTruthy();
    if (restaurarPortapapelesButton) fireEvent.click(restaurarPortapapelesButton);
    await waitFor(() => {
      expect(document.querySelector('[data-testid="mock-dialog"]')).toBeTruthy();
    });
  });
  
  test('closes the restore dialog', async () => {
    const { container } = render(<BackupManager />);
    const restaurarPortapapelesButton = Array.from(container.querySelectorAll('button')).find(el => el.textContent === 'Restaurar del portapapeles');
    expect(restaurarPortapapelesButton).toBeTruthy();
    if (restaurarPortapapelesButton) fireEvent.click(restaurarPortapapelesButton);
    // Wait for dialog to appear
    await waitFor(() => {
      expect(document.querySelector('[data-testid="mock-dialog"]')).toBeTruthy();
    });
    // Find the Close button robustly
    const closeButton = Array.from(document.querySelectorAll('button')).find(el => el.textContent === 'Close');
    expect(closeButton).toBeTruthy();
    if (closeButton) fireEvent.click(closeButton);
    await waitFor(() => {
      expect(document.querySelector('[data-testid="mock-dialog"]')).toBeFalsy();
    });
  });
}); 