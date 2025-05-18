import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Menu, Home, Trophy, Medal, Users, Save } from 'lucide-react';
import { cn } from '@/lib/utils';
import packageInfo from '../../package.json';

interface LayoutProps {
  children: React.ReactNode;
}

// Navigation items configuration
const navItems = [
  { path: '/', label: 'Participantes', icon: <Home className="mr-2 h-4 w-4" /> },
  { path: '/tournament', label: 'Torneo', icon: <Trophy className="mr-2 h-4 w-4" /> },
  { path: '/standings', label: 'Clasificacion', icon: <Medal className="mr-2 h-4 w-4" /> },
  { path: '/public', label: 'Público', icon: <Users className="mr-2 h-4 w-4" /> },
  { path: '/backup', label: 'Backup', icon: <Save className="mr-2 h-4 w-4" /> },
];

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [value, setValue] = useState(location.pathname);
  const version = packageInfo.version;

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-pokemon-red text-white p-4 shadow-md">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-baseline">
            <h1 className="text-2xl font-bold">Lolocha's Young League Tournament</h1>
            <span className="ml-2 text-xs bg-white bg-opacity-20 px-2 py-0.5 rounded">v{version}</span>
          </div>
        </div>
      </header>

      <div className="container mx-auto mt-4 mb-4">
        {/* Mobile/Zoomed Menu (Burger) */}
        <div className="md:hidden mb-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full flex justify-between items-center">
                <span className="flex items-center">
                  <Menu className="mr-2 h-4 w-4" />
                  {navItems.find(item => item.path === location.pathname)?.label || 'Menú'}
                </span>
                <span className="text-xs bg-pokemon-red text-white px-2 py-0.5 rounded">{navItems.findIndex(item => item.path === location.pathname) + 1}/{navItems.length}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56">
              {navItems.map((item) => (
                <DropdownMenuItem key={item.path} asChild>
                  <Link 
                    to={item.path} 
                    className={cn(
                      "flex w-full items-center",
                      location.pathname === item.path && "bg-pokemon-red text-white"
                    )}
                  >
                    {item.icon}
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        {/* Desktop Tabs */}
        <div className="hidden md:block">
          <Tabs 
            value={value} 
            onValueChange={(newValue) => {
              setValue(newValue);
            }}
            className="w-full"
          >
            <TabsList className="w-full grid grid-cols-5">
              {navItems.map((item) => (
                <TabsTrigger 
                  key={item.path}
                  value={item.path} 
                  asChild
                  className={cn("data-[state=active]:bg-pokemon-red data-[state=active]:text-white")}
                >
                  <Link to={item.path}>{item.label}</Link>
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </div>
      </div>

      <main className="flex-1 container mx-auto p-4 pokeball-bg">
        {children}
      </main>

      <footer className="bg-pokemon-dark text-white p-4 mt-auto">
        <div className="container mx-auto text-center">
          <p className="text-sm">
            Lolocha's Young League Tournament v{version} &copy; {new Date().getFullYear()}
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
