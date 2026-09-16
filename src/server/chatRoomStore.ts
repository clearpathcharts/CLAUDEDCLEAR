/**
 * Durable chat room history — Firestore when Admin is up, in-memory fallback per process.
 */
import { getAdminFirestore } from './firebaseAdmin';

export type ChatRoomMessage = {
  id: string;
  roomId: string;
  author: string;
  avatar?: string;
  text: string;
  timestamp: number;
  isSystem?: boolean;
};

const COLLECTION = 'chat_rooms';
const MAX_PER_ROOM = 120;
const memory: Record<string, ChatRoomMessage[]> = {};

function memoryRoom(roomId: string): ChatRoomMessage[] {
  if (!memory[roomId]) memory[roomId] = [];
  return memory[roomId];
}

export async function loadChatRoomHistory(roomId: string, limit = 80): Promise<ChatRoomMessage[]> {
  const db = getAdminFirestore();
  if (db) {
    try {
      const snap = await db
        .collection(COLLECTION)
        .doc(roomId)
        .collection('messages')
        .orderBy('timestamp', 'desc')
        .limit(limit)
        .get();
      const rows = snap.docs
        .map((d) => d.data() as ChatRoomMessage)
        .filter((m) => m?.id && m.text)
        .reverse();
      memory[roomId] = rows.slice(-MAX_PER_ROOM);
      return rows;
    } catch (err) {
      console.warn('[ChatRoom] Firestore history load failed', err);
    }
  }
  return memoryRoom(roomId).slice(-limit);
}

export async function appendChatRoomMessage(message: ChatRoomMessage): Promise<void> {
  const room = memoryRoom(message.roomId);
  room.push(message);
  if (room.length > MAX_PER_ROOM) room.splice(0, room.length - MAX_PER_ROOM);

  const db = getAdminFirestore();
  if (!db) return;
  try {
    await db
      .collection(COLLECTION)
      .doc(message.roomId)
      .collection('messages')
      .doc(message.id)
      .set(message);
  } catch (err) {
    console.warn('[ChatRoom] Firestore append failed (memory copy kept)', err);
  }
}
