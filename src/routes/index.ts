import { Application, Router } from "express";
import { ProductRouter } from './product.route.js';
import { outletRouter } from "./outlet.route.js";
import { authRouter } from "./auth.route.js";
import { categoryRouter } from "./category.route.js";
import { unitRouter } from "./unit.route.js";
import { cartRouter } from "./cart.route.js";

const _routes: Array<[string, Router]> = [
    ['/api/products', ProductRouter],
    ['/api/outlets', outletRouter],
    ['/api/auth', authRouter],
    ['/api/categories', categoryRouter],
    ['/api/units', unitRouter],
    ['/api/carts', cartRouter],
 
]
export const routes = (app: Application) => {

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

