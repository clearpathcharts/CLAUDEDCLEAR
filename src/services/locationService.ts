export async function getFriendlyLocation(lat: number, lng: number): Promise<string> {
  return `${lat.toFixed(2)}, ${lng.toFixed(2)}`;
}
