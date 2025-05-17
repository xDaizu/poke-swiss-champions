import { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import MatchCard from '../components/MatchCard';
import { Button } from '@/components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { ChevronLeft, ChevronRight, Plus, X } from 'lucide-react';
import { Participant } from '../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PairingService } from '../services/pairingService';
import ROUND_COLORS from '../lib/roundColors';

export default function TournamentPage() {
  const { 
    participants, 
    tournament, 
    setRounds, 
    startTournament,
    createCustomMatch,
    removeMatch,
    havePlayed,
    getStandings,
    getCurrentRound,
    toggleMatchPublic
  } = useAppContext();
  
  const [customRounds, setCustomRounds] = useState(tournament.rounds.toString());
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [selectedRoundForMatch, setSelectedRoundForMatch] = useState<number>(1);
  const [participant1Id, setParticipant1Id] = useState<string>('');
  const [participant2Id, setParticipant2Id] = useState<string>('');
  
  const handleStartTournament = () => {
    if (participants.length < 2) {
      toast.error('Necesitas al menos 2 participantes para iniciar un torneo');
      return;
    }
    
    startTournament();
    toast.success('Torneo iniciado correctamente');
  };
  
  const handleRoundsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setCustomRounds(value);
    
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setRounds(numValue);
    }
  };

  const openAddMatchDialog = (roundNumber: number) => {
    setSelectedRoundForMatch(roundNumber);
    setParticipant1Id('');
    setParticipant2Id('');
    setIsMatchDialogOpen(true);
  };

  const handleAddMatch = () => {
    if (!participant1Id) {
      toast.error('Por favor, selecciona el primer participante');
      return;
    }

    // Validate participant selection
    createCustomMatch(selectedRoundForMatch, participant1Id, participant2Id || null);
    setIsMatchDialogOpen(false);
    setParticipant1Id('');
    setParticipant2Id('');
    toast.success('Combate agregado correctamente');
  };

  const handleRemoveMatch = (matchId: string) => {
    if (confirm('¿Estás seguro de que deseas eliminar este combate?')) {
      removeMatch(matchId);
      toast.success('Combate eliminado correctamente');
    }
  };

  // Get participants who aren't already fighting in the selected round
  const getAvailableParticipantsForRound = (round: number, excludeParticipantId: string | null = null) => {
    const matchesInRound = tournament.matches.filter(m => m.round === round);
    const participantsInRound = new Set<string>();
    
    matchesInRound.forEach(match => {
      if (match.participant1Id) participantsInRound.add(match.participant1Id);
      if (match.participant2Id) participantsInRound.add(match.participant2Id);
    });
    
    return participants.filter(p => 
      !participantsInRound.has(p.id) || 
      (excludeParticipantId && p.id === excludeParticipantId)
    );
  };

  // Automatic pairing for a round
  const handleAutoPairRound = (roundNumber: number) => {
    const pairs = PairingService.autoPairRound(
      participants,
      tournament.matches,
      roundNumber,
      getStandings,
      havePlayed
    );
    pairs.forEach(([p1, p2]) => {
      createCustomMatch(roundNumber, p1, p2);
    });
    toast.success(`Se crearon ${pairs.length} combates automáticamente para la ronda ${roundNumber}`);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Gestión del Torneo</h2>
      
      <Card className="!p-2">
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Configuración del Torneo</CardTitle>
          <CardDescription className="text-xs">
            Configura los parámetros del torneo antes de comenzar
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex flex-row items-center gap-2 overflow-x-auto">
            <div className="w-1/3 min-w-0">
              <Label htmlFor="rounds" className="text-xs">Número de Rondas</Label>
              <Input
                id="rounds"
                type="number"
                min="1"
                value={customRounds}
                onChange={handleRoundsChange}
                className="mt-1 text-xs py-1 px-2 h-8"
              />
            </div>
            <div className="w-1/3 min-w-0">
              <Label className="text-xs">Participantes</Label>
              <div className="mt-1 p-1 bg-gray-50 rounded border text-xs">
                <span className="font-medium">{participants.length}</span> participantes registrados
              </div>
            </div>
            <div className="w-1/3 min-w-0">
              <Label className="text-xs">Estado del Torneo</Label>
              <div className="mt-1 p-1 bg-gray-50 rounded border text-xs">
                {getCurrentRound() === 0
                  ? "No iniciado"
                  : `Rondas completas: ${getCurrentRound()} de ${tournament.rounds}`}
              </div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="pt-2">
          <Button 
            onClick={handleStartTournament}
            disabled={participants.length < 2}
            size="sm"
          >
            {getCurrentRound() === 0 ? "Iniciar Torneo" : "Reiniciar Torneo"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-8">
        <h3 className="text-xl font-bold">Rondas del Torneo</h3>
        
        {Array.from({ length: tournament.rounds || 4 }).map((_, index) => {
          const roundNumber = index + 1;
          const roundMatches = tournament.matches.filter(m => m.round === roundNumber);
          const roundActive = getCurrentRound() >= roundNumber;
          const roundColor = ROUND_COLORS[index % ROUND_COLORS.length];
          const hasHidden = roundMatches.some(m => !m.public);
          
          return (
            <Card key={roundNumber} className={`${roundColor} border-2 ${roundActive ? 'border-pokemon-red' : 'border-gray-200'}`}>
              <CardHeader className="pb-2 flex flex-row items-center justify-between">
                <CardTitle>Ronda {roundNumber}</CardTitle>
                <div className="flex gap-2">
                  {hasHidden && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        roundMatches.forEach(m => {
                          if (!m.public) toggleMatchPublic(m.id);
                        });
                      }}
                    >
                      Hacer todos visibles
                    </Button>
                  )}
                  <Button 
                    onClick={() => openAddMatchDialog(roundNumber)}
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Agregar Combate
                  </Button>
                  <Button
                    onClick={() => handleAutoPairRound(roundNumber)}
                    size="sm"
                    variant="secondary"
                  >
                    Emparejar Automáticamente
                  </Button>
                </div>
              </CardHeader>
              
              <CardContent>
                {roundMatches.length === 0 ? (
                  <div className="text-center py-8 bg-white/50 rounded-md">
                    <p className="text-gray-500">Aún no hay combates para esta ronda</p>
                    <Button 
                      onClick={() => openAddMatchDialog(roundNumber)}
                      size="sm"
                      variant="outline"
                      className="bg-white hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Agregar Combate
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {roundMatches.map(match => (
                      <div key={match.id} className="relative">
                        <Button 
                          variant="ghost" 
                          size="icon"
                          className="absolute -right-2 -top-2 h-6 w-6 rounded-full bg-gray-200 hover:bg-gray-300 p-1"
                          onClick={() => handleRemoveMatch(match.id)}
                        >
                          <X size={12} />
                        </Button>
                        <MatchCard key={match.id} match={match} />
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
      
      <Dialog open={isMatchDialogOpen} onOpenChange={setIsMatchDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar Combate para Ronda {selectedRoundForMatch}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="participant1">Participante 1 (Requerido)</Label>
              <Select 
                value={participant1Id} 
                onValueChange={(value) => {
                  setParticipant1Id(value);
                  // Reset participant2 if they selected the same participant
                  if (value === participant2Id) {
                    setParticipant2Id('');
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona participante 1" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableParticipantsForRound(selectedRoundForMatch).map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.name} ({p.title})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label htmlFor="participant2">Participante 2 (Opcional, dejar vacío para BYE)</Label>
              <Select 
                value={participant2Id} 
                onValueChange={setParticipant2Id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona participante 2 (opcional)" />
                </SelectTrigger>
                <SelectContent>
                  {getAvailableParticipantsForRound(selectedRoundForMatch, participant1Id)
                    .filter(p => p.id !== participant1Id)
                    .map((p) => {
                      // Check if this participant already fought against participant1
                      const alreadyFought = participant1Id && havePlayed(p.id, participant1Id);
                      
                      return (
                        <SelectItem 
                          key={p.id} 
                          value={p.id}
                          className={alreadyFought ? "text-red-500 font-medium" : ""}
                        >
                          {p.name} ({p.title}) {alreadyFought ? "- Rematch" : ""}
                        </SelectItem>
                      );
                    })}
                </SelectContent>
              </Select>
              {participant1Id && (
                <p className="text-xs text-gray-500 mt-1">
                  Nota: Los participantes en rojo ya se han enfrentado a este oponente en rondas anteriores.
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddMatch}>
              Agregar Combate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
