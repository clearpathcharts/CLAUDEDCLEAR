import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

const generateData = (startValue: number) => {
  let currentValue = startValue;
  const data = [];
  const now = Date.now();
  for (let i = 60; i >= 0; i--) {
    data.push({
      time: new Date(now - i * 1000 * 60 * 60).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      value: currentValue
    });
    currentValue = currentValue + (Math.random() - 0.48) * (startValue * 0.05);
  }
  return data;
};

export const CustomChartWidget = ({ config }: any) => {
  const symbol = config?.symbol || 'BTCUSDT';
  const startValue = symbol.includes('BTC') ? 65000 : symbol.includes('AAPL') ? 180 : 100;
  
  const [data, setData] = useState(() => generateData(startValue));

  useEffect(() => {
    const interval = setInterval(() => {
      setData(prev => {
        const newData = [...prev.slice(1)];
        const lastValue = newData[newData.length - 1].value;
        newData.push({
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          value: lastValue + (Math.random() - 0.48) * (startValue * 0.05)
        });
        return newData;
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [startValue]);

  const latestValue = data[data.length - 1].value;
  const prevValue = data[data.length - 2].value;
  const isUp = latestValue >= prevValue;

  return (
    <div className="w-full h-full bg-[#111] flex flex-col pointer-events-auto p-4 rounded-xl border border-[#333]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-white font-bold text-lg tracking-wider">{symbol.split(':').pop()}</h2>
          <div className="text-gray-400 text-xs flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
            LIVE INTERNAL CHART
          </div>
        </div>
        <div className="text-right">
          <div className={`text-2xl font-black tabular-nums ${isUp ? 'text-green-400' : 'text-red-400'}`}>
            ${latestValue.toFixed(2)}
          </div>
          <div className={`text-xs ${isUp ? 'text-green-500' : 'text-red-500'}`}>
            {isUp ? '+' : ''}{(latestValue - prevValue).toFixed(2)} ({( ((latestValue - prevValue)/prevValue) * 100).toFixed(2)}%)
          </div>
        </div>
      </div>
      
      <div className="flex-1 w-full min-h-[200px]">
        <ResponsiveContainer width="100%" height="100%" minWidth={1} minHeight={1}>
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isUp ? "#4ade80" : "#f87171"} stopOpacity={0.8}/>
                <stop offset="95%" stopColor={isUp ? "#4ade80" : "#f87171"} stopOpacity={0}/>
              </linearGradient>
            </defs>
            <XAxis dataKey="time" hide />
            <YAxis domain={['auto', 'auto']} hide />
            <Tooltip 
              contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '8px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value: any) => [`$${Number(value).toFixed(2)}`, 'Price']}
            />
            <Area 
              type="monotone" 
              dataKey="value" 
              stroke={isUp ? "#4ade80" : "#f87171"} 
              strokeWidth={3}
              fillOpacity={1} 
              fill="url(#colorValue)" 
              isAnimationActive={false}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};
