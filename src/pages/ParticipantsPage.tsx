import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import ParticipantForm from '../components/ParticipantForm';
import { Participant } from '../types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';
import { Plus, Edit, Trash, Import } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { CsvImporter } from '@/services/csvImporter';
import { searchPokemon } from '@/services/pokemonService';
import participantsCsv from '../data/participants.csv?raw';

export default function ParticipantsPage() {
  const { participants, addParticipant, editParticipant, removeParticipant, addParticipantsFromCsv, setTournament } = useAppContext();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingParticipant, setEditingParticipant] = useState<Participant | undefined>(undefined);
  const [isCsvImportOpen, setIsCsvImportOpen] = useState(false);
  const [csvData, setCsvData] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importCompleteList, setImportCompleteList] = useState(false);

  const handleAddClick = () => {
    setEditingParticipant(undefined);
    setIsFormOpen(true);
  };

  const handleEditClick = (participant: Participant) => {
    setEditingParticipant(participant);
    setIsFormOpen(true);
  };

  const handleRemoveClick = (id: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este participante?')) {
      removeParticipant(id);
      toast.success('Participante eliminado correctamente');
    }
  };

  const handleFormSubmit = (participant: Participant) => {
    if (editingParticipant) {
      editParticipant(participant);
      toast.success('Participante actualizado correctamente');
    } else {
      addParticipant(participant);
      toast.success('Participante agregado correctamente');
    }
    setIsFormOpen(false);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
  };

  const handleImportCsv = async () => {
    if (!csvData.trim()) {
      toast.error('Por favor, ingresa datos CSV');
      return;
    }
    
    setIsImporting(true);
    try {
      if (importCompleteList) {
        // Remove all participants before importing
        participants.forEach((p) => removeParticipant(p.id));
      }

      // Use the CsvImporter directly for better error reporting
      const importer = new CsvImporter(searchPokemon);
      const result = await importer.importFromCsv(csvData);

      // Display warnings if any
      if (result.warnings?.length) {
        result.warnings.forEach(warning => {
          toast.warning(warning);
        });
      }

      // Handle errors
      if (result.error) {
        toast.error(result.error, {
          duration: 8000, // Show longer for detailed errors
          description: 'Por favor, corrige los errores e inténtalo de nuevo'
        });
        return;
      }

      // Process successful imports
      if (result.count > 0) {
        // Add participants to context
        for (const participant of result.participants) {
          addParticipant(participant);
        }
        
        toast.success(`Se importaron correctamente ${result.count} participantes`);
        setCsvData('');
        setIsCsvImportOpen(false);
      } else {
        toast.error('No se encontraron participantes válidos en los datos CSV');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Error al importar participantes', {
        duration: 8000,
        description: 'Por favor, revisa el formato CSV e inténtalo de nuevo'
      });
    } finally {
      setIsImporting(false);
    }
  };

  // Handler for importing default data
  const handleImportDefault = async () => {
    if (!window.confirm('Esto eliminará todos los participantes y datos del torneo actuales y los reemplazará con los datos por defecto. ¿Continuar?')) return;
    // Remove all participants
    participants.forEach((p) => removeParticipant(p.id));
    // Clear tournament data
    setTournament({
      rounds: 4,
      matches: [],
      currentRound: 1
    });
    // Import from CSV
    try {
      const count = await addParticipantsFromCsv(participantsCsv);
      toast.success(`Se importaron ${count} participantes por defecto.`);
    } catch (error) {
      toast.error('Error al importar los datos por defecto');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Participantes del Torneo</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsCsvImportOpen(true)} variant="outline">
            <Import className="mr-2 h-4 w-4" /> Importar CSV
          </Button>
          <Button onClick={handleImportDefault} variant="destructive">
            Importar datos torneo KYL
          </Button>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" /> Agregar Participante
          </Button>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">Aún no hay participantes</p>
          <p className="text-gray-400">Agrega participantes para comenzar el torneo</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={() => setIsCsvImportOpen(true)} variant="outline">
              <Import className="mr-2 h-4 w-4" /> Importar CSV
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Agregar Participante
            </Button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {participants.map((participant) => (
            <Card key={participant.id} className="pokemon-card">
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle>{participant.name}</CardTitle>
                    <p className="text-sm text-gray-500">{participant.title}</p>
                    <div className="flex items-center mt-2">
                      <Avatar>
                        <AvatarImage src={participant.profileImage} alt={participant.name} onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://ui-avatars.com/api/?name=Trainer&background=random&rounded=true';
                        }} />
                        <AvatarFallback>?</AvatarFallback>
                      </Avatar>
                    </div>
                  </div>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" onClick={() => handleEditClick(participant)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleRemoveClick(participant.id)}>
                      <Trash className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-2">
                  {participant.team.map((pokemon, index) => (
                    <div key={`${pokemon.id}-${index}`} className="text-center">
                      <img
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        className="w-12 h-12 mx-auto"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
                        }}
                      />
                      <p className="text-xs mt-1 truncate">{pokemon.name}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingParticipant ? 'Editar Participante' : 'Agregar Nuevo Participante'}
            </DialogTitle>
          </DialogHeader>
          <ParticipantForm
            participant={editingParticipant}
            onSubmit={handleFormSubmit}
            onCancel={handleFormCancel}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isCsvImportOpen} onOpenChange={setIsCsvImportOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Importar Participantes desde CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Ingresa los datos de los participantes en formato CSV (uno por línea):
              <br />
              <code className="bg-gray-100 p-1 rounded">Nombre, Título, Pokemon1, Pokemon2, ...</code>
            </p>
            
            <div className="space-y-2">
              <Textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="Juan Pérez, Maestro Chef, Charizard, Blastoise, Venusaur"
                rows={10}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Ejemplo: <code>Juan Pérez, Maestro Chef, Charizard, Blastoise, Venusaur</code>
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <input
                id="import-complete-list"
                type="checkbox"
                checked={importCompleteList}
                onChange={(e) => setImportCompleteList(e.target.checked)}
              />
              <label htmlFor="import-complete-list" className="text-sm">
                Importar como lista completa (eliminar todos los participantes existentes antes de importar)
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCsvImportOpen(false)}>Cancelar</Button>
            <Button onClick={handleImportCsv} disabled={isImporting || !csvData.trim()}>
              {isImporting ? "Importando..." : "Importar Participantes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
