import { Router, type IRouter } from "express";
import healthRouter from "./health";
import portfoliosRouter from "./portfolios";
import holdingsRouter from "./holdings";
import transactionsRouter from "./transactions";
import projectsRouter from "./projects";
import tasksRouter from "./tasks";
import membersRouter from "./members";
import dashboardRouter from "./dashboard";
import authRouter from "./auth";
import adminRouter from "./admin";
import cryptoRouter from "./crypto";
import paymentAddressesRouter from "./paymentAddresses";
import paymentsRouter from "./payments";

const router: IRouter = Router();

router.use(healthRouter);
router.use(authRouter);
router.use(adminRouter);
router.use(cryptoRouter);
router.use(paymentAddressesRouter);
router.use(paymentsRouter);
router.use(portfoliosRouter);
router.use(holdingsRouter);
router.use(transactionsRouter);
router.use(projectsRouter);
router.use(tasksRouter);
router.use(membersRouter);
router.use(dashboardRouter);

export default router;
