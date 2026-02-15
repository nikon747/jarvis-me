import { useState, useEffect, useRef } from 'react';
import { Mic, MicOff, Send, Volume2, VolumeX, Plus, Trash2, MessageSquare, CheckSquare, BarChart3, Settings, X, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import useAudioRecorder from '@/hooks/useAudioRecorder';
import useAudioPlayer from '@/hooks/useAudioPlayer';
import JarvisOrb from '@/components/jarvis/JarvisOrb';
import ChatMessage from '@/components/jarvis/ChatMessage';
import TaskPanel from '@/components/jarvis/TaskPanel';
import ConversationList from '@/components/jarvis/ConversationList';
import StatsPanel from '@/components/jarvis/StatsPanel';

export default function JarvisApp() {
  const [activeConversation, setActiveConversation] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [activePanel, setActivePanel] = useState('chat'); // 'chat', 'tasks', 'stats'
  const [autoPlayAudio, setAutoPlayAudio] = useState(true);
  const [voiceType, setVoiceType] = useState('onyx'); // JARVIS-like deep voice
  const [stats, setStats] = useState(null);
  
  const messagesEndRef = useRef(null);
  const { isRecording, audioBlob, startRecording, stopRecording, clearRecording, error: recordError } = useAudioRecorder();
  const { isPlaying, playAudio, stopAudio } = useAudioPlayer();

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
    loadStats();
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle recording completion
  useEffect(() => {
    if (audioBlob && !isRecording) {
      handleTranscribe();
    }
  }, [audioBlob, isRecording]);

  // Show recording errors
  useEffect(() => {
    if (recordError) {
      toast.error(recordError);
    }
  }, [recordError]);

  const loadConversations = async () => {
    try {
      const data = await api.getConversations();
      setConversations(data);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    }
  };

  const loadStats = async () => {
    try {
      const data = await api.getStats();
      setStats(data);
    } catch (err) {
      console.error('Failed to load stats:', err);
    }
  };

  const createNewConversation = async () => {
    try {
      const conversation = await api.createConversation('New Conversation');
      setConversations(prev => [conversation, ...prev]);
      setActiveConversation(conversation);
      setMessages([]);
      toast.success('New conversation created');
    } catch (err) {
      toast.error('Failed to create conversation');
    }
  };

  const selectConversation = async (conversation) => {
    try {
      const fullConversation = await api.getConversation(conversation.id);
      setActiveConversation(fullConversation);
      setMessages(fullConversation.messages || []);
    } catch (err) {
      toast.error('Failed to load conversation');
    }
  };

  const deleteConversation = async (id) => {
    try {
      await api.deleteConversation(id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversation?.id === id) {
        setActiveConversation(null);
        setMessages([]);
      }
      toast.success('Conversation deleted');
      loadStats();
    } catch (err) {
      toast.error('Failed to delete conversation');
    }
  };

  const handleTranscribe = async () => {
    if (!audioBlob) return;
    
    setIsTranscribing(true);
    try {
      const result = await api.transcribeAudio(audioBlob);
      if (result.text) {
        setInputText(result.text);
        toast.success('Voice transcribed successfully');
      }
    } catch (err) {
      toast.error('Failed to transcribe audio');
    } finally {
      setIsTranscribing(false);
      clearRecording();
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    
    // Create conversation if none exists
    if (!activeConversation) {
      try {
        const conversation = await api.createConversation('New Conversation');
        setConversations(prev => [conversation, ...prev]);
        setActiveConversation(conversation);
        await sendMessageToConversation(conversation.id, inputText.trim());
      } catch (err) {
        toast.error('Failed to create conversation');
      }
      return;
    }
    
    await sendMessageToConversation(activeConversation.id, inputText.trim());
  };

  const sendMessageToConversation = async (conversationId, message) => {
    setIsLoading(true);
    const userMessage = { role: 'user', content: message, timestamp: new Date().toISOString() };
    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    
    try {
      const response = await api.sendMessage(conversationId, message);
      const assistantMessage = { 
        role: 'assistant', 
        content: response.response, 
        timestamp: new Date().toISOString(),
        audio: response.audio_base64
      };
      setMessages(prev => [...prev, assistantMessage]);
      
      // Auto-play audio response
      if (autoPlayAudio && response.audio_base64) {
        playAudio(response.audio_base64);
      }
      
      loadStats();
    } catch (err) {
      toast.error('JARVIS encountered an error');
      // Remove the user message if failed
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleRecording = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  return (
    <div className="min-h-screen bg-void grid-bg relative overflow-hidden" data-testid="jarvis-app">
      {/* Ambient background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-neon-blue/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 flex h-screen">
        {/* Sidebar */}
        <aside className="w-80 glass-panel border-r border-neon-blue/10 flex flex-col">
          {/* Logo */}
          <div className="p-6 border-b border-neon-blue/10">
            <h1 className="font-orbitron text-2xl font-bold text-neon-blue neon-text tracking-widest">
              J.A.R.V.I.S.
            </h1>
            <p className="text-xs text-muted-foreground font-mono mt-1 tracking-wider">
              JUST A RATHER VERY INTELLIGENT SYSTEM
            </p>
          </div>

          {/* Navigation */}
          <nav className="p-4 space-y-2">
            <button
              onClick={() => setActivePanel('chat')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-rajdhani font-semibold tracking-wide transition-colors ${
                activePanel === 'chat' 
                  ? 'bg-neon-blue/10 text-neon-blue border-l-2 border-neon-blue' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              data-testid="nav-chat"
            >
              <MessageSquare size={18} />
              CONVERSATIONS
            </button>
            <button
              onClick={() => setActivePanel('tasks')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-rajdhani font-semibold tracking-wide transition-colors ${
                activePanel === 'tasks' 
                  ? 'bg-neon-blue/10 text-neon-blue border-l-2 border-neon-blue' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              data-testid="nav-tasks"
            >
              <CheckSquare size={18} />
              TASK MANAGEMENT
            </button>
            <button
              onClick={() => setActivePanel('stats')}
              className={`w-full flex items-center gap-3 px-4 py-3 font-rajdhani font-semibold tracking-wide transition-colors ${
                activePanel === 'stats' 
                  ? 'bg-neon-blue/10 text-neon-blue border-l-2 border-neon-blue' 
                  : 'text-muted-foreground hover:text-foreground hover:bg-white/5'
              }`}
              data-testid="nav-stats"
            >
              <BarChart3 size={18} />
              SYSTEM STATS
            </button>
          </nav>

          {/* Conversations List or New Button */}
          {activePanel === 'chat' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="p-4 border-t border-neon-blue/10">
                <Button
                  onClick={createNewConversation}
                  className="w-full bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20 hover:border-neon-blue/50 font-orbitron text-xs tracking-widest"
                  data-testid="new-conversation-btn"
                >
                  <Plus size={16} className="mr-2" />
                  NEW CONVERSATION
                </Button>
              </div>
              <ConversationList
                conversations={conversations}
                activeConversation={activeConversation}
                onSelect={selectConversation}
                onDelete={deleteConversation}
              />
            </div>
          )}

          {/* Settings */}
          <div className="p-4 border-t border-neon-blue/10">
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono text-muted-foreground tracking-wider">AUTO-PLAY VOICE</span>
              <button
                onClick={() => setAutoPlayAudio(!autoPlayAudio)}
                className={`p-2 rounded transition-colors ${
                  autoPlayAudio ? 'text-neon-blue' : 'text-muted-foreground'
                }`}
                data-testid="toggle-autoplay"
              >
                {autoPlayAudio ? <Volume2 size={18} /> : <VolumeX size={18} />}
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 flex flex-col">
          {activePanel === 'chat' && (
            <>
              {/* Chat Header */}
              <header className="p-6 border-b border-neon-blue/10 glass-panel">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="font-rajdhani text-xl font-bold tracking-wide text-foreground">
                      {activeConversation?.title || 'Welcome to J.A.R.V.I.S.'}
                    </h2>
                    <p className="text-xs font-mono text-muted-foreground mt-1">
                      {activeConversation 
                        ? `${messages.length} messages • Created ${new Date(activeConversation.created_at).toLocaleDateString()}`
                        : 'Start a new conversation to begin'
                      }
                    </p>
                  </div>
                  <JarvisOrb 
                    isActive={isLoading || isRecording || isPlaying}
                    isRecording={isRecording}
                    isSpeaking={isPlaying}
                  />
                </div>
              </header>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-6">
                <div className="max-w-4xl mx-auto space-y-4">
                  {messages.length === 0 ? (
                    <div className="text-center py-20">
                      <div className="w-32 h-32 mx-auto mb-8 rounded-full bg-neon-blue/10 border border-neon-blue/30 flex items-center justify-center">
                        <MessageSquare size={48} className="text-neon-blue/50" />
                      </div>
                      <h3 className="font-orbitron text-xl text-muted-foreground mb-2">
                        AWAITING COMMAND
                      </h3>
                      <p className="text-sm text-muted-foreground/70 font-barlow max-w-md mx-auto">
                        Good day. I am J.A.R.V.I.S., your personal AI assistant. 
                        How may I assist you today? You can type or use voice commands.
                      </p>
                    </div>
                  ) : (
                    messages.map((msg, index) => (
                      <ChatMessage 
                        key={index} 
                        message={msg} 
                        onPlayAudio={msg.audio ? () => playAudio(msg.audio) : null}
                        isPlaying={isPlaying}
                      />
                    ))
                  )}
                  
                  {/* Loading indicator */}
                  {isLoading && (
                    <div className="flex items-center gap-3 p-4 bg-neon-blue/5 border-l-2 border-neon-blue">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                        <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                        <span className="w-2 h-2 bg-neon-blue rounded-full typing-dot" />
                      </div>
                      <span className="text-sm text-neon-blue font-mono">Processing...</span>
                    </div>
                  )}
                  
                  {/* Transcribing indicator */}
                  {isTranscribing && (
                    <div className="flex items-center gap-3 p-4 bg-alert-green/5 border-l-2 border-alert-green">
                      <div className="flex gap-1">
                        <span className="w-2 h-2 bg-alert-green rounded-full typing-dot" />
                        <span className="w-2 h-2 bg-alert-green rounded-full typing-dot" />
                        <span className="w-2 h-2 bg-alert-green rounded-full typing-dot" />
                      </div>
                      <span className="text-sm text-alert-green font-mono">Transcribing voice...</span>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </div>
              </ScrollArea>

              {/* Input Area */}
              <div className="p-6 border-t border-neon-blue/10 glass-panel">
                <div className="max-w-4xl mx-auto flex gap-4">
                  {/* Voice Recording Button */}
                  <button
                    onClick={toggleRecording}
                    disabled={isLoading || isTranscribing}
                    className={`p-4 rounded-full transition-all ${
                      isRecording 
                        ? 'bg-alert-red text-white recording-pulse shadow-[0_0_20px_rgba(255,59,48,0.5)]' 
                        : 'bg-neon-blue/10 text-neon-blue border border-neon-blue/30 hover:bg-neon-blue/20'
                    } disabled:opacity-50`}
                    data-testid="voice-record-btn"
                  >
                    {isRecording ? <MicOff size={24} /> : <Mic size={24} />}
                  </button>

                  {/* Text Input */}
                  <div className="flex-1 relative">
                    <Input
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Enter command or speak..."
                      disabled={isLoading || isRecording}
                      className="w-full bg-black/50 border-neon-blue/30 text-foreground font-barlow pr-12 py-6 text-base focus:border-neon-blue focus:ring-neon-blue/20 placeholder:text-muted-foreground/50"
                      data-testid="chat-input"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={!inputText.trim() || isLoading}
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-neon-blue/20 text-neon-blue hover:bg-neon-blue/30 p-2 h-auto"
                      data-testid="send-btn"
                    >
                      <Send size={20} />
                    </Button>
                  </div>
                </div>
                
                {/* Recording indicator */}
                {isRecording && (
                  <div className="max-w-4xl mx-auto mt-4 flex items-center justify-center gap-2">
                    <div className="flex gap-1 items-end h-8">
                      {[...Array(5)].map((_, i) => (
                        <div key={i} className="w-1 bg-alert-red rounded-full voice-bar" />
                      ))}
                    </div>
                    <span className="text-sm text-alert-red font-mono ml-2">RECORDING...</span>
                  </div>
                )}
              </div>
            </>
          )}

          {activePanel === 'tasks' && <TaskPanel />}
          {activePanel === 'stats' && <StatsPanel stats={stats} onRefresh={loadStats} />}
        </main>
      </div>
    </div>
  );
}
