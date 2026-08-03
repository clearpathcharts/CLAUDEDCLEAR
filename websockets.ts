import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import { getFinnhubApiKey } from './src/server/secrets';
import { screenCommunityMessage } from './src/server/botQuarantineService';

let wssInstance: WebSocketServer | null = null;

interface SocialPost {
  id: string;
  platform: 'x' | 'discord' | 'stocktwits' | 'linkedin';
  handle: string;
  avatar?: string;
  text: string;
  timestamp: number;
}

/** Live social posts only — no seeded fake people. */
let activeSocialPosts: SocialPost[] = [];

/** Per-socket sliding window to limit chat/social spam. */
const WS_MSG_LIMIT = 30;
const WS_MSG_WINDOW_MS = 60_000;

function allowWsMessage(ws: WebSocket): boolean {
  const now = Date.now();
  let stamps: number[] = (ws as any).__cpMsgStamps || [];
  stamps = stamps.filter((t) => now - t < WS_MSG_WINDOW_MS);
  if (stamps.length >= WS_MSG_LIMIT) {
    (ws as any).__cpMsgStamps = stamps;
    return false;
  }
  stamps.push(now);
  (ws as any).__cpMsgStamps = stamps;
  return true;
}

export interface ChatRoomMessage {
  id: string;
  roomId: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

/** Rooms start empty — no seeded fake people or demo conversations. */
const CHAT_ROOM_IDS = ['lobby', 'macro-minds', 'forex-syndicate', 'liquidity-alchemists'] as const;

const chatRoomMessages: Record<string, ChatRoomMessage[]> = Object.fromEntries(
  CHAT_ROOM_IDS.map((roomId) => [roomId, [] as ChatRoomMessage[]])
);

const chatRoomOnline: Record<string, Set<WebSocket>> = {};

function ensureChatRoom(roomId: string): ChatRoomMessage[] {
  if (!chatRoomMessages[roomId]) {
    chatRoomMessages[roomId] = [];
  }
  return chatRoomMessages[roomId];
}

function getChatRoomOnlineCount(roomId: string): number {
  return chatRoomOnline[roomId]?.size ?? 0;
}

function joinChatRoom(ws: WebSocket, roomId: string) {
  if (!chatRoomOnline[roomId]) {
    chatRoomOnline[roomId] = new Set();
  }
  chatRoomOnline[roomId].add(ws);
  (ws as any).__chatRooms = (ws as any).__chatRooms || new Set<string>();
  (ws as any).__chatRooms.add(roomId);
}

function leaveChatRoom(ws: WebSocket, roomId: string) {
  chatRoomOnline[roomId]?.delete(ws);
  (ws as any).__chatRooms?.delete(roomId);
}

function leaveAllChatRooms(ws: WebSocket) {
  const rooms: Set<string> | undefined = (ws as any).__chatRooms;
  if (!rooms) return;
  rooms.forEach((roomId) => leaveChatRoom(ws, roomId));
}

function broadcastChatRoom(roomId: string, payload: Record<string, unknown>) {
  const members = chatRoomOnline[roomId];
  if (!members) return;
  const message = JSON.stringify(payload);
  members.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}

/**
 * WebSocket Server for Institutional Data Streams.
 * Handles real-time pushes for prices, news, and system alerts.
 */
export function setupWebSockets(server: Server) {
  const wss = new WebSocketServer({ server });
  wssInstance = wss;

  wss.on('connection', (ws: WebSocket, req) => {
    const forwarded = String(req.headers['x-forwarded-for'] || '')
      .split(',')[0]
      .trim();
    (ws as any).__cpRemoteIp = forwarded || req.socket.remoteAddress || '';

    // Send initial welcome message
    ws.send(JSON.stringify({
      type: 'SYSTEM',
      message: 'Connected to Clear Path Markets Science Institutional Data Stream v4.2.0',
      timestamp: Date.now()
    }));

    // Send active social posts to the newly connected client
    ws.send(JSON.stringify({
      type: 'ACTIVE_SOCIAL_POSTS',
      posts: activeSocialPosts,
      timestamp: Date.now()
    }));

    // Heartbeat only — no fake news spam
    const heartbeatInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'HEARTBEAT',
          status: 'HEALTHY',
          latency: '0.8ms',
          timestamp: Date.now()
        }));
      }
    }, 5000);

    ws.on('message', (message: string) => {
      try {
        if (!allowWsMessage(ws)) {
          ws.send(JSON.stringify({
            type: 'RATE_LIMIT',
            error: 'Too many websocket messages. Slow down.',
            timestamp: Date.now(),
          }));
          return;
        }

        const parsed = JSON.parse(message);

        if (parsed.type === 'SOCIAL_CONNECT') {
          // Broadcast that user connected to gateway
          broadcastToAll({
            type: 'SOCIAL_CONNECT_BROADCAST',
            platform: parsed.platform,
            handle: parsed.handle,
            timestamp: Date.now()
          });
        } else if (parsed.type === 'SOCIAL_POST') {
          const text = String(parsed.text || '').trim().slice(0, 2000);
          if (!text) return;
          const handle = String(parsed.handle || 'Guest').slice(0, 64);
          const screen = screenCommunityMessage({
            uid: parsed.userId ? String(parsed.userId).slice(0, 128) : undefined,
            handle,
            text,
            channel: `social:${String(parsed.platform || 'x')}`,
            ipAddress: (ws as any).__cpRemoteIp,
          });
          if (screen.allowed === false) {
            ws.send(JSON.stringify({
              type: 'COMMUNITY_LOCKED',
              reason: screen.reason,
              message: screen.message,
              expiresAt: screen.record.expiresAt,
              featuresAllowed: true,
              timestamp: Date.now(),
            }));
            return;
          }
          const newPost: SocialPost = {
            id: 'post_' + Math.random().toString(36).slice(2, 11),
            platform: parsed.platform,
            handle,
            text,
            timestamp: Date.now()
          };

          // Prepend and keep latest 50
          activeSocialPosts = [newPost, ...activeSocialPosts].slice(0, 50);
          
          // Broadcast post to everyone
          broadcastToAll({
            type: 'SOCIAL_POST_BROADCAST',
            post: newPost,
            timestamp: Date.now()
          });
        } else if (parsed.type === 'CHAT_ROOM_JOIN') {
          const roomId = String(parsed.roomId || 'lobby').slice(0, 64);
          joinChatRoom(ws, roomId);
          const history = ensureChatRoom(roomId);
          ws.send(JSON.stringify({
            type: 'CHAT_ROOM_HISTORY',
            roomId,
            messages: history.slice(-80),
            onlineCount: getChatRoomOnlineCount(roomId),
            timestamp: Date.now()
          }));
          broadcastChatRoom(roomId, {
            type: 'CHAT_ROOM_PRESENCE',
            roomId,
            onlineCount: getChatRoomOnlineCount(roomId),
            timestamp: Date.now()
          });
        } else if (parsed.type === 'CHAT_ROOM_LEAVE') {
          const roomId = String(parsed.roomId || 'lobby').slice(0, 64);
          leaveChatRoom(ws, roomId);
          broadcastChatRoom(roomId, {
            type: 'CHAT_ROOM_PRESENCE',
            roomId,
            onlineCount: getChatRoomOnlineCount(roomId),
            timestamp: Date.now()
          });
        } else if (parsed.type === 'CHAT_ROOM_MESSAGE') {
          const roomId = String(parsed.roomId || 'lobby').slice(0, 64);
          const text = String(parsed.text || '').trim().slice(0, 2000);
          const author = String(parsed.author || 'Guest').trim().slice(0, 64);
          if (!text) return;

          const screen = screenCommunityMessage({
            uid: parsed.userId ? String(parsed.userId).slice(0, 128) : undefined,
            handle: author,
            text,
            channel: `chat:${roomId}`,
            ipAddress: (ws as any).__cpRemoteIp,
          });
          if (screen.allowed === false) {
            ws.send(JSON.stringify({
              type: 'COMMUNITY_LOCKED',
              reason: screen.reason,
              message: screen.message,
              expiresAt: screen.record.expiresAt,
              roomId,
              featuresAllowed: true,
              timestamp: Date.now(),
            }));
            return;
          }

          joinChatRoom(ws, roomId);
          const newMessage: ChatRoomMessage = {
            id: 'chat_' + Math.random().toString(36).slice(2, 11),
            roomId,
            author,
            avatar: parsed.avatar ? String(parsed.avatar).slice(0, 8) : undefined,
            text,
            timestamp: Date.now()
          };

          const room = ensureChatRoom(roomId);
          room.push(newMessage);
          if (room.length > 120) {
            room.splice(0, room.length - 120);
          }

          broadcastChatRoom(roomId, {
            type: 'CHAT_ROOM_MESSAGE_BROADCAST',
            message: newMessage,
            onlineCount: getChatRoomOnlineCount(roomId),
            timestamp: Date.now()
          });
        } else {
          // Echo back generic ACK
          ws.send(JSON.stringify({
            type: 'ACK',
            received: parsed.type,
            timestamp: Date.now()
          }));
        }
      } catch (e) {
        console.error('Failed to parse client message');
      }
    });

    ws.on('close', () => {
      clearInterval(heartbeatInterval);
      leaveAllChatRooms(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket Error:', error);
    });
  });

  // Start Finnhub Connection or Simulation
  const apiKey = getFinnhubApiKey();
  if (apiKey) {
    console.log("🔌 [Finnhub Connection] Initializing streaming API tunnel...");
    // Open standard connection to Finnhub as requested
    const finnhubSocket = new WebSocket(`wss://ws.finnhub.io?token=${apiKey}`);
    
    finnhubSocket.on('open', () => {
      console.log('✅ Main server proxy connected to Finnhub');
      finnhubSocket.send(JSON.stringify({ type: 'subscribe', symbol: 'AAPL' }));
      finnhubSocket.send(JSON.stringify({ type: 'subscribe', symbol: 'BTCUSD' }));
      finnhubSocket.send(JSON.stringify({ type: 'subscribe', symbol: 'MSFT' }));
    });
    
    finnhubSocket.on('message', (data) => {
      try {
        const parsed = JSON.parse(data.toString());
        if (parsed?.data) {
          // Broadcast to all clients connected to port 3000
          broadcastToAll(parsed);
        }
      } catch (err) {
        console.error('Error parsing Finnhub on main socket:', err);
      }
    });

    finnhubSocket.on('close', () => {
      console.log('🔌 Finnhub main tunnel disconnected');
    });

    finnhubSocket.on('error', (err) => {
      console.error('Finnhub connection error on main socket:', err);
    });
  } else {
    // Simulated WebSocket ticker pipelines are disabled under compliance mode
    console.log("⚠️ [Finnhub Simulator] Simulated WebSocket ticker pipelines are disabled under compliance mode.");
  }

  return wss;
}

export function broadcastToAll(data: any) {
  if (!wssInstance) return;
  const message = JSON.stringify(data);
  wssInstance.clients.forEach((client) => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  });
}
