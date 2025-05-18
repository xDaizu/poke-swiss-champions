import React, { useState } from 'react';
import { useAppContext } from '../../context/AppContext';
import { storageService } from '../../services/storageService'; 
import { useToast } from '../../hooks/use-toast';

export function DataExportImport() {
  const { participants, tournament, setParticipants, setTournament } = useAppContext();
  const [isImporting, setIsImporting] = useState(false);
  const { toast } = useToast();
  
  // Export tournament data as JSON file
  const handleExport = () => {
    try {
      const exportData = {
        participants,
        tournament,
        exportDate: new Date().toISOString(),
        version: '1.0'
      };
      
      const dataStr = JSON.stringify(exportData, null, 2);
      const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(dataStr)}`;
      
      // Create link and trigger download
      const exportName = `pokemon-tournament-export-${new Date().toISOString().slice(0,10)}.json`;
      const linkElement = document.createElement('a');
      linkElement.setAttribute('href', dataUri);
      linkElement.setAttribute('download', exportName);
      linkElement.click();
      
      toast({
        title: 'Exportación exitosa',
        description: 'Los datos del torneo han sido exportados correctamente.',
        variant: 'default'
      });
    } catch (error) {
      console.error('Error exporting data:', error);
      toast({
        title: 'Error de exportación',
        description: 'Ha ocurrido un error al exportar los datos.',
        variant: 'destructive'
      });
    }
  };
  
  // Import tournament data from JSON file
  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setIsImporting(true);
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const importData = JSON.parse(content);
        
        // Validate imported data
        if (!importData.participants || !importData.tournament) {
          throw new Error('Invalid import file format');
        }
        
        // Create backup before import
        storageService.createBackup();
        
        // Update state with imported data
        setParticipants(importData.participants);
        setTournament(importData.tournament);
        
        toast({
          title: 'Importación exitosa',
          description: 'Los datos del torneo han sido importados correctamente.',
          variant: 'default'
        });
      } catch (error) {
        console.error('Error importing data:', error);
        toast({
          title: 'Error de importación',
          description: 'Ha ocurrido un error al importar los datos. Asegúrese de que el archivo sea válido.',
          variant: 'destructive'
        });
      } finally {
        setIsImporting(false);
        // Reset the file input
        event.target.value = '';
      }
    };
    
    reader.onerror = () => {
      console.error('Error reading file');
      toast({
        title: 'Error de importación',
        description: 'Ha ocurrido un error al leer el archivo.',
        variant: 'destructive'
      });
      setIsImporting(false);
      // Reset the file input
      event.target.value = '';
    };
    
    reader.readAsText(file);
  };
  
  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div className="p-5">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h3 className="text-base font-medium text-gray-800">Exportar/Importar Datos</h3>
            <p className="text-sm text-gray-500">
              Exporta tus datos como archivo JSON o importa desde un archivo guardado
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm rounded-md bg-pokemon-green text-white font-medium hover:bg-green-700 transition shadow-sm"
            >
              Exportar Datos
            </button>
            
            <label className={`relative px-4 py-2 text-sm rounded-md font-medium transition shadow-sm ${
              isImporting
                ? "bg-gray-200 text-gray-500 cursor-not-allowed"
                : "bg-pokemon-blue text-white hover:bg-blue-700 cursor-pointer"
            }`}>
              {isImporting ? "Importando..." : "Importar Datos"}
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                disabled={isImporting}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
} 