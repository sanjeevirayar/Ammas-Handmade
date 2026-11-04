import {
    createContext,
    useContext,
    useEffect,
    useState
} from "react";


const AdminAuthContext =
    createContext(null);


export function AdminAuthProvider({
    children
}) {

    const [
        token,
        setToken
    ] = useState(
        () =>
            sessionStorage.getItem(
                "ammas-admin-token"
            )
    );


    const [
        admin,
        setAdmin
    ] = useState(null);


    const [
        loading,
        setLoading
    ] = useState(true);


    const login =
        async (
            email,
            password
        ) => {

            const response =
                await fetch(
                    "/api/admin/auth/login",
                    {
                        method:
                            "POST",

                        headers: {
                            "Content-Type":
                                "application/json",
                        },

                        body:
                            JSON.stringify({
                                email,
                                password,
                            }),
                    }
                );


            const data =
                await response.json();


            if (!response.ok) {

                throw new Error(
                    data.message ||
                    "Unable to log in."
                );

            }


            sessionStorage.setItem(
                "ammas-admin-token",
                data.token
            );


            setToken(
                data.token
            );


            setAdmin(
                data.admin
            );


            return data;

        };


    const logout =
        () => {

            sessionStorage.removeItem(
                "ammas-admin-token"
            );


            setToken(null);

            setAdmin(null);

        };


    useEffect(
        () => {

            const verifySession =
                async () => {

                    if (!token) {

                        setLoading(false);

                        return;

                    }


                    try {

                        const response =
                            await fetch(
                                "/api/admin/auth/me",
                                {
                                    headers: {
                                        Authorization:
                                            `Bearer ${token}`,
                                    },
                                }
                            );


                        const data =
                            await response.json();


                        if (!response.ok) {

                            throw new Error();

                        }


                        setAdmin(
                            data.admin
                        );

                    } catch {

                        logout();

                    } finally {

                        setLoading(false);

                    }

                };


            verifySession();

        },
        [token]
    );


    return (

        <AdminAuthContext.Provider
            value={{
                token,
                admin,
                loading,
                login,
                logout,
                isAuthenticated:
                    Boolean(
                        token &&
                        admin
                    ),
            }}
        >

            {children}

        </AdminAuthContext.Provider>

    );

}


export function useAdminAuth() {

    return useContext(
        AdminAuthContext
    );

}