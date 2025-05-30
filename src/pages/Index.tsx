
import { useState, useEffect } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/AppSidebar';
import { ChatArea } from '@/components/ChatArea';
import { AddShapeModal } from '@/components/AddShapeModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';
import { MobileHeader } from '@/components/MobileHeader';
import { useToast } from '@/hooks/use-toast';

export interface Chatbot {
  id: string;
  name: string;
  url: string;
}

const Index = () => {
  const [chatbots, setChatbots] = useState<Chatbot[]>([]);
  const [selectedChatbot, setSelectedChatbot] = useState<Chatbot | null>(null);
  const [isAddShapeModalOpen, setIsAddShapeModalOpen] = useState(false);
  const [isApiKeyModalOpen, setIsApiKeyModalOpen] = useState(false);
  const [apiKey, setApiKey] = useState<string>('');
  const { toast } = useToast();

  useEffect(() => {
    const savedApiKey = localStorage.getItem('shapes-api-key');
    if (savedApiKey) {
      setApiKey(savedApiKey);
    }
  }, []);

  const addChatbot = (url: string) => {
    const name = url.split('/').pop() || 'Unknown Bot';
    const newChatbot: Chatbot = {
      id: Date.now().toString(),
      name: name.replace('-', ' '),
      url
    };
    setChatbots([...chatbots, newChatbot]);
    
    // Automatically select the newly added chatbot
    setSelectedChatbot(newChatbot);
    
    // Show success toast
    toast({
      title: "Shape Added Successfully!",
      description: `${newChatbot.name} is now ready to chat. Chat window is now active.`,
    });
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('shapes-api-key', key);
  };

  return (
    <div className="min-h-screen bg-[#36393f] text-white">
      <SidebarProvider defaultOpen={false}>
        <div className="min-h-screen flex w-full">
          {/* Mobile Header */}
          <MobileHeader 
            onAddShape={() => setIsAddShapeModalOpen(true)}
            onOpenApiConfig={() => setIsApiKeyModalOpen(true)}
          />
          
          <AppSidebar 
            chatbots={chatbots}
            selectedChatbot={selectedChatbot}
            onSelectChatbot={setSelectedChatbot}
            onAddShape={() => setIsAddShapeModalOpen(true)}
            onOpenApiConfig={() => setIsApiKeyModalOpen(true)}
          />
          <ChatArea 
            selectedChatbot={selectedChatbot}
            apiKey={apiKey}
          />
        </div>
      </SidebarProvider>

      <AddShapeModal 
        isOpen={isAddShapeModalOpen}
        onClose={() => setIsAddShapeModalOpen(false)}
        onAddShape={addChatbot}
      />

      <ApiKeyModal 
        isOpen={isApiKeyModalOpen}
        onClose={() => setIsApiKeyModalOpen(false)}
        onSaveApiKey={saveApiKey}
        currentApiKey={apiKey}
      />
    </div>
  );
};

export default Index;
