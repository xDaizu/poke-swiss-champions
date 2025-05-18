import React, { useState, useEffect } from 'react';
import { storageService } from '../../services/storageService';
import { useToast } from '../../hooks/use-toast';
import { useAppContext } from '../../context/AppContext';
import { ClipboardRestoreDialog } from './ClipboardRestoreDialog';

export function BackupManager() {
  const { toast } = useToast();
  const { participants, tournament } = useAppContext();
  const [lastBackup, setLastBackup] = useState<Date | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [isCopying, setIsCopying] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    // Update last backup time
    const updateLastBackupTime = () => {
      setLastBackup(storageService.getLastBackupTime());
    };

    updateLastBackupTime();
    
    // Check for backup time every minute
    const interval = setInterval(updateLastBackupTime, 60000);
    
    return () => clearInterval(interval);
  }, []);

  const handleCreateBackup = () => {
    try {
      storageService.createBackup();
      setLastBackup(storageService.getLastBackupTime());
      toast({
        title: "Backup created",
        description: "Tournament data has been backed up successfully.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error creating backup:", error);
      toast({
        title: "Backup failed",
        description: "There was an error creating the backup. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleRestoreBackup = () => {
    setIsRestoring(true);
    try {
      const restored = storageService.restoreFromBackup();
      if (restored) {
        toast({
          title: "Backup restored",
          description: "Tournament data has been restored successfully. Refresh the page to see changes.",
          variant: "default"
        });
      } else {
        toast({
          title: "Restore failed",
          description: "No backup found or backup is corrupted.",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error("Error restoring backup:", error);
      toast({
        title: "Restore failed",
        description: "There was an error restoring from backup.",
        variant: "destructive"
      });
    } finally {
      setIsRestoring(false);
    }
  };

  const handleCopyToClipboard = async () => {
    setIsCopying(true);
    try {
      const exportData = {
        participants,
        tournament,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      
      // Use Clipboard API to copy to clipboard
      await navigator.clipboard.writeText(dataStr);
      
      toast({
        title: "Backup copiado",
        description: "Los datos han sido copiados al portapapeles.",
        variant: "default"
      });
    } catch (error) {
      console.error("Error copying to clipboard:", error);
      toast({
        title: "Error al copiar",
        description: "No se pudo copiar al portapapeles. Intente nuevamente.",
        variant: "destructive"
      });
    } finally {
      setIsCopying(false);
    }
  };

  const openRestoreDialog = () => {
    setIsDialogOpen(true);
  };

  const closeRestoreDialog = () => {
    setIsDialogOpen(false);
  };

  return (
    <>
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-5 space-y-5">
          {/* System Backups Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b">
            <div>
              <h3 className="text-base font-medium text-gray-800">Backups del Sistema</h3>
              <p className="text-sm text-gray-500">
                {lastBackup 
                  ? `Último backup: ${lastBackup.toLocaleString()}`
                  : "No hay backups creados aún"}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCreateBackup}
                className="px-4 py-2 text-sm rounded-md bg-pokemon-yellow text-pokemon-dark font-medium hover:bg-yellow-400 transition shadow-sm"
              >
                Crear Backup
              </button>
              <button
                onClick={handleRestoreBackup}
                disabled={isRestoring || !lastBackup}
                className={`px-4 py-2 text-sm rounded-md font-medium transition shadow-sm ${
                  isRestoring || !lastBackup
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-pokemon-blue text-white hover:bg-blue-700"
                }`}
              >
                {isRestoring ? "Restaurando..." : "Restaurar Backup"}
              </button>
            </div>
          </div>
          
          {/* Clipboard Backups Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-medium text-gray-800">Backups del Portapapeles</h3>
              <p className="text-sm text-gray-500">
                Copia o restaura datos utilizando el portapapeles
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={handleCopyToClipboard}
                disabled={isCopying}
                className={`px-4 py-2 text-sm rounded-md font-medium transition shadow-sm ${
                  isCopying
                    ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                    : "bg-pokemon-yellow text-pokemon-dark hover:bg-yellow-400"
                }`}
              >
                {isCopying ? "Copiando..." : "Copiar al portapapeles"}
              </button>
              <button
                onClick={openRestoreDialog}
                className="px-4 py-2 text-sm rounded-md bg-pokemon-blue text-white font-medium hover:bg-blue-700 transition shadow-sm"
              >
                Restaurar del portapapeles
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <ClipboardRestoreDialog 
        isOpen={isDialogOpen} 
        onClose={closeRestoreDialog} 
      />
    </>
  );
} 