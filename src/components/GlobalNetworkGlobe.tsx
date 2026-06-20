import React, { useEffect, useRef, useState } from "react";
import { getDb } from "../firebase";
import { collection, onSnapshot } from "../firebase";
import { Compass, Users, Target, Activity, Shield, Cpu, RefreshCw, Layers } from "lucide-react";
import GlobeConstructor from "globe.gl";

const Globe = (GlobeConstructor as any).default || GlobeConstructor;

interface CountryConfig {
  docId: string;
  id: string; // ISO Code
  countryName: string;
  launchPhase: string;
  launchColor: string;
  signupGoal: number;
  currentSignupCount: number;
  highlightEnabled: boolean;
  latitude: number;
  longitude: number;
}

// Resilient fallback country pool in case Firebase contains no entries or is offline
const defaultCountries: CountryConfig[] = [
  {
    docId: "usa",
    id: "USA",
    countryName: "United States",
    launchPhase: "ALPHA SYSTEM",
    launchColor: "#00FFFF",
    signupGoal: 15000,
    currentSignupCount: 14102,
    highlightEnabled: true,
    latitude: 37.0902,
    longitude: -95.7129,
  },
  {
    docId: "gbr",
    id: "GBR",
    countryName: "United Kingdom",
    launchPhase: "BETA CHANNEL",
    launchColor: "#FF1493",
    signupGoal: 15000,
    currentSignupCount: 11242,
    highlightEnabled: true,
    latitude: 55.3781,
    longitude: -3.4360,
  },
  {
    docId: "deu",
    id: "DEU",
    countryName: "Germany",
    launchPhase: "BETA CHANNEL",
    launchColor: "#7F00FF",
    signupGoal: 15000,
    currentSignupCount: 9781,
    highlightEnabled: true,
    latitude: 51.1657,
    longitude: 10.4515,
  },
  {
    docId: "sgp",
    id: "SGP",
    countryName: "Singapore",
    launchPhase: "STAGING V3",
    launchColor: "#39FF14",
    signupGoal: 15000,
    currentSignupCount: 12450,
    highlightEnabled: true,
    latitude: 1.3521,
    longitude: 103.8198,
  },
  {
    docId: "jpn",
    id: "JPN",
    countryName: "Japan",
    launchPhase: "QUEUE OPEN",
    launchColor: "#FFFF00",
    signupGoal: 15000,
    currentSignupCount: 8122,
    highlightEnabled: true,
    latitude: 36.2048,
    longitude: 138.2529,
  },
  {
    docId: "aus",
    id: "AUS",
    countryName: "Australia",
    launchPhase: "QUEUE OPEN",
    launchColor: "#FF4500",
    signupGoal: 15000,
    currentSignupCount: 7421,
    highlightEnabled: true,
    latitude: -25.2744,
    longitude: 133.7751,
  }
];

export default function GlobalNetworkGlobe() {
  const containerRef = useRef<HTMLDivElement>(null);
  const parentRef = useRef<HTMLDivElement>(null);
  const globeInstanceRef = useRef<any>(null);
  
  const [countryConfigs, setCountryConfigs] = useState<CountryConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCountry, setSelectedCountry] = useState<CountryConfig | null>(null);
  
  // WebGL support safety flag to prevent browser crash and silent black screen in restrictive sandboxes
  const [webGlSupported, setWebGlSupported] = useState<boolean>(() => {
    try {
      const canvas = document.createElement("canvas");
      const supported = !!(
        window.WebGLRenderingContext &&
        (canvas.getContext("webgl") || canvas.getContext("experimental-webgl"))
      );
      return supported;
    } catch (e) {
      return false;
    }
  });

  // 1. Listen to real-time updates from Firestore, with graceful fallback
  useEffect(() => {
    const unsub = onSnapshot(
      collection(getDb(), "globe_country_configs"),
      (snapshot) => {
        const configs: CountryConfig[] = [];
        snapshot.forEach((doc) => {
          configs.push({ docId: doc.id, ...doc.data() } as CountryConfig);
        });
        
        // If snapshot has countries, use them; otherwise, fallback to resilient static config
        const finalConfigs = configs.length > 0 ? configs : defaultCountries;
        setCountryConfigs(finalConfigs);
        
        // Set default selection to first active if none highlights
        if (finalConfigs.length > 0 && !selectedCountry) {
          const first = finalConfigs.find(c => c.highlightEnabled) || finalConfigs[0];
          setSelectedCountry(first);
        }
        setLoading(false);
      },
      (error) => {
        console.warn("Firestore loading blocked or delayed on globe, using default static grid configs:", error);
        setCountryConfigs(defaultCountries);
        if (!selectedCountry) {
          setSelectedCountry(defaultCountries[0]);
        }
        setLoading(false);
      }
    );

    return () => unsub();
  }, [selectedCountry]);

  // 2. Initialize and configure Globe.gl with dynamic ResizeObserver
  useEffect(() => {
    if (!webGlSupported || !containerRef.current) return;

    let MyGlobe: any;
    try {
      // Standard high-end vanilla Globe on div ref
      MyGlobe = Globe()(containerRef.current)
        .globeImageUrl("//unpkg.com/three-globe/example/img/earth-night.jpg")
        .bumpImageUrl("//unpkg.com/three-globe/example/img/earth-topology.png")
        .backgroundColor("rgba(0,0,0,0)")
        .showAtmosphere(true)
        .atmosphereColor("#B026FF")
        .atmosphereAltitude(0.24)
        .showGraticules(false);
    } catch (err) {
      console.warn("[GlobalNetworkGlobe] WebGL Globe constructor aborted due to sandboxed constraints. Engaging 2D schematic fallback.", err);
      setWebGlSupported(false);
      return;
    }

    // Initial resize if successful
    const w = containerRef.current.clientWidth || 800;
    const h = containerRef.current.clientHeight || 750;
    MyGlobe.width(w).height(h);

    // Precise ResizeObserver to always dynamically snap canvas container size perfectly
    const resizeObserver = new ResizeObserver((entries) => {
      for (let entry of entries) {
        const { width, height } = entry.contentRect;
        if (MyGlobe && width > 0 && height > 0) {
          MyGlobe.width(width);
          MyGlobe.height(height);
        }
      }
    });
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Gentle continuous spin
    const controls = MyGlobe.controls();
    if (controls) {
      controls.autoRotate = true;
      controls.autoRotateSpeed = 0.85;
      controls.enableZoom = false; // preserve layout focus boundary
    }

    globeInstanceRef.current = MyGlobe;

    return () => {
      resizeObserver.disconnect();
      try {
        if (globeInstanceRef.current) {
          // Forcefully dispose the WebGL context and remove DOM elements to prevent memory leaks during HMR updates
          if (typeof globeInstanceRef.current.pauseAnimation === 'function') {
            globeInstanceRef.current.pauseAnimation();
          }
          if (typeof globeInstanceRef.current.renderer === 'function') {
            const renderer = globeInstanceRef.current.renderer();
            if (renderer) {
              renderer.dispose();
              renderer.forceContextLoss();
            }
          }
          if (typeof globeInstanceRef.current._destructor === 'function') {
            globeInstanceRef.current._destructor();
          }
        }
      } catch (err) {
        console.warn("Globe cleanup warning:", err);
      }
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [webGlSupported]);

  // 3. Keep globe nodes, arcs, and highlights updated when countryConfigs shift
  useEffect(() => {
    const g = globeInstanceRef.current;
    if (!g || countryConfigs.length === 0) return;

    // Filter configurations and construct fresh data objects with selection state to trigger clean cache invalidation inside three-globe
    const activeCountries = countryConfigs.filter(
      (c) => c.latitude && c.longitude
    ).map(c => ({
      ...c,
      isSelected: selectedCountry?.id === c.id
    }));

    const majorCities = [
      { lat: 40.7128, lng: -74.0060, name: "New York" },
      { lat: 51.5074, lng: -0.1278, name: "London" },
      { lat: 35.6895, lng: 139.6917, name: "Tokyo" },
      { lat: 48.8566, lng: 2.3522, name: "Paris" },
      { lat: -33.8688, lng: 151.2093, name: "Sydney" },
      { lat: 1.3521, lng: 103.8198, name: "Singapore" },
      { lat: 22.3193, lng: 114.1694, name: "Hong Kong" },
      { lat: 25.2048, lng: 55.2708, name: "Dubai" },
      { lat: -23.5505, lng: -46.6333, name: "São Paulo" },
      { lat: 55.7558, lng: 37.6173, name: "Moscow" },
      { lat: 19.4326, lng: -99.1332, name: "Mexico City" },
      { lat: 28.6139, lng: 77.2090, name: "New Delhi" },
      { lat: -26.2041, lng: 28.0473, name: "Johannesburg" },
      { lat: 39.9042, lng: 116.4074, name: "Beijing" },
      { lat: 31.2304, lng: 121.4737, name: "Shanghai" },
      { lat: 34.0522, lng: -118.2437, name: "Los Angeles" },
      { lat: 41.8781, lng: -87.6298, name: "Chicago" },
      { lat: 43.6532, lng: -79.3832, name: "Toronto" },
      { lat: 50.1109, lng: 8.6821, name: "Frankfurt" },
      { lat: 52.5200, lng: 13.4050, name: "Berlin" },
      { lat: 41.9028, lng: 12.4964, name: "Rome" },
      { lat: 40.4168, lng: -3.7038, name: "Madrid" },
      { lat: 37.7749, lng: -122.4194, name: "San Francisco" },
      { lat: 42.3601, lng: -71.0589, name: "Boston" },
      { lat: 37.5665, lng: 126.9780, name: "Seoul" },
      { lat: 1.2902, lng: 103.8519, name: "Marina Bay" },
      { lat: -34.6037, lng: -58.3816, name: "Buenos Aires" },
      { lat: 4.6097, lng: -74.0817, name: "Bogota" },
      { lat: 25.0330, lng: 121.5654, name: "Taipei" },
      { lat: -12.0464, lng: -77.0428, name: "Lima" },
      { lat: -33.9249, lng: 18.4241, name: "Cape Town" },
      { lat: -37.8136, lng: 144.9631, name: "Melbourne" }
    ];

    // Prepare custom HTML nodes on the globe surface
    const combinedData = [
      ...activeCountries.map(a => ({ ...a, type: 'node' })), 
      ...majorCities.map(c => ({ ...c, type: 'city', id: c.name, name: c.name }))
    ];
    g.htmlElementsData(combinedData);
    g.htmlElement((d: any) => {
      const el = document.createElement("div");
      
      if (d.type === 'city') {
        el.className = "flex flex-col items-center select-none pointer-events-none";
        el.innerHTML = `
          <div class="relative flex flex-col items-center">
            <div class="w-1.5 h-1.5 rounded-full bg-[#00B7FF] shadow-[0_0_10px_#00B7FF]"></div>
            <div class="mt-0.5 text-[7px] font-mono text-[#00B7FF] tracking-widest uppercase opacity-80" style="text-shadow: 0 0 4px #00B7FF">${d.name}</div>
          </div>
        `;
        return el;
      }

      el.className = "flex flex-col items-center select-none group pointer-events-auto cursor-pointer";
      
      const isSelected = d.isSelected;
      const themeColor = d.launchColor || "#FF1493";

      // Dynamically style the node marker and labels with conditional sizes/classes based on fresh state values
      el.innerHTML = `
        <div class="relative flex items-center justify-center">
          ${
            d.highlightEnabled 
              ? `<div class="absolute w-12 h-12 rounded-full animate-ping opacity-35" style="border: 2.5px solid ${themeColor};"></div>` 
              : ""
          }
          <div class="w-4 h-4 rounded-full z-10 transition-all duration-300 group-hover:scale-135 shadow-lg flex items-center justify-center" 
               style="background-color: ${themeColor}; border: 2.5px solid #FFFFFF; box-shadow: 0 0 25px ${themeColor}, 0 0 10px ${themeColor}; transform: ${isSelected ? 'scale(1.4)' : 'scale(1)'}; border-color: ${isSelected ? '#00FFFF' : '#FFFFFF'};">
          </div>
        </div>
        <div class="mt-2 px-2.5 py-1 rounded-lg bg-black/95 border shadow-2xl backdrop-blur-md transition-all duration-300 flex flex-col items-center select-none ${isSelected ? 'border-[#00FFFF] opacity-100 scale-105' : 'border-zinc-800 opacity-80 group-hover:opacity-100'}">
          <span class="text-[9px] font-sans font-black uppercase text-white tracking-widest leading-none">${d.countryName}</span>
          <span class="text-[7.5px] font-mono font-bold uppercase mt-0.5" style="color: ${themeColor}">${d.launchPhase}</span>
        </div>
      `;

      el.onclick = () => {
        // Pause rotate momentarily and slide to clicked country
        const controls = g.controls();
        if (controls) {
          controls.autoRotate = false;
          setTimeout(() => { controls.autoRotate = true; }, 12000); // spin again
        }
        g.pointOfView({ lat: d.latitude, lng: d.longitude, altitude: 1.95 }, 1200);
        setSelectedCountry(d);
      };

      return el;
    });

    // Project high-glowing Arcs representing systemic interconnections (The Neural Grid)
    const primaryNode = activeCountries.find(c => c.id === "USA") || activeCountries[0];
    const arcList: any[] = [];
    
    activeCountries.forEach(dest => {
      if (dest.id !== primaryNode.id && dest.highlightEnabled) {
        arcList.push({
          startLat: primaryNode.latitude,
          startLng: primaryNode.longitude,
          endLat: dest.latitude,
          endLng: dest.longitude,
          color: [primaryNode.launchColor || "#00FFFF", dest.launchColor || "#FF1493"]
        });
      }
    });

    g.arcsData(arcList);
    g.arcColor((d: any) => d.color);
    g.arcDashLength(0.65);
    g.arcDashGap(0.15);
    g.arcDashAnimateTime(1800);
    g.arcStroke(1.6);
    g.arcAltitude(0.32);

    // Combine activeCountries and majorCities into HTML elements if possible,
    // or just leave cities out for a moment to prevent crashes.

  }, [countryConfigs, selectedCountry]);

  // Equirectangular coordinate mapper for 2D fallback layout
  const projectCoordinates = (lat: number, lng: number, w: number, h: number) => {
    // Equirectangular mapping of lat/lng (-180 to 180, -90 to 90) onto target dimensions
    const x = ((lng + 180) / 360) * w;
    const y = ((90 - lat) / 180) * h;
    return { x, y };
  };

  const activeCountries = countryConfigs.filter(c => c.latitude && c.longitude);
  const totalReservations = countryConfigs.reduce((sum, c) => sum + (c.currentSignupCount || 0), 0);

  return (
    <div ref={parentRef} className="flex flex-col lg:flex-row gap-8 items-stretch justify-center max-w-7xl mx-auto py-4 relative z-20">
      
      {/* Dynamic Reticle Panel: Renders full WebGL Globe or High-Fidelity 2D Cyber-Tactical Schematic fallback */}
      <div className="relative w-full lg:w-[68%] min-h-[500px] sm:min-h-[600px] lg:h-[720px] bg-black/40 border border-zinc-900/60 rounded-[3rem] overflow-hidden flex items-center justify-center shrink-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(127,0,255,0.06),transparent_70%)] pointer-events-none" />
        
        {loading && (
          <div className="absolute z-10 flex flex-col items-center gap-3">
            <div className="w-10 h-10 rounded-full border-t-2 border-r-2 border-[#FF1493] animate-spin" />
            <span className="text-[10px] text-zinc-500 font-mono font-black uppercase tracking-widest animate-pulse">SYNCHRONIZING SECURE ROUTING SYSTEM...</span>
          </div>
        )}

        {webGlSupported ? (
          // Standard WebGL interactive 3D Globe
          <div ref={containerRef} className="absolute inset-0 cursor-grab active:cursor-grabbing" />
        ) : (
          // Elegant WebGL-less fallback: High-fidelity Vector Cyber-Radar and Neural Network Routing screen
          <div className="absolute inset-0 p-8 flex flex-col justify-between select-none">
            
            {/* Embedded styles for CSS animations on vector path streams */}
            <style dangerouslySetInnerHTML={{__html: `
              @keyframes pulseFlow {
                from { stroke-dashoffset: 140; }
                to { stroke-dashoffset: 0; }
              }
              @keyframes rotateSlow {
                from { transform: rotate(0deg); }
                to { transform: rotate(360deg); }
              }
              .animate-pulse-flow {
                animation: pulseFlow 3.5s linear infinite;
              }
              .animate-rotate-slow {
                transform-origin: 400px 300px;
                animation: rotateSlow 45s linear infinite;
              }
              .animate-rotate-slow-rev {
                transform-origin: 400px 300px;
                animation: rotateSlow 60s linear infinite reverse;
              }
            `}} />
            
            {/* Header Telemetry */}
            <div className="flex justify-between items-center z-10">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
                <span className="text-[9px] font-mono font-black text-indigo-400 uppercase tracking-widest">
                  COGNITIVE 2D CORE PROJECTOR (SECURE MODE)
                </span>
              </div>
              <div className="text-[8px] font-mono text-zinc-600 tracking-wider">
                SURFACE SURVEY RECON v1.99
              </div>
            </div>

            {/* Main Interactive Map/Radar Canvas */}
            <div className="flex-grow w-full relative flex items-center justify-center">
              <svg 
                viewBox="0 0 800 600" 
                className="w-full h-full max-h-[580px]"
                xmlns="http://www.w3.org/2000/svg"
              >
                {/* 1. Tactical Tech Background Grid & Radar Circle Layouts */}
                <g className="opacity-40">
                  {/* Concentric telemetry rings */}
                  <circle cx="400" cy="300" r="280" fill="none" stroke="rgba(127, 0, 255, 0.08)" strokeWidth="1" strokeDasharray="3 6" className="animate-rotate-slow" />
                  <circle cx="400" cy="300" r="200" fill="none" stroke="rgba(0, 255, 255, 0.06)" strokeWidth="1" strokeDasharray="5 15" className="animate-rotate-slow-rev" />
                  <circle cx="400" cy="300" r="120" fill="none" stroke="rgba(127, 0, 255, 0.12)" strokeWidth="0.8" />
                  <circle cx="400" cy="300" r="50" fill="none" stroke="rgba(0, 255, 255, 0.15)" strokeWidth="0.8" strokeDasharray="2 4" />
                  
                  {/* Radar grid coordinates */}
                  <line x1="400" y1="20" x2="400" y2="580" stroke="rgba(127,0,255,0.06)" strokeWidth="1" strokeDasharray="4 8" />
                  <line x1="20" y1="300" x2="780" y2="300" stroke="rgba(127,0,255,0.06)" strokeWidth="1" strokeDasharray="4 8" />
                  
                  {/* Outer border telemetry labels */}
                  <text x="400" y="15" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="middle">GRID BEARING 000° N</text>
                  <text x="785" y="303" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="end">INTELLIGENCE BEARING 090° E</text>
                  <text x="400" y="595" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="middle">GRID BEARING 180° S</text>
                  <text x="15" y="303" fill="rgba(255,255,255,0.15)" fontSize="7" fontFamily="monospace" textAnchor="start">INTELLIGENCE BEARING 270° W</text>
                </g>

                {/* 2. Neural interlock arc routes from USA to others */}
                {(() => {
                  const usaNode = activeCountries.find(c => c.id === "USA") || activeCountries[0];
                  if (!usaNode) return null;
                  const fromCoord = projectCoordinates(usaNode.latitude, usaNode.longitude, 800, 600);
                  
                  return activeCountries.map((c, idx) => {
                    if (c.id === usaNode.id || !c.highlightEnabled) return null;
                    const toCoord = projectCoordinates(c.latitude, c.longitude, 800, 600);
                    
                    // Arc midpoints with subtle curve offset for beautiful sub-orbital vectors
                    const mx = (fromCoord.x + toCoord.x) / 2;
                    const my = (fromCoord.y + toCoord.y) / 2 - 45;
                    
                    return (
                      <g key={`arc-${c.id}-${idx}`}>
                        {/* Static connecting track */}
                        <path
                          d={`M ${fromCoord.x} ${fromCoord.y} Q ${mx} ${my} ${toCoord.x} ${toCoord.y}`}
                          fill="none"
                          stroke={c.launchColor}
                          strokeWidth="1.2"
                          strokeOpacity="0.25"
                          strokeDasharray="4 6"
                        />
                        {/* High-speed animated flow node pulses */}
                        <path
                          d={`M ${fromCoord.x} ${fromCoord.y} Q ${mx} ${my} ${toCoord.x} ${toCoord.y}`}
                          fill="none"
                          stroke={c.launchColor}
                          strokeWidth="2.2"
                          strokeLinecap="round"
                          strokeDasharray="14 110"
                          className="animate-pulse-flow"
                          style={{ filter: `drop-shadow(0 0 5px ${c.launchColor})` }}
                        />
                      </g>
                    );
                  });
                })()}

                {/* 3. Render projected interactive Country nodes */}
                {activeCountries.map((c, idx) => {
                  const { x, y } = projectCoordinates(c.latitude, c.longitude, 800, 600);
                  const isSelected = selectedCountry?.id === c.id;
                  
                  return (
                    <g 
                      key={`node-${c.id}-${idx}`}
                      transform={`translate(${x}, ${y})`}
                      className="cursor-pointer group"
                      onClick={() => setSelectedCountry(c)}
                    >
                      {/* Interactive click targets */}
                      <circle r="40" fill="transparent" />
                      
                      {/* Outer pulsing ping rings */}
                      {c.highlightEnabled && (
                        <circle 
                          r={isSelected ? "18" : "12"} 
                          fill="none" 
                          stroke={c.launchColor} 
                          strokeWidth="1.5" 
                          strokeOpacity="0.4"
                          className="animate-ping"
                        />
                      )}
                      
                      {/* Custom selection reticle brackets */}
                      {isSelected && (
                        <circle 
                          r="15" 
                          fill="none" 
                          stroke="#00FFFF" 
                          strokeWidth="1.2" 
                          strokeDasharray="5 3"
                        />
                      )}

                      {/* Main glowing node core */}
                      <circle 
                        r={isSelected ? "7" : "5.5"} 
                        fill={c.launchColor} 
                        stroke="#030307" 
                        strokeWidth="2" 
                        style={{ filter: `drop-shadow(0 0 7px ${c.launchColor})` }}
                      />

                      {/* Interactive detail text labels */}
                      <g transform={`translate(0, ${isSelected ? 26 : 22})`}>
                        {/* Solid background plate for readable typography */}
                        <rect 
                          x="-50" 
                          y="-9" 
                          width="100" 
                          height="20" 
                          rx="4" 
                          fill="rgba(3, 3, 7, 0.95)" 
                          stroke={isSelected ? "#00FFFF" : "rgba(39, 39, 42, 0.45)"}
                          strokeWidth={isSelected ? 1 : 0.6}
                        />
                        <text 
                          y="0" 
                          fill="#FFFFFF" 
                          fontSize="7.5" 
                          textAnchor="middle" 
                          fontWeight="900" 
                          fontFamily="sans-serif"
                          letterSpacing="1"
                        >
                          {c.id}
                        </text>
                        <text 
                          y="8" 
                          fill={c.launchColor} 
                          fontSize="5.5" 
                          textAnchor="middle" 
                          fontWeight="bold" 
                          fontFamily="monospace"
                          letterSpacing="0.5"
                        >
                          {c.launchPhase}
                        </text>
                      </g>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Footer telemetry tracker */}
            <div className="flex justify-between items-center text-[8.5px] font-mono text-zinc-500 z-10 px-4">
              <span>LATITUDE RANGE: -90° / +90°</span>
              <span>LONGITUDE RANGE: -180° / +180°</span>
              <span>NETWORK CHANNELS ACTIVE: {activeCountries.length}</span>
            </div>
            
          </div>
        )}

        {/* Helper Orbit Controls Guide Overlay */}
        <div className="absolute bottom-6 flex gap-3 items-center px-4 py-2 rounded-full bg-black/85 border border-zinc-900/80 backdrop-blur-md shadow-2xl">
          <Compass size={12} className="text-[#00FFFF] animate-spin-slow" />
          <span className="text-[9px] font-mono font-bold text-zinc-400 uppercase tracking-widest select-none">
            {webGlSupported 
              ? "DRAG CORE COGNITIVE GLOBAL LINK LAYER • TAP NODES TO FOCUS"
              : "CORE SECURED LAYER ENGAGED • TAP HUD ON-SCREEN NODES TO SCAN"
            }
          </span>
        </div>
      </div>

      {/* Supporting Geopolitical Indicators and Controls Panel (Occupies 30% of section) */}
      <div className="w-full lg:w-[32%] flex flex-col justify-between gap-6">
        
        {/* Active Node Analyzer Card */}
        {selectedCountry ? (
          <div className="bg-zinc-950/80 border border-zinc-900/80 rounded-[2rem] p-6 sm:p-8 backdrop-blur-xl relative overflow-hidden shadow-2xl flex-grow flex flex-col justify-between">
            
            {/* Top color matching lightbar */}
            <div 
              className="absolute top-0 left-0 right-0 h-1" 
              style={{ background: `linear-gradient(90deg, transparent, ${selectedCountry.launchColor}, transparent)` }} 
            />
            
            <div>
              <div className="flex justify-between items-start mb-6">
                <div className="space-y-1">
                  <span className="font-mono text-[8px] font-black uppercase tracking-[0.2em] px-2.5 py-1 rounded-full border bg-zinc-950/80"
                        style={{ color: selectedCountry.launchColor, borderColor: `${selectedCountry.launchColor}22` }}>
                    {selectedCountry.launchPhase}
                  </span>
                  <h3 className="text-2xl sm:text-3xl font-sans font-black tracking-tight text-white uppercase mt-2">
                    {selectedCountry.countryName}
                  </h3>
                </div>
                <Activity size={20} style={{ color: selectedCountry.launchColor }} className="animate-pulse shrink-0" />
              </div>

              {/* Stats sub-grid */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Target size={11} /> TARGET
                  </span>
                  <div className="text-lg sm:text-xl font-black text-white font-mono mt-2">
                    15,000 <span className="text-[9px] text-zinc-500 font-sans tracking-wide">FREE</span>
                  </div>
                </div>

                <div className="p-4 bg-zinc-950/50 border border-zinc-900 rounded-2xl flex flex-col justify-between">
                  <span className="text-[8px] text-zinc-500 font-bold uppercase tracking-wider font-mono flex items-center gap-1.5">
                    <Users size={11} /> QUEUED
                  </span>
                  <div className="text-lg sm:text-xl font-black font-mono mt-2 animate-pulse" style={{ color: selectedCountry.launchColor }}>
                    {selectedCountry.currentSignupCount.toLocaleString()}
                  </div>
                </div>
              </div>

              {/* Rollout Saturation Progress Bar */}
              <div className="space-y-2.5">
                <div className="flex justify-between text-[9px] text-zinc-400 font-mono font-bold leading-none">
                  <span>SATURATION STATE</span>
                  <span style={{ color: selectedCountry.launchColor }}>
                    {Math.round((selectedCountry.currentSignupCount / selectedCountry.signupGoal) * 100)}% ALLOCATED
                  </span>
                </div>
                <div className="h-2 w-full bg-zinc-900 rounded-full overflow-hidden">
                  <div 
                    className="h-full rounded-full transition-all duration-1000 bg-gradient-to-r"
                    style={{ 
                      width: `${Math.min(100, (selectedCountry.currentSignupCount / selectedCountry.signupGoal) * 100)}%`,
                      backgroundImage: `linear-gradient(90deg, ${selectedCountry.launchColor}, #FFFFFF)`
                    }}
                  />
                </div>
              </div>
            </div>

            {/* Warning Callout Footer */}
            <div className="mt-6 flex gap-2.5 items-center p-3.5 rounded-xl border border-zinc-900/60 bg-neutral-950/30 text-xs text-zinc-300 font-sans leading-relaxed">
              <span>💎</span>
              <p className="text-[10.5px]">
                Priority allocations are active. Once this country hits the 15,000 limit, free soft-launch clearance unlocks close permanently.
              </p>
            </div>

          </div>
        ) : (
          <div className="bg-zinc-950 border border-zinc-900 rounded-[2rem] p-8 text-center text-zinc-500 text-xs font-mono flex items-center justify-center flex-grow">
            TAP OR SELECT A GEOPOLITICAL STATE DESIRED PIN TO SECURE ROUTE Focus
          </div>
        )}

        {/* Global Waitlist Aggregator Metrics Panel */}
        <div className="p-5 bg-zinc-950/80 border border-zinc-900 rounded-2xl flex flex-col justify-between shadow-lg">
          <div className="flex justify-between items-center mb-1">
            <span className="text-[8px] font-mono text-zinc-500 font-black tracking-widest uppercase">AGGREGATED WAITLIST SYSTEM</span>
            <div className="flex items-center gap-1 text-[8px] font-mono text-emerald-400">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              SYSTEM SECURED
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-black text-white font-mono drop-shadow-[0_0_15px_rgba(0,255,255,0.4)] tracking-wider">
            {totalReservations.toLocaleString()}
          </div>
        </div>

        {/* Geopolitical Wave Selector Buttons (Compact Interface) */}
        <div className="space-y-2">
          <span className="text-[8px] font-mono font-black text-zinc-500 uppercase tracking-[0.2em] block">NEURAL BEACON REGIONS</span>
          <div className="flex flex-wrap gap-2">
            {countryConfigs.map((c, idx) => (
              <button
                key={c.docId || `${c.id}-${idx}`}
                type="button"
                onClick={() => setSelectedCountry(c)}
                style={{ 
                  borderColor: selectedCountry?.id === c.id ? c.launchColor : "rgba(39,39,42,0.45)",
                  backgroundColor: selectedCountry?.id === c.id ? `${c.launchColor}1a` : "transparent",
                  color: selectedCountry?.id === c.id ? "#FFFFFF" : "rgb(150,150,160)"
                }}
                className="px-3.5 py-1.5 border hover:border-zinc-500 rounded-xl text-[9px] font-mono font-black uppercase tracking-widest transition-all duration-300 cursor-pointer flex items-center gap-1.5"
              >
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.launchColor }} />
                {c.id}
              </button>
            ))}
          </div>
        </div>

      </div>

    </div>
  );
}
