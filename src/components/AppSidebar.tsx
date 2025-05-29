
import { Plus, Bot, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import { Chatbot } from '@/pages/Index';

interface AppSidebarProps {
  chatbots: Chatbot[];
  selectedChatbot: Chatbot | null;
  onSelectChatbot: (chatbot: Chatbot) => void;
  onAddShape: () => void;
  onOpenApiConfig: () => void;
}

export function AppSidebar({ 
  chatbots, 
  selectedChatbot, 
  onSelectChatbot, 
  onAddShape, 
  onOpenApiConfig 
}: AppSidebarProps) {
  return (
    <Sidebar className="bg-[#2f3136] border-r border-[#202225]">
      <SidebarHeader className="p-4 border-b border-[#202225]">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center">
            <Bot className="w-5 h-5 text-white" />
          </div>
          <span className="font-semibold text-white">Shapes Chat</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-[#96989d] text-xs uppercase font-semibold px-2 mb-2">
            Chatbots
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {chatbots.map((chatbot) => (
                <SidebarMenuItem key={chatbot.id}>
                  <SidebarMenuButton 
                    onClick={() => onSelectChatbot(chatbot)}
                    className={`w-full justify-start text-left px-2 py-1 rounded hover:bg-[#393c43] ${
                      selectedChatbot?.id === chatbot.id ? 'bg-[#393c43] text-white' : 'text-[#96989d]'
                    }`}
                  >
                    <div className="w-6 h-6 bg-[#5865f2] rounded-full flex items-center justify-center mr-3">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                    <span className="truncate">{chatbot.name}</span>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
              
              <SidebarMenuItem>
                <SidebarMenuButton 
                  onClick={onAddShape}
                  className="w-full justify-start text-left px-2 py-1 rounded hover:bg-[#393c43] text-[#96989d]"
                >
                  <div className="w-6 h-6 bg-[#43b581] rounded-full flex items-center justify-center mr-3">
                    <Plus className="w-4 h-4 text-white" />
                  </div>
                  <span>Add New Shape</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="p-4 border-t border-[#202225]">
        <SidebarMenuButton 
          onClick={onOpenApiConfig}
          className="w-full justify-start text-left px-2 py-2 rounded hover:bg-[#393c43] text-[#96989d]"
        >
          <Settings className="w-4 h-4 mr-3" />
          <span>API Configuration</span>
        </SidebarMenuButton>
      </SidebarFooter>
    </Sidebar>
  );
}
