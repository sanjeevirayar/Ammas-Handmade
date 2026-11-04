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
                        search.trim()
                    ) {

                        params.set(
                            "search",
                            search.trim()
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
                search,
                orderStatus,
                paymentStatus,
                logout
            ]
        );


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
            orderStatus,
            paymentStatus
        ]
    );


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


    const handleSearchSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            await loadOrders(
                1
            );

        };


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


                                return {
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


                        return {
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


    if (authLoading) {

        return (

            <div className="admin-loading">

                Loading...

            </div>

        );

    }


    if (!isAuthenticated) {

        return (

            <Navigate
                to="/admin/login"
                replace
            />

        );

    }


    return (

        <main className="admin-dashboard">

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