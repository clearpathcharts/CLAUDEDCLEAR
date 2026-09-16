'use client';

import { useEffect, useState } from 'react';

interface Trade {
  p: number;
  s: string;
  t: number;
}

export default function ClearPathLiveTicker({
  symbol,
}: {
  symbol: string;
}) {
  const [price, setPrice] = useState<number | null>(null);
  const [status, setStatus] = useState('Connecting');

  useEffect(() => {
    let socket: WebSocket;

    const connect = () => {
      // Intelligently fallback from localhost:3001 to standard portal websocket (port 3000) 
      // which we've upgraded to also feed live Finnhub data!
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      
      const targetUrl = host.includes('localhost')
        ? 'ws://localhost:3001'
        : `${protocol}//${host}`;

      socket = new WebSocket(targetUrl);

      socket.onopen = () => {
        setStatus('Live');
      };

      socket.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);

          // Finnhub payload: array of trades
          if (parsed?.data?.length > 0) {
            const trade: Trade = parsed.data.find(
              (t: Trade) => t.s.toLowerCase() === symbol.toLowerCase()
            );

            if (trade?.p) {
              setPrice(trade.p);
            }
          }
        } catch (err) {
          console.error(err);
        }
      };

      socket.onclose = () => {
        setStatus('Reconnecting');

        setTimeout(() => {
          connect();
        }, 3000);
      };

      socket.onerror = () => {
        socket.close();
      };
    };

    connect();

    return () => {
      socket?.close();
    };
  }, [symbol]);

  return (
    <div className="bg-black/50 backdrop-blur-md border border-zinc-950 rounded-2xl p-5 w-full shadow-2xl flex flex-col justify-between hover:border-zinc-800 transition-all duration-300">
      <div className="flex justify-between items-center">
        <h2 className="text-zinc-400 text-xs font-mono font-black tracking-widest uppercase">
          {symbol}
        </h2>

        <div className="flex items-center space-x-1.5">
          <span className={`w-2 h-2 rounded-full ${
            status === 'Live' ? 'bg-emerald-500 animate-pulse' : 'bg-yellow-500'
          }`} />
          <span
            className={`text-[9px] font-mono font-black uppercase tracking-wider ${
              status === 'Live'
                ? 'text-emerald-400'
                : 'text-yellow-400'
            }`}
          >
            {status}
          </span>
        </div>
      </div>

      <div className="mt-4 text-3xl font-mono font-black text-white tracking-tight">
        {price ? `$${price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '--'}
      </div>
    </div>
  );
}
