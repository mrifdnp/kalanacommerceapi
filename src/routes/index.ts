import { Application, Router } from "express";
import { ProductRouter } from './product.route.js';
import { outletRouter } from "./outlet.route.js";
import { authRouter } from "./auth.route.js";
import { categoryRouter } from "./category.route.js";
import { unitRouter } from "./unit.route.js";
import { cartRouter } from "./cart.route.js";
import profileRouter from "./profile.route.js";
import { addressRouter } from "./address.routes.js";
import { chatbotRouter } from "./chatbot.route.js";
import paymentRouter from "./payment.route.js";

const _routes: Array<[string, Router]> = [
    ['/api/products', ProductRouter],
    ['/api/outlets', outletRouter],
    ['/api/auth', authRouter],
    ['/api/categories', categoryRouter],
    ['/api/units', unitRouter],
    ['/api/carts', cartRouter],
    ['/api/me', profileRouter],
    ['/api/addresses', addressRouter],
    ['/api/chatbot', chatbotRouter],
    ['/api/payments', paymentRouter]
]
export const routes = (app: Application) => {


   app.get('/', (req, res) => {
        // Gunakan \n untuk baris baru (di terminal atau browser dengan Content-Type: text/plain)
        const statusText = `
Kalana Commerce API V3 STATUS
---------------------------------------
STATUS: OK
LAST UPDATE: 2025-12-12
DOKUMENTASI: /docs

CHANGELOG TERAKHIR:
1. Model User: Menambahkan field 'phoneNumber' (Wajib diisi saat Register).
2. Fix: Menyelesaikan konflik Foreign Key UUID/TEXT di seluruh database.
3. Cleanup: Menghapus semua riwayat migrasi lama yang korup.
---------------------------------------
`;
        // Kirim sebagai teks biasa
        res.setHeader('Content-Type', 'text/plain');
        res.status(200).send(statusText);
    });

    app.get('/health', (req, res) => {
        res.status(200).send({ status: 'UP', message: 'API is healthy' });
    });

    _routes.forEach((route) => {
        const [url, router] = route
        app.use(url, router)
    })

    app.use((req, res) => {
        res.status(404).send({ status: false, statusCode: 404, message: 'Endpoint not found', data: {} });
    });
}

