import { useEffect } from 'react';
import { SquarePen, Settings } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ThemeSelector } from '@/components/Theme/ThemeSelector';
import { useChatStore } from '@/store/useChatStore';
import { getConversations } from '@/services/chatService';

function formatDate(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return date.toLocaleDateString([], { weekday: 'short' });
  return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export function Sidebar() {
  const resetChat = useChatStore((s) => s.resetChat);
  const conversationId = useChatStore((s) => s.conversationId);
  const setConversationId = useChatStore((s) => s.setConversationId);
  const isStreaming = useChatStore((s) => s.isStreaming);
  const queryClient = useQueryClient();

  const { data: conversations } = useQuery({
    queryKey: ['conversations'],
    queryFn: getConversations,
    staleTime: 10_000,
  });

  // Refetch conversation list after each stream completes
  useEffect(() => {
    if (!isStreaming) {
      void queryClient.invalidateQueries({ queryKey: ['conversations'] });
    }
  }, [isStreaming, queryClient]);

  function handleNewChat() {
    resetChat();
  }

  function handleSelectConversation(id: string) {
    resetChat();
    setConversationId(id);
  }

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: 'var(--color-surface-sidebar)' }}
    >
      {/* Header */}
      <div
        className="px-3 py-3 flex items-center justify-between"
        style={{ borderBottom: `1px solid var(--color-border)` }}
      >
        <span className="text-sm font-semibold" style={{ color: 'var(--color-text-primary)' }}>
          ChatMe
        </span>
        <button
          onClick={handleNewChat}
          aria-label="New chat"
          title="New chat"
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
          onMouseEnter={(e) => {
            e.currentTarget.style.backgroundColor = 'var(--color-surface)';
            e.currentTarget.style.color = 'var(--color-text-primary)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.backgroundColor = 'transparent';
            e.currentTarget.style.color = 'var(--color-text-secondary)';
          }}
        >
          <SquarePen size={18} />
        </button>
      </div>

      {/* Conversations list */}
      <nav aria-label="Conversation history" className="flex-1 overflow-y-auto px-2 py-3">
        {!conversations || conversations.length === 0 ? (
          <p className="px-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            No conversations yet
          </p>
        ) : (
          <ul className="flex flex-col gap-0.5">
            {conversations.map((c) => {
              const isActive = c.conversation_id === conversationId;
              return (
                <li key={c.conversation_id}>
                  <button
                    onClick={() => handleSelectConversation(c.conversation_id)}
                    title={c.name}
                    className="w-full text-left px-2 py-1.5 rounded-lg text-xs transition-colors"
                    style={{
                      backgroundColor: isActive ? 'var(--color-surface)' : 'transparent',
                      color: isActive ? 'var(--color-text-primary)' : 'var(--color-text-secondary)',
                    }}
                    onMouseEnter={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'var(--color-surface)';
                        e.currentTarget.style.color = 'var(--color-text-primary)';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isActive) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                        e.currentTarget.style.color = 'var(--color-text-secondary)';
                      }
                    }}
                  >
                    <span className="block truncate leading-snug">{c.name}</span>
                    <span className="block mt-0.5 text-[10px]" style={{ color: 'var(--color-text-secondary)' }}>
                      {formatDate(c.updated_at)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </nav>

      {/* Footer */}
      <div
        className="px-3 py-3 flex items-center justify-between"
        style={{ borderTop: `1px solid var(--color-border)` }}
      >
        <ThemeSelector />
        <button
          aria-label="Settings"
          title="Settings"
          className="p-1.5 rounded-md transition-colors"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <Settings size={18} />
        </button>
      </div>
    </div>
  );
}
