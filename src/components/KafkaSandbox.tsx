import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, 
  Pause, 
  Send, 
  Settings, 
  RefreshCw, 
  Cpu, 
  Layers, 
  Database, 
  CheckCircle2, 
  Clock, 
  AlertTriangle, 
  Grid, 
  Users, 
  Plus, 
  Trash2, 
  Zap, 
  Terminal as TerminalIcon, 
  Sliders, 
  FileText, 
  Key, 
  ArrowRight,
  Info 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import KafkaLatencyHeatmap from './KafkaLatencyHeatmap';

// Type definitions for Kafka Sandbox
interface KafkaMessage {
  id: string;
  offset: number;
  timestamp: number;
  key: string;
  payload: Record<string, any>;
  partition: number;
}

interface Partition {
  id: number;
  leader: string; // "Broker-1", "Broker-2", etc.
  replicas: string[];
  isr: string[];
  messages: KafkaMessage[];
  lastOffset: number;
}

interface Topic {
  name: string;
  partitions: Partition[];
  schemaType: 'JSON' | 'AVRO' | 'PROTOBUF';
}

interface Consumer {
  id: string;
  status: 'idle' | 'polling' | 'processing' | 'paused' | 'failed';
  assignedPartitions: number[];
  processedCount: number;
}

interface ConsumerGroup {
  id: string;
  topic: string;
  consumers: Consumer[];
  autoCommit: boolean;
  commitInterval: number; // ms
  offsets: Record<number, number>; // Partition ID -> Committed Offset
}

export default function KafkaSandbox() {
  // Topics available in CPMS Inner Kafka cluster
  const [topics, setTopics] = useState<Topic[]>([
    {
      name: 'order-events',
      schemaType: 'JSON',
      partitions: [
        { id: 0, leader: 'Broker-101', replicas: ['Broker-101', 'Broker-102'], isr: ['Broker-101', 'Broker-102'], messages: [], lastOffset: -1 },
        { id: 1, leader: 'Broker-102', replicas: ['Broker-102', 'Broker-103'], isr: ['Broker-102', 'Broker-103'], messages: [], lastOffset: -1 },
        { id: 2, leader: 'Broker-103', replicas: ['Broker-103', 'Broker-101'], isr: ['Broker-103', 'Broker-101'], messages: [], lastOffset: -1 },
      ]
    },
    {
      name: 'market-ticks',
      schemaType: 'AVRO',
      partitions: [
        { id: 0, leader: 'Broker-102', replicas: ['Broker-102', 'Broker-103'], isr: ['Broker-102', 'Broker-103'], messages: [], lastOffset: -1 },
        { id: 1, leader: 'Broker-103', replicas: ['Broker-103', 'Broker-101'], isr: ['Broker-103', 'Broker-101'], messages: [], lastOffset: -1 },
        { id: 2, leader: 'Broker-101', replicas: ['Broker-101', 'Broker-102'], isr: ['Broker-101', 'Broker-102'], messages: [], lastOffset: -1 },
      ]
    },
    {
      name: 'system-alerts',
      schemaType: 'PROTOBUF',
      partitions: [
        { id: 0, leader: 'Broker-103', replicas: ['Broker-103', 'Broker-101'], isr: ['Broker-103', 'Broker-101'], messages: [], lastOffset: -1 },
        { id: 1, leader: 'Broker-101', replicas: ['Broker-101', 'Broker-102'], isr: ['Broker-101', 'Broker-102'], messages: [], lastOffset: -1 },
        { id: 2, leader: 'Broker-102', replicas: ['Broker-102', 'Broker-103'], isr: ['Broker-102', 'Broker-103'], messages: [], lastOffset: -1 },
      ]
    }
  ]);

  const [selectedTopicName, setSelectedTopicName] = useState<string>('order-events');
  const [selectedPartitionId, setSelectedPartitionId] = useState<number>(0);

  // Producer state
  const [isAutoProducing, setIsAutoProducing] = useState(false);
  const [productionThrottle, setProductionThrottle] = useState<'normal' | 'high'>('normal'); // normal = 2s, high = 500ms
  const [customKey, setCustomKey] = useState('user_772');
  const [customPayload, setCustomPayload] = useState('{\n  "asset": "AAPL",\n  "qty": 150,\n  "side": "BUY",\n  "price": 178.45,\n  "trader": "CPMS_CORE"\n}');

  // Consumer state
  const [consumerGroups, setConsumerGroups] = useState<ConsumerGroup[]>([
    {
      id: 'risk-engine-executor',
      topic: 'order-events',
      autoCommit: true,
      commitInterval: 1000,
      offsets: { 0: -1, 1: -1, 2: -1 },
      consumers: [
        { id: 'risk-consumer-alpha', status: 'idle', assignedPartitions: [0, 1], processedCount: 0 },
        { id: 'risk-consumer-beta', status: 'idle', assignedPartitions: [2], processedCount: 0 },
      ]
    },
    {
      id: 'portfolio-sync-service',
      topic: 'order-events',
      autoCommit: true,
      commitInterval: 2000,
      offsets: { 0: -1, 1: -1, 2: -1 },
      consumers: [
        { id: 'portfolio-consumer-1', status: 'idle', assignedPartitions: [0], processedCount: 0 },
        { id: 'portfolio-consumer-2', status: 'idle', assignedPartitions: [1, 2], processedCount: 0 },
      ]
    },
    {
      id: 'audit-logger',
      topic: 'system-alerts',
      autoCommit: false,
      commitInterval: 1500,
      offsets: { 0: -1, 1: -1, 2: -1 },
      consumers: [
        { id: 'audit-primary', status: 'idle', assignedPartitions: [0, 1, 2], processedCount: 0 }
      ]
    }
  ]);

  // Terminal Logs
  const [terminalLogs, setTerminalLogs] = useState<string[]>([
    `[${new Date().toLocaleTimeString()}] [CLUSTER] Broker-101, Broker-102, Broker-103 ready. KRaft consensus active.`,
    `[${new Date().toLocaleTimeString()}] [CLUSTER] Schema Registry online on https://schema.cpms-markets.com:8081`
  ]);

  // Stats
  const [stats, setStats] = useState({
    eventsProduced: 0,
    eventsConsumed: 0,
    avgLatency: 8.4, // ms
    throughput: 0, // eps
  });

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto scroll terminal logs
  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [terminalLogs]);

  // Append a terminal log line helper
  const addLog = (msg: string) => {
    const timeStr = new Date().toLocaleTimeString();
    setTerminalLogs(prev => [...prev, `[${timeStr}] ${msg}`].slice(-100)); // Limit to last 100 logs
  };

  // Live traffic indicator for UI animation
  const [signalFlow, setSignalFlow] = useState<{
    id: string;
    from: 'producer' | 'broker';
    to: 'broker' | 'consumer';
    message: string;
    partition: number;
    color: string;
  } | null>(null);

  // Helper to hash string to partition id
  const getPartitionIdForClass = (key: string, numPartitions: number): number => {
    let hash = 0;
    for (let i = 0; i < key.length; i++) {
      hash = key.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % numPartitions;
  };

  // Main Event Production logic
  const produceEvent = (key: string, payloadObj: Record<string, any>) => {
    // Determine target topic
    setTopics(prevTopics => {
      return prevTopics.map(t => {
        if (t.name === selectedTopicName) {
          const targetPartitionId = getPartitionIdForClass(key, t.partitions.length);
          const updatedPartitions = t.partitions.map(p => {
            if (p.id === targetPartitionId) {
              const newOffset = p.lastOffset + 1;
              const newMessage: KafkaMessage = {
                id: Math.random().toString(36).substring(2, 9),
                offset: newOffset,
                timestamp: Date.now(),
                key,
                payload: payloadObj,
                partition: targetPartitionId
              };

              // Log production to terminal
              addLog(`[PRODUCER] Sent message with Key="${key}" Offset=${newOffset} to Topic="${selectedTopicName}" Part=${targetPartitionId}`);
              
              // Trigger graphic pulse flow
              setSignalFlow({
                id: newMessage.id,
                from: 'producer',
                to: 'broker',
                message: JSON.stringify(payloadObj).slice(0, 30) + '...',
                partition: targetPartitionId,
                color: selectedTopicName === 'order-events' ? '#00FFFF' : (selectedTopicName === 'market-ticks' ? '#FF00FF' : '#FFA500')
              });
              setTimeout(() => setSignalFlow(null), 850);

              return {
                ...p,
                lastOffset: newOffset,
                messages: [...p.messages, newMessage].slice(-25) // Keep last 25 elements for performance
              };
            }
            return p;
          });

          return {
            ...t,
            partitions: updatedPartitions
          };
        }
        return t;
      });
    });

    setStats(prev => ({
      ...prev,
      eventsProduced: prev.eventsProduced + 1
    }));
  };

  // Run auto producer loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout;
    if (isAutoProducing) {
      const delay = productionThrottle === 'normal' ? 2500 : 600;
      intervalId = setInterval(() => {
        // Generate mock data according to the selected topic
        let key = '';
        let payload: Record<string, any> = {};

        if (selectedTopicName === 'order-events') {
          const tickets = ['AAPL', 'TSLA', 'NVDA', 'BTCUSD', 'EURUSD', 'MSFT', 'XAUUSD'];
          const randomTicker = tickets[Math.floor(Math.random() * tickets.length)];
          const traders = ['QUANT_ALGO_9', 'MARKET_MAKER_X', 'STRATEGY_ENG', 'BOT_FLUIDITY'];
          key = `client_${Math.floor(Math.random() * 1000)}`;
          payload = {
            asset: randomTicker,
            qty: Math.floor(Math.random() * 50) * 10 + 10,
            side: Math.random() > 0.4 ? 'BUY' : 'SELL',
            price: parseFloat((Math.random() * 150 + 50).toFixed(2)),
            trader: traders[Math.floor(Math.random() * traders.length)]
          };
        } else if (selectedTopicName === 'market-ticks') {
          const feeds = ['XAU/USD', 'BTC/USDT', 'ETH/USD', 'US10Y', 'OIL/WTI'];
          const selectedFeed = feeds[Math.floor(Math.random() * feeds.length)];
          key = `feed_${selectedFeed.replace('/', '_')}`;
          payload = {
            feed: selectedFeed,
            bid: parseFloat((Math.random() * 100 + 400).toFixed(4)),
            ask: parseFloat((Math.random() * 100 + 400.1).toFixed(4)),
            vol: Math.floor(Math.random() * 20000),
            provider: 'TwelveData'
          };
        } else {
          const alerts = ['LIQUIDITY_SURGE', 'PRICE_CROSSOVER', 'HIGH_VOLATILITY', 'ANOMALY_FLOW', 'NEWS_IMPACT_HIGH'];
          key = `sys_alert_core`;
          payload = {
            type: alerts[Math.floor(Math.random() * alerts.length)],
            severity: Math.random() > 0.75 ? 'CRITICAL' : 'WARNING',
            message: `Neural network detected significant shift on index pipeline segment.`,
            msOffset: Math.floor(Math.random() * 12)
          };
        }

        produceEvent(key, payload);
      }, delay);
    }
    return () => clearInterval(intervalId);
  }, [isAutoProducing, productionThrottle, selectedTopicName]);

  // Consume Event Worker simulation loop
  useEffect(() => {
    const consumerInterval = setInterval(() => {
      // Find events in the brokers for groups that subscribes to the active topic
      setConsumerGroups(prevGroups => {
        let stateChanged = false;
        
        const updatedGroups = prevGroups.map(group => {
          // Find the source topic for this group
          const targetTopic = topics.find(t => t.name === group.topic);
          if (!targetTopic) return group;

          // Check for any unparsed offset progress per assigned partition
          let processedSomething = false;
          const updatedConsumers = group.consumers.map(consumer => {
            if (consumer.assignedPartitions.length === 0) return consumer;

            // Pick a partition to process next
            let workedPartitionIdx = -1;
            let currentUncommittedMsgs: KafkaMessage[] = [];

            for (const pid of consumer.assignedPartitions) {
              const partitionObj = targetTopic.partitions.find(p => p.id === pid);
              if (!partitionObj) continue;

              const lastCommitted = group.offsets[pid] !== undefined ? group.offsets[pid] : -1;
              const pendingMessages = partitionObj.messages.filter(m => m.offset > lastCommitted);

              if (pendingMessages.length > 0) {
                workedPartitionIdx = pid;
                currentUncommittedMsgs = pendingMessages;
                break;
              }
            }

            if (workedPartitionIdx !== -1 && currentUncommittedMsgs.length > 0) {
              processedSomething = true;
              const nextMsg = currentUncommittedMsgs[0]; // consume sequentially in FIFO style offset progression
              
              // Simulating random processing delay
              setTimeout(() => {
                addLog(`[CONSUMER] (${group.id}) [${consumer.id}] Processed Message Key="${nextMsg.key}" Offset=${nextMsg.offset} on Partition=${workedPartitionIdx}`);
              }, 100);

              // Auto-commit offset instantly on success if enabled
              const finalGroupOffsets = { ...group.offsets };
              if (group.autoCommit) {
                finalGroupOffsets[workedPartitionIdx] = nextMsg.offset;
              }

              stateChanged = true;
              return {
                ...consumer,
                status: 'processing' as const,
                processedCount: consumer.processedCount + 1
              };
            }

            return {
              ...consumer,
              status: 'idle' as const
            };
          });

          if (processedSomething) {
            // Update offsets for the group
            const finalGroupOffsets = { ...group.offsets };
            targetTopic.partitions.forEach(partition => {
              const partitionId = partition.id;
              // If auto-commit is on, commit up to the last processed message
              const groupConsumersWithThisPartition = updatedConsumers.find(c => c.assignedPartitions.includes(partitionId));
              if (groupConsumersWithThisPartition && group.autoCommit) {
                // Find highest offset
                if (partition.messages.length > 0) {
                  finalGroupOffsets[partitionId] = partition.messages[partition.messages.length - 1].offset;
                }
              }
            });

            setStats(prev => ({ ...prev, eventsConsumed: prev.eventsConsumed + 1 }));

            return {
              ...group,
              consumers: updatedConsumers,
              offsets: finalGroupOffsets
            };
          }

          return group;
        });

        return stateChanged ? updatedGroups : prevGroups;
      });

    }, 1800);

    return () => clearInterval(consumerInterval);
  }, [topics]);

  // Handle rebalancing when partitions or consumers counts change
  const triggerRebalance = (groupId: string) => {
    setConsumerGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        addLog(`[CLUSTER] Initiating Consumer Partition Assignor (Cooperative sticky protocol) for group "${groupId}"`);
        
        // Distribute topic partitions across consumers
        const topicObj = topics.find(t => t.name === g.topic);
        if (!topicObj) return g;
        
        const partitionIds = topicObj.partitions.map(p => p.id);
        const activeConsumers = g.consumers.filter(c => c.status !== 'failed');
        
        if (activeConsumers.length === 0) {
          addLog(`[WARNING] No active consumers left in group "${groupId}"! Partition lag will rise alarmingly.`);
          return {
            ...g,
            consumers: g.consumers.map(c => ({ ...c, assignedPartitions: [] }))
          };
        }

        const redistributedConsumers = g.consumers.map((c, idx) => {
          if (c.status === 'failed') {
            return { ...c, assignedPartitions: [] };
          }
          // Simple round-robin partition distribution
          const myPartitions: number[] = [];
          partitionIds.forEach((pid, pidx) => {
            if (pidx % activeConsumers.length === idx) {
              myPartitions.push(pid);
            }
          });

          addLog(`[CLUSTER] Group Rebalance Assigned partition(s) [${myPartitions.join(', ')}] directly to Consumer "${c.id}"`);
          return {
            ...c,
            assignedPartitions: myPartitions,
            status: 'idle' as const
          };
        });

        return {
          ...g,
          consumers: redistributedConsumers
        };
      }
      return g;
    }));
  };

  // Fail (crash) a consumer node to trigger rebalance simulation
  const toggleConsumerFail = (groupId: string, consumerId: string) => {
    setConsumerGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === groupId) {
          const targetConsumer = g.consumers.find(c => c.id === consumerId);
          if (!targetConsumer) return g;

          const isCurrentlyFailed = targetConsumer.status === 'failed';
          const newStatus = isCurrentlyFailed ? 'idle' as const : 'failed' as const;

          addLog(`[NODE] Consumer Node "${consumerId}" has been ${isCurrentlyFailed ? 'Re-activated & Spun up' : 'STRICTLY KILLED / SHUTDOWN'}`);

          const updatedConsumers = g.consumers.map(c => {
            if (c.id === consumerId) {
              return { ...c, status: newStatus, assignedPartitions: [] };
            }
            return c;
          });

          return {
            ...g,
            consumers: updatedConsumers
          };
        }
        return g;
      });

      // Instantly invoke partition rebalance logic for group
      setTimeout(() => triggerRebalance(groupId), 200);

      return updated;
    });
  };

  // Add a consumer to group dynamic scaling
  const addConsumerToGroup = (groupId: string) => {
    setConsumerGroups(prev => {
      const updated = prev.map(g => {
        if (g.id === groupId) {
          const numActive = g.consumers.length;
          const newId = `${groupId.split('-')[0]}-scale-${numActive + 1}`;
          
          addLog(`[SCALING] Dynamically spinning up new institutional Consumer Node ID="${newId}" for horizontal pipeline scaling`);
          
          return {
            ...g,
            consumers: [...g.consumers, { id: newId, status: 'idle' as const, assignedPartitions: [] as number[], processedCount: 0 }]
          };
        }
        return g;
      });

      setTimeout(() => triggerRebalance(groupId), 200);
      return updated;
    });
  };

  const executeManualProduce = () => {
    try {
      const parsedObj = JSON.parse(customPayload);
      produceEvent(customKey, parsedObj);
    } catch (e) {
      alert("Payload validation Failed. Input is not valid JSON string.");
      addLog("[SCHEMA ERROR] Payload JSON format validation failed. Dropped event.");
    }
  };

  // Calculate consumer group lag
  const getLagForGroupAndPartition = (group: ConsumerGroup, partitionId: number) => {
    const topicObj = topics.find(t => t.name === group.topic);
    if (!topicObj) return 0;
    
    const partitionObj = topicObj.partitions.find(p => p.id === partitionId);
    if (!partitionObj) return 0;

    const committed = group.offsets[partitionId] !== undefined ? group.offsets[partitionId] : -1;
    const currentMax = partitionObj.lastOffset;

    return Math.max(0, currentMax - committed);
  };

  const getLogColorHex = (log: string) => {
    if (log.includes('[PRODUCER]')) return 'text-cyan-400 font-mono';
    if (log.includes('[CONSUMER]')) return 'text-violet-400 font-mono';
    if (log.includes('[WARNING]') || log.includes('lag')) return 'text-amber-400 font-mono';
    if (log.includes('[CLUSTER]')) return 'text-emerald-500 font-mono font-bold';
    return 'text-zinc-400 font-mono';
  };

  return (
    <div className="w-full bg-[#05050c]/80 border border-white/10 rounded-3xl p-6 shadow-2xl backdrop-blur-md" id="kafka_sandbox_view">
      
      {/* Title block */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b border-white/5 pb-6 mb-6">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="p-2 bg-indigo-500/20 rounded-xl border border-indigo-500/40 animate-pulse text-indigo-400">
              <Cpu size={20} />
            </span>
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight text-white flex items-center gap-2">
              KAFKA EVENT STREAMING ENGINE
            </h1>
          </div>
          <p className="text-xs text-zinc-400 max-w-2xl font-mono leading-relaxed">
            Configure real-time distributed pipelines. Simulate state replication, client offset tracking, zero-copy log serialization, and dynamic consumer rebalancing.
          </p>
        </div>
        
        <div className="flex gap-2 mt-4 md:mt-0 font-mono bg-zinc-950/60 p-3 rounded-2xl border border-white/5">
          <div className="text-center px-4 border-r border-white/10">
            <div className="text-[9px] text-zinc-500 uppercase font-black">Events Sent</div>
            <div className="text-lg font-black text-cyan-400">{stats.eventsProduced}</div>
          </div>
          <div className="text-center px-4 border-r border-white/10">
            <div className="text-[9px] text-zinc-500 uppercase font-black">Events Read</div>
            <div className="text-lg font-black text-purple-400">{stats.eventsConsumed}</div>
          </div>
          <div className="text-center px-4">
            <div className="text-[9px] text-zinc-500 uppercase font-black">Cluster Consensus</div>
            <div className="text-xs font-black text-emerald-400 flex items-center justify-center gap-1.5 mt-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              KRAFT ACTIVE
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Left Side: Producers Control */}
        <div className="xl:col-span-4 bg-zinc-950/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-cyan-400 flex items-center gap-2">
                <Sliders size={14} className="text-cyan-400" />
                Stream Producers
              </h2>
              <span className="text-[9px] bg-cyan-500/10 text-cyan-400 px-2 py-0.5 rounded-full font-mono font-bold">PRODUCER_API v2</span>
            </div>

            {/* Select Topic */}
            <div className="mb-4">
              <label className="block text-[10px] uppercase font-black text-zinc-400 mb-1.5 font-mono">Target Kafka Topic</label>
              <div className="grid grid-cols-3 gap-2">
                {topics.map(t => (
                  <button
                    key={t.name}
                    onClick={() => {
                      setSelectedTopicName(t.name);
                      setSelectedPartitionId(0);
                      addLog(`[CLIENT] Redirected client producer targeting Topic="${t.name}" (Schema: ${t.schemaType})`);
                    }}
                    className={`p-2.5 rounded-xl border text-[10px] font-mono leading-none transition-all ${
                      selectedTopicName === t.name 
                        ? 'border-cyan-500 text-white bg-cyan-500/10 shadow-[0_0_10px_rgba(6,182,212,0.15)] font-bold' 
                        : 'border-white/5 text-zinc-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {t.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Auto Streaming */}
            <div className="bg-zinc-950/70 p-4 rounded-xl border border-white/5 mb-4 space-y-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-bold text-white uppercase font-mono">Continuous Trading Feed</div>
                  <div className="text-[9px] text-zinc-500 font-mono">Simulate non-stop order streams</div>
                </div>
                <button
                  onClick={() => {
                    setIsAutoProducing(!isAutoProducing);
                    addLog(`[PRODUCER] Auto feed ${!isAutoProducing ? 'STARTED' : 'PAUSED'}`);
                  }}
                  className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider flex items-center gap-2 transition-all ${
                    isAutoProducing
                      ? 'bg-amber-600 border border-amber-400 text-white animate-pulse'
                      : 'bg-[#00FFFF] hover:bg-cyan-400 text-black font-black'
                  }`}
                >
                  {isAutoProducing ? <Pause size={14} /> : <Play size={14} />}
                  {isAutoProducing ? 'Pause Loop' : 'Start Feed'}
                </button>
              </div>

              {isAutoProducing && (
                <div className="flex items-center justify-between pt-2 border-t border-white/5">
                  <span className="text-[10px] text-zinc-400 font-mono">Injection Speed Throttle:</span>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setProductionThrottle('normal')}
                      className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase ${
                        productionThrottle === 'normal'
                          ? 'bg-zinc-800 text-white font-bold border border-white/10'
                          : 'text-zinc-500'
                      }`}
                    >
                      Normal (2.5s)
                    </button>
                    <button
                      onClick={() => setProductionThrottle('high')}
                      className={`px-2.5 py-1 rounded text-[9px] font-mono uppercase ${
                        productionThrottle === 'high'
                          ? 'bg-cyan-500 text-black font-black'
                          : 'text-zinc-500'
                      }`}
                    >
                      HI-SPEED (0.6s)
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Manual Message Input Container */}
            <div className="bg-zinc-950/40 p-4 rounded-xl border border-white/5 space-y-3">
              <div className="text-xs font-bold text-white font-mono uppercase flex items-center justify-between">
                <span>Manual Payload Builder</span>
                <span className="text-[9px] text-orange-400 uppercase font-bold">Strict Validation</span>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1 font-mono">Partition Key</label>
                <div className="relative">
                  <Key size={12} className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
                  <input
                    type="text"
                    value={customKey}
                    onChange={(e) => setCustomKey(e.target.value)}
                    className="w-full h-8 bg-zinc-950/80 border border-white/5 rounded-lg pl-8 p-2 font-mono text-xs text-zinc-300 focus:outline-none focus:border-cyan-500"
                  />
                </div>
                <span className="text-[8px] text-zinc-600 font-mono mt-0.5 block leading-normal italic">
                  Key is SHA256 hashed to mathematically route event to specific partition guaranteeing order.
                </span>
              </div>

              <div>
                <label className="block text-[9px] uppercase font-bold text-zinc-500 mb-1 font-mono">Payload JSON</label>
                <textarea
                  value={customPayload}
                  rows={4}
                  onChange={(e) => setCustomPayload(e.target.value)}
                  className="w-full bg-zinc-950/80 border border-white/5 rounded-lg p-2 font-mono text-[10px] text-zinc-300 focus:outline-none focus:border-cyan-500 leading-normal"
                />
              </div>

              <button
                onClick={executeManualProduce}
                className="w-full py-2.5 rounded-xl bg-gradient-to-r from-cyan-500/10 to-teal-500/10 border border-cyan-500/30 text-cyan-400 font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 hover:bg-cyan-500/20 hover:border-cyan-300 transition-all hover:shadow-[0_0_15px_rgba(6,182,212,0.25)]"
              >
                <Send size={12} />
                Produce Event Node
              </button>
            </div>
          </div>

          <div className="mt-4 pt-4 border-t border-white/5 text-[9px] font-mono text-zinc-500 flex items-start gap-1">
            <Info size={12} className="shrink-0 text-cyan-500 mt-0.5" />
            <span>Partition keys always route to the exact same thread order sequentially to preserve transaction integrity.</span>
          </div>
        </div>

        {/* Middle Panel: Kafka Cluster & Topics Visualizer */}
        <div className="xl:col-span-5 bg-zinc-950/30 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-indigo-400 flex items-center gap-2">
                <Database size={14} className="text-indigo-400" />
                Kafka Brokers Cluster
              </h2>
              <div className="flex items-center gap-2 font-mono text-[9px]">
                <span className="text-zinc-500 uppercase">Topic:</span>
                <span className="text-cyan-400 font-bold">{selectedTopicName}</span>
              </div>
            </div>

            {/* High Tech Routing Animation Display */}
            <div className="relative h-[120px] bg-zinc-950/90 rounded-xl border border-white/5 p-4 flex flex-col justify-between mb-4 overflow-hidden">
              {/* Backgrid lines */}
              <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

              <div className="flex justify-between items-center z-10">
                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                    <Send size={16} />
                  </div>
                  <div className="text-[8px] font-mono text-zinc-500 uppercase mt-1">Client Producer</div>
                </div>

                <div className="flex-1 px-4 relative">
                  {/* Streaming Connection Indicator lines */}
                  <div className="h-[2px] bg-gradient-to-r from-cyan-500/20 via-indigo-500/20 to-purple-500/20 w-full rounded-full" />
                  
                  {/* Dynamic Particles Floating */}
                  <AnimatePresence>
                    {signalFlow && (
                      <motion.div
                        initial={{ x: '0%' }}
                        animate={{ x: '100%' }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.8, ease: "linear" }}
                        className="absolute h-3 w-3 rounded-full flex items-center justify-center top-1/2 -translate-y-1/2 z-20"
                        style={{ backgroundColor: signalFlow.color, boxShadow: `0 0 10px ${signalFlow.color}` }}
                      >
                        <Zap size={6} className="text-black" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="text-center">
                  <div className="w-10 h-10 rounded-full bg-indigo-500/10 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
                    <Grid size={16} />
                  </div>
                  <div className="text-[8px] font-mono text-indigo-400 uppercase mt-1">Topic Partitions</div>
                </div>
              </div>

              <div className="text-center z-10 w-full pt-1.5 border-t border-white/5 flex gap-2 justify-around font-mono text-[9px] text-zinc-500">
                <span>Broker Replication: 3 Nodes</span>
                <span className="text-emerald-400">ISR Status: All synched (100% ISR)</span>
              </div>
            </div>

            {/* List of Partitions inside active topic */}
            <div className="space-y-3">
              <label className="block text-[10px] uppercase font-black text-zinc-400 select-none font-mono">
                Log Segment Partition Queues
              </label>

              {topics.find(t => t.name === selectedTopicName)?.partitions.map((part) => {
                const totalInPart = part.messages.length;
                const activeLagInPart = consumerGroups
                  .filter(cg => cg.topic === selectedTopicName)
                  .reduce((max, cg) => Math.max(max, getLagForGroupAndPartition(cg, part.id)), 0);

                return (
                  <div
                    key={part.id}
                    onClick={() => {
                      setSelectedPartitionId(part.id);
                      addLog(`[UI] Inspected Segment Log Indexes for Partition ${part.id}`);
                    }}
                    className={`p-3 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                      selectedPartitionId === part.id
                        ? 'bg-indigo-500/5 border-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.1)]'
                        : 'bg-zinc-950/60 border-white/5 hover:border-white/10 hover:bg-zinc-950/80'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-black font-mono text-white">
                          Partition #{part.id}
                        </span>
                        <span className="text-[8px] bg-zinc-900 border border-white/5 px-1.5 text-zinc-400 font-mono font-bold rounded">
                          LDR: {part.leader}
                        </span>
                      </div>

                      <div className="flex gap-2 text-[9px] font-mono">
                        <span className="text-zinc-500">Size: {part.lastOffset + 1} ev</span>
                        {activeLagInPart > 0 && (
                          <span className="text-amber-500 font-bold flex items-center gap-1">
                            <AlertTriangle size={10} />
                            Lag: {activeLagInPart}
                          </span>
                        )}
                        {activeLagInPart === 0 && totalInPart > 0 && (
                          <span className="text-emerald-400 font-bold">100% Caught Up</span>
                        )}
                      </div>
                    </div>

                    {/* Miniature representation of log queue segment array */}
                    <div className="h-6 w-full bg-zinc-950 border border-white/5 rounded-lg flex items-center px-2 gap-1 overflow-x-auto custom-scrollbar-horizontal">
                      {part.messages.length === 0 ? (
                        <span className="text-[8px] text-zinc-600 font-mono uppercase italic px-1">[] Immutability index empty. Waiting for records...</span>
                      ) : (
                        part.messages.map((m) => (
                          <div
                            key={m.id}
                            title={`Offset: ${m.offset}\nKey: ${m.key}\nPayload: ${JSON.stringify(m.payload)}`}
                            className="bg-indigo-600 hover:bg-cyan-500 border border-indigo-400 h-4 px-1.5 rounded text-[8px] font-mono font-bold text-white transition-colors select-none flex items-center shrink-0"
                          >
                            Offset {m.offset}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected partition detail segment table */}
            <div className="mt-4 bg-zinc-950/60 p-4 border border-white/5 rounded-xl">
              <div className="flex justify-between items-center border-b border-white/5 pb-2 mb-3">
                <span className="text-[9px] font-black uppercase text-zinc-400 font-mono flex items-center gap-1">
                  <FileText size={10} className="text-indigo-400" />
                  Log Table Inspector: Partition {selectedPartitionId}
                </span>
                <span className="text-[8px] text-zinc-500 font-mono">Stored on Disk Segments (.log)</span>
              </div>

              <div className="max-h-[140px] overflow-y-auto custom-scrollbar space-y-1.5 text-left pr-2 text-[9px] font-mono">
                {(() => {
                  const part = topics.find(t => t.name === selectedTopicName)?.partitions.find(p => p.id === selectedPartitionId);
                  if (!part || !part.messages || part.messages.length === 0) {
                    return <div className="text-zinc-600 italic py-2">No messages stored in partition {selectedPartitionId} yet. Run auto-producer sequence to see log append arrays.</div>;
                  }

                  return [...part.messages].reverse().map(m => (
                    <div key={m.id} className="p-2 bg-zinc-950 border border-white/5 rounded flex flex-col justify-between">
                      <div className="flex justify-between text-zinc-400">
                        <span className="text-cyan-400 font-black">Offset #{m.offset}</span>
                        <span className="text-indigo-400">Key: {m.key}</span>
                        <span className="text-zinc-500">{new Date(m.timestamp).toLocaleTimeString()}</span>
                      </div>
                      <div className="text-white bg-zinc-950 border border-white/5 p-1 mt-1 rounded text-[8px] overflow-x-auto whitespace-pre">
                        {JSON.stringify(m.payload)}
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-zinc-500 mt-4 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
            <span>All logs replicate synchronously with zero-data-loss durability criteria across our server array.</span>
          </div>
        </div>

        {/* Right Panel: Consumer Groups Interface */}
        <div className="xl:col-span-3 bg-zinc-950/40 p-5 rounded-2xl border border-white/5 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between border-b border-white/5 pb-3 mb-4">
              <h2 className="text-xs font-black uppercase tracking-widest text-violet-400 flex items-center gap-2">
                <Users size={14} className="text-violet-400" />
                Consumer Groups
              </h2>
              <span className="text-[9px] bg-violet-500/10 text-violet-400 px-2 py-0.5 rounded-full font-mono font-bold">CG_ENGINE v4</span>
            </div>

            <div className="space-y-5">
              {consumerGroups
                .filter(cg => cg.topic === selectedTopicName)
                .map((group) => {
                  return (
                    <div key={group.id} className="bg-zinc-950/60 p-4 border border-white/5 rounded-xl space-y-3">
                      <div className="flex justify-between items-start border-b border-white/5 pb-2">
                        <div>
                          <div className="text-xs font-black text-white font-mono break-all">{group.id}</div>
                          <div className="text-[8px] text-zinc-500 font-mono uppercase mt-0.5 flex gap-2">
                            <span>AutoCommit: {group.autoCommit ? 'ON' : 'OFF'}</span>
                            <span>Interval: {group.commitInterval}ms</span>
                          </div>
                        </div>
                        <button
                          title="Trigger group partition assignment rebalance"
                          onClick={() => triggerRebalance(group.id)}
                          className="hover:bg-white/5 p-1 rounded transition-colors text-zinc-400 hover:text-white"
                        >
                          <RefreshCw size={12} />
                        </button>
                      </div>

                      {/* Consumer Client node list */}
                      <div className="space-y-2">
                        {group.consumers.map(c => {
                          const isFailed = c.status === 'failed';
                          const isProcessing = c.status === 'processing';

                          return (
                            <div
                              key={c.id}
                              className={`p-2.5 rounded-lg border ${
                                isFailed
                                  ? 'border-red-500/30 bg-red-500/5'
                                  : isProcessing
                                    ? 'border-purple-500 bg-purple-500/5'
                                    : 'border-white/5 bg-zinc-950'
                              } transition-all`}
                            >
                              <div className="flex justify-between items-center mb-1.5">
                                <span className={`text-[10px] font-bold font-mono ${isFailed ? 'text-red-500line-through' : 'text-zinc-300'}`}>
                                  {c.id}
                                </span>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => toggleConsumerFail(group.id, c.id)}
                                    className={`px-1.5 py-0.5 text-[8px] font-bold rounded font-mono ${
                                      isFailed ? 'bg-emerald-600 text-white' : 'bg-red-950/80 text-red-400 hover:bg-red-900 border border-red-500/20'
                                    }`}
                                  >
                                    {isFailed ? 'Recover' : 'Kill Node'}
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-between items-center text-[9px] font-mono">
                                <span className="text-zinc-500">Processed: {c.processedCount} ev</span>
                                <span className="text-zinc-500 flex gap-1">
                                  Partitions: 
                                  <strong className="text-indigo-400">
                                    {isFailed ? '[]' : `[${c.assignedPartitions.join(', ')}]`}
                                  </strong>
                                </span>
                              </div>

                              {!isFailed && (
                                <div className="mt-1.5 flex items-center justify-between text-[8px] font-mono text-zinc-500 border-t border-white/5 pt-1.5">
                                  <span>Node Status:</span>
                                  <span className={`font-bold uppercase ${isProcessing ? 'text-cyan-400' : 'text-zinc-400'}`}>
                                    {isProcessing ? '⚡ active_polling' : '💤 idle_wait'}
                                  </span>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Scale Group Button */}
                      <button
                        onClick={() => addConsumerToGroup(group.id)}
                        className="w-full py-1.5 border border-dashed border-white/10 hover:border-violet-500/50 rounded-lg text-zinc-500 hover:text-violet-400 text-[9px] font-black uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
                      >
                        <Plus size={10} />
                        Add Consumer Instance (Scale Out)
                      </button>
                    </div>
                  );
                })}
              
              {consumerGroups.filter(cg => cg.topic === selectedTopicName).length === 0 && (
                <div className="p-4 bg-zinc-950/40 rounded-xl border border-white/5 font-mono text-zinc-600 text-xs italic text-center">
                  No active consumer groups are configured for topic "{selectedTopicName}".
                </div>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-white/5 text-[9px] font-mono text-zinc-500 mt-4 flex items-start gap-1">
            <Info size={12} className="shrink-0 text-violet-500 mt-0.5" />
            <span>Killing a node automatically triggers an immediate partition rebalance, ensuring zero-downtime service failover!</span>
          </div>
        </div>

      </div>

      {/* D3 Latency Heatmap Visual Monitoring Row */}
      <div className="mt-6 text-left">
        <KafkaLatencyHeatmap
          selectedTopic={selectedTopicName}
          activePartitionsCount={topics.find(t => t.name === selectedTopicName)?.partitions.length || 3}
        />
      </div>

      {/* Embedded Terminal log outputs */}
      <div className="mt-6 bg-zinc-950 border border-white/5 rounded-2xl p-4 text-left">
        <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-3">
          <div className="flex items-center gap-2 text-[10px] font-black uppercase text-emerald-400 font-mono">
            <TerminalIcon size={12} />
            Cluster Stream Log Output
          </div>
          <button
            onClick={() => setTerminalLogs([`[${new Date().toLocaleTimeString()}] Terminal trace cleared. Cluster logging remains active.`])}
            className="text-[9px] text-zinc-500 hover:text-white transition-colors font-mono"
          >
            Clear trace
          </button>
        </div>

        <div className="h-[150px] overflow-y-auto custom-scrollbar font-mono text-[10px] leading-relaxed space-y-1">
          {terminalLogs.map((log, index) => (
            <div key={index} className={getTwelveDataMockLogsHex(log)}>
              {log}
            </div>
          ))}
          <div ref={logsEndRef} />
        </div>
      </div>

    </div>
  );
}

function getTwelveDataMockLogsHex(log: string) {
  if (log.includes('[PRODUCER]')) return 'text-cyan-400/90 font-mono';
  if (log.includes('[CONSUMER]')) return 'text-violet-300/90 font-mono';
  if (log.includes('[WARNING]') || log.includes('lag')) return 'text-amber-400 font-mono';
  if (log.includes('[CLUSTER]')) return 'text-emerald-400 font-semibold font-mono';
  if (log.includes('[SCALING]')) return 'text-sky-400 font-semibold font-mono';
  return 'text-zinc-500 font-mono';
}
