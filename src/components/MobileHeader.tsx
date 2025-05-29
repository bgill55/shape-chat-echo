
import { Plus, Settings, Menu } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

interface MobileHeaderProps {
  onAddShape: () => void;
  onOpenApiConfig: () => void;
}

export function MobileHeader({ onAddShape, onOpenApiConfig }: MobileHeaderProps) {
  return (
    <div className="md:hidden fixed top-0 left-0 right-0 z-50 bg-[#2f3136] border-b border-[#202225] p-4 flex items-center justify-between">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="text-white hover:bg-[#393c43]" />
        <span className="font-semibold text-white">Shapes Chat</span>
      </div>
      
      <div className="flex items-center gap-2">
        <Button
          onClick={onAddShape}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-[#393c43]"
        >
          <Plus className="w-5 h-5" />
        </Button>
        <Button
          onClick={onOpenApiConfig}
          variant="ghost"
          size="icon"
          className="text-white hover:bg-[#393c43]"
        >
          <Settings className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}
