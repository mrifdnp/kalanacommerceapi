import  express, {Application,}  from "express";
import favicon from "serve-favicon";
import path from "path";

const app:Application = express();

app.use(favicon(path.join(process.cwd(), 'public', 'favicon.png')));



export default app;