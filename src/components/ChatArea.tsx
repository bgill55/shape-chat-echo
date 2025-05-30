import { useState, useRef, useEffect } from 'react';
import { Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Chatbot } from '@/pages/Index';
import { useToast } from '@/hooks/use-toast';
import { AudioPlayer } from './AudioPlayer';
import { ImagePreview } from './ui/ImagePreview';

interface Message {
  id: string;
  content: string;
  sender: 'user' | 'bot';
  timestamp: Date;
  imageUrl?: string; // For user-sent image previews (local blob URL)
}

interface ChatAreaProps {
  selectedChatbot: Chatbot | null;
  apiKey: string;
}

export function ChatArea({ selectedChatbot, apiKey }: ChatAreaProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedImageFile, setSelectedImageFile] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Effect to handle object URL cleanup
  useEffect(() => {
    // If there's an image preview URL, and selectedImageFile is null (meaning it was cleared)
    // or if the component unmounts with an active previewUrl, revoke it.
    let currentPreviewUrl = imagePreviewUrl; // Capture the value for cleanup
    if (!selectedImageFile && currentPreviewUrl) {
      URL.revokeObjectURL(currentPreviewUrl);
      setImagePreviewUrl(null); // Ensure preview URL state is also cleared
    }
    
    // Cleanup function to be called when selectedImageFile changes or component unmounts
    return () => {
      if (currentPreviewUrl) {
        URL.revokeObjectURL(currentPreviewUrl);
      }
    };
  }, [selectedImageFile]); // Rerun when selectedImageFile changes

  const isAudioUrl = (content: string): string | null => {
    const audioUrlRegex = /(https:\/\/files\.shapes\.inc\/[^\s]+\.mp3)/g;
    const match = content.match(audioUrlRegex);
    return match ? match[0] : null;
  };

  const isImageUrl = (content: string): string | null => {
    const imageUrlRegex = /(https:\/\/files\.shapes\.inc\/[^\s]+\.(png|jpg|jpeg|gif))/gi;
    const match = content.match(imageUrlRegex);
    return match ? match[0] : null;
  };

  const renderMessageContent = (message: Message) => {
    // User-sent images with local preview
    if (message.sender === 'user' && message.imageUrl) {
      return (
        <div className="space-y-1">
          {message.content && <p className="text-sm">{message.content}</p>}
          <img 
            src={message.imageUrl} 
            alt="User upload preview" 
            className="max-w-[200px] h-auto rounded mt-1 border border-blue-400" // Adjusted styling for user images
          />
        </div>
      );
    }

    // Bot messages with image URL (rendered via ImagePreview component)
    const botImageUrl = isImageUrl(message.content);
    if (botImageUrl && message.sender === 'bot') {
      const textContent = message.content.replace(botImageUrl, '').trim();
      return (
        <div className="space-y-2">
          {textContent && <p className="text-sm">{textContent}</p>}
          <ImagePreview src={botImageUrl} alt="Bot image content" />
        </div>
      );
    }
    
    // Bot messages with audio URL
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
    
    // Default: plain text message (for user or bot without special content)
    return <p className="text-sm">{message.content}</p>;
  };

  const performApiCall = async (apiKey: string, selectedChatbot: Chatbot, messageContent: any) => {
    setIsLoading(true);
    try {
      const shapeUsername = selectedChatbot.url.split('/').pop() || selectedChatbot.name.toLowerCase().replace(/\s+/g, '-');
      const response = await fetch('https://api.shapes.inc/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: `shapesinc/${shapeUsername}`,
          messages: [{ role: "user", content: messageContent }]
        })
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      const botMessage: Message = {
        id: (Date.now() + 1).toString(), // Ensure unique ID
        content: data.choices?.[0]?.message?.content || "I'm sorry, I couldn't generate a response.",
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      console.error('Error calling Shapes API:', error);
      const errorMessageContent = error instanceof Error ? error.message : "Sorry, I encountered an error while processing your message.";
      const errorBotMessage: Message = {
        id: (Date.now() + 1).toString(), // Ensure unique ID
        content: `Error: ${errorMessageContent}. Please check your API key and try again.`,
        sender: 'bot',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorBotMessage]);
      toast({
        title: "API Error",
        description: errorMessageContent,
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const sendMessage = async () => {
    if ((!inputValue.trim() && !selectedImageFile) || !selectedChatbot || !apiKey) return;

    const currentInput = inputValue;
    const currentImageFile = selectedImageFile;
    const currentImagePreviewUrl = imagePreviewUrl; // Capture preview URL before reset

    // Construct user message for local display
    const userMessage: Message = {
      id: Date.now().toString(),
      content: currentInput, // Only text part for content
      sender: 'user',
      timestamp: new Date(),
      imageUrl: currentImageFile ? currentImagePreviewUrl : undefined, // Store preview URL
    };
    setMessages(prev => [...prev, userMessage]);
    
    setInputValue('');
    setSelectedImageFile(null); 
    // imagePreviewUrl will be set to null by its useEffect due to selectedImageFile changing

    if (currentImageFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const base64DataUri = e.target?.result as string;
        if (!base64DataUri) {
          console.error("Failed to read file as Base64.");
          // Update the optimistic user message to indicate failure
          setMessages(prev => prev.map(msg => 
            msg.id === userMessage.id ? {...msg, content: `${userMessage.content} [Image send failed (read error)]`} : msg
          ));
          setIsLoading(false); 
          return;
        }

        const apiMessageContent: any[] = [];
        if (currentInput.trim()) {
          apiMessageContent.push({ type: "text", text: currentInput.trim() });
        }
        apiMessageContent.push({ type: "image_url", image_url: { url: base64DataUri } });
        
        performApiCall(apiKey, selectedChatbot, apiMessageContent);
      };
      reader.onerror = (error) => {
        console.error("FileReader error:", error);
        setMessages(prev => prev.map(msg => 
            msg.id === userMessage.id ? {...msg, content: `${userMessage.content} [Image send failed (read error)]`} : msg
        ));
          setIsLoading(false); 
        toast({
          title: "File Read Error",
          description: "Could not read the selected image file.",
          variant: "destructive"
        });
      };
      reader.readAsDataURL(currentImageFile);
    } else {
      // Only text is present
      performApiCall(apiKey, selectedChatbot, currentInput);
    }
  };

  const handleImageUploadButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedImageFile(file);
      const newPreviewUrl = URL.createObjectURL(file);
      setImagePreviewUrl(newPreviewUrl);
    } else {
      setSelectedImageFile(null);
      // imagePreviewUrl will be handled by the useEffect cleanup or directly here
      if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
      }
      setImagePreviewUrl(null);
    }
    event.target.value = ''; // Allow selecting the same file again
  };

  const handleRemoveSelectedImage = () => {
    setSelectedImageFile(null);
    // The useEffect for selectedImageFile will handle revoking imagePreviewUrl
    // and setting it to null. If direct feedback is needed, uncomment below:
    // if (imagePreviewUrl) {
    //   URL.revokeObjectURL(imagePreviewUrl);
    // }
    // setImagePreviewUrl(null); 
    if (fileInputRef.current) {
      fileInputRef.current.value = ''; // Clear the file input
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
        
        <div className="flex space-x-2 items-center">
          <Button
            variant="outline"
            onClick={handleImageUploadButtonClick}
            disabled={!apiKey || isLoading}
            className="p-2 text-white border-[#202225] hover:bg-[#40444b]"
            aria-label="Attach image"
          >
            {/* Using a simple text representation for now, can be replaced with an icon */}
            [+Image]
          </Button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            onChange={handleFileSelected}
            className="hidden"
            data-testid="hidden-file-input" // Added for testing
          />
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
            disabled={(!inputValue.trim() && !selectedImageFile) || !apiKey || isLoading}
            className="bg-[#5865f2] hover:bg-[#4752c4] text-white"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
        {imagePreviewUrl && selectedImageFile && (
          <div className="mt-2 flex items-center space-x-2">
            <img 
              src={imagePreviewUrl} 
              alt="Selected preview" 
              className="w-20 h-20 object-cover rounded border border-[#202225]" 
            />
            <div className="text-xs text-[#96989d] truncate">
              {selectedImageFile.name}
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={handleRemoveSelectedImage}
              className="text-red-500 hover:text-red-700 p-1"
              aria-label="Remove selected image"
            >
              X
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
