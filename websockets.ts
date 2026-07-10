import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';

let wssInstance: WebSocketServer | null = null;

interface SocialPost {
  id: string;
  platform: 'x' | 'discord' | 'stocktwits' | 'linkedin';
  handle: string;
  avatar?: string;
  text: string;
  timestamp: number;
}

// Initial default social posts
let activeSocialPosts: SocialPost[] = [
  { id: 'p1', platform: 'x', handle: '@CryptoWhaleCPMS', text: '📈 BTC/USD break out confirmed through master zone resistance node. Volume validation complete.', timestamp: Date.now() - 3600000 },
  { id: 'p2', platform: 'stocktwits', handle: 'PatternSurfer', text: 'Bullish divergence forming on $TSLA relative to the CPM-6 Support. Ready to launch.', timestamp: Date.now() - 1800000 },
  { id: 'p3', platform: 'discord', handle: 'ExecutiveTradeDesk', text: '🎙 Connecting to terminal voice node #04 for Live Capital Flow session starting in 5 mins.', timestamp: Date.now() - 900000 },
  { id: 'p4', platform: 'linkedin', handle: 'Apex Capital Partners', text: 'Announcing our institutional integration with Clear Path Markets Science Reader terminal layer.', timestamp: Date.now() - 450000 }
];

export interface ChatRoomMessage {
  id: string;
  roomId: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
}

const CHAT_ROOM_SEEDS: Record<string, ChatRoomMessage[]> = {
  lobby: [
    { id: 'lobby-1', roomId: 'lobby', author: 'ClearPath Host', text: 'Welcome to the public trading lobby. Create a free account to unlock private guilds.', timestamp: Date.now() - 7200000, isSystem: true },
    { id: 'lobby-2', roomId: 'lobby', author: 'MacroMaven', text: 'Anyone watching the 10Y auction today? Curve looks stressed.', timestamp: Date.now() - 3600000 },
    { id: 'lobby-3', roomId: 'lobby', author: 'FX_Scout', text: 'EURUSD holding the London open range — patience on breakouts.', timestamp: Date.now() - 1800000 },
  ],
  'macro-minds': [
    { id: 'macro-1', roomId: 'macro-minds', author: 'YieldWatcher', text: '2s10s inversion tightening again. Risk-off tone into NY.', timestamp: Date.now() - 5400000 },
    { id: 'macro-2', roomId: 'macro-minds', author: 'SovereignDesk', text: 'Watching DXY 104.20 as the line in the sand this week.', timestamp: Date.now() - 2400000 },
  ],
  'forex-syndicate': [
    { id: 'fx-1', roomId: 'forex-syndicate', author: 'SessionHunter', text: 'Asia sweep on GBPUSD cleared — watching 1.2680 reaction.', timestamp: Date.now() - 4200000 },
    { id: 'fx-2', roomId: 'forex-syndicate', author: 'PipArchitect', text: 'NY overlap volatility window opens in 40 minutes.', timestamp: Date.now() - 1200000 },
  ],
  'liquidity-alchemists': [
    { id: 'liq-1', roomId: 'liquidity-alchemists', author: 'RepoRadar', text: 'Overnight RRP usage ticked lower — liquidity pulse improving.', timestamp: Date.now() - 3000000 },
  ],
};

const chatRoomMessages: Record<string, ChatRoomMessage[]> = Object.fromEntries(
  Object.entries(CHAT_ROOM_SEEDS).map(([roomId, messages]) => [roomId, [...messages]])
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

  wss.on('connection', (ws: WebSocket) => {
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

    // Simulate real-time institutional news pushes
    const newsInterval = setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'NEWS_UPDATE',
          data: {
            title: 'Institutional Liquidity Shift Detected',
            source: 'Clear Path Markets Science Engine',
            impact: 'High',
            timestamp: Date.now()
          }
        }));
      }
    }, 15000);

    // Simulate real-time price alerts or system heartbeats
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
        const parsed = JSON.parse(message);
        console.log('Received from client:', parsed);
        
        if (parsed.type === 'SOCIAL_CONNECT') {
          // Broadcast that user connected to gateway
          broadcastToAll({
            type: 'SOCIAL_CONNECT_BROADCAST',
            platform: parsed.platform,
            handle: parsed.handle,
            timestamp: Date.now()
          });
        } else if (parsed.type === 'SOCIAL_POST') {
          const newPost: SocialPost = {
            id: 'post_' + Math.random().toString(36).substr(2, 9),
            platform: parsed.platform,
            handle: parsed.handle,
            text: parsed.text,
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
      clearInterval(newsInterval);
      clearInterval(heartbeatInterval);
      leaveAllChatRooms(ws);
    });

    ws.on('error', (error) => {
      console.error('WebSocket Error:', error);
    });
  });

  // Start Finnhub Connection or Simulation
  const apiKey = process.env.FINNHUB_API_KEY;
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
