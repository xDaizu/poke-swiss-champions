import { useAppContext } from '../context/AppContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

export default function StandingsPage() {
  const { getStandings, tournament } = useAppContext();
  
  const standings = getStandings();
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Clasificación del Torneo</h2>
      
      {tournament.currentRound === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">El torneo aún no ha comenzado</p>
          <p className="text-gray-400">Inicia el torneo para ver la clasificación</p>
        </div>
      ) : standings.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-500">No hay clasificación disponible</p>
        </div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Clasificación Actual</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">#</TableHead>
                  <TableHead>Entrenador</TableHead>
                  <TableHead className="text-center">Pokémon</TableHead>
                  <TableHead className="text-center">Puntos</TableHead>
                  <TableHead className="text-center">Resistencia</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {standings.map(({ participant, points, resistance }, index) => (
                  <TableRow key={participant.id}>
                    <TableCell className="font-medium">{index + 1}</TableCell>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-semibold">{participant.name}</span>
                        <span className="text-xs text-gray-500">{participant.title}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-center">
                      <div className="flex justify-center space-x-1">
                        {participant.team.slice(0, 3).map((pokemon, i) => (
                          <img
                            key={i}
                            src={pokemon.sprite}
                            alt={pokemon.name}
                            className="w-6 h-6"
                            title={pokemon.name}
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://raw.githubusercontent.com/fanzeyi/pokemon.json/master/sprites/001MS.png';
                            }}
                          />
                        ))}
                        {participant.team.length > 3 && (
                          <span className="text-xs text-gray-500 self-center">
                            +{participant.team.length - 3} más
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-center font-semibold">{points}</TableCell>
                    <TableCell className="text-center">{resistance}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Sistema de Puntuación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-lg font-medium mb-2">Puntos</h4>
              <ul className="list-disc list-inside space-y-1">
                <li>Victoria: 2 puntos</li>
                <li>Empate: 1 punto</li>
                <li>Bye: 1 punto</li>
                <li>Derrota: 0 puntos</li>
              </ul>
            </div>
            <div>
              <h4 className="text-lg font-medium mb-2">Resistencia</h4>
              <p className="text-sm text-gray-600">
                La resistencia de un participante se calcula como la suma de los puntos obtenidos por todos sus oponentes durante el torneo. Una mayor resistencia indica que se han enfrentado a oponentes más fuertes.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
