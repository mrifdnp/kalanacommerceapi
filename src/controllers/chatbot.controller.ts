/* eslint-disable @typescript-eslint/no-explicit-any */
import {Request, Response } from 'express';
import { AuthRequest } from '../middlewares/auth.middleware.js';
import { logger } from '../utils/logger.js';
import { prisma } from '../lib/prisma.js';

export const sendChatMessage = async (req: AuthRequest, res: Response) => {
    const { message } = req.body;
    const userId = req.userId;

    if (!userId) {
        logger.warn('Chat attempt without userId');
        return res.status(401).send({ status: false, statusCode: 401, message: 'Unauthorized.' });
    }
    try {
        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: { name: true }
        });

        const allProducts = await prisma.product.findMany({
            where: { deletedAt: null },
            include: { variants: true, category: true }
        });

        const productContext = allProducts.map(p =>
            `- ${p.name} (${p.category?.name}): ${p.variants.map(v => v.price).join('/')}`
        ).join('\n');

        const userName = user?.name || 'Pelanggan';
        logger.info({
            userId, userName,
            messageLength: message?.length
        }, 'Sending request to Groq API');
        const startTime = Date.now();

        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        content: `Anda pelayan ramah di Toko Kalana. 
                        Anda sedang berbicara dengan: ${userName}. 
                        Waktu sekarang: ${new Date().toLocaleTimeString('id-ID', { timeZone: 'Asia/Jakarta' })}. 
                        Selalu sapa user dengan namanya jika sopan.   
                        Daftar Produk:\n${productContext}
                        Tugas Anda:
1. Jawab pertanyaan dengan ramah.
2. Jika user ingin membeli/memesan, identifikasi produk dan jumlahnya.
3. DI AKHIR JAWABAN, selalu sertakan format JSON khusus di dalam tag <checkout> jika ada produk yang ingin dibeli, contoh:
   <checkout>
   [{"id": "uuid-produk-1", "qty": 2}, {"id": "uuid-produk-2", "qty": 1}]
   </checkout>

Daftar Produk (Gunakan ID ini untuk JSON):\n${allProducts.map(p => `- ID: ${p.id} 
    | Nama: ${p.name} 
    | Harga: ${p.variants[0]?.price}`).join('\n')}`

                    },
                    { role: "user", content: message }
                ]
            })
        });

        const data = await response.json() as any;
        const duration = Date.now() - startTime;
        if (data.error) {
            logger.error({ error: data.error, userId }, 'Groq API returned an error');
            throw new Error(data.error.message);
        }
        logger.info({
            userId,
            duration: `${duration}ms`,
            promptTokens: data.usage?.prompt_tokens,
            completionTokens: data.usage?.completion_tokens,
            totalTokens: data.usage?.total_tokens
        }, 'Groq API success response');
        return res.status(200).send({
            status: true,
            response: data.choices[0].message.content,
        });
    } catch (e: any) {
        logger.error({
            error: e.message,
            userId,
            stack: e.stack
        }, 'ERR: groq-chatbot-critical');
        return res.status(500).send({ status: false, message: 'Groq sedang istirahat.' });
    }
};

export const sendChatTrial = async (req: Request, res: Response) => {
    // Ambil pesan dari body request
    const { message } = req.body;

    try {
        // 1. Hardcode nama tamu
        const userName = 'Kakak'; 

        // 2. Ambil Data Produk (Tetap perlu supaya AI tahu stok)
        const allProducts = await prisma.product.findMany({
            where: { deletedAt: null },
            include: { variants: true, category: true }
        });

        // Format data produk menjadi string untuk konteks AI
        const productContext = allProducts.map(p =>
            `- ${p.name} (${p.category?.name}): ${p.variants.map(v => v.price).join('/')}`
        ).join('\n');

        // 3. Log request
        logger.info({ role: 'Guest', messageLength: message?.length }, 'Groq Trial Request');

        // 4. Kirim ke Groq AI
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "llama-3.3-70b-versatile",
                messages: [
                    {
                        role: "system",
                        // FIX ESLint: userName digunakan di sini ("${userName}")
                        content: `Anda asisten virtual Toko Kalana. 
                        User ini adalah TAMU (Guest). Sapa dengan panggilan "${userName}".
                        
                        Daftar Produk:\n${productContext}
                        
                        Tugas:
                        1. Jawab pertanyaan singkat & ramah.
                        2. Dorong user untuk LOGIN/DAFTAR di akhir percakapan jika mereka ingin checkout.
                        3. JANGAN berikan tag <checkout> json, karena tamu tidak bisa checkout langsung. 
                           Ganti dengan: "Silakan login untuk memproses pesanan ini ya, ${userName}! 😊"`
                    },
                    { role: "user", content: message }
                ]
            })
        });

        // FIX TypeScript: Parse JSON dulu sebelum akses properti data
        // Menggunakan 'as any' untuk menghindari error strict typing pada response eksternal
        const data = await response.json() as any;
        
        // Cek jika API Groq mengembalikan error
        if (data.error) {
            // Sekarang aman mengakses data.error.message karena sudah diparsing
            throw new Error(data.error.message);
        }

        return res.status(200).send({
            status: true,
            response: data.choices[0].message.content,
        });

    } catch (e: any) {
        logger.error({ 
            error: e.message, 
            stack: e.stack 
        }, 'ERR: groq-trial');
        
        return res.status(500).send({ 
            status: false, 
            message: 'Maaf, AI sedang sibuk atau terjadi kesalahan jaringan.' 
        });
    }
};