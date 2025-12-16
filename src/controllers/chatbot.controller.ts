import { GoogleGenAI, Chat } from '@google/genai'; // ⬅️ IMPORT TYPE 'Chat'
import { Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { logger } from '../utils/logger.js';

// ⚠️ Gunakan tipe AuthRequest yang sudah kita buat sebelumnya


// Inisialisasi Google Gen AI (API Key harus ada di process.env)
const ai = new GoogleGenAI({});

// PENTING: Map untuk menyimpan sesi chat per pengguna
// Di lingkungan production, ini harus disimpan di Redis atau Database
const userChatSessions = new Map<string, Chat>();
/**
 * Controller untuk menerima pesan dari user dan membalasnya, 
 * sambil mempertahankan riwayat percakapan.
 * Route: POST /api/chatbot/send
 */
export const sendChatMessage = async (req: AuthRequest, res: Response) => {
    const userId = req.userId; // Dari JWT
    const { message } = req.body;

    if (!userId) {
        return res.status(401).send({ status: false, message: 'Unauthorized.' });
    }
    if (!message) {
        return res.status(400).send({ status: false, message: 'Message body is required.' });
    }

    // 1. Dapatkan atau Buat Sesi Chat
    let chat = userChatSessions.get(userId);

    if (!chat) {
        // Jika sesi belum ada, buat sesi baru
        chat = ai.chats.create({
            model: "gemini-2.5-flash",
            config: {
                systemInstruction: `Anda adalah Chatbot layanan pelanggan, jangan jawab dengan tanda baca ...`
            }
        });
        userChatSessions.set(userId, chat);
    }

    try {
        // 2. Kirim Pesan ke Sesi Chat
        const response = await chat.sendMessage({ message });
        const textResponse = response.text;

        logger.info({ userId, prompt: message }, 'Chatbot success response.');

        return res.status(200).send({
            status: true,
            response: textResponse,
            history: await chat.getHistory(), 
        });

   } catch (e: unknown) { // ⬅️ Ganti :any menjadi :unknown
        // 1. Lakukan Type Narrowing untuk memastikan 'e' adalah Error
        const errorMessage = (e instanceof Error) ? e.message : 'Unknown Gemini API error.';

        logger.error({ error: errorMessage, userId }, 'ERR: chatbot - send message');
        
        // Cek jika error spesifik dari Gemini
        if (errorMessage.includes('API key')) {
             return res.status(500).send({ status: false, message: 'Server configuration error (API Key).' });
        }
        
        return res.status(500).send({ status: false, message: 'Gagal menghubungi Gemini API.' });
    }
};
