
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
import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function TournamentPage() {
  const { 
    participants, 
    tournament, 
    setRounds, 
    startTournament 
  } = useAppContext();
  
  const [customRounds, setCustomRounds] = useState(tournament.rounds.toString());
  const [currentRoundView, setCurrentRoundView] = useState(tournament.currentRound || 1);
  
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
  
  const canNavigateToPrevRound = currentRoundView > 1;
  const canNavigateToNextRound = currentRoundView < tournament.currentRound;
  
  const currentRoundMatches = tournament.matches.filter(m => m.round === currentRoundView);
  
  const handlePrevRound = () => {
    if (canNavigateToPrevRound) {
      setCurrentRoundView(currentRoundView - 1);
    }
  };
  
  const handleNextRound = () => {
    if (canNavigateToNextRound) {
      setCurrentRoundView(currentRoundView + 1);
    }
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
      
      {tournament.currentRound > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xl font-bold">
              Round {currentRoundView} Matches
            </h3>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePrevRound}
                disabled={!canNavigateToPrevRound}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              
              <span>
                {currentRoundView} of {tournament.currentRound}
              </span>
              
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextRound}
                disabled={!canNavigateToNextRound}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {currentRoundMatches.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No matches for this round</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentRoundMatches.map(match => (
                <MatchCard key={match.id} match={match} />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
