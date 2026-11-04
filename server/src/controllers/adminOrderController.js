import Order from "../models/Order.js";


const ALLOWED_ORDER_STATUSES = [
    "pending",
    "confirmed",
    "making",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
];


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


            if (
                !ALLOWED_ORDER_STATUSES
                    .includes(
                        orderStatus
                    )
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Invalid order status.",
                    });

            }


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


            order.orderStatus =
                orderStatus;


            await order.save();


            return res.json({

                message:
                    "Order status updated.",

                order,

            });

        } catch (error) {

            console.error(
                "Update admin order status error:",
                error
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to update order status.",
                });

        }

    };