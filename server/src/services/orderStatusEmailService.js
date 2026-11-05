import { Resend } from "resend";

import Order from "../models/Order.js";


let resendClient = null;


/* =====================================================
   GET RESEND CLIENT
===================================================== */

function getResendClient() {

    const apiKey =
        process.env.RESEND_API_KEY;


    if (!apiKey) {

        throw new Error(
            "RESEND_API_KEY is not configured."
        );

    }


    if (!resendClient) {

        resendClient =
            new Resend(
                apiKey
            );

    }


    return resendClient;

}


/* =====================================================
   STATUS EMAIL CONTENT
===================================================== */

const STATUS_EMAIL_CONTENT = {

    making: {
        subject:
            "Your order is being made",

        heading:
            "Your order is now being made ♡",

        message:
            "Amma has started working on your handmade pieces. Each item is being prepared carefully, one detail at a time.",
    },


    ready: {
        subject:
            "Your order is ready",

        heading:
            "Your order is ready ♡",

        message:
            "Your handmade pieces are ready and are being prepared for the next step of their journey to you.",
    },


    shipped: {
        subject:
            "Your order is on the way",

        heading:
            "Your order is on the way ♡",

        message:
            "Your Amma's Handmade order has been shipped and is now making its way to you.",
    },


    delivered: {
        subject:
            "Your order has been delivered",

        heading:
            "Your order has arrived ♡",

        message:
            "Your order has been marked as delivered. We hope your handmade pieces bring a little warmth and joy to your day.",
    },


    cancelled: {
        subject:
            "An update about your order",

        heading:
            "Your order has been cancelled",

        message:
            "Your order has been marked as cancelled. If you have any questions about your order, payment or refund status, please contact Amma's Handmade.",
    },

};


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHtml(
    value
) {

    return String(
        value ?? ""
    )
        .replace(
            /&/g,
            "&amp;"
        )
        .replace(
            /</g,
            "&lt;"
        )
        .replace(
            />/g,
            "&gt;"
        )
        .replace(
            /"/g,
            "&quot;"
        )
        .replace(
            /'/g,
            "&#039;"
        );

}


/* =====================================================
   FORMAT MONEY
===================================================== */

function formatMoney(
    minorUnits,
    currency = "INR"
) {

    const value =
        Number(
            minorUnits
        );


    if (
        !Number.isFinite(
            value
        )
    ) {

        return "";

    }


    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency,

            maximumFractionDigits:
                2,
        }
    ).format(
        value / 100
    );

}


/* =====================================================
   BUILD STATUS UPDATE EMAIL
===================================================== */

function buildStatusUpdateEmail(
    order,
    status
) {

    const content =
        STATUS_EMAIL_CONTENT[
        status
        ];


    if (!content) {

        throw new Error(
            `No status email template exists for: ${status}`
        );

    }


    const items =
        order.items
            .map(
                (
                    item
                ) => `
                    <tr>
                        <td
                            style="
                                padding:12px 0;
                                border-bottom:1px solid #eeeeee;
                            "
                        >
                            <strong>
                                ${escapeHtml(
                    item.name
                )}
                            </strong>

                            <br />

                            <span
                                style="
                                    color:#777777;
                                    font-size:13px;
                                "
                            >
                                Qty: ${item.quantity}
                            </span>
                        </td>

                        <td
                            align="right"
                            style="
                                padding:12px 0;
                                border-bottom:1px solid #eeeeee;
                            "
                        >
                            ${formatMoney(
                    item.lineTotalMinor,
                    order.currency
                )}
                        </td>
                    </tr>
                `
            )
            .join("");


    const html = `
        <!DOCTYPE html>

        <html>

            <body
                style="
                    margin:0;
                    padding:0;
                    background:#f7f4ef;
                    font-family:Arial, Helvetica, sans-serif;
                    color:#332f2b;
                "
            >

                <div
                    style="
                        max-width:620px;
                        margin:0 auto;
                        padding:40px 20px;
                    "
                >

                    <div
                        style="
                            background:#ffffff;
                            border-radius:16px;
                            padding:36px;
                        "
                    >

                        <p
                            style="
                                margin:0 0 10px;
                                color:#8a765f;
                                font-size:13px;
                                letter-spacing:2px;
                                text-transform:uppercase;
                            "
                        >
                            Amma's Handmade
                        </p>


                        <h1
                            style="
                                margin:0 0 14px;
                                font-size:28px;
                                line-height:1.3;
                            "
                        >
                            ${content.heading}
                        </h1>


                        <p
                            style="
                                margin:0 0 24px;
                                line-height:1.7;
                                color:#5f5953;
                            "
                        >
                            Hi
                            ${escapeHtml(
        order.customer
            .firstName
    )},
                        </p>


                        <p
                            style="
                                line-height:1.7;
                                color:#5f5953;
                            "
                        >
                            ${content.message}
                        </p>


                        <div
                            style="
                                margin:28px 0;
                                padding:18px;
                                background:#f7f4ef;
                                border-radius:12px;
                            "
                        >

                            <span
                                style="
                                    display:block;
                                    margin-bottom:6px;
                                    color:#8a8178;
                                    font-size:12px;
                                    text-transform:uppercase;
                                    letter-spacing:1px;
                                "
                            >
                                Order number
                            </span>


                            <strong>
                                ${escapeHtml(
        order.orderNumber
    )}
                            </strong>

                        </div>


                        <h2
                            style="
                                margin-top:30px;
                                font-size:18px;
                            "
                        >
                            Your order
                        </h2>


                        <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                                border-collapse:collapse;
                            "
                        >

                            ${items}

                        </table>


                        <table
                            width="100%"
                            cellspacing="0"
                            cellpadding="0"
                            style="
                                margin-top:24px;
                            "
                        >

                            <tr>

                                <td
                                    style="
                                        font-weight:bold;
                                    "
                                >
                                    Total
                                </td>


                                <td
                                    align="right"
                                    style="
                                        font-weight:bold;
                                    "
                                >

                                    ${formatMoney(
        order.totalMinor,
        order.currency
    )}

                                </td>

                            </tr>

                        </table>


                        <hr
                            style="
                                border:none;
                                border-top:1px solid #eeeeee;
                                margin:32px 0;
                            "
                        />


                        <p
                            style="
                                margin:0;
                                color:#777777;
                                font-size:14px;
                                line-height:1.7;
                            "
                        >
                            Thank you for supporting
                            handmade creations made
                            slowly and with care.
                        </p>


                        <p
                            style="
                                margin:18px 0 0;
                                color:#8a765f;
                                font-size:14px;
                            "
                        >
                            Amma's Handmade
                            <br />
                            A touch of love in every knot.
                        </p>

                    </div>

                </div>

            </body>

        </html>
    `;


    return {
        subject:
            `${content.subject} — ${order.orderNumber}`,

        html,
    };

}


/* =====================================================
   SEND STATUS UPDATE EMAIL
===================================================== */

async function sendStatusUpdateEmail(
    order,
    status
) {

    const resend =
        getResendClient();


    const from =
        process.env
            .ORDER_EMAIL_FROM ||
        "Amma's Handmade <onboarding@resend.dev>";


    const {
        subject,
        html
    } =
        buildStatusUpdateEmail(
            order,
            status
        );


    const {
        data,
        error
    } =
        await resend
            .emails
            .send({

                from,

                to: [
                    order.customer
                        .email
                ],

                subject,

                html,

            });


    if (error) {

        throw new Error(
            error.message ||
            "Unable to send order status email."
        );

    }


    return data;

}


/* =====================================================
   SEND STATUS UPDATE ONLY ONCE

   changedAt identifies the exact status-history entry.

   Flow:

   pending / failed
       ↓
   sending
       ↓
   sent

   If Resend fails:
       ↓
   failed

   The order status itself is NEVER rolled back.
===================================================== */

export async function sendOrderStatusUpdateOnce(
    {
        orderId,
        status,
        changedAt
    }
) {

    const historyChangedAt =
        new Date(
            changedAt
        );


    if (
        Number.isNaN(
            historyChangedAt
                .getTime()
        )
    ) {

        return {
            sent:
                false,

            skipped:
                true,

            reason:
                "invalid_history_timestamp",
        };

    }


    if (
        !STATUS_EMAIL_CONTENT[
        status
        ]
    ) {

        return {
            sent:
                false,

            skipped:
                true,

            reason:
                "email_not_required",
        };

    }


    /* =================================================
       CLAIM THIS HISTORY ENTRY

       Only pending/failed emails can be claimed.

       This prevents duplicate sending.
    ================================================= */

    const order =
        await Order.findOneAndUpdate(
            {
                _id:
                    orderId,

                statusHistory: {
                    $elemMatch: {
                        status,

                        changedAt:
                            historyChangedAt,

                        emailStatus: {
                            $in: [
                                "pending",
                                "failed"
                            ],
                        },
                    },
                },
            },

            {
                $set: {
                    "statusHistory.$.emailStatus":
                        "sending",

                    "statusHistory.$.emailLastError":
                        null,
                },
            },

            {
                returnDocument:
                    "after",
            }
        );


    /* =================================================
       NOTHING TO SEND

       Usually means it was already sent,
       is currently sending, or isn't required.
    ================================================= */

    if (!order) {

        return {
            sent:
                false,

            skipped:
                true,

            reason:
                "already_processed_or_not_pending",
        };

    }


    try {

        /* =================================================
           SEND EMAIL
        ================================================= */

        const data =
            await sendStatusUpdateEmail(
                order,
                status
            );


        /* =================================================
           MARK EMAIL AS SENT
        ================================================= */

        await Order.updateOne(
            {
                _id:
                    orderId,
            },

            {
                $set: {
                    "statusHistory.$[entry].emailStatus":
                        "sent",

                    "statusHistory.$[entry].emailSentAt":
                        new Date(),

                    "statusHistory.$[entry].emailMessageId":
                        data?.id ||
                        null,

                    "statusHistory.$[entry].emailLastError":
                        null,
                },
            },

            {
                arrayFilters: [
                    {
                        "entry.status":
                            status,

                        "entry.changedAt":
                            historyChangedAt,
                    },
                ],
            }
        );


        console.log(
            "Order status email sent:",
            {
                orderNumber:
                    order.orderNumber,

                status,

                emailId:
                    data?.id,
            }
        );


        return {
            sent:
                true,

            emailId:
                data?.id ||
                null,
        };

    } catch (error) {

        const errorMessage =
            error?.message ||
            "Unable to send order status email.";


        /* =================================================
           MARK EMAIL AS FAILED

           Important:
           We do NOT change order.orderStatus.
        ================================================= */

        try {

            await Order.updateOne(
                {
                    _id:
                        orderId,
                },

                {
                    $set: {
                        "statusHistory.$[entry].emailStatus":
                            "failed",

                        "statusHistory.$[entry].emailSentAt":
                            null,

                        "statusHistory.$[entry].emailMessageId":
                            null,

                        "statusHistory.$[entry].emailLastError":
                            errorMessage,
                    },
                },

                {
                    arrayFilters: [
                        {
                            "entry.status":
                                status,

                            "entry.changedAt":
                                historyChangedAt,
                        },
                    ],
                }
            );

        } catch (
        databaseError
        ) {

            console.error(
                "Unable to record status email failure:",
                databaseError
            );

        }


        console.error(
            "Order status email failed:",
            {
                orderId,
                status,
                error:
                    errorMessage,
            }
        );


        return {
            sent:
                false,

            failed:
                true,

            error:
                errorMessage,
        };

    }

}