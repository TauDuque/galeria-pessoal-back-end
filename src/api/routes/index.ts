import { Router } from "express";
import userRoutes from "./userRoutes";

const router = Router();

router.get("/", (_req, res) => {
  res.json({ status: "Raiz da API" });
});

router.use("/users", userRoutes);

export default router;
