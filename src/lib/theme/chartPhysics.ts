import type { ThemeProfile } from "./profiles";

export function chartPhysics(profile: ThemeProfile) {
  const candleWidth =
    profile.spacing === "Tight" ? 0.55 :
    profile.spacing === "Wide" ? 0.9 :
    0.72;

  const gridCount =
    profile.dataDensity === "Low" ? 4 :
    profile.dataDensity === "High" ? 10 :
    7;

  const animationSpeed =
    profile.motion === "Off" ? 0 :
    profile.glow === "High" ? 300 :
    profile.glow === "Medium" ? 180 :
    80;

  const glowBlur =
    profile.glow === "High" ? 18 :
    profile.glow === "Medium" ? 10 :
    0;

  return {
    candleWidth,
    gridCount,
    animationSpeed,
    glowBlur,
  };
}
