import "./App.css";

import {
    Routes,
    Route,
    useLocation
} from "react-router-dom";

import TrustBar from "./components/TrustBar";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Shop from "./pages/Shop";
import Collections from "./pages/Collections";
import Gifts from "./pages/Gifts";
import CustomOrders from "./pages/CustomOrders";
import OurStory from "./pages/OurStory";
import Cart from "./pages/Cart";
import Wishlist from "./pages/Wishlist";
import ProductDetails from "./pages/ProductDetails";
import ScrollToTop from "./components/ScrollToTop";
import LearnWithAmma from "./pages/LearnWithAmma";
import Contact from "./pages/Contact";
import FAQ from "./pages/FAQ";
import Checkout from "./pages/Checkout";
import AdminLogin
    from "./pages/AdminLogin";

import AdminDashboard
    from "./pages/AdminDashboard";


function App() {

    const location = useLocation();

    return (
        <>
            <ScrollToTop />

            <TrustBar />

            <Navbar />

            <Routes>

                <Route
                    path="/"
                    element={<Home />}
                />

                <Route
                    path="/shop"
                    element={<Shop key={location.key} />}
                />

                <Route
                    path="/collections"
                    element={<Collections />}
                />

                <Route
                    path="/gifts"
                    element={<Gifts />}
                />

                <Route
                    path="/custom-orders"
                    element={<CustomOrders />}
                />

                <Route
                    path="/our-story"
                    element={<OurStory />}
                />


                <Route
                    path="/wishlist"
                    element={<Wishlist />}
                />

                <Route
                    path="/cart"
                    element={<Cart />}
                />

                <Route
                    path="/product/:slug"
                    element={<ProductDetails />}
                />

                <Route
                    path="/learn-with-amma"
                    element={<LearnWithAmma />}
                />

                <Route
                    path="/checkout"
                    element={<Checkout />}
                />

                <Route path="/contact" element={<Contact />} />

                <Route path="/faq" element={<FAQ />} />
                <Route
                    path="/admin/login"
                    element={
                        <AdminLogin />
                    }
                />

                <Route
                    path="/admin"
                    element={
                        <AdminDashboard />
                    }
                />

            </Routes>


            <Footer />

        </>
    );
}


export default App;