
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Participant, Pokemon } from '../types';
import PokemonTeamSelector from './PokemonTeamSelector';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

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
