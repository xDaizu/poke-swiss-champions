
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
      toast.error("Please enter Pokémon names");
      return;
    }

    setIsProcessing(true);
    try {
      // Split by commas and trim whitespace
      const pokemonNames = csvInput.split(',').map(name => name.trim()).filter(name => name);
      
      if (pokemonNames.length === 0) {
        toast.error("No valid Pokémon names found");
        setIsProcessing(false);
        return;
      }

      const maxTeamSize = 6;
      const availableSlots = maxTeamSize - team.length;
      
      if (pokemonNames.length > availableSlots) {
        toast.warning(`Only adding ${availableSlots} of ${pokemonNames.length} Pokémon (team size limit is 6)`);
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
        toast.error("No matching Pokémon found");
      } else if (newPokemon.length < pokemonToAdd.length) {
        toast.warning(`Added ${newPokemon.length} of ${pokemonToAdd.length} Pokémon (some names were not found)`);
        setTeam([...team, ...newPokemon]);
      } else {
        toast.success(`Added ${newPokemon.length} Pokémon to the team`);
        setTeam([...team, ...newPokemon]);
      }
      
      setCsvInput('');
    } catch (error) {
      console.error("Error importing Pokémon:", error);
      toast.error("Failed to import Pokémon");
    } finally {
      setIsProcessing(false);
    }
  };

  const onFormSubmit = handleSubmit((data) => {
    if (team.length < 1) {
      toast.error('Please select at least one Pokémon for the team.');
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
          <Label htmlFor="name">Trainer Name</Label>
          <Input
            id="name"
            {...register('name', { required: 'Trainer name is required' })}
            placeholder="Enter trainer name"
            className="mt-1"
          />
          {errors.name && (
            <p className="text-sm text-red-500 mt-1">{errors.name.message}</p>
          )}
        </div>

        <div>
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            {...register('title', { required: 'Title is required' })}
            placeholder="e.g. Master Chef, Dragon Tamer, etc."
            className="mt-1"
          />
          {errors.title && (
            <p className="text-sm text-red-500 mt-1">{errors.title.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="csvInput">Quick Add Pokémon (CSV)</Label>
        <div className="flex gap-2">
          <Textarea
            id="csvInput"
            value={csvInput}
            onChange={(e) => setCsvInput(e.target.value)}
            placeholder="Enter Pokémon names separated by commas (e.g. Pikachu, Charizard, Bulbasaur)"
            className="flex-1"
          />
          <Button 
            type="button" 
            onClick={handleCsvImport} 
            disabled={isProcessing || !csvInput.trim() || team.length >= 6}
            className="self-start"
          >
            {isProcessing ? "Adding..." : "Add"}
          </Button>
        </div>
        <p className="text-xs text-gray-500">
          Add multiple Pokémon at once by entering names separated by commas
        </p>
      </div>

      <PokemonTeamSelector 
        team={team} 
        onChange={setTeam}
        maxTeamSize={6} 
      />

      <div className="flex justify-end space-x-2">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {participant ? 'Update' : 'Create'} Participant
        </Button>
      </div>
    </form>
  );
}
