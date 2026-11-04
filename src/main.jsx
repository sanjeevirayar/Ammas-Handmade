import {
    StrictMode
} from "react";

import {
    createRoot
} from "react-dom/client";

import {
    BrowserRouter
} from "react-router-dom";


import ProductProvider
    from "./context/ProductContext";

import {
    CartProvider
} from "./context/CartContext";

import {
    WishlistProvider
} from "./context/WishlistContext";

import {
    AdminAuthProvider
} from "./context/AdminAuthContext.jsx";

import "./index.css";

import App
    from "./App.jsx";


createRoot(
    document.getElementById(
        "root"
    )
).render(

    <StrictMode>

        <BrowserRouter>

            <ProductProvider>

                <CartProvider>

                    <WishlistProvider>
                        <AdminAuthProvider>

                        <App />
                        
                        </AdminAuthProvider>

                    </WishlistProvider>

                </CartProvider>

            </ProductProvider>

        </BrowserRouter>

    </StrictMode>

);