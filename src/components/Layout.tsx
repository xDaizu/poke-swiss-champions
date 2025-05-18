import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-pokemon-red text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <h1 className="text-2xl font-bold">Pokémon Tournament Manager</h1>
        </div>
      </header>

      <div className="container mx-auto mt-4 mb-4">
        <Tabs 
          value={value} 
          onValueChange={(newValue) => {
            setValue(newValue);
          }}
          className="w-full"
        >
          <TabsList className="w-full grid grid-cols-5">
            <TabsTrigger 
              value="/" 
              asChild
              className={cn("data-[state=active]:bg-pokemon-red data-[state=active]:text-white")}
            >
              <Link to="/">Participants</Link>
            </TabsTrigger>
            <TabsTrigger 
              value="/tournament" 
              asChild
              className={cn("data-[state=active]:bg-pokemon-red data-[state=active]:text-white")}
            >
              <Link to="/tournament">Tournament</Link>
            </TabsTrigger>
            <TabsTrigger 
              value="/standings" 
              asChild
              className={cn("data-[state=active]:bg-pokemon-red data-[state=active]:text-white")}
            >
              <Link to="/standings">Clasificacion</Link>
            </TabsTrigger>
            <TabsTrigger 
              value="/public" 
              asChild
              className={cn("data-[state=active]:bg-pokemon-red data-[state=active]:text-white")}
            >
              <Link to="/public">Público</Link>
            </TabsTrigger>
            <TabsTrigger 
              value="/backup" 
              asChild
              className={cn("data-[state=active]:bg-pokemon-red data-[state=active]:text-white")}
            >
              <Link to="/backup">Backup</Link>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <main className="flex-1 container mx-auto p-4 pokeball-bg">
        {children}
      </main>

      <footer className="bg-pokemon-dark text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            Pokémon Tournament Manager &copy; {new Date().getFullYear()}
          </p>
          <p className="text-xs mt-1">
            Pokémon data from <a 
              href="https://github.com/fanzeyi/pokemon.json" 
              target="_blank" 
              rel="noopener noreferrer"
              className="underline"
            >
              fanzeyi/pokemon.json
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
