export type AdvancedProfileId = 'focus_mode' | 'lava_hot' | 'calm_focus' | 'low_stim_emergency' | 'dyslexia_readable' | 'dyscalculia_numeric_relief' | 'visual_processing_safe' | 'apd_assist' | 'executive_function_support' | 'motor_friendly' | 'adhd_dopamine_balanced' | 'adhd_hyperfocus' | 'autism_predictable' | 'tourette_tic_friendly' | 'standard_red_green';

export interface AdvancedProfile {
  id: AdvancedProfileId;
  name: string;
  // RESTORED: Flattened structure to match the fixProfile.ts requirements
  bgTop: string;
  bgBottom: string;
  borderA: string; // Formerly profile.ui.accent
  text: string;
  chartStyle: number; 
}

export const advancedProfiles: Record<AdvancedProfileId, AdvancedProfile> = {
  focus_mode: {
    id: 'focus_mode',
    name: 'Focus Mode (Money State)',
    bgTop: '#050505',
    bgBottom: '#04020a',
    borderA: '#7F00FF', // Neon Indigo
    text: '#00FFFF', // Neuro-Cyan
    chartStyle: 2
  },
  lava_hot: {
    id: 'lava_hot',
    name: 'Lava Hot (High Intensity)',
    bgTop: '#000000',
    bgBottom: '#050000',
    borderA: '#FF4500', // Magma Flare
    text: '#ff0000', // Lava Red
    chartStyle: 2
  },
  calm_focus: { id: "calm_focus", name: "Calm Focus", bgTop: "#07111f", bgBottom: "#030712", borderA: "#38bdf8", text: "#dbeafe", chartStyle: 1 },
  low_stim_emergency: { id: "low_stim_emergency", name: "Low Stimulation", bgTop: "#05070b", bgBottom: "#000000", borderA: "#475569", text: "#cbd5e1", chartStyle: 1 },
  dyslexia_readable: { id: "dyslexia_readable", name: "Reading Support", bgTop: "#08131f", bgBottom: "#020617", borderA: "#4D00FF", text: "#f8fafc", chartStyle: 1 },
  dyscalculia_numeric_relief: { id: "dyscalculia_numeric_relief", name: "Numeric Relief", bgTop: "#0a1220", bgBottom: "#020617", borderA: "#4D00FF", text: "#e2e8f0", chartStyle: 1 },
  visual_processing_safe: { id: "visual_processing_safe", name: "Visual Ease", bgTop: "#06111b", bgBottom: "#01040a", borderA: "#60a5fa", text: "#dbeafe", chartStyle: 1 },
  apd_assist: { id: "apd_assist", name: "Reduced Signal Load", bgTop: "#08131d", bgBottom: "#020617", borderA: "#2dd4bf", text: "#e2e8f0", chartStyle: 1 },
  executive_function_support: { id: "executive_function_support", name: "Task Structure", bgTop: "#07101b", bgBottom: "#020617", borderA: "#38bdf8", text: "#e2e8f0", chartStyle: 1 },
  motor_friendly: { id: "motor_friendly", name: "Large Target Mode", bgTop: "#09111f", bgBottom: "#020617", borderA: "#4D00FF", text: "#f1f5f9", chartStyle: 1 },
  adhd_dopamine_balanced: { id: "adhd_dopamine_balanced", name: "Balanced Energy", bgTop: "#09091b", bgBottom: "#020617", borderA: "#22d3ee", text: "#f8fafc", chartStyle: 1 },
  adhd_hyperfocus: { id: "adhd_hyperfocus", name: "Hyperfocus", bgTop: "#090510", bgBottom: "#000000", borderA: "#00f5ff", text: "#ffffff", chartStyle: 2 },
  autism_predictable: { id: "autism_predictable", name: "Autism - Predictable", bgTop: "#07111a", bgBottom: "#020617", borderA: "#4D00FF", text: "#f1f5f9", chartStyle: 1 },
  tourette_tic_friendly: { id: "tourette_tic_friendly", name: "Minimal Motion", bgTop: "#05070b", bgBottom: "#000000", borderA: "#4D00FF", text: "#e2e8f0", chartStyle: 1 },
  standard_red_green: { id: "standard_red_green", name: "Standard Chart (Red & Green)", bgTop: "#131722", bgBottom: "#0b0e14", borderA: "#26a69a", text: "#d1d4dc", chartStyle: 1 },
};
