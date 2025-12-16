import { Request, Response } from 'express';
import nodemailer from 'nodemailer';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

// Konfigurasi transporter khusus Google
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// src/controllers/auth.controller.ts

export const forgotPassword = async (req: Request, res: Response) => {
    try {
        const { email } = req.body;
        const user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            return res.status(200).send({ message: 'Jika akun ditemukan, kode OTP telah dikirim.' });
        }

        // 1. Generate OTP 6 Digit Angka
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpires = new Date(Date.now() + 5 * 60000); // Kode cuma berlaku 5 MENIT

        // 2. Simpan ke Database
        await prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken: otp, // Kita simpan OTP di kolom resetToken
                resetTokenExpires: otpExpires,
            },
        });

        // 3. Kirim Email berisi OTP
        await transporter.sendMail({
            from: '"Admin CiptaWorks" <noreply@myid.id>',
            to: email,
            subject: 'Kode OTP Reset Password',
            html: `
                <div style="font-family: sans-serif; text-align: center; border: 1px solid #ddd; padding: 20px;">
                    <h2>Kode Verifikasi</h2>
                    <p>Gunakan kode OTP di bawah ini untuk mereset password Anda:</p>
                    <h1 style="background: #f4f4f4; display: inline-block; padding: 10px 20px; letter-spacing: 5px; color: #007bff;">${otp}</h1>
                    <p>Kode ini hanya berlaku selama <b>5 menit</b>.</p>
                    <p>Jangan berikan kode ini kepada siapapun.</p>
                </div>
            `,
        });

        return res.status(200).send({ message: 'Kode OTP berhasil dikirim ke email.' });

    } catch (error) {
        console.error(error);
        return res.status(500).send({ message: 'Gagal mengirim OTP.' });
    }
};

export const resetPassword = async (req: Request, res: Response) => {
    try {
        const { email, otp, newPassword } = req.body; // Sekarang butuh email juga untuk verifikasi

        if (!email || !otp || !newPassword) {
            return res.status(400).send({ message: 'Data tidak lengkap.' });
        }

        // 1. Cari user berdasarkan Email dan OTP yang belum expired
        const user = await prisma.user.findFirst({
            where: {
                email: email,
                resetToken: otp,
                resetTokenExpires: { gt: new Date() }
            }
        });

        if (!user) {
            return res.status(400).send({ message: 'Kode OTP salah atau sudah kedaluwarsa.' });
        }

        // 2. Hash Password Baru
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // 3. Update & Bersihkan OTP
        await prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpires: null
            }
        });

        return res.status(200).send({ message: 'Password berhasil diperbarui!' });

    } catch {
        return res.status(500).send({ message: 'Gagal mereset password.' });
    }
};