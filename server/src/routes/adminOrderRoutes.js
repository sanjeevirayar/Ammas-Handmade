import express from "express";

import {
    getAdminOrders,
    getAdminOrderById,
    updateAdminOrderStatus
} from "../controllers/adminOrderController.js";

import {
    requireAdmin
} from "../middleware/requireAdmin.js";


const router =
    express.Router();


router.use(
    requireAdmin
);


router.get(
    "/",
    getAdminOrders
);


router.get(
    "/:id",
    getAdminOrderById
);


router.patch(
    "/:id/status",
    updateAdminOrderStatus
);


export default router;