import {
    useCallback,
    useEffect,
    useMemo,
    useState
} from "react";

import {
    Navigate
} from "react-router-dom";

import {
    useAdminAuth
} from "../context/AdminAuthContext";

import "../styles/Admin.css";


const ORDER_STATUSES = [
    "pending",
    "confirmed",
    "making",
    "ready",
    "shipped",
    "delivered",
    "cancelled",
];


const ORDER_PROGRESS_STATUSES = [
    "pending",
    "confirmed",
    "making",
    "ready",
    "shipped",
    "delivered",
];


/* =====================================================
   FORMAT MONEY
===================================================== */

function formatMoney(
    minorUnits,
    currency = "INR"
) {

    const amount =
        Number(
            minorUnits || 0
        ) / 100;


    return new Intl.NumberFormat(
        "en-IN",
        {
            style:
                "currency",

            currency:
                currency || "INR",
        }
    ).format(
        amount
    );

}


/* =====================================================
   FORMAT DATE
===================================================== */

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    return new Intl.DateTimeFormat(
        "en-IN",
        {
            dateStyle:
                "medium",

            timeStyle:
                "short",
        }
    ).format(
        new Date(
            value
        )
    );

}


/* =====================================================
   STATUS LABEL
===================================================== */

function statusLabel(
    value
) {

    if (!value) {

        return "";

    }


    return value
        .charAt(0)
        .toUpperCase() +
        value.slice(1);

}


/* =====================================================
   EMAIL STATUS LABEL
===================================================== */

function emailStatusLabel(
    value
) {

    switch (
        value
    ) {

        case "sent":
            return "Email sent";

        case "failed":
            return "Email failed";

        case "sending":
            return "Sending email...";

        case "pending":
            return "Email pending";

        default:
            return "";

    }

}


/* =====================================================
   GET LATEST HISTORY ENTRY FOR STATUS
===================================================== */

function getLatestHistoryEntry(
    order,
    status
) {

    const history =
        Array.isArray(
            order?.statusHistory
        )
            ? order.statusHistory
            : [];


    for (
        let index =
            history.length - 1;
        index >= 0;
        index -= 1
    ) {

        if (
            history[index]
                ?.status ===
            status
        ) {

            return history[index];

        }

    }


    return null;

}


/* =====================================================
   BUILD ORDER TIMELINE
===================================================== */

function buildOrderTimeline(
    order
) {

    if (!order) {

        return [];

    }


    const currentStatus =
        order.orderStatus ||
        "pending";


    const currentIndex =
        ORDER_PROGRESS_STATUSES
            .indexOf(
                currentStatus
            );


    const isCancelled =
        currentStatus ===
        "cancelled";


    const timeline =
        ORDER_PROGRESS_STATUSES
            .map(
                (
                    status,
                    index
                ) => {

                    const historyEntry =
                        getLatestHistoryEntry(
                            order,
                            status
                        );


                    const changedAt =
                        historyEntry
                            ?.changedAt ||
                        (
                            status ===
                            "pending"
                                ? order.createdAt
                                : null
                        );


                    const reached =
                        Boolean(
                            historyEntry
                        ) ||
                        (
                            !isCancelled &&
                            currentIndex >=
                            index
                        ) ||
                        status ===
                        "pending";


                    return {
                        status,

                        reached,

                        isCurrent:
                            currentStatus ===
                            status,

                        changedAt,

                        changedBy:
                            historyEntry
                                ?.changedBy ||
                            null,

                        source:
                            historyEntry
                                ?.source ||
                            null,

                        emailStatus:
                            historyEntry
                                ?.emailStatus ||
                            "not_required",

                        emailSentAt:
                            historyEntry
                                ?.emailSentAt ||
                            null,

                        emailMessageId:
                            historyEntry
                                ?.emailMessageId ||
                            null,

                        emailLastError:
                            historyEntry
                                ?.emailLastError ||
                            null,
                    };

                }
            );


    if (isCancelled) {

        const cancelledEntry =
            getLatestHistoryEntry(
                order,
                "cancelled"
            );


        timeline.push({
            status:
                "cancelled",

            reached:
                true,

            isCurrent:
                true,

            changedAt:
                cancelledEntry
                    ?.changedAt ||
                null,

            changedBy:
                cancelledEntry
                    ?.changedBy ||
                null,

            source:
                cancelledEntry
                    ?.source ||
                null,

            emailStatus:
                cancelledEntry
                    ?.emailStatus ||
                "not_required",

            emailSentAt:
                cancelledEntry
                    ?.emailSentAt ||
                null,

            emailMessageId:
                cancelledEntry
                    ?.emailMessageId ||
                null,

            emailLastError:
                cancelledEntry
                    ?.emailLastError ||
                null,
        });

    }


    return timeline;

}


/* =====================================================
   ADMIN DASHBOARD
===================================================== */

export default function AdminDashboard() {

    const {
        token,
        admin,
        logout,
        loading:
            authLoading,
        isAuthenticated
    } =
        useAdminAuth();


    const [
        orders,
        setOrders
    ] =
        useState([]);


    const [
        loading,
        setLoading
    ] =
        useState(true);


    const [
        error,
        setError
    ] =
        useState("");


    const [
        search,
        setSearch
    ] =
        useState("");


    const [
        appliedSearch,
        setAppliedSearch
    ] =
        useState("");


    const [
        orderStatus,
        setOrderStatus
    ] =
        useState("all");


    const [
        paymentStatus,
        setPaymentStatus
    ] =
        useState("all");


    const [
        selectedOrder,
        setSelectedOrder
    ] =
        useState(null);


    const [
        updatingOrderId,
        setUpdatingOrderId
    ] =
        useState(null);


    const [
        pagination,
        setPagination
    ] =
        useState({
            page: 1,
            limit: 20,
            total: 0,
            totalPages: 1,
        });


    /* =================================================
       LOAD ORDERS
    ================================================= */

    const loadOrders =
        useCallback(
            async (
                page = 1
            ) => {

                if (!token) {

                    return;

                }


                try {

                    setLoading(true);

                    setError("");


                    const params =
                        new URLSearchParams();


                    params.set(
                        "page",
                        String(page)
                    );


                    params.set(
                        "limit",
                        "20"
                    );


                    if (
                        appliedSearch
                    ) {

                        params.set(
                            "search",
                            appliedSearch
                        );

                    }


                    if (
                        orderStatus !==
                        "all"
                    ) {

                        params.set(
                            "orderStatus",
                            orderStatus
                        );

                    }


                    if (
                        paymentStatus !==
                        "all"
                    ) {

                        params.set(
                            "paymentStatus",
                            paymentStatus
                        );

                    }


                    const response =
                        await fetch(
                            `/api/admin/orders?${params.toString()}`,
                            {
                                headers: {
                                    Authorization:
                                        `Bearer ${token}`,
                                },
                            }
                        );


                    const data =
                        await response.json();


                    if (
                        response.status ===
                        401
                    ) {

                        logout();

                        return;

                    }


                    if (!response.ok) {

                        throw new Error(
                            data.message ||
                            "Unable to load orders."
                        );

                    }


                    setOrders(
                        data.orders || []
                    );


                    setPagination(
                        data.pagination || {
                            page: 1,
                            limit: 20,
                            total: 0,
                            totalPages: 1,
                        }
                    );

                } catch (err) {

                    setError(
                        err.message
                    );

                } finally {

                    setLoading(false);

                }

            },
            [
                token,
                appliedSearch,
                orderStatus,
                paymentStatus,
                logout
            ]
        );


    /* =================================================
       LOAD WHEN FILTERS CHANGE
    ================================================= */

    useEffect(
        () => {

            if (
                isAuthenticated
            ) {

                loadOrders(
                    1
                );

            }

        },
        [
            isAuthenticated,
            loadOrders
        ]
    );


    /* =================================================
       DASHBOARD STATS
    ================================================= */

    const dashboardStats =
        useMemo(
            () => {

                const paid =
                    orders.filter(
                        (order) =>
                            order
                                .paymentStatus ===
                            "paid"
                    ).length;


                const active =
                    orders.filter(
                        (order) =>
                            ![
                                "delivered",
                                "cancelled"
                            ].includes(
                                order
                                    .orderStatus
                            )
                    ).length;


                const delivered =
                    orders.filter(
                        (order) =>
                            order
                                .orderStatus ===
                            "delivered"
                    ).length;


                return {
                    paid,
                    active,
                    delivered,
                };

            },
            [orders]
        );


    /* =================================================
       SELECTED ORDER TIMELINE
    ================================================= */

    const selectedOrderTimeline =
        useMemo(
            () =>
                buildOrderTimeline(
                    selectedOrder
                ),
            [selectedOrder]
        );


    /* =================================================
       SEARCH
    ================================================= */

    const handleSearchSubmit =
        (
            event
        ) => {

            event.preventDefault();


            setAppliedSearch(
                search.trim()
            );

        };


    /* =================================================
       OPEN ORDER
    ================================================= */

    const openOrder =
        async (
            orderId
        ) => {

            try {

                setError("");


                const response =
                    await fetch(
                        `/api/admin/orders/${orderId}`,
                        {
                            headers: {
                                Authorization:
                                    `Bearer ${token}`,
                            },
                        }
                    );


                const data =
                    await response.json();


                if (
                    response.status ===
                    401
                ) {

                    logout();

                    return;

                }


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to load order."
                    );

                }


                setSelectedOrder(
                    data.order
                );

            } catch (err) {

                setError(
                    err.message
                );

            }

        };


    /* =================================================
       UPDATE ORDER STATUS
    ================================================= */

    const updateOrderStatus =
        async (
            orderId,
            nextStatus
        ) => {

            try {

                setUpdatingOrderId(
                    orderId
                );

                setError("");


                const response =
                    await fetch(
                        `/api/admin/orders/${orderId}/status`,
                        {
                            method:
                                "PATCH",

                            headers: {
                                "Content-Type":
                                    "application/json",

                                Authorization:
                                    `Bearer ${token}`,
                            },

                            body:
                                JSON.stringify({
                                    orderStatus:
                                        nextStatus,
                                }),
                        }
                    );


                const data =
                    await response.json();


                if (
                    response.status ===
                    401
                ) {

                    logout();

                    return;

                }


                if (!response.ok) {

                    throw new Error(
                        data.message ||
                        "Unable to update order status."
                    );

                }


                /*
                   Backend returns the full updated
                   order including statusHistory and
                   status-email information.
                */

                const updatedOrder =
                    data.order;


                setOrders(
                    (currentOrders) =>
                        currentOrders.map(
                            (order) => {

                                if (
                                    order._id !==
                                    orderId
                                ) {

                                    return order;

                                }


                                return updatedOrder ||
                                    {
                                        ...order,

                                        orderStatus:
                                            nextStatus,
                                    };

                            }
                        )
                );


                setSelectedOrder(
                    (currentOrder) => {

                        if (
                            !currentOrder ||
                            currentOrder._id !==
                            orderId
                        ) {

                            return currentOrder;

                        }


                        return updatedOrder ||
                            {
                                ...currentOrder,

                                orderStatus:
                                    nextStatus,
                            };

                    }
                );

            } catch (err) {

                setError(
                    err.message
                );

            } finally {

                setUpdatingOrderId(
                    null
                );

            }

        };


    /* =================================================
       AUTH LOADING
    ================================================= */

    if (authLoading) {

        return (

            <div className="admin-loading">

                Loading...

            </div>

        );

    }


    /* =================================================
       NOT AUTHENTICATED
    ================================================= */

    if (!isAuthenticated) {

        return (

            <Navigate
                to="/admin/login"
                replace
            />

        );

    }


    /* =================================================
       RENDER
    ================================================= */

    return (

        <main className="admin-dashboard">

            {/* =========================================
                HEADER
            ========================================== */}

            <header className="admin-header">

                <div>

                    <p className="admin-eyebrow">
                        Amma&apos;s Handmade
                    </p>

                    <h1>
                        Orders
                    </h1>

                    <p className="admin-welcome">
                        Welcome, {admin?.email}
                    </p>

                </div>


                <button
                    type="button"
                    className="admin-logout-button"
                    onClick={
                        logout
                    }
                >
                    Log out
                </button>

            </header>


            {/* =========================================
                STATS
            ========================================== */}

            <section className="admin-stat-grid">

                <article className="admin-stat-card">

                    <span>
                        Total orders
                    </span>

                    <strong>
                        {pagination.total}
                    </strong>

                </article>


                <article className="admin-stat-card">

                    <span>
                        Paid on page
                    </span>

                    <strong>
                        {dashboardStats.paid}
                    </strong>

                </article>


                <article className="admin-stat-card">

                    <span>
                        Active on page
                    </span>

                    <strong>
                        {dashboardStats.active}
                    </strong>

                </article>


                <article className="admin-stat-card">

                    <span>
                        Delivered on page
                    </span>

                    <strong>
                        {dashboardStats.delivered}
                    </strong>

                </article>

            </section>


            {/* =========================================
                ORDERS
            ========================================== */}

            <section className="admin-orders-section">

                <div className="admin-toolbar">

                    <form
                        className="admin-search"
                        onSubmit={
                            handleSearchSubmit
                        }
                    >

                        <input
                            type="search"
                            placeholder="Search order, customer, email or phone"
                            value={
                                search
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setSearch(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        />


                        <button
                            type="submit"
                        >
                            Search
                        </button>

                    </form>


                    <div className="admin-filters">

                        <select
                            value={
                                orderStatus
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setOrderStatus(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        >

                            <option value="all">
                                All order statuses
                            </option>

                            {
                                ORDER_STATUSES
                                    .map(
                                        (
                                            status
                                        ) => (

                                            <option
                                                key={
                                                    status
                                                }
                                                value={
                                                    status
                                                }
                                            >
                                                {
                                                    statusLabel(
                                                        status
                                                    )
                                                }
                                            </option>

                                        )
                                    )
                            }

                        </select>


                        <select
                            value={
                                paymentStatus
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setPaymentStatus(
                                        event
                                            .target
                                            .value
                                    )
                            }
                        >

                            <option value="all">
                                All payment statuses
                            </option>

                            <option value="pending">
                                Pending
                            </option>

                            <option value="paid">
                                Paid
                            </option>

                            <option value="failed">
                                Failed
                            </option>

                            <option value="refunded">
                                Refunded
                            </option>

                        </select>

                    </div>

                </div>


                {
                    error &&
                    (
                        <div className="admin-error-banner">
                            {error}
                        </div>
                    )
                }


                {
                    loading
                        ? (

                            <div className="admin-table-message">
                                Loading orders...
                            </div>

                        )
                        : orders.length ===
                            0
                            ? (

                                <div className="admin-table-message">
                                    No orders found.
                                </div>

                            )
                            : (

                                <div className="admin-table-wrap">

                                    <table className="admin-orders-table">

                                        <thead>

                                            <tr>

                                                <th>
                                                    Order
                                                </th>

                                                <th>
                                                    Customer
                                                </th>

                                                <th>
                                                    Total
                                                </th>

                                                <th>
                                                    Payment
                                                </th>

                                                <th>
                                                    Status
                                                </th>

                                                <th>
                                                    Date
                                                </th>

                                                <th />

                                            </tr>

                                        </thead>


                                        <tbody>

                                            {
                                                orders.map(
                                                    (
                                                        order
                                                    ) => (

                                                        <tr
                                                            key={
                                                                order._id
                                                            }
                                                        >

                                                            <td>

                                                                <strong>
                                                                    {
                                                                        order.orderNumber
                                                                    }
                                                                </strong>

                                                                <span className="admin-muted">
                                                                    {
                                                                        order.items
                                                                            ?.length || 0
                                                                    }
                                                                    {" "}
                                                                    item(s)
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <strong>
                                                                    {
                                                                        order.customer
                                                                            ?.firstName
                                                                    }
                                                                    {" "}
                                                                    {
                                                                        order.customer
                                                                            ?.lastName
                                                                    }
                                                                </strong>

                                                                <span className="admin-muted">
                                                                    {
                                                                        order.customer
                                                                            ?.email
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>

                                                                {
                                                                    formatMoney(
                                                                        order.totalMinor,
                                                                        order.currency
                                                                    )
                                                                }

                                                            </td>


                                                            <td>

                                                                <span
                                                                    className={
                                                                        `admin-status admin-status-${order.paymentStatus}`
                                                                    }
                                                                >
                                                                    {
                                                                        statusLabel(
                                                                            order.paymentStatus
                                                                        )
                                                                    }
                                                                </span>

                                                            </td>


                                                            <td>

                                                                <select
                                                                    className="admin-status-select"
                                                                    value={
                                                                        order.orderStatus
                                                                    }
                                                                    disabled={
                                                                        updatingOrderId ===
                                                                        order._id
                                                                    }
                                                                    onChange={
                                                                        (
                                                                            event
                                                                        ) =>
                                                                            updateOrderStatus(
                                                                                order._id,
                                                                                event
                                                                                    .target
                                                                                    .value
                                                                            )
                                                                    }
                                                                >

                                                                    {
                                                                        ORDER_STATUSES
                                                                            .map(
                                                                                (
                                                                                    status
                                                                                ) => (

                                                                                    <option
                                                                                        key={
                                                                                            status
                                                                                        }
                                                                                        value={
                                                                                            status
                                                                                        }
                                                                                    >
                                                                                        {
                                                                                            statusLabel(
                                                                                                status
                                                                                            )
                                                                                        }
                                                                                    </option>

                                                                                )
                                                                            )
                                                                    }

                                                                </select>

                                                            </td>


                                                            <td>

                                                                {
                                                                    formatDate(
                                                                        order.createdAt
                                                                    )
                                                                }

                                                            </td>


                                                            <td>

                                                                <button
                                                                    type="button"
                                                                    className="admin-view-button"
                                                                    onClick={
                                                                        () =>
                                                                            openOrder(
                                                                                order._id
                                                                            )
                                                                    }
                                                                >
                                                                    View
                                                                </button>

                                                            </td>

                                                        </tr>

                                                    )
                                                )
                                            }

                                        </tbody>

                                    </table>

                                </div>

                            )
                }


                {/* =====================================
                    PAGINATION
                ====================================== */}

                <div className="admin-pagination">

                    <button
                        type="button"
                        disabled={
                            pagination.page <=
                            1 ||
                            loading
                        }
                        onClick={
                            () =>
                                loadOrders(
                                    pagination.page -
                                    1
                                )
                        }
                    >
                        Previous
                    </button>


                    <span>
                        Page {pagination.page}
                        {" "}
                        of
                        {" "}
                        {pagination.totalPages}
                    </span>


                    <button
                        type="button"
                        disabled={
                            pagination.page >=
                            pagination.totalPages ||
                            loading
                        }
                        onClick={
                            () =>
                                loadOrders(
                                    pagination.page +
                                    1
                                )
                        }
                    >
                        Next
                    </button>

                </div>

            </section>


            {/* =========================================
                ORDER DETAIL DRAWER
            ========================================== */}

            {
                selectedOrder &&
                (

                    <div
                        className="admin-order-overlay"
                        onClick={
                            () =>
                                setSelectedOrder(
                                    null
                                )
                        }
                    >

                        <aside
                            className="admin-order-panel"
                            onClick={
                                (
                                    event
                                ) =>
                                    event
                                        .stopPropagation()
                            }
                        >

                            {/* =================================
                                PANEL HEADER
                            ================================== */}

                            <div className="admin-order-panel-header">

                                <div>

                                    <p className="admin-eyebrow">
                                        Order
                                    </p>

                                    <h2>
                                        {
                                            selectedOrder
                                                .orderNumber
                                        }
                                    </h2>

                                </div>


                                <button
                                    type="button"
                                    className="admin-close-button"
                                    onClick={
                                        () =>
                                            setSelectedOrder(
                                                null
                                            )
                                    }
                                >
                                    ×
                                </button>

                            </div>


                            {/* =================================
                                CURRENT STATUS
                            ================================== */}

                            <div className="admin-detail-section">

                                <h3>
                                    Order status
                                </h3>

                                <select
                                    className="admin-status-select admin-detail-status"
                                    value={
                                        selectedOrder
                                            .orderStatus
                                    }
                                    disabled={
                                        updatingOrderId ===
                                        selectedOrder._id
                                    }
                                    onChange={
                                        (
                                            event
                                        ) =>
                                            updateOrderStatus(
                                                selectedOrder._id,
                                                event
                                                    .target
                                                    .value
                                            )
                                    }
                                >

                                    {
                                        ORDER_STATUSES
                                            .map(
                                                (
                                                    status
                                                ) => (

                                                    <option
                                                        key={
                                                            status
                                                        }
                                                        value={
                                                            status
                                                        }
                                                    >
                                                        {
                                                            statusLabel(
                                                                status
                                                            )
                                                        }
                                                    </option>

                                                )
                                            )
                                    }

                                </select>

                            </div>


                            {/* =================================
                                ORDER PROGRESS TIMELINE
                            ================================== */}

                            <div className="admin-detail-section">

                                <h3>
                                    Order progress
                                </h3>


                                <div className="admin-order-timeline">

                                    {
                                        selectedOrderTimeline
                                            .map(
                                                (
                                                    step,
                                                    index
                                                ) => (

                                                    <div
                                                        className={
                                                            `admin-timeline-step ${
                                                                step.reached
                                                                    ? "is-reached"
                                                                    : "is-pending"
                                                            } ${
                                                                step.isCurrent
                                                                    ? "is-current"
                                                                    : ""
                                                            } ${
                                                                step.status ===
                                                                "cancelled"
                                                                    ? "is-cancelled"
                                                                    : ""
                                                            }`
                                                        }
                                                        key={
                                                            step.status
                                                        }
                                                    >

                                                        <div className="admin-timeline-rail">

                                                            <span className="admin-timeline-dot">
                                                                {
                                                                    step.reached
                                                                        ? "✓"
                                                                        : ""
                                                                }
                                                            </span>


                                                            {
                                                                index <
                                                                selectedOrderTimeline.length -
                                                                1 &&
                                                                (
                                                                    <span className="admin-timeline-line" />
                                                                )
                                                            }

                                                        </div>


                                                        <div className="admin-timeline-content">

                                                            <div className="admin-timeline-title-row">

                                                                <strong>
                                                                    {
                                                                        statusLabel(
                                                                            step.status
                                                                        )
                                                                    }
                                                                </strong>


                                                                {
                                                                    step.isCurrent &&
                                                                    (

                                                                        <span className="admin-timeline-current">
                                                                            Current
                                                                        </span>

                                                                    )
                                                                }

                                                            </div>


                                                            <span className="admin-timeline-date">

                                                                {
                                                                    step.changedAt
                                                                        ? formatDate(
                                                                            step.changedAt
                                                                        )
                                                                        : step.reached
                                                                            ? "No timestamp recorded"
                                                                            : "Not reached yet"
                                                                }

                                                            </span>


                                                            {
                                                                step.changedBy &&
                                                                (

                                                                    <span className="admin-timeline-meta">
                                                                        Updated by{" "}
                                                                        {step.changedBy}
                                                                    </span>

                                                                )
                                                            }


                                                            {
                                                                step.emailStatus &&
                                                                step.emailStatus !==
                                                                "not_required" &&
                                                                (

                                                                    <div
                                                                        className={
                                                                            `admin-timeline-email admin-timeline-email-${step.emailStatus}`
                                                                        }
                                                                    >

                                                                        <span className="admin-timeline-email-badge">

                                                                            {
                                                                                emailStatusLabel(
                                                                                    step.emailStatus
                                                                                )
                                                                            }

                                                                        </span>


                                                                        {
                                                                            step.emailStatus ===
                                                                            "sent" &&
                                                                            step.emailSentAt &&
                                                                            (

                                                                                <span className="admin-timeline-email-detail">

                                                                                    {
                                                                                        formatDate(
                                                                                            step.emailSentAt
                                                                                        )
                                                                                    }

                                                                                </span>

                                                                            )
                                                                        }


                                                                        {
                                                                            step.emailStatus ===
                                                                            "failed" &&
                                                                            step.emailLastError &&
                                                                            (

                                                                                <span className="admin-timeline-email-error">

                                                                                    {
                                                                                        step.emailLastError
                                                                                    }

                                                                                </span>

                                                                            )
                                                                        }

                                                                    </div>

                                                                )
                                                            }

                                                        </div>

                                                    </div>

                                                )
                                            )
                                    }

                                </div>

                            </div>


                            {/* =================================
                                CUSTOMER
                            ================================== */}

                            <div className="admin-detail-section">

                                <h3>
                                    Customer
                                </h3>

                                <p>
                                    {
                                        selectedOrder
                                            .customer
                                            ?.firstName
                                    }
                                    {" "}
                                    {
                                        selectedOrder
                                            .customer
                                            ?.lastName
                                    }
                                </p>

                                <p>
                                    {
                                        selectedOrder
                                            .customer
                                            ?.email
                                    }
                                </p>

                                <p>
                                    {
                                        selectedOrder
                                            .customer
                                            ?.phone
                                    }
                                </p>

                            </div>


                            {/* =================================
                                ADDRESS
                            ================================== */}

                            <div className="admin-detail-section">

                                <h3>
                                    Delivery address
                                </h3>

                                <p>
                                    {
                                        selectedOrder
                                            .shippingAddress
                                            ?.addressLine1
                                    }
                                </p>

                                {
                                    selectedOrder
                                        .shippingAddress
                                        ?.addressLine2 &&
                                    (

                                        <p>
                                            {
                                                selectedOrder
                                                    .shippingAddress
                                                    .addressLine2
                                            }
                                        </p>

                                    )
                                }

                                <p>
                                    {
                                        selectedOrder
                                            .shippingAddress
                                            ?.city
                                    },
                                    {" "}
                                    {
                                        selectedOrder
                                            .shippingAddress
                                            ?.state
                                    }
                                    {" "}
                                    {
                                        selectedOrder
                                            .shippingAddress
                                            ?.postalCode
                                    }
                                </p>

                                <p>
                                    {
                                        selectedOrder
                                            .shippingAddress
                                            ?.country
                                    }
                                </p>

                            </div>


                            {/* =================================
                                ITEMS
                            ================================== */}

                            <div className="admin-detail-section">

                                <h3>
                                    Items
                                </h3>


                                <div className="admin-order-items">

                                    {
                                        selectedOrder
                                            .items
                                            ?.map(
                                                (
                                                    item
                                                ) => (

                                                    <div
                                                        className="admin-order-item"
                                                        key={
                                                            item._id ||
                                                            item.productId
                                                        }
                                                    >

                                                        <div>

                                                            <strong>
                                                                {
                                                                    item.name
                                                                }
                                                            </strong>

                                                            <span>
                                                                Qty:
                                                                {" "}
                                                                {
                                                                    item.quantity
                                                                }
                                                            </span>

                                                        </div>


                                                        <strong>
                                                            {
                                                                formatMoney(
                                                                    item.lineTotalMinor,
                                                                    selectedOrder.currency
                                                                )
                                                            }
                                                        </strong>

                                                    </div>

                                                )
                                            )
                                    }

                                </div>

                            </div>


                            {/* =================================
                                TOTAL
                            ================================== */}

                            <div className="admin-detail-section admin-order-total">

                                <span>
                                    Total
                                </span>

                                <strong>
                                    {
                                        formatMoney(
                                            selectedOrder.totalMinor,
                                            selectedOrder.currency
                                        )
                                    }
                                </strong>

                            </div>


                            {/* =================================
                                PAYMENT
                            ================================== */}

                            <div className="admin-detail-section">

                                <h3>
                                    Payment
                                </h3>

                                <p>
                                    Status:
                                    {" "}

                                    <strong>
                                        {
                                            statusLabel(
                                                selectedOrder
                                                    .paymentStatus
                                            )
                                        }
                                    </strong>
                                </p>


                                <p>
                                    Razorpay Payment ID:
                                    {" "}

                                    {
                                        selectedOrder
                                            .razorpayPaymentId ||
                                        "—"
                                    }
                                </p>


                                <p>
                                    Placed:
                                    {" "}

                                    {
                                        formatDate(
                                            selectedOrder
                                                .createdAt
                                        )
                                    }
                                </p>

                            </div>

                        </aside>

                    </div>

                )
            }

        </main>

    );

}