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

const swaggerPath = path.resolve(process.cwd(), 'src/docs/openapi.yaml');
const swaggerDocument = YAML.load(swaggerPath);

const swaggerOptions = {
    customfavIcon: "/favicon.ico", // Menggunakan favicon yang sudah di-serve tadi
    customSiteTitle: "Kalana Commerce API Docs" // Judul tab browser
};

const PORT = process.env.PORT ||  3000;

app.use(bodyParser.urlencoded({extended:false}))
app.use(bodyParser.json())
app.use(cors())


app.use(bodyParser.json()); 
app.use(bodyParser.urlencoded({ extended: true }));

app.use('/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument, swaggerOptions));

app.use((req,res,next)=>{
    res.setHeader('Access-Control-Allow-Headers','*')
        res.setHeader('Access-Control-Allow-Methods','*')
        res.setHeader('Access-Control-Allow-Origin','*')
        next()
    
})

routes(app)

app.listen(PORT,() => {
    logger.info(`Server running on http://localhost:${PORT}`)
    console.log(`Swagger Docs available at http://localhost:${PORT}/docs`);
})
