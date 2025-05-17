
import { useAppContext } from '../context/AppContext';
import { Match, MatchResult } from '../types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MatchCardProps {
  match: Match;
}

export default function MatchCard({ match }: MatchCardProps) {
  const { getParticipantById, updateMatchResult } = useAppContext();
  
  const participant1 = getParticipantById(match.participant1Id);
  const participant2 = getParticipantById(match.participant2Id);
  
  const isBye = !match.participant2Id;
  
  const handleResultClick = (result: MatchResult) => {
    updateMatchResult(match.id, result);
  };
  
  const getResultLabel = () => {
    switch (match.result) {
      case 'win1':
        return `${participant1?.name} Won`;
      case 'win2':
        return `${participant2?.name} Won`;
      case 'tie':
        return 'Tie';
      case 'bye':
        return 'Bye';
      default:
        return 'Pending';
    }
  };

  return (
    <Card className="pokemon-card w-full">
      <CardHeader className="pb-2 text-center">
        <CardTitle className="text-base">Match {match.id.split('-').pop()}</CardTitle>
      </CardHeader>
      
      <CardContent>
        <div className="flex items-center justify-between mb-4">
          <div className="w-[45%] text-center">
            <div className="flex flex-col items-center">
              {participant1 && (
                <>
                  <span className="font-medium truncate max-w-full">{participant1.name}</span>
                  <span className="text-xs text-gray-500 truncate max-w-full">{participant1.title}</span>
                  
                  {participant1.team.length > 0 && (
                    <div className="flex space-x-1 mt-1">
                      {participant1.team.slice(0, 3).map((pokemon, index) => (
                        <img
                          key={index}
                          src={pokemon.sprite}
                          alt={pokemon.name}
                          className="w-6 h-6"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
                          }}
                        />
                      ))}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
          
          <div className="text-center w-[10%]">VS</div>
          
          <div className="w-[45%] text-center">
            {isBye ? (
              <span className="text-gray-500">— BYE —</span>
            ) : participant2 ? (
              <div className="flex flex-col items-center">
                <span className="font-medium truncate max-w-full">{participant2.name}</span>
                <span className="text-xs text-gray-500 truncate max-w-full">{participant2.title}</span>
                
                {participant2.team.length > 0 && (
                  <div className="flex space-x-1 mt-1">
                    {participant2.team.slice(0, 3).map((pokemon, index) => (
                      <img
                        key={index}
                        src={pokemon.sprite}
                        alt={pokemon.name}
                        className="w-6 h-6"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <span className="text-gray-500">Waiting...</span>
            )}
          </div>
        </div>
        
        {match.result ? (
          <div className="text-center p-1 bg-gray-100 rounded-md">
            <span className="font-medium">{getResultLabel()}</span>
          </div>
        ) : (
          <div className="grid grid-cols-4 gap-1">
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs py-1 h-auto"
              onClick={() => handleResultClick('win1')}
              disabled={isBye}
            >
              {participant1?.name.split(' ')[0]} Wins
            </Button>
            
            {!isBye && (
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs py-1 h-auto"
                onClick={() => handleResultClick('win2')}
              >
                {participant2?.name.split(' ')[0]} Wins
              </Button>
            )}
            
            <Button 
              size="sm" 
              variant="outline"
              className="text-xs py-1 h-auto"
              onClick={() => handleResultClick('tie')}
              disabled={isBye}
            >
              Tie
            </Button>
            
            {isBye && (
              <Button 
                size="sm" 
                variant="outline"
                className="text-xs py-1 h-auto"
                onClick={() => handleResultClick('bye')}
                disabled={match.result === 'bye'}
              >
                Bye
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
