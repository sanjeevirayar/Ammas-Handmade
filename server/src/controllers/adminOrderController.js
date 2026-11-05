import Order from "../models/Order.js";

import {
    setOrderStatus
} from "../services/orderStatusService.js";

import {
    sendOrderStatusUpdateOnce
} from "../services/orderStatusEmailService.js";


/* =====================================================
   GET ALL ORDERS
===================================================== */

export const getAdminOrders =
    async (
        req,
        res
    ) => {

        try {

            const page =
                Math.max(
                    Number.parseInt(
                        req.query.page,
                        10
                    ) || 1,
                    1
                );


            const limit =
                Math.min(
                    Math.max(
                        Number.parseInt(
                            req.query.limit,
                            10
                        ) || 20,
                        1
                    ),
                    100
                );


            const filter = {};


            if (
                req.query.orderStatus &&
                req.query.orderStatus !== "all"
            ) {

                filter.orderStatus =
                    req.query.orderStatus;

            }


            if (
                req.query.paymentStatus &&
                req.query.paymentStatus !== "all"
            ) {

                filter.paymentStatus =
                    req.query.paymentStatus;

            }


            const search =
                String(
                    req.query.search || ""
                ).trim();


            if (search) {

                filter.$or = [

                    {
                        orderNumber: {
                            $regex:
                                search,

                            $options:
                                "i",
                        },
                    },

                    {
                        "customer.firstName": {
                            $regex:
                                search,

                            $options:
                                "i",
                        },
                    },

                    {
                        "customer.lastName": {
                            $regex:
                                search,

                            $options:
                                "i",
                        },
                    },

                    {
                        "customer.email": {
                            $regex:
                                search,

                            $options:
                                "i",
                        },
                    },

                    {
                        "customer.phone": {
                            $regex:
                                search,

                            $options:
                                "i",
                        },
                    },

                ];

            }


            const skip =
                (page - 1) *
                limit;


            const [
                orders,
                total
            ] =
                await Promise.all([

                    Order
                        .find(
                            filter
                        )
                        .sort({
                            createdAt:
                                -1,
                        })
                        .skip(
                            skip
                        )
                        .limit(
                            limit
                        )
                        .lean(),

                    Order.countDocuments(
                        filter
                    ),

                ]);


            return res.json({

                orders,

                pagination: {

                    page,

                    limit,

                    total,

                    totalPages:
                        Math.max(
                            Math.ceil(
                                total /
                                limit
                            ),
                            1
                        ),

                },

            });

        } catch (error) {

            console.error(
                "Get admin orders error:",
                error
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to load orders.",
                });

        }

    };


/* =====================================================
   GET ONE ORDER
===================================================== */

export const getAdminOrderById =
    async (
        req,
        res
    ) => {

        try {

            const order =
                await Order.findById(
                    req.params.id
                ).lean();


            if (!order) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Order not found.",
                    });

            }


            return res.json({
                order,
            });

        } catch (error) {

            console.error(
                "Get admin order error:",
                error
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to load order.",
                });

        }

    };


/* =====================================================
   UPDATE ORDER STATUS
===================================================== */

export const updateAdminOrderStatus =
    async (
        req,
        res
    ) => {

        try {

            const {
                orderStatus
            } = req.body;


            /* =================================================
               VALIDATE REQUEST
            ================================================= */

            if (!orderStatus) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Order status is required.",
                    });

            }


            /* =================================================
               FIND ORDER
            ================================================= */

            const order =
                await Order.findById(
                    req.params.id
                );


            if (!order) {

                return res
                    .status(404)
                    .json({
                        message:
                            "Order not found.",
                    });

            }


            /* =================================================
               UPDATE STATUS + CREATE HISTORY ENTRY
            ================================================= */

            const result =
                setOrderStatus(
                    order,
                    orderStatus,
                    {
                        changedBy:
                            req.admin?.email ||
                            "admin",

                        source:
                            "admin",
                    }
                );


            /* =================================================
               SAME STATUS

               Example:

               making -> making

               No new status event.
               No email.
            ================================================= */

            if (
                !result.changed
            ) {

                return res.json({

                    message:
                        "Order is already using this status.",

                    order,

                    email: {
                        sent:
                            false,

                        skipped:
                            true,

                        reason:
                            "status_not_changed",
                    },

                });

            }


            /* =================================================
               SAVE STATUS FIRST

               This is important.

               Even if email sending later fails,
               the order status must remain updated.
            ================================================= */

            await order.save();


            /* =================================================
               SEND CUSTOMER STATUS EMAIL

               Only statuses such as:

               making
               ready
               shipped
               delivered
               cancelled

               have emailStatus = "pending".

               pending / confirmed do not use this
               status-update email flow.
            ================================================= */

            let emailResult = {

                sent:
                    false,

                skipped:
                    true,

                reason:
                    "email_not_required",

            };


            if (
                result.historyEntry
                    ?.emailStatus ===
                "pending"
            ) {

                try {

                    emailResult =
                        await sendOrderStatusUpdateOnce({
                            orderId:
                                order._id,

                            status:
                                orderStatus,

                            changedAt:
                                result
                                    .historyEntry
                                    .changedAt,
                        });

                } catch (
                    emailError
                ) {

                    /*
                       Important:

                       Email failure must NEVER make
                       the order-status update fail.
                    */

                    console.error(
                        "Order status email processing error:",
                        emailError
                    );


                    emailResult = {

                        sent:
                            false,

                        failed:
                            true,

                        error:
                            emailError
                                ?.message ||
                            "Unable to process status email.",

                    };

                }

            }


            /* =================================================
               RELOAD ORDER

               The email service may have changed:

               emailStatus
               emailSentAt
               emailMessageId
               emailLastError

               Fetch the latest copy so the admin
               frontend receives the newest data.
            ================================================= */

            const updatedOrder =
                await Order.findById(
                    order._id
                );


            /* =================================================
               RESPONSE
            ================================================= */

            return res.json({

                message:
                    emailResult.sent
                        ? "Order status updated and customer notified."
                        : "Order status updated successfully.",

                order:
                    updatedOrder ||
                    order,

                email:
                    emailResult,

            });

        } catch (error) {

            console.error(
                "Update admin order status error:",
                error
            );


            /* =================================================
               INVALID STATUS
            ================================================= */

            if (
                error.message?.startsWith(
                    "Invalid order status:"
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            error.message,
                    });

            }


            /* =================================================
               INVALID SOURCE
            ================================================= */

            if (
                error.message?.startsWith(
                    "Invalid order status source:"
                )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            error.message,
                    });

            }


            return res
                .status(500)
                .json({
                    message:
                        "Unable to update order status.",
                });

        }

    };