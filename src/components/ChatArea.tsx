import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chatbot } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from './AudioPlayer';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
}

interface ChatAreaProps {
  selectedChatbot: Chatbot | null;
  apiKey: string;
}

export function ChatArea({ selectedChatbot, apiKey }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const isAudioUrl = (content: string): string | null => {
    const audioUrlRegex = /(https:\/\/files\.shapes\.inc\/[^\s]+\.mp3)/g;
    const match = content.match(audioUrlRegex);
    return match ? match[0] : null;
  };

  const renderMessageContent = (message: Message) => {
    const audioUrl = isAudioUrl(message.content);
    
    if (audioUrl && message.sender === 'bot') {
      const textContent = message.content.replace(audioUrl, '').trim();
      
      return (
        <div className="space-y-2">
          {textContent && <p className="text-sm">{textContent}</p>}
          <AudioPlayer src={audioUrl} />
        </div>
      );
    }
    
    return <p className="text-sm">{message.content}</p>;
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !selectedChatbot || !apiKey) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: inputValue,
      sender: 'user',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      // Extract shape username from URL (e.g., "bella-donna" from "https://shapes.inc/bella-donna")
      const shapeUsername = selectedChatbot.url.split('/').pop() || selectedChatbot.name.toLowerCase().replace(/\s+/g, '-');
      
      const response = await fetch('https://api.shapes.inc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `shapesinc/${shapeUsername}`,
          messages: [
            { role: "user", content: currentInput }
          ]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Shapes API:', error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        content: "Sorry, I encountered an error while processing your message. Please check your API key and try again.",
        sender: 'bot',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, errorMessage]);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please check your API key and try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (!selectedChatbot) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#36393f] pt-16 md:pt-0">
        <div className="text-center text-[#96989d] px-4">
          <h2 className="text-2xl font-semibold mb-2">Welcome to Shapes Chat</h2>
          <p className="mb-4">Select a chatbot from the sidebar to start a conversation</p>
          <p className="text-sm text-[#72767d]">
            On mobile, tap the menu button in the top left to open the sidebar
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col bg-[#36393f] pt-16 md:pt-0">
      {/* Chat Header */}
      <div className="h-16 bg-[#36393f] border-b border-[#202225] flex items-center px-4">
        <div className="w-8 h-8 bg-[#5865f2] rounded-full flex items-center justify-center mr-3">
          <span className="text-white font-semibold text-sm">
            {selectedChatbot.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h3 className="text-white font-semibold">{selectedChatbot.name}</h3>
          <p className="text-[#96989d] text-sm">{selectedChatbot.url}</p>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                message.sender === 'user'
                  ? 'bg-[#5865f2] text-white'
                  : 'bg-[#2f3136] text-white border border-[#202225]'
              }`}
            >
              {renderMessageContent(message)}
              <p className="text-xs opacity-70 mt-1">
                {message.timestamp.toLocaleTimeString()}
              </p>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex justify-start">
            <div className="bg-[#2f3136] text-white border border-[#202225] px-4 py-2 rounded-lg">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#96989d] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#96989d] rounded-full animate-bounce delay-100"></div>
                <div className="w-2 h-2 bg-[#96989d] rounded-full animate-bounce delay-200"></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-[#36393f] border-t border-[#202225]">
        {!apiKey ? (
          <div className="bg-[#faa61a] text-black px-4 py-2 rounded mb-2 text-sm">
            Please configure your API key to start chatting
          </div>
        ) : null}
        
        <div className="flex space-x-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder={`Message ${selectedChatbot.name}...`}
            className="flex-1 bg-[#40444b] border-[#202225] text-white placeholder-[#96989d]"
            disabled={!apiKey || isLoading}
          />
          <Button
            onClick={sendMessage}
            disabled={!inputValue.trim() || !apiKey || isLoading}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
