import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Participant, Pokemon } from '../types';
import PokemonTeamSelector from './PokemonTeamSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Textarea } from '@/components/ui/textarea';
import { searchPokemon } from '../services/pokemonService';

interface ParticipantFormProps {
  participant?: Participant;
  onSubmit: (participant: Participant) => void;
  onCancel: () => void;
}

export default function ParticipantForm({ 
  participant, 
  onSubmit, 
  onCancel 
}: ParticipantFormProps) {
  const [team, setTeam] = useState<Pokemon[]>(participant?.team || []);
  const [csvInput, setCsvInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const { 
    register, 
    handleSubmit, 
    formState: { errors },
    reset
  } = useForm({
    defaultValues: {
      name: participant?.name || '',
      title: participant?.title || '',
    }
  });

  useEffect(() => {
    if (participant) {
      reset({
        name: participant.name,
        title: participant.title,
      });
      setTeam(participant.team);
    }
  }, [participant, reset]);

  const handleCsvImport = async () => {
    if (!csvInput.trim()) {
      toast.error("Por favor, ingrese los nombres de los Pokémon");
      return;
    }

    setIsProcessing(true);
    try {
      // Split by commas and trim whitespace
      const pokemonNames = csvInput.split(',').map(name => name.trim()).filter(name => name);
      
      if (pokemonNames.length === 0) {
        toast.error("No se encontraron nombres de Pokémon válidos");
        setIsProcessing(false);
        return;
      }

      const maxTeamSize = 6;
      const availableSlots = maxTeamSize - team.length;
      
      if (pokemonNames.length > availableSlots) {
        toast.warning(`Solo se agregarán ${availableSlots} de ${pokemonNames.length} Pokémon (el límite de tamaño de equipo es 6)`);
      }

      const pokemonToAdd = pokemonNames.slice(0, availableSlots);
      const newPokemon: Pokemon[] = [];
      
      // Process each name sequentially
      for (const name of pokemonToAdd) {
        const results = await searchPokemon(name);
        if (results.length > 0) {
          // Add the first match
          newPokemon.push(results[0]);
        }
      }

      if (newPokemon.length === 0) {
        toast.error("No se encontraron Pokémon coincidentes");
      } else if (newPokemon.length < pokemonToAdd.length) {
        toast.warning(`Se agregaron ${newPokemon.length} de ${pokemonToAdd.length} Pokémon (algunos nombres no se encontraron)`);
        setTeam([...team, ...newPokemon]);
      } else {
        toast.success(`Se agregaron ${newPokemon.length} Pokémon al equipo`);
        setTeam([...team, ...newPokemon]);
      }
      
      setCsvInput('');
    } catch (error) {
      console.error("Error al importar Pokémon:", error);
      toast.error("No se pudo importar Pokémon");
    } finally {
      setIsProcessing(false);
    }
  };

  const onFormSubmit = handleSubmit((data) => {
    if (team.length < 1) {
      toast.error('Por favor, seleccione al menos un Pokémon para el equipo.');
      return;
    }

    const updatedParticipant: Participant = {
      id: participant?.id || crypto.randomUUID(),
      name: data.name,
      title: data.title,
      team,
    };

    onSubmit(updatedParticipant);
    reset();
    setTeam([]);
    setCsvInput('');
  });

  return (
    <form onSubmit={onFormSubmit} className="space-y-6">
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Nombre del Entrenador</Label>
          <Input
            id="name"
            {...register('name', { required: 'El nombre del entrenador es obligatorio' })}
            placeholder="Ingresa el nombre del entrenador"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="title">Título</Label>
          <Input
            id="title"
            {...register('title', { required: 'El título es obligatorio' })}
            placeholder="Ej: Maestro Chef, Domador de Dragones, etc."
            className="mt-1"
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csvInput">Agregar Pokémon Rápidamente (CSV)</Label>
        <div className="flex gap-2">
          <Textarea
            id="csvInput"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="Ingresa los nombres de los Pokémon separados por comas (ej: Pikachu, Charizard, Bulbasaur)"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleCsvImport} 
            disabled={isProcessing || !csvInput.trim() || team.length >= 6}
            className="self-start"
          >
            {isProcessing ? "Agregando..." : "Agregar"}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Agrega varios Pokémon a la vez ingresando los nombres separados por comas
        </p>
      </div>

      <PokemonTeamSelector 
        team={team} 
        onChange={setTeam}
        maxTeamSize={6} 
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit">
          {participant ? 'Actualizar' : 'Crear'} Participante
        </Button>
      </div>
    </form>
  );
}
