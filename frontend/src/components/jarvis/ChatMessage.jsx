import { User, Bot, Volume2, Copy, Check } from 'lucide-react';
import { useState } from 'react';

export const ChatMessage = ({ message, onPlayAudio, isPlaying }) => {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === 'user';
  
  const copyToClipboard = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatContent = (content) => {
    // Simple code block detection and formatting
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Add text before code block
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: content.slice(lastIndex, match.index)
        });
      }
      
      // Add code block
      parts.push({
        type: 'code',
        language: match[1] || 'code',
        content: match[2].trim()
      });
      
      lastIndex = match.index + match[0].length;
    }

    // Add remaining text
    if (lastIndex < content.length) {
      parts.push({
        type: 'text',
        content: content.slice(lastIndex)
      });
    }

    if (parts.length === 0) {
      parts.push({ type: 'text', content });
    }

    return parts;
  };

  const formattedContent = formatContent(message.content);

  return (
    <div 
      className={`flex gap-4 p-4 fade-in-up ${
        isUser ? 'user-message' : 'assistant-message'
      }`}
      data-testid={isUser ? 'user-message' : 'assistant-message'}
    >
      {/* Avatar */}
      <div className={`flex-shrink-0 w-10 h-10 rounded flex items-center justify-center ${
        isUser 
          ? 'bg-alert-green/20 text-alert-green' 
          : 'bg-neon-blue/20 text-neon-blue'
      }`}>
        {isUser ? <User size={20} /> : <Bot size={20} />}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className={`text-xs font-orbitron tracking-widest ${
            isUser ? 'text-alert-green' : 'text-neon-blue'
          }`}>
            {isUser ? 'YOU' : 'J.A.R.V.I.S.'}
          </span>
          <span className="text-xs text-muted-foreground font-mono">
            {new Date(message.timestamp).toLocaleTimeString()}
          </span>
        </div>
        
        <div className="text-foreground font-barlow leading-relaxed space-y-3">
          {formattedContent.map((part, index) => {
            if (part.type === 'code') {
              return (
                <div key={index} className="code-block relative group">
                  <div className="absolute top-2 right-2 flex gap-2">
                    <span className="text-xs text-neon-blue/50 font-mono uppercase">
                      {part.language}
                    </span>
                  </div>
                  <pre className="overflow-x-auto">
                    <code className="text-sm">{part.content}</code>
                  </pre>
                </div>
              );
            }
            return (
              <p key={index} className="whitespace-pre-wrap">
                {part.content}
              </p>
            );
          })}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 mt-3">
          <button
            onClick={copyToClipboard}
            className="text-muted-foreground hover:text-foreground transition-colors p-1"
            title="Copy message"
          >
            {copied ? <Check size={14} className="text-alert-green" /> : <Copy size={14} />}
          </button>
          
          {!isUser && onPlayAudio && (
            <button
              onClick={onPlayAudio}
              className={`transition-colors p-1 ${
                isPlaying ? 'text-neon-blue' : 'text-muted-foreground hover:text-foreground'
              }`}
              title="Play audio"
              data-testid="play-audio-btn"
            >
              <Volume2 size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;
