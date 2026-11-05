import mongoose from "mongoose";


/* =====================================================
   ORDER ITEM
===================================================== */

const orderItemSchema =
    new mongoose.Schema(
        {
            productId: {
                type: Number,
                required: true,
            },


            productMongoId: {
                type:
                    mongoose.Schema.Types.ObjectId,

                ref:
                    "Product",

                required: true,
            },


            slug: {
                type: String,
                required: true,
            },


            name: {
                type: String,
                required: true,
            },


            image: {
                type: String,
                default: "",
            },


            quantity: {
                type: Number,
                required: true,
                min: 1,
            },


            /*
               Stored in the smallest
               currency unit.

               INR example:

               ₹2,000
               =
               200000 paise
            */

            unitPriceMinor: {
                type: Number,
                required: true,
                min: 0,
            },


            lineTotalMinor: {
                type: Number,
                required: true,
                min: 0,
            },
        },
        {
            _id: false,
        }
    );


/* =====================================================
   CUSTOMER
===================================================== */

const customerSchema =
    new mongoose.Schema(
        {
            firstName: {
                type: String,
                required: true,
                trim: true,
            },


            lastName: {
                type: String,
                required: true,
                trim: true,
            },


            email: {
                type: String,
                required: true,
                trim: true,
                lowercase: true,
            },


            phone: {
                type: String,
                required: true,
                trim: true,
            },
        },
        {
            _id: false,
        }
    );


/* =====================================================
   SHIPPING ADDRESS
===================================================== */

const shippingAddressSchema =
    new mongoose.Schema(
        {
            addressLine1: {
                type: String,
                required: true,
                trim: true,
            },


            addressLine2: {
                type: String,
                default: "",
                trim: true,
            },


            city: {
                type: String,
                required: true,
                trim: true,
            },


            state: {
                type: String,
                required: true,
                trim: true,
            },


            postalCode: {
                type: String,
                required: true,
                trim: true,
            },


            country: {
                type: String,
                required: true,
                trim: true,
            },
        },
        {
            _id: false,
        }
    );


/* =====================================================
   ORDER STATUS HISTORY
===================================================== */

const orderStatusHistorySchema =
    new mongoose.Schema(
        {
            status: {
                type: String,

                required: true,

                enum: [
                    "pending",
                    "confirmed",
                    "making",
                    "ready",
                    "shipped",
                    "delivered",
                    "cancelled"
                ],
            },


            changedAt: {
                type: Date,

                required: true,

                default: Date.now,
            },


            changedBy: {
                type: String,

                required: true,

                default: "system",

                trim: true,
            },


            source: {
                type: String,

                required: true,

                enum: [
                    "order_created",
                    "payment_verified",
                    "razorpay_webhook",
                    "admin"
                ],
            },


            /* =================================================
               STATUS UPDATE EMAIL

               Each status change can track the result
               of its own customer update email.

               "not_required"
               means that particular status does not
               require a status-update email.

               For example:
               - pending
               - confirmed

               Confirmed already uses our separate
               order-confirmation email flow.
            ================================================= */

            emailStatus: {
                type: String,

                enum: [
                    "not_required",
                    "pending",
                    "sending",
                    "sent",
                    "failed"
                ],

                default:
                    "not_required",
            },


            emailSentAt: {
                type: Date,

                default:
                    null,
            },


            emailMessageId: {
                type: String,

                default:
                    null,
            },


            emailLastError: {
                type: String,

                default:
                    null,
            },
        },
        {
            _id: false,
        }
    );


/* =====================================================
   ORDER
===================================================== */

const orderSchema =
    new mongoose.Schema(
        {
            /* =================================================
               ORDER NUMBER
            ================================================= */

            orderNumber: {
                type: String,
                required: true,
                unique: true,
                index: true,
            },


            /* =================================================
               CUSTOMER
            ================================================= */

            customer: {
                type: customerSchema,
                required: true,
            },


            /* =================================================
               SHIPPING
            ================================================= */

            shippingAddress: {
                type: shippingAddressSchema,
                required: true,
            },


            /* =================================================
               ITEMS
            ================================================= */

            items: {
                type: [orderItemSchema],

                validate: {
                    validator:
                        (items) =>
                            Array.isArray(
                                items
                            ) &&
                            items.length > 0,

                    message:
                        "An order must contain at least one item.",
                },
            },


            /* =================================================
               CURRENCY

               INR is our current base currency.

               We are not restricting this to INR
               because later we can support USD,
               GBP, AED, EUR, etc.
            ================================================= */

            currency: {
                type: String,
                required: true,
                default: "INR",
                uppercase: true,
                trim: true,
            },


            /* =================================================
               TOTALS

               All values stored in minor units.

               Example:

               subtotalMinor: 400000
               currency: INR

               = ₹4,000
            ================================================= */

            subtotalMinor: {
                type: Number,
                required: true,
                min: 0,
            },


            shippingMinor: {
                type: Number,
                default: 0,
                min: 0,
            },


            taxMinor: {
                type: Number,
                default: 0,
                min: 0,
            },


            totalMinor: {
                type: Number,
                required: true,
                min: 0,
            },


            /* =================================================
               PAYMENT STATUS
            ================================================= */

            paymentStatus: {
                type: String,

                enum: [
                    "pending",
                    "paid",
                    "failed",
                    "refunded"
                ],

                default:
                    "pending",

                index: true,
            },


            /* =================================================
               ORDER STATUS
            ================================================= */

            orderStatus: {
                type: String,

                enum: [
                    "pending",
                    "confirmed",
                    "making",
                    "ready",
                    "shipped",
                    "delivered",
                    "cancelled"
                ],

                default:
                    "pending",

                index: true,
            },


            /* =================================================
               ORDER STATUS HISTORY
            ================================================= */

            statusHistory: {
                type: [
                    orderStatusHistorySchema
                ],

                default: [],
            },


            /* =================================================
               RAZORPAY
            ================================================= */

            razorpayOrderId: {
                type: String,
                default: null,
                index: true,
            },


            razorpayPaymentId: {
                type: String,
                default: null,
                index: true,
            },


            razorpaySignature: {
                type: String,
                default: null,
            },


            /* =================================================
               INVENTORY

               Prevents stock from being reduced
               more than once if payment verification
               is repeated.
            ================================================= */

            inventoryAdjusted: {
                type: Boolean,
                default: false,
            },


            /* =================================================
               ORDER CONFIRMATION EMAIL

               This is separate from status-update emails.

               It is used specifically for the initial
               successful-payment confirmation email.
            ================================================= */

            confirmationEmailStatus: {
                type: String,

                enum: [
                    "pending",
                    "sending",
                    "sent",
                    "failed"
                ],

                default: "pending",

                index: true,
            },


            confirmationEmailSentAt: {
                type: Date,
                default: null,
            },


            confirmationEmailLastError: {
                type: String,
                default: null,
            },
        },
        {
            timestamps: true,
        }
    );


/* =====================================================
   MODEL
===================================================== */

const Order =
    mongoose.model(
        "Order",
        orderSchema
    );


export default Order;