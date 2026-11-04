import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

import connectDB
    from "./config/db.js";

import productRoutes
    from "./routes/productRoutes.js";

import orderRoutes
    from "./routes/orderRoutes.js";

import paymentRoutes
    from "./routes/paymentRoutes.js";

import {
    handleRazorpayWebhook
} from "./controllers/webhookController.js";


/* =====================================================
   FILE / DIRECTORY PATHS
===================================================== */

const __filename =
    fileURLToPath(
        import.meta.url
    );

const __dirname =
    path.dirname(
        __filename
    );


/* =====================================================
   ENVIRONMENT VARIABLES

   Local:
   server/.env

   Production:
   Hostinger environment variables remain available
   through process.env.
===================================================== */

dotenv.config({
    path: path.resolve(
        __dirname,
        "../.env"
    ),
});


/* =====================================================
   EXPRESS APP
===================================================== */

const app =
    express();


const PORT =
    process.env.PORT ||
    3001;


/* =====================================================
   FRONTEND BUILD PATH

   server/src/index.js
   → ../../dist
   → project-root/dist
===================================================== */

const frontendDistPath =
    path.resolve(
        __dirname,
        "../../dist"
    );


/* =====================================================
   DATABASE
===================================================== */

connectDB();


/* =====================================================
   RAZORPAY WEBHOOK

   IMPORTANT:
   This MUST remain before express.json()
   because Razorpay signature verification needs
   the original raw request body.
===================================================== */

app.post(
    "/api/webhooks/razorpay",

    express.raw({
        type:
            "application/json",
    }),

    handleRazorpayWebhook
);


/* =====================================================
   JSON MIDDLEWARE
===================================================== */

app.use(
    express.json()
);


/* =====================================================
   HEALTH CHECK
===================================================== */

app.get(
    "/api/health",

    (req, res) => {

        res.json({
            status:
                "ok",

            message:
                "Amma's Handmade backend is running",
        });

    }
);


/* =====================================================
   PRODUCT ROUTES
===================================================== */

app.use(
    "/api/products",
    productRoutes
);


/* =====================================================
   ORDER ROUTES
===================================================== */

app.use(
    "/api/orders",
    orderRoutes
);


/* =====================================================
   PAYMENT ROUTES
===================================================== */

app.use(
    "/api/payments",
    paymentRoutes
);


/* =====================================================
   SERVE REACT PRODUCTION BUILD
===================================================== */

app.use(
    express.static(
        frontendDistPath
    )
);


/* =====================================================
   REACT ROUTER FALLBACK

   Requests such as:

   /
   /shop
   /collections
   /product/example-product

   are handled by React.

   /api/* requests are NEVER redirected to React.
===================================================== */

app.use(
    (req, res, next) => {

        if (
            req.method !== "GET" ||
            req.path.startsWith("/api/")
        ) {

            return next();

        }


        return res.sendFile(
            path.join(
                frontendDistPath,
                "index.html"
            )
        );

    }
);


/* =====================================================
   API 404

   Keeps invalid API requests from accidentally
   returning the React frontend.
===================================================== */

app.use(
    "/api",

    (req, res) => {

        return res
            .status(404)
            .json({
                message:
                    "API route not found.",
            });

    }
);


/* =====================================================
   START SERVER

   Do NOT force 127.0.0.1 here.
   Hostinger provides the production networking.
===================================================== */

app.listen(
    PORT,

    () => {

        console.log(
            `Backend running on port ${PORT}`
        );

    }
);