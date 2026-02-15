import { ScrollArea } from '@/components/ui/scroll-area';
import { MessageSquare, Trash2 } from 'lucide-react';

export const ConversationList = ({ conversations, activeConversation, onSelect, onDelete }) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now - date;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <ScrollArea className="flex-1">
      <div className="p-2 space-y-1">
        {conversations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <MessageSquare size={24} className="mx-auto mb-2 opacity-50" />
            <p className="text-xs font-mono">NO CONVERSATIONS</p>
          </div>
        ) : (
          conversations.map((conversation) => (
            <div
              key={conversation.id}
              className={`group relative p-3 cursor-pointer transition-colors ${
                activeConversation?.id === conversation.id
                  ? 'bg-neon-blue/10 border-l-2 border-neon-blue'
                  : 'hover:bg-white/5 border-l-2 border-transparent'
              }`}
              onClick={() => onSelect(conversation)}
              data-testid={`conversation-${conversation.id}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <h4 className={`text-sm font-rajdhani font-semibold truncate ${
                    activeConversation?.id === conversation.id
                      ? 'text-neon-blue'
                      : 'text-foreground'
                  }`}>
                    {conversation.title}
                  </h4>
                  <p className="text-xs text-muted-foreground font-mono mt-1">
                    {formatDate(conversation.updated_at)}
                  </p>
                </div>
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete(conversation.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-alert-red transition-all p-1"
                  data-testid={`delete-conversation-${conversation.id}`}
                >
                  <Trash2 size={14} />
                </button>
              </div>
              
              {conversation.messages?.length > 0 && (
                <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                  {conversation.messages.length} messages
                </p>
              )}
            </div>
          ))
        )}
      </div>
    </ScrollArea>
  );
};

export default ConversationList;
