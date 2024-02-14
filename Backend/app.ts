import "core-js/actual/structured-clone"
import "web-streams-polyfill/es6";

import express, { Express, NextFunction, Request, Response } from "express";
import bodyParser from 'body-parser';
import multer from "multer";
import { inMemoryStorage, fileFilter } from "./utils/multer"
import { filesRoute } from "./routes/files"
import { chatRoute } from "./routes/chat"

const app: Express = express();
const port = process.env.PORT || 3000;

const allowCrossDomain = (req: Request, res: Response, next: NextFunction) => {
  res.header(`Access-Control-Allow-Origin`, `http://127.0.0.1:5173`);
  res.header(`Access-Control-Allow-Methods`, `GET,PUT,POST,DELETE`);
  res.header(`Access-Control-Allow-Headers`, `Content-Type`);
  next();
};

app.use(allowCrossDomain);
app.use(bodyParser.json());
app.use(bodyParser.json({limit: '15mb'}));
app.use(bodyParser.urlencoded({limit: '15mb', extended: true}));

app.use(multer({ storage: inMemoryStorage, fileFilter }).array("document", 1));

app.get("/", (_req: Request, res: Response) => {
  res.send("Backend alive!");
});

app.use("/files", filesRoute);
app.use("/chat", chatRoute);


app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
