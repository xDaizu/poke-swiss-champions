import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { storageService } from '../../services/storageService';
import { useToast } from '../../hooks/use-toast';

interface ClipboardRestoreDialogProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ClipboardRestoreDialog({ isOpen, onClose }: ClipboardRestoreDialogProps) {
  const [jsonText, setJsonText] = useState('');
  const [isRestoring, setIsRestoring] = useState(false);
  const { setParticipants, setTournament } = useAppContext();
  const { toast } = useToast();

  const handleRestore = () => {
    if (!jsonText.trim()) {
      toast({
        title: "Error",
        description: "Por favor, pegue un JSON válido",
        variant: "destructive"
      });
      return;
    }

    setIsRestoring(true);
    try {
      const data = JSON.parse(jsonText);
      
      // Validate imported data
      if (!data.participants || !data.tournament) {
        throw new Error('Formato de JSON inválido');
      }
      
      // Create backup before import
      storageService.createBackup();
      
      // Update state with imported data
      setParticipants(data.participants);
      setTournament(data.tournament);
      
      toast({
        title: 'Backup restaurado',
        description: 'Los datos del torneo han sido restaurados correctamente.',
        variant: 'default'
      });
      
      // Close dialog
      onClose();
    } catch (error) {
      console.error('Error restoring data from clipboard:', error);
      toast({
        title: 'Error de restauración',
        description: 'Ha ocurrido un error al procesar el JSON. Asegúrese de que el formato es correcto.',
        variant: 'destructive'
      });
    } finally {
      setIsRestoring(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-6 w-full max-w-lg mx-4">
        <h2 className="text-xl font-semibold mb-4">Restaurar Backup del Portapapeles</h2>
        
        <p className="text-sm text-gray-600 mb-4">
          Pegue el JSON de backup en el campo de texto a continuación.
        </p>
        
        <textarea 
          className="w-full h-60 p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-pokemon-blue mb-4 font-mono text-sm"
          placeholder="Pegue el JSON aquí..."
          value={jsonText}
          onChange={(e) => setJsonText(e.target.value)}
        />
        
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm border border-gray-300 rounded-md hover:bg-gray-100"
          >
            Cancelar
          </button>
          <button
            onClick={handleRestore}
            disabled={isRestoring || !jsonText.trim()}
            className={`px-4 py-2 text-sm rounded-md font-medium ${
              isRestoring || !jsonText.trim()
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-pokemon-blue text-white hover:bg-blue-700"
            }`}
          >
            {isRestoring ? "Restaurando..." : "Restaurar"}
          </button>
        </div>
      </div>
    </div>
  );
} 