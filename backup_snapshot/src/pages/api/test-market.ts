export default async function handler(req: any, res: any) {
  try {
    res.status(200).json({
      success: true,
      timestamp: Date.now(),
    })
  } catch {
    res.status(500).json({
      success: false,
    })
  }
}
