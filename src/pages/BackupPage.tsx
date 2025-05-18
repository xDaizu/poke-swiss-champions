import React from 'react';
import { BackupManager } from '../components/ui/BackupManager';
import { DataExportImport } from '../components/ui/DataExportImport';

export default function BackupPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold mb-2">Gestión de Backups</h1>
        <p className="text-gray-600">
          Crea, restaura y gestiona los backups de tu torneo para evitar pérdida de datos.
        </p>
      </div>

      <div className="grid gap-6">
        <div>
          <h2 className="text-lg font-semibold mb-3">Backups Automáticos</h2>
          <p className="text-sm text-gray-500 mb-4">
            El sistema crea backups automáticos cada 30 minutos y antes de operaciones importantes.
          </p>
          <BackupManager />
        </div>

        <div>
          <h2 className="text-lg font-semibold mb-3">Exportar/Importar Backups</h2>
          <p className="text-sm text-gray-500 mb-4">
            Exporta tus backups a un archivo JSON o impórtalos desde un archivo previamente guardado.
          </p>
          <DataExportImport />
        </div>
        
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
          <h2 className="text-lg font-semibold mb-2 text-blue-700">Consejos para backups</h2>
          <ul className="list-disc pl-5 text-sm text-blue-800 space-y-1">
            <li>Realiza backups manuales antes de hacer cambios importantes</li>
            <li>Exporta los backups y guárdalos en un lugar seguro periódicamente</li>
            <li>Utiliza la función de portapapeles para transferir rápidamente backups entre dispositivos</li>
            <li>Si experimentas problemas, restaura desde el backup más reciente</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 