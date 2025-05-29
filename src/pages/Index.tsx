
import { useState } from 'react';
import { SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from '@/components/AppSidebar';
import { ChatArea } from '@/components/ChatArea';
import { AddShapeModal } from '@/components/AddShapeModal';
import { ApiKeyModal } from '@/components/ApiKeyModal';

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

  const addChatbot = (url: string) => {
    const name = url.split('/').pop() || 'Unknown Bot';
    const newChatbot: Chatbot = {
      id: Date.now().toString(),
      name: name.replace('-', ' '),
      url
    };
    setChatbots([...chatbots, newChatbot]);
    if (!selectedChatbot) {
      setSelectedChatbot(newChatbot);
    }
  };

  const saveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem('shapes-api-key', key);
  };

  return (
    <div className="min-h-screen bg-[#36393f] text-white">
      <SidebarProvider>
        <div className="min-h-screen flex w-full">
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
