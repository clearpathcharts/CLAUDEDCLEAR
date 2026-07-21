import { useCallback, useEffect, useRef, useState } from 'react';

export interface ChatRoomMessage {
  id: string;
  roomId: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

export type ChatConnectionStatus = 'ONLINE' | 'CONNECTING' | 'OFFLINE';

const HANDLE_KEY = 'cp_chat_handle';
const AVATAR_KEY = 'cp_chat_avatar';

export function getChatHandle(): string {
  if (typeof window === 'undefined') return 'Guest';
  const saved = localStorage.getItem(HANDLE_KEY);
  if (saved?.trim()) return saved.trim().slice(0, 32);
  const generated = `Trader_${Math.floor(1000 + Math.random() * 9000)}`;
  localStorage.setItem(HANDLE_KEY, generated);
  return generated;
}

export function setChatHandle(handle: string) {
  localStorage.setItem(HANDLE_KEY, handle.trim().slice(0, 32));
}

function getChatAvatarSeed(handle: string): string {
  const saved = localStorage.getItem(AVATAR_KEY);
  if (saved) return saved;
  const seed = handle.slice(0, 2).toUpperCase();
  localStorage.setItem(AVATAR_KEY, seed);
  return seed;
}

export function useChatRoom(roomId: string) {
  const [messages, setMessages] = useState<ChatRoomMessage[]>([]);
  const [status, setStatus] = useState<ChatConnectionStatus>('CONNECTING');
  const [onlineCount, setOnlineCount] = useState(0);
  const [handle, setHandle] = useState(getChatHandle);
  const wsRef = useRef<WebSocket | null>(null);
  const roomRef = useRef(roomId);
  const joinedRef = useRef(false);

  const joinRoom = useCallback((socket: WebSocket, nextRoomId: string) => {
    if (joinedRef.current && roomRef.current !== nextRoomId) {
      socket.send(JSON.stringify({ type: 'CHAT_ROOM_LEAVE', roomId: roomRef.current }));
      joinedRef.current = false;
    }
    roomRef.current = nextRoomId;
    if (!joinedRef.current) {
      socket.send(JSON.stringify({ type: 'CHAT_ROOM_JOIN', roomId: nextRoomId }));
      joinedRef.current = true;
    }
  }, []);

  useEffect(() => {
    let socket: WebSocket | null = null;
    let reconnectTimeout: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const connect = () => {
      if (cancelled) return;
      setStatus('CONNECTING');
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        socket = new WebSocket(`${protocol}//${window.location.host}`);
        wsRef.current = socket;

        socket.onopen = () => {
          if (cancelled) return;
          setStatus('ONLINE');
          joinedRef.current = false;
          joinRoom(socket!, roomId);
        };

        socket.onmessage = (event) => {
          try {
            const parsed = JSON.parse(event.data);
            if (parsed.type === 'CHAT_ROOM_HISTORY' && parsed.roomId === roomRef.current) {
              setMessages(Array.isArray(parsed.messages) ? parsed.messages : []);
              setOnlineCount(typeof parsed.onlineCount === 'number' ? parsed.onlineCount : 0);
            } else if (parsed.type === 'CHAT_ROOM_MESSAGE_BROADCAST' && parsed.message?.roomId === roomRef.current) {
              setMessages((prev) => [...prev, parsed.message as ChatRoomMessage].slice(-120));
              if (typeof parsed.onlineCount === 'number') setOnlineCount(parsed.onlineCount);
            } else if (parsed.type === 'CHAT_ROOM_PRESENCE' && parsed.roomId === roomRef.current) {
              if (typeof parsed.onlineCount === 'number') setOnlineCount(parsed.onlineCount);
            }
          } catch {
            // ignore malformed packets
          }
        };

        socket.onclose = () => {
          if (cancelled) return;
          setStatus('OFFLINE');
          joinedRef.current = false;
          reconnectTimeout = setTimeout(connect, 5000);
        };
      } catch {
        setStatus('OFFLINE');
        reconnectTimeout = setTimeout(connect, 5000);
      }
    };

    connect();

    return () => {
      cancelled = true;
      if (reconnectTimeout) clearTimeout(reconnectTimeout);
      if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'CHAT_ROOM_LEAVE', roomId: roomRef.current }));
      }
      socket?.close();
      wsRef.current = null;
    };
  }, [joinRoom, roomId]);

  useEffect(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      joinedRef.current = false;
      joinRoom(wsRef.current, roomId);
    }
  }, [roomId, joinRoom]);

  const sendMessage = useCallback((text: string) => {
    const trimmed = text.trim();
    if (!trimmed || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return false;

    wsRef.current.send(JSON.stringify({
      type: 'CHAT_ROOM_MESSAGE',
      roomId: roomRef.current,
      author: handle,
      avatar: getChatAvatarSeed(handle),
      text: trimmed,
    }));
    return true;
  }, [handle]);

  const updateHandle = useCallback((next: string) => {
    const clean = next.trim().slice(0, 32);
    if (!clean) return;
    setChatHandle(clean);
    setHandle(clean);
  }, []);

  return {
    messages,
    status,
    onlineCount,
    handle,
    sendMessage,
    updateHandle,
    isOwnMessage: (author: string) => author === handle,
  };
}
