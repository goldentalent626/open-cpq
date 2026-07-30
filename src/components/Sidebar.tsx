import React from 'react';
import { LayoutDashboard, FileText, Database, Settings as SettingsIcon, LogOut, HelpCircle, PackageCheck } from 'lucide-react';
import { Button } from './ui/Button';
import { signOut } from '../services/api';

interface SidebarProps {
  currentPage: string;
  setPage: (page: string) => void;
  onOpenTutorial: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, onOpenTutorial }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'quotes', label: 'Preventivi', icon: FileText },
    { id: 'backoffice', label: 'Backoffice Hub', icon: PackageCheck },
    { id: 'pricelist', label: 'Risorse & Listini', icon: Database },
    { id: 'settings', label: 'Impostazioni', icon: SettingsIcon },
  ];

  const handleLogout = async () => {
    await signOut();
  };

  return (
    <aside className="w-64 bg-midnight text-white h-screen fixed left-0 top-0 flex flex-col shadow-xl z-50">
      <div className="p-6 border-b border-white/10">
        <h1 className="text-xl font-bold tracking-tight">OpenCPQ</h1>
        <p className="text-xs text-gray-400 mt-1">Configure, Price, Quote</p>
      </div>

      <nav className="flex-1 p-4 space-y-2">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          return (
            <button
              key={item.id}
              onClick={() => setPage(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                isActive 
                  ? 'bg-cyan text-white shadow-lg shadow-cyan/20 font-medium' 
                  : 'text-gray-400 hover:bg-white/5 hover:text-white'
              }`}
            >
              <Icon size={20} />
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-white/10 space-y-2">
        <button 
            onClick={onOpenTutorial}
            className="w-full flex items-center gap-3 px-4 py-2 text-sm text-gray-400 hover:text-white transition-colors"
        >
            <HelpCircle size={18} />
            Tutorial
        </button>
        <Button 
            variant="danger" 
            fullWidth 
            onClick={handleLogout}
            icon={LogOut}
            className="justify-start"
        >
            Esci
        </Button>
      </div>
    </aside>
  );
};

export default Sidebar;
