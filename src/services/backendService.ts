import { 
  collection, 
  addDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  doc,
  getDoc,
  setDoc,
  limit
} from '../firebase';
import { getDb, auth } from '../firebase';
import { TimelinePost, Alert, UserRole, PortfolioPosition, LeaderboardEntry, TradingStrategy } from '../types';

/**
 * SOCIAL FEED ENGINE (File 3, 91)
 */
export async function createPost(userId: string, text: string) {
  if (!text) return;
  return await addDoc(collection(getDb(), 'posts'), {
    uid: userId,
    text,
    createdAt: serverTimestamp()
  });
}

export async function postAnalysis(userId: string, content: any) {
  return await addDoc(collection(getDb(), 'posts'), {
    uid: userId,
    type: 'analysis',
    content,
    createdAt: serverTimestamp()
  });
}

export function subscribeToPosts(callback: (posts: TimelinePost[]) => void) {
  const q = query(collection(getDb(), 'posts'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    const posts = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as TimelinePost));
    callback(posts);
  });
}

/**
 * PRIVATE MESSAGE SYSTEM (File 4)
 */
export async function sendSecureMessage(data: { name: string; email: string; message: string; targetUid: string }) {
  if (!data.name || !data.email || !data.message) return;
  return await addDoc(collection(getDb(), 'messages'), {
    ...data,
    senderUid: auth.currentUser?.uid || 'anonymous',
    status: 'new',
    createdAt: serverTimestamp()
  });
}

/**
 * ACCESS CONTROL SYSTEM (File 7)
 */
export async function getUserRole(userId: string): Promise<UserRole['role']> {
  const docRef = doc(getDb(), 'roles', userId);
  const snap = await getDoc(docRef);
  if (!snap.exists()) return 'public';
  return (snap.data() as UserRole).role;
}

/**
 * ALERT ENGINE (File 8)
 */
export async function createAlert(userId: string, symbol: string, price: number, condition: 'above' | 'below' = 'above') {
  return await addDoc(collection(getDb(), 'users', userId, 'alerts'), {
    uid: userId,
    symbol: symbol.toUpperCase(),
    price,
    condition,
    triggered: false,
    createdAt: serverTimestamp()
  });
}

/**
 * MARKET SCANNER (File 9)
 */
/**
 * PORTFOLIO TRACKER (File 36)
 */
export async function addPosition(userId: string, symbol: string, price: number, quantity: number) {
  return await addDoc(collection(getDb(), 'users', userId, 'portfolio'), {
    uid: userId,
    symbol: symbol.toUpperCase(),
    price,
    quantity,
    createdAt: serverTimestamp()
  });
}

export function subscribeToPortfolio(userId: string, callback: (positions: PortfolioPosition[]) => void) {
  const q = query(collection(getDb(), 'users', userId, 'portfolio'), orderBy('createdAt', 'desc'));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as PortfolioPosition)));
  });
}

/**
 * LEADERBOARD (File 38)
 */
export async function calculateLeaderboard(): Promise<LeaderboardEntry[]> {
  // In a real app, this would be a cloud function.
  // Here we aggregate from a sample or public shares.
  const snapshot = await getDocs(collection(getDb(), 'posts'));
  const scores: Record<string, number> = {};
  
  snapshot.docs.forEach(doc => {
    const data = doc.data();
    if (data.uid) {
      scores[data.uid] = (scores[data.uid] || 0) + 1; // Example scoring based on engagement/posts
    }
  });

  return Object.entries(scores)
    .map(([uid, score]) => ({ uid, score }))
    .sort((a, b) => b.score - a.score);
}

export function computeTraderScore(stats: { likes: number; posts: number; performance: number }) {
  const engagement = stats.likes + stats.posts * 2;
  const performance = stats.performance || 0;
  // File 97: engagement * 0.6 + performance * 0.4
  return engagement * 0.6 + performance * 0.4;
}

export function rankUsers(users: any[]) {
  return users
    .map(u => ({
      ...u,
      score: computeTraderScore({
        likes: u.likes || 0,
        posts: u.postsLength || 0,
        performance: u.pnl || 0
      })
    }))
    .sort((a, b) => b.score - a.score);
}

/**
 * ENGAGEMENT & PERSONALIZATION (File 102, 103)
 */
export async function trackEngagement(userId: string, asset: string, action: string) {
  return await addDoc(collection(getDb(), "engagement"), {
    userId,
    asset,
    action,
    timestamp: serverTimestamp()
  });
}

export async function getEngagementHeatmap(userId: string) {
  const q = query(collection(getDb(), "engagement"), where("userId", "==", userId));
  const snapshot = await getDocs(q);
  const map: Record<string, number> = {};

  snapshot.docs.forEach(doc => {
    const d = doc.data();
    if (!map[d.asset]) map[d.asset] = 0;
    map[d.asset]++;
  });

  return map;
}

/**
 * DISCOVERY FEED (File 104)
 */
export async function loadDiscoveryFeed() {
  const q = query(collection(getDb(), "posts"), orderBy("createdAt", "desc"), limit(30));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as TimelinePost));
}

/**
 * PAPER TRADING SIMULATOR (File 110)
 */
export function simulateTrade(balance: number, entry: number, exit: number, shares: number = 1) {
  const profit = (exit - entry) * shares;
  return balance + profit;
}
export async function uploadStrategy(userId: string, name: string, result: number) {
  return await addDoc(collection(getDb(), 'strategies'), {
    uid: userId,
    name,
    result,
    createdAt: serverTimestamp()
  });
}

export function subscribeToStrategies(callback: (strategies: TradingStrategy[]) => void) {
  const q = query(collection(getDb(), 'strategies'), orderBy('createdAt', 'desc'), limit(50));
  return onSnapshot(q, (snapshot) => {
    callback(snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as TradingStrategy)));
  });
}

