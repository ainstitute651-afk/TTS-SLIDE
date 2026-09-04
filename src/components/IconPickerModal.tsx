import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Star,
  Check,
  TrendingUp,
  Zap,
  Target,
  Smile,
  Heart,
  Shield,
  Award,
  Globe,
  Flame,
  Cloud,
  Code,
  Laptop,
  Smartphone,
  Cpu,
  Database,
  Lock,
  Search,
} from 'lucide-react';

interface IconPickerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectIcon: (iconName: string, color: string) => void;
}

const AVAILABLE_ICONS = [
  { name: 'sparkles', label: 'Sparkles', component: Sparkles },
  { name: 'star', label: 'Star', component: Star },
  { name: 'check', label: 'Checkmark', component: Check },
  { name: 'chart', label: 'Growth Chart', component: TrendingUp },
  { name: 'zap', label: 'Lightning Zap', component: Zap },
  { name: 'target', label: 'Target', component: Target },
  { name: 'heart', label: 'Heart', component: Heart },
  { name: 'shield', label: 'Shield', component: Shield },
  { name: 'award', label: 'Award', component: Award },
  { name: 'globe', label: 'Globe', component: Globe },
  { name: 'flame', label: 'Flame', component: Flame },
  { name: 'cloud', label: 'Cloud', component: Cloud },
  { name: 'code', label: 'Code', component: Code },
  { name: 'laptop', label: 'Laptop', component: Laptop },
  { name: 'smartphone', label: 'Mobile', component: Smartphone },
  { name: 'cpu', label: 'Processor', component: Cpu },
  { name: 'database', label: 'Database', component: Database },
  { name: 'lock', label: 'Lock Security', component: Lock },
];

export const IconPickerModal: React.FC<IconPickerModalProps> = ({
  isOpen,
  onClose,
  onSelectIcon,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedColor, setSelectedColor] = useState('#38bdf8');

  if (!isOpen) return null;

  const filteredIcons = AVAILABLE_ICONS.filter((icon) =>
    icon.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
    icon.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-[#161616] border border-[#2A2A2A] rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in-95">
        <div className="px-4 py-3 border-b border-[#2A2A2A] bg-[#121212] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Smile className="w-4 h-4 text-blue-400" />
            <h3 className="font-bold text-sm text-gray-100">Select Icon</h3>
          </div>
          <button onClick={onClose} className="p-1 rounded text-gray-400 hover:text-white transition">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-4 space-y-3">
          {/* Search & Color */}
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search icon..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-[#121212] border border-[#2A2A2A] rounded pl-8 pr-2.5 py-1.5 text-gray-200 text-xs outline-none focus:border-blue-600"
              />
            </div>
            <input
              type="color"
              value={selectedColor}
              onChange={(e) => setSelectedColor(e.target.value)}
              className="w-8 h-8 rounded border border-[#333] bg-transparent cursor-pointer"
              title="Icon Color"
            />
          </div>

          {/* Grid of Icons */}
          <div className="grid grid-cols-4 gap-2 max-h-60 overflow-y-auto p-1 border border-[#2A2A2A] rounded-lg bg-[#121212]">
            {filteredIcons.map((icon) => {
              const IconComponent = icon.component;
              return (
                <button
                  key={icon.name}
                  onClick={() => {
                    onSelectIcon(icon.name, selectedColor);
                    onClose();
                  }}
                  className="p-3 rounded-lg hover:bg-[#222] flex flex-col items-center justify-center text-gray-300 hover:text-white transition-colors group"
                >
                  <IconComponent className="w-6 h-6 transition-transform group-hover:scale-110" style={{ color: selectedColor }} />
                  <span className="text-[10px] mt-1 text-gray-400 truncate max-w-[60px]">{icon.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
