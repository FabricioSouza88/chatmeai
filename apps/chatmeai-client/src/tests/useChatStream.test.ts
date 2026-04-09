import { renderHook, act } from '@testing-library/react'
import { useChatStream } from '@/hooks/useChatStream'
import { useChatStore } from '@/store/useChatStore'
import * as chatService from '@/services/chatService'
import type { ChatEvent } from '@/types/chat'

vi.mock('@/services/chatService')

beforeEach(() => {
  vi.clearAllMocks()
})

async function* makeStream(events: ChatEvent[]): AsyncGenerator<ChatEvent> {
  for (const event of events) {
    yield event
  }
}

beforeEach(() => {
  useChatStore.setState({
    messages: [],
    isStreaming: false,
    isThinking: false,
    conversationId: null,
    addMessage: useChatStore.getState().addMessage,
    appendDelta: useChatStore.getState().appendDelta,
    setStreaming: useChatStore.getState().setStreaming,
    setThinking: useChatStore.getState().setThinking,
    resetChat: useChatStore.getState().resetChat,
    setConversationId: useChatStore.getState().setConversationId,
  })
})

describe('useChatStream', () => {
  it('adds user and assistant messages on send', async () => {
    vi.spyOn(chatService, 'streamChat').mockImplementation(() =>
      makeStream([{ type: 'done', finish_reason: 'stop' }])
    )
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('Hello'))
    const messages = useChatStore.getState().messages
    expect(messages[0].role).toBe('user')
    expect(messages[0].content).toBe('Hello')
    expect(messages[1].role).toBe('assistant')
  })

  it('appends content_delta to assistant message', async () => {
    vi.spyOn(chatService, 'streamChat').mockImplementation(() =>
      makeStream([
        { type: 'content_delta', delta: 'Hi' },
        { type: 'content_delta', delta: ' there' },
        { type: 'done', finish_reason: 'stop' },
      ])
    )
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('Hello'))
    const assistant = useChatStore.getState().messages.find((m) => m.role === 'assistant')
    expect(assistant?.content).toBe('Hi there')
  })

  it('sets isThinking true on thinking event, false on content_delta', async () => {
    const thinkingStates: boolean[] = []
    vi.spyOn(chatService, 'streamChat').mockImplementation(async function* () {
      yield { type: 'thinking' } as ChatEvent
      thinkingStates.push(useChatStore.getState().isThinking)
      yield { type: 'content_delta', delta: 'ok' } as ChatEvent
      thinkingStates.push(useChatStore.getState().isThinking)
      yield { type: 'done', finish_reason: 'stop' } as ChatEvent
    })
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('Hi'))
    expect(thinkingStates[0]).toBe(true)
    expect(thinkingStates[1]).toBe(false)
  })

  it('resets isStreaming to false after done', async () => {
    vi.spyOn(chatService, 'streamChat').mockImplementation(() =>
      makeStream([{ type: 'done', finish_reason: 'stop' }])
    )
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('Hi'))
    expect(useChatStore.getState().isStreaming).toBe(false)
  })

  it('stores conversation_id from session_start and adds no extra message', async () => {
    const testId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    vi.spyOn(chatService, 'streamChat').mockImplementation(() =>
      makeStream([
        { type: 'session_start', conversation_id: testId },
        { type: 'content_delta', delta: 'Paris.' },
        { type: 'done', finish_reason: 'stop' },
      ])
    )
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('Qual a capital da França?'))
    expect(useChatStore.getState().conversationId).toBe(testId)
    const roles = useChatStore.getState().messages.map((m) => m.role)
    expect(roles).toEqual(['user', 'assistant'])
  })

  it('sends conversation_id on subsequent messages', async () => {
    const testId = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890'
    useChatStore.setState({ conversationId: testId })
    const spy = vi.spyOn(chatService, 'streamChat').mockImplementation(() =>
      makeStream([{ type: 'done', finish_reason: 'stop' }])
    )
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('E qual a população?'))
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ conversationId: testId })
    )
  })

  it('does not send when already streaming', async () => {
    const spy = vi.spyOn(chatService, 'streamChat').mockImplementation(() => makeStream([]))
    useChatStore.setState({ isStreaming: true })
    const { result } = renderHook(() => useChatStream())
    await act(() => result.current.send('Hi'))
    expect(spy).not.toHaveBeenCalled()
  })
})
