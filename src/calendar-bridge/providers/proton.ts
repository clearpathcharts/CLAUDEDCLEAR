// src/calendar-bridge/providers/proton.ts

export async function connectProton(email: string, bridgeKey?: string) {
  if (!email || !email.includes('@')) {
    throw new Error("Invalid Proton Mail address");
  }
  return {
    provider: "proton",
    email,
    connected: true,
    encryptedMode: true,
    timestamp: new Date().toISOString()
  };
}
