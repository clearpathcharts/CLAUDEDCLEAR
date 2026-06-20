import React, { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import { Sliders, Activity, AlertOctagon, HelpCircle, RefreshCw, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface HeatmapDataPoint {
  group: string;
  partition: string;
  latency: number; // in milliseconds
  activeConsumer: string;
  lag: number;
  lastUpdated: string;
}

interface KafkaLatencyHeatmapProps {
  selectedTopic: string;
  activePartitionsCount: number;
}

export default function KafkaLatencyHeatmap({ selectedTopic, activePartitionsCount }: KafkaLatencyHeatmapProps) {
  const d3Container = useRef<SVGSVGElement | null>(null);
  const [latencyProfile, setLatencyProfile] = useState<'healthy' | 'throttled' | 'extreme_spike'>('healthy');
  const [anomalyThreshold, setAnomalyThreshold] = useState<number>(60); // ms
  const [hoveredCell, setHoveredCell] = useState<HeatmapDataPoint | null>(null);
  const [tooltipPos, setTooltipPos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  // Keep track of internal latency measurements simulation state
  const [heatmapData, setHeatmapData] = useState<HeatmapDataPoint[]>([]);

  // Base list of consumer groups targeting the partitions
  const baseConsumerGroups = [
    { id: 'risk-engine-executor', consumers: ['risk-consumer-alpha', 'risk-consumer-beta'] },
    { id: 'portfolio-sync-service', consumers: ['portfolio-consumer-1', 'portfolio-consumer-2'] },
    { id: 'audit-logger', consumers: ['audit-primary'] },
    { id: 'analytics-aggregator', consumers: ['aggregator-worker-1', 'aggregator-worker-2'] }
  ];

  // Initialize/Update heatmap data when state changes
  useEffect(() => {
    const generateData = () => {
      const data: HeatmapDataPoint[] = [];
      const now = new Date();

      baseConsumerGroups.forEach((group) => {
        for (let p = 0; p < activePartitionsCount; p++) {
          let baseLatency = 5; // Healthy
          let lag = 0;

          // Process profiles
          if (latencyProfile === 'throttled') {
            // High latency on some partitions
            baseLatency = group.id === 'risk-engine-executor' ? 85 : 24;
            lag = group.id === 'risk-engine-executor' ? 4 : 1;
          } else if (latencyProfile === 'extreme_spike') {
            // Severe processing spike bottleneck on specific cells
            if (p === 1 && group.id.includes('portfolio')) {
              baseLatency = 245;
              lag = 18;
            } else if (group.id.includes('audit')) {
              baseLatency = 135;
              lag = 9;
            } else {
              baseLatency = Math.random() * 20 + 25;
            }
          } else {
            // Healthy Profile
            baseLatency = Math.random() * 8 + 3; // 3 to 11ms
            if (Math.random() > 0.85) {
              baseLatency += 12; // brief microspikes
            }
          }

          // Distribute active consumers
          const consumerCount = group.consumers.length;
          const assignedConsumer = group.consumers[p % consumerCount] || 'idle-manager';

          data.push({
            group: group.id,
            partition: `Partition ${p}`,
            latency: parseFloat(baseLatency.toFixed(1)),
            activeConsumer: assignedConsumer,
            lag,
            lastUpdated: now.toLocaleTimeString()
          });
        }
      });
      return data;
    };

    setHeatmapData(generateData());

    // Setup periodic small noise fluctuation
    const interval = setInterval(() => {
      setHeatmapData((prev) =>
        prev.map((d) => {
          let fluctuation = 0;
          if (latencyProfile === 'healthy') {
            fluctuation = (Math.random() * 3 - 1.5);
          } else if (latencyProfile === 'throttled') {
            fluctuation = (Math.random() * 12 - 6);
          } else {
            fluctuation = (Math.random() * 30 - 15);
          }
          const nextLatency = Math.max(1.2, d.latency + fluctuation);
          return {
            ...d,
            latency: parseFloat(nextLatency.toFixed(1)),
            lastUpdated: new Date().toLocaleTimeString()
          };
        })
      );
    }, 1500);

    return () => clearInterval(interval);
  }, [latencyProfile, activePartitionsCount]);

  // D3 rendering logic
  useEffect(() => {
    if (!d3Container.current || heatmapData.length === 0) return;

    // Clear previous elements
    d3.select(d3Container.current).selectAll('*').remove();

    const margin = { top: 40, right: 30, bottom: 40, left: 160 };
    const width = 500 - margin.left - margin.right;
    const height = 280 - margin.top - margin.bottom;

    const svg = d3.select(d3Container.current)
      .attr('viewBox', `0 0 ${width + margin.left + margin.right} ${height + margin.top + margin.bottom}`)
      .append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Extract unique labels
    const myGroups = Array.from(new Set(heatmapData.map(d => d.group)));
    const myVars = Array.from(new Set(heatmapData.map(d => d.partition))).sort();

    // Scale axes
    const xScale = d3.scaleBand()
      .range([0, width])
      .domain(myVars)
      .padding(0.08);

    const yScale = d3.scaleBand()
      .range([0, height])
      .domain(myGroups)
      .padding(0.08);

    // Draw grid X-Axis
    svg.append('g')
      .attr('transform', `translate(0, ${height})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .select('.domain').remove();
    
    // Customize X-Axis text
    svg.selectAll('g.tick text')
      .style('fill', '#9ca3af')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '10px');

    // Draw grid Y-Axis
    svg.append('g')
      .call(d3.axisLeft(yScale).tickSize(0))
      .select('.domain').remove();

    svg.selectAll('text')
      .style('fill', '#d1d5db')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '10px');

    // Color scales based on threshold severity (Cyan/Emerald/Orange/Red)
    const colorScale = d3.scaleLinear<string>()
      .domain([0, anomalyThreshold / 2, anomalyThreshold, 150, 250])
      .range(['#10b981', '#14b8a6', '#f59e0b', '#ef4444', '#7f1d1d']);

    // Render cells
    const cells = svg.selectAll()
      .data(heatmapData, (d: any) => d.group + ':' + d.partition)
      .enter()
      .append('rect')
      .attr('x', (d: any) => xScale(d.partition) || 0)
      .attr('y', (d: any) => yScale(d.group) || 0)
      .attr('rx', 6)
      .attr('ry', 6)
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .style('fill', (d: any) => colorScale(d.latency))
      .style('stroke', 'rgba(255, 255, 255, 0.05)')
      .style('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('mouseover', function(event, d: any) {
        d3.select(this)
          .style('stroke', '#ffffff')
          .style('stroke-width', 2);
        setHoveredCell(d);
        // Calculate coords relative to SVG container or client
        const [x, y] = d3.pointer(event, d3Container.current);
        setTooltipPos({ x: x + 20, y: y - 50 });
      })
      .on('mousemove', function(event) {
        const [x, y] = d3.pointer(event, d3Container.current);
        setTooltipPos({ x: x + 20, y: y - 50 });
      })
      .on('mouseleave', function() {
        d3.select(this)
          .style('stroke', 'rgba(255, 255, 255, 0.05)')
          .style('stroke-width', 1);
        setHoveredCell(null);
      });

    // Add overlay text labels indicating latency values directly inside cells
    svg.selectAll()
      .data(heatmapData, (d: any) => d.group + ':' + d.partition)
      .enter()
      .append('text')
      .attr('x', (d: any) => (xScale(d.partition) || 0) + xScale.bandwidth() / 2)
      .attr('y', (d: any) => (yScale(d.group) || 0) + yScale.bandwidth() / 2 + 3)
      .attr('text-anchor', 'middle')
      .text((d: any) => `${d.latency}ms`)
      .style('fill', '#ffffff')
      .style('font-family', 'ui-monospace, monospace')
      .style('font-size', '9px')
      .style('font-weight', 'bold')
      .style('pointer-events', 'none');

    // Add dynamic indicator circles for anomalies
    svg.selectAll()
      .data(heatmapData)
      .enter()
      .filter((d: any) => d.latency > anomalyThreshold)
      .append('circle')
      .attr('cx', (d: any) => (xScale(d.partition) || 0) + xScale.bandwidth() - 10)
      .attr('cy', (d: any) => (yScale(d.group) || 0) + 10)
      .attr('r', 3.5)
      .style('fill', '#f43f5e')
      .style('stroke', '#ffffff')
      .style('stroke-width', 0.8)
      .style('pointer-events', 'none')
      .append('animate')
      .attr('attributeName', 'opacity')
      .attr('values', '0.2;1;0.2')
      .attr('dur', '1.2s')
      .attr('repeatCount', 'indefinite');

  }, [heatmapData, anomalyThreshold]);

  // Identify worst offending bottleneck
  const worstCell = [...heatmapData].sort((a, b) => b.latency - a.latency)[0];

  return (
    <div className="bg-zinc-950/80 p-5 rounded-2xl border border-white/5 space-y-4 text-left" id="latency_heatmap_card">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-white/5 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-rose-500/10 border border-rose-500/30 text-rose-400 rounded-lg">
            <Activity size={14} />
          </span>
          <div>
            <h3 className="text-xs font-black uppercase tracking-widest text-zinc-300 font-mono">D3 Node Latency Heatmap</h3>
            <p className="text-[10px] text-zinc-500 font-mono">Processing performance matrices by Partition * Consumer Group</p>
          </div>
        </div>

        {/* Profile togglers */}
        <div className="flex gap-1.5 font-mono text-[9px]">
          <button
            onClick={() => setLatencyProfile('healthy')}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              latencyProfile === 'healthy'
                ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400 font-bold'
                : 'border-white/5 text-zinc-500 hover:text-white'
            }`}
          >
            Healthy Flow
          </button>
          <button
            onClick={() => setLatencyProfile('throttled')}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              latencyProfile === 'throttled'
                ? 'bg-amber-500/10 border-amber-500/40 text-amber-400 font-bold'
                : 'border-white/5 text-zinc-500 hover:text-white'
            }`}
          >
            Network Throttle
          </button>
          <button
            onClick={() => setLatencyProfile('extreme_spike')}
            className={`px-2.5 py-1 rounded-lg border transition-all ${
              latencyProfile === 'extreme_spike'
                ? 'bg-red-500/10 border-red-500/40 text-rose-400 font-bold'
                : 'border-white/5 text-zinc-500 hover:text-white'
            }`}
          >
            Db Lock Spike
          </button>
        </div>
      </div>

      {/* Slide settings input */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-zinc-950/50 p-3.5 border border-white/5 rounded-xl text-xs font-mono">
        <div className="space-y-1">
          <div className="flex justify-between text-[10px] text-zinc-400 uppercase font-bold">
            <span>Anomaly Alert Trigger:</span>
            <span className="text-rose-400 font-black">{anomalyThreshold}ms</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="15"
              max="150"
              value={anomalyThreshold}
              onChange={(e) => setAnomalyThreshold(Number(e.target.value))}
              className="w-full accent-indigo-500 bg-zinc-900 border border-white/5 h-2 rounded-lg cursor-pointer"
            />
          </div>
          <p className="text-[8px] text-zinc-600 leading-normal">
            Triggers visual blinking indicators when processing latencies exceed this limit threshold.
          </p>
        </div>

        {/* Dynamic Telemetry summary */}
        <div className="bg-zinc-950/80 p-2.5 border border-white/5 rounded-lg flex items-center justify-between">
          <div className="space-y-1 text-left">
            <span className="text-[9px] text-zinc-500 uppercase block">Max Active Bottleneck</span>
            {worstCell ? (
              <div>
                <span className="text-[10px] text-white font-bold block truncate max-w-[130px]">{worstCell.group}</span>
                <span className="text-[9.5px] text-rose-400 font-bold font-mono">
                  {worstCell.partition}: {worstCell.latency}ms
                </span>
              </div>
            ) : (
              <span className="text-zinc-600 italic">None</span>
            )}
          </div>
          <div className="text-right">
            {worstCell && worstCell.latency > anomalyThreshold ? (
              <div className="px-2 py-1 rounded-md bg-rose-500/10 border border-rose-500/30 text-rose-400 text-[8px] font-bold animate-pulse flex items-center gap-1">
                <AlertOctagon size={10} />
                ALERT HIGH LAG
              </div>
            ) : (
              <div className="px-2 py-1 rounded-md bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-[8px] font-bold flex items-center gap-1">
                <Zap size={10} />
                NOMINAL LATENCY
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Main Heatmap Container */}
      <div className="relative bg-zinc-950/70 p-4 border border-white/5 rounded-xl flex justify-center items-center overflow-x-auto">
        <svg
          ref={d3Container}
          style={{ width: '100%', height: 'auto', maxWidth: '640px', minWidth: '400px' }}
        />

        {/* Hover Tooltip Render */}
        <AnimatePresence>
          {hoveredCell && (
            <div
              className="absolute z-50 bg-[#09090f]/95 border border-white/10 rounded-xl p-3.5 shadow-2x shadow-black/80 font-mono text-[10px] space-y-1.5 backdrop-blur-md w-[220px]"
              style={{
                left: `${tooltipPos.x}px`,
                top: `${tooltipPos.y}px`,
                pointerEvents: 'none'
              }}
            >
              <div className="text-emerald-400 border-b border-white/5 pb-1 font-bold truncate">
                {hoveredCell.group}
              </div>
              
              <div className="grid grid-cols-2 gap-1 text-zinc-400">
                <span>Partition:</span>
                <span className="text-white text-right">{hoveredCell.partition}</span>
                
                <span>Active Node:</span>
                <span className="text-white text-right truncate">{hoveredCell.activeConsumer}</span>

                <span>Latency:</span>
                <span className={`text-right font-bold ${hoveredCell.latency > anomalyThreshold ? 'text-rose-400' : 'text-emerald-400'}`}>
                  {hoveredCell.latency}ms
                </span>

                <span>Pending Lag:</span>
                <span className={`text-right font-bold ${hoveredCell.lag > 0 ? 'text-amber-400 font-black' : 'text-zinc-500'}`}>
                  {hoveredCell.lag} ev
                </span>

                <span>Last Ping:</span>
                <span className="text-zinc-500 text-right">{hoveredCell.lastUpdated}</span>
              </div>
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex justify-between text-[9px] font-mono text-zinc-600">
        <span className="flex items-center gap-1">
          <HelpCircle size={11} className="text-zinc-500" />
          Click healthy flow profile to reset standard telemetry matrices
        </span>
        <span className="text-zinc-500">Latency Range: 1ms - 300ms</span>
      </div>
    </div>
  );
}
