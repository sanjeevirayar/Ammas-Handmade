import express from "express";

import {
    adminLogin
} from "../controllers/adminAuthController.js";

import {
    requireAdmin
} from "../middleware/requireAdmin.js";


const router =
    express.Router();


router.post(
    "/login",
    adminLogin
);


router.get(
    "/me",
    requireAdmin,

    (req, res) => {

        return res.json({

            admin: {
                email:
                    req.admin.email,
            },

        });

    }
);


export default router;