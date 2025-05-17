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

export default function ParticipantsPage() {
  const { participants, addParticipant, editParticipant, removeParticipant, addParticipantsFromCsv } = useAppContext();
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
    if (confirm('Are you sure you want to remove this participant?')) {
      removeParticipant(id);
      toast.success('Participant removed successfully');
    }
  };

  const handleFormSubmit = (participant: Participant) => {
    if (editingParticipant) {
      editParticipant(participant);
      toast.success('Participant updated successfully');
    } else {
      addParticipant(participant);
      toast.success('Participant added successfully');
    }
    setIsFormOpen(false);
  };

  const handleFormCancel = () => {
    setIsFormOpen(false);
  };

  const handleImportCsv = async () => {
    if (!csvData.trim()) {
      toast.error('Please enter CSV data');
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
          description: 'Please correct the issues and try again'
        });
        return;
      }

      // Process successful imports
      if (result.count > 0) {
        // Add participants to context
        for (const participant of result.participants) {
          addParticipant(participant);
        }
        
        toast.success(`Successfully imported ${result.count} participants`);
        setCsvData('');
        setIsCsvImportOpen(false);
      } else {
        toast.error('No valid participants found in CSV data');
      }
    } catch (error: any) {
      console.error('Import error:', error);
      toast.error(error.message || 'Failed to import participants', {
        duration: 8000,
        description: 'Please check the CSV format and try again'
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Tournament Participants</h2>
        <div className="space-x-2">
          <Button onClick={() => setIsCsvImportOpen(true)} variant="outline">
            <Import className="mr-2 h-4 w-4" /> Import CSV
          </Button>
          <Button onClick={handleAddClick}>
            <Plus className="mr-2 h-4 w-4" /> Add Participant
          </Button>
        </div>
      </div>

      {participants.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No participants yet</p>
          <p className="text-gray-400">Add participants to start the tournament</p>
          <div className="flex justify-center space-x-4 mt-4">
            <Button onClick={() => setIsCsvImportOpen(true)} variant="outline">
              <Import className="mr-2 h-4 w-4" /> Import CSV
            </Button>
            <Button onClick={handleAddClick}>
              <Plus className="mr-2 h-4 w-4" /> Add Participant
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
              {editingParticipant ? 'Edit Participant' : 'Add New Participant'}
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
            <DialogTitle>Import Participants from CSV</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-600">
              Enter participant data in CSV format (one per line):
              <br />
              <code className="bg-gray-100 p-1 rounded">Name, Title, Pokemon1, Pokemon2, ...</code>
            </p>
            
            <div className="space-y-2">
              <Textarea
                value={csvData}
                onChange={(e) => setCsvData(e.target.value)}
                placeholder="John Doe, Master Chef, Charizard, Blastoise, Venusaur"
                rows={10}
                className="font-mono"
              />
              <p className="text-xs text-gray-500">
                Example: <code>John Doe, Master Chef, Charizard, Blastoise, Venusaur</code>
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
                Import as complete list (delete all existing participants before import)
              </label>
            </div>
          </div>
          
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsCsvImportOpen(false)}>Cancel</Button>
            <Button onClick={handleImportCsv} disabled={isImporting || !csvData.trim()}>
              {isImporting ? "Importing..." : "Import Participants"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
