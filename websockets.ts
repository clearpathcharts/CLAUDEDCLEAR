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
