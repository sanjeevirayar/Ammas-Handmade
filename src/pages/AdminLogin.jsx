import {
    useState
} from "react";

import {
    Navigate,
    useNavigate
} from "react-router-dom";

import {
    useAdminAuth
} from "../context/AdminAuthContext";

import "../styles/Admin.css";


export default function AdminLogin() {

    const {
        login,
        isAuthenticated,
        loading
    } =
        useAdminAuth();


    const navigate =
        useNavigate();


    const [
        email,
        setEmail
    ] =
        useState("");


    const [
        password,
        setPassword
    ] =
        useState("");


    const [
        error,
        setError
    ] =
        useState("");


    const [
        submitting,
        setSubmitting
    ] =
        useState(false);


    if (loading) {

        return (
            <div className="admin-loading">
                Loading...
            </div>
        );

    }


    if (isAuthenticated) {

        return (
            <Navigate
                to="/admin"
                replace
            />
        );

    }


    const handleSubmit =
        async (
            event
        ) => {

            event.preventDefault();

            setError("");

            setSubmitting(true);


            try {

                await login(
                    email,
                    password
                );


                navigate(
                    "/admin",
                    {
                        replace:
                            true,
                    }
                );

            } catch (err) {

                setError(
                    err.message
                );

            } finally {

                setSubmitting(false);

            }

        };


    return (

        <main className="admin-login-page">

            <div className="admin-login-card">

                <p className="admin-login-eyebrow">
                    Amma&apos;s Handmade
                </p>


                <h1>
                    Admin Login
                </h1>


                <p className="admin-login-copy">
                    Sign in to manage orders
                    and fulfilment.
                </p>


                <form
                    onSubmit={
                        handleSubmit
                    }
                    className="admin-login-form"
                >

                    <label>

                        Email

                        <input
                            type="email"
                            value={
                                email
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setEmail(
                                        event
                                            .target
                                            .value
                                    )
                            }
                            autoComplete="username"
                            required
                        />

                    </label>


                    <label>

                        Password

                        <input
                            type="password"
                            value={
                                password
                            }
                            onChange={
                                (
                                    event
                                ) =>
                                    setPassword(
                                        event
                                            .target
                                            .value
                                    )
                            }
                            autoComplete="current-password"
                            required
                        />

                    </label>


                    {
                        error &&
                        (
                            <p className="admin-login-error">
                                {error}
                            </p>
                        )
                    }


                    <button
                        type="submit"
                        disabled={
                            submitting
                        }
                    >

                        {
                            submitting
                                ? "Signing in..."
                                : "Sign in"
                        }

                    </button>

                </form>

            </div>

        </main>

    );

}