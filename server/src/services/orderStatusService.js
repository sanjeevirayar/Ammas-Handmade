/* =====================================================
   VALID ORDER STATUSES
===================================================== */

export const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "making",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
];


/* =====================================================
   VALID STATUS CHANGE SOURCES
===================================================== */

export const ORDER_STATUS_SOURCES = [
    "order_created",
    "payment_verified",
    "razorpay_webhook",
    "admin",
];


/* =====================================================
   STATUSES THAT REQUIRE CUSTOMER UPDATE EMAIL
===================================================== */

export const ORDER_STATUS_EMAIL_STATUSES = [
    "making",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
];


/* =====================================================
   CHECK WHETHER STATUS NEEDS EMAIL
===================================================== */

export function requiresStatusUpdateEmail(
    status
) {

    return ORDER_STATUS_EMAIL_STATUSES
        .includes(
            status
        );

}


/* =====================================================
   SET ORDER STATUS
===================================================== */

export function setOrderStatus(
    order,
    newStatus,
    {
        changedBy = "system",
        source = "admin",
    } = {}
) {

    /* =================================================
       VALIDATE ORDER
    ================================================= */

    if (!order) {

        throw new Error(
            "Order document is required."
        );

    }


    /* =================================================
       VALIDATE STATUS
    ================================================= */

    if (
        !ORDER_STATUSES.includes(
            newStatus
        )
    ) {

        throw new Error(
            `Invalid order status: ${newStatus}`
        );

    }


    /* =================================================
       VALIDATE SOURCE
    ================================================= */

    if (
        !ORDER_STATUS_SOURCES.includes(
            source
        )
    ) {

        throw new Error(
            `Invalid order status source: ${source}`
        );

    }


    /* =================================================
       PREVENT DUPLICATE STATUS EVENT

       Example:

       making -> making

       is not a real transition.
    ================================================= */

    if (
        order.orderStatus ===
        newStatus
    ) {

        return {
            changed: false,

            status:
                order.orderStatus,

            historyEntry:
                null,
        };

    }


    /* =================================================
       UPDATE CURRENT STATUS
    ================================================= */

    order.orderStatus =
        newStatus;


    /* =================================================
       ENSURE HISTORY ARRAY EXISTS
    ================================================= */

    if (
        !Array.isArray(
            order.statusHistory
        )
    ) {

        order.statusHistory = [];

    }


    /* =================================================
       DETERMINE EMAIL REQUIREMENT
    ================================================= */

    const emailStatus =
        requiresStatusUpdateEmail(
            newStatus
        )
            ? "pending"
            : "not_required";


    /* =================================================
       CREATE HISTORY ENTRY
    ================================================= */

    const historyEntry = {

        status:
            newStatus,

        changedAt:
            new Date(),

        changedBy:
            changedBy ||
            "system",

        source,

        emailStatus,

        emailSentAt:
            null,

        emailMessageId:
            null,

        emailLastError:
            null,

    };


    /* =================================================
       ADD HISTORY ENTRY
    ================================================= */

    order.statusHistory.push(
        historyEntry
    );


    /* =================================================
       RETURN RESULT
    ================================================= */

    return {

        changed:
            true,

        status:
            newStatus,

        historyEntry,

    };

}