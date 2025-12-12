    import dotenv from "dotenv";
import bodyParser from 'body-parser';
dotenv.config();
import app from "./app.js";
import { routes } from "./routes/index.js";
import cors from 'cors';
import { logger } from "./utils/logger.js";
import swaggerUi from 'swagger-ui-express';
import YAML from 'yamljs'; 
import path from 'path';
import rateLimit from "express-rate-limit";


const swaggerPath = path.resolve(process.cwd(), 'src/docs/openapi.yaml');
// Muat file YAML
const swaggerDocument = YAML.load(swaggerPath);


export const authLimiter = rateLimit({
    windowMs: 5 * 60 * 1000, // 5 menit
    max: 5, // Maksimal 5 request per IP dalam 5 menit
    message: {
        status: false,
        statusCode: 429,
        message: 'Too many requests. Please try again after 5 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});
const PORT = process.env.PORT ||  3000;

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(cors())


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

// ⬅️ DAFTARKAN JALUR SWAGGER/DOCS
app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Headers','*')
        res.setHeader('Access-Control-Allow-Method','*')
        res.setHeader('Access-Control-Allow-Origin','*')
        next()
    
})

routes(app)

app.listen(PORT,() => {
    logger.info(`Server running on http://localhost:${PORT}`)
    console.log(`Swagger Docs available at http://localhost:${PORT}/docs`);
})
