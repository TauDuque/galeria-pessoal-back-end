import dotenv from "dotenv";
import express, { Express, Request, Response } from "express";
import cors from "cors";
import mainRouter from "./api/routes";

dotenv.config();

const app: Express = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Middleware de logging para debug
app.use((req, res, next) => {
  console.log(`🌐 ${req.method} ${req.path} - ${new Date().toISOString()}`);
  next();
});

// Rotas
app.use("/api", mainRouter);

app.get("/", (_req: Request, res: Response) => {
  res.json({ message: "API da Galeria de Arte Pessoal está no ar!" });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Servidor rodando na porta ${PORT}`);
});
