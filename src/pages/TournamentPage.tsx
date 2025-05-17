
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

// Define round colors for containers
const ROUND_COLORS = [
  'bg-[#F2FCE2]', // Soft Green
  'bg-[#FEF7CD]', // Soft Yellow
  'bg-[#E5DEFF]', // Soft Purple
  'bg-[#D3E4FD]'  // Soft Blue
];

export default function TournamentPage() {
  const { 
    participants, 
    tournament, 
    setRounds, 
    startTournament,
    createCustomMatch,
    removeMatch,
    havePlayed
  } = useAppContext();
  
  const [customRounds, setCustomRounds] = useState(tournament.rounds.toString());
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [selectedRoundForMatch, setSelectedRoundForMatch] = useState<number>(1);
  const [participant1Id, setParticipant1Id] = useState<string>('');
  const [participant2Id, setParticipant2Id] = useState<string>('');
  
  const handleStartTournament = () => {
    if (participants.length < 2) {
      toast.error('You need at least 2 participants to start a tournament');
      return;
    }
    
    startTournament();
    toast.success('Tournament started successfully');
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
      toast.error('Please select the first participant');
      return;
    }

    // Validate participant selection
    createCustomMatch(selectedRoundForMatch, participant1Id, participant2Id || null);
    setIsMatchDialogOpen(false);
    setParticipant1Id('');
    setParticipant2Id('');
    toast.success('Match added successfully');
  };

  const handleRemoveMatch = (matchId: string) => {
    if (confirm('Are you sure you want to remove this match?')) {
      removeMatch(matchId);
      toast.success('Match removed successfully');
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Tournament Management</h2>
      
      <Card>
        <CardHeader>
          <CardTitle>Tournament Settings</CardTitle>
          <CardDescription>
            Configure the tournament parameters before starting
          </CardDescription>
        </CardHeader>
        
        <CardContent>
          <div className="space-y-4">
            <div className="flex flex-col md:flex-row md:items-center gap-4">
              <div className="w-full md:w-1/2">
                <Label htmlFor="rounds">Number of Rounds</Label>
                <Input
                  id="rounds"
                  type="number"
                  min="1"
                  value={customRounds}
                  onChange={handleRoundsChange}
                  className="mt-1"
                />
              </div>
              
              <div className="w-full md:w-1/2">
                <Label>Participants</Label>
                <div className="mt-1 p-2 bg-gray-50 rounded border">
                  <span className="font-medium">{participants.length}</span> participants registered
                </div>
              </div>
            </div>
            
            <div>
              <Label>Tournament Status</Label>
              <div className="mt-1 p-2 bg-gray-50 rounded border">
                {tournament.currentRound === 0 
                  ? "Not started" 
                  : `Round ${tournament.currentRound} of ${tournament.rounds}`}
              </div>
            </div>
          </div>
        </CardContent>
        
        <CardFooter>
          <Button 
            onClick={handleStartTournament}
            disabled={participants.length < 2}
          >
            {tournament.currentRound === 0 ? "Start Tournament" : "Restart Tournament"}
          </Button>
        </CardFooter>
      </Card>
      
      <div className="space-y-8">
        <h3 className="text-xl font-bold">Tournament Rounds</h3>
        
        {Array.from({ length: tournament.rounds || 4 }).map((_, index) => {
          const roundNumber = index + 1;
          const roundMatches = tournament.matches.filter(m => m.round === roundNumber);
          const roundActive = tournament.currentRound >= roundNumber;
          const roundColor = ROUND_COLORS[index % ROUND_COLORS.length];
          
          return (
            <Card key={roundNumber} className={`${roundColor} border-2 ${roundActive ? 'border-pokemon-red' : 'border-gray-200'}`}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-center">
                  <CardTitle>Round {roundNumber}</CardTitle>
                  <Button 
                    onClick={() => openAddMatchDialog(roundNumber)}
                    size="sm"
                    variant="outline"
                    className="bg-white hover:bg-gray-100"
                  >
                    <Plus className="h-4 w-4 mr-2" /> Add Match
                  </Button>
                </div>
                <CardDescription>
                  {roundActive ? 'Active round' : 'Upcoming round'} • {roundMatches.length} matches
                </CardDescription>
              </CardHeader>
              
              <CardContent>
                {roundMatches.length === 0 ? (
                  <div className="text-center py-8 bg-white/50 rounded-md">
                    <p className="text-gray-500">No matches for this round yet</p>
                    <Button 
                      onClick={() => openAddMatchDialog(roundNumber)}
                      variant="outline"
                      className="mt-4 bg-white hover:bg-gray-100"
                    >
                      <Plus className="h-4 w-4 mr-2" /> Create First Match
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
            <DialogTitle>Add Custom Match for Round {selectedRoundForMatch}</DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="participant1">Participant 1 (Required)</Label>
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
                  <SelectValue placeholder="Select participant 1" />
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
              <Label htmlFor="participant2">Participant 2 (Optional, leave empty for BYE)</Label>
              <Select 
                value={participant2Id} 
                onValueChange={setParticipant2Id}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select participant 2 (optional)" />
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
                  Note: Participants in red have already fought against this opponent in previous rounds.
                </p>
              )}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsMatchDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddMatch}>
              Add Match
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
