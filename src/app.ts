import  express, {Application,}  from "express";
import favicon from "serve-favicon";
import path from "path";

const app:Application = express();

app.set('view engine', 'ejs');
app.set('views', path.join(process.cwd(), 'src', 'views'));

app.set('trust proxy', 1);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(favicon(path.join(process.cwd(), 'public', 'favicon.png')));

app.use(express.static('public'));

export default app;