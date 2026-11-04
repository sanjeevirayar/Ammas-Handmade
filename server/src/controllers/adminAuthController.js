import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";


export const adminLogin =
    async (
        req,
        res
    ) => {

        try {

            const {
                email,
                password
            } = req.body;


            if (
                !email ||
                !password
            ) {

                return res
                    .status(400)
                    .json({
                        message:
                            "Email and password are required.",
                    });

            }


            const adminEmail =
                process.env.ADMIN_EMAIL;

            const passwordHash =
                process.env.ADMIN_PASSWORD_HASH;

            const jwtSecret =
                process.env.ADMIN_JWT_SECRET;


            if (
                !adminEmail ||
                !passwordHash ||
                !jwtSecret
            ) {

                console.error(
                    "Admin authentication environment variables are missing."
                );

                return res
                    .status(500)
                    .json({
                        message:
                            "Admin authentication is not configured.",
                    });

            }


            const normalizedEmail =
                String(email)
                    .trim()
                    .toLowerCase();


            if (
                normalizedEmail !==
                adminEmail
                    .trim()
                    .toLowerCase()
            ) {

                return res
                    .status(401)
                    .json({
                        message:
                            "Invalid email or password.",
                    });

            }


            const passwordValid =
                await bcrypt.compare(
                    password,
                    passwordHash
                );


            if (!passwordValid) {

                return res
                    .status(401)
                    .json({
                        message:
                            "Invalid email or password.",
                    });

            }


            const token =
                jwt.sign(
                    {
                        role:
                            "admin",

                        email:
                            normalizedEmail,
                    },

                    jwtSecret,

                    {
                        expiresIn:
                            "12h",
                    }
                );


            return res.json({

                message:
                    "Admin login successful.",

                token,

                admin: {
                    email:
                        normalizedEmail,
                },

            });

        } catch (error) {

            console.error(
                "Admin login error:",
                error
            );


            return res
                .status(500)
                .json({
                    message:
                        "Unable to log in.",
                });

        }

    };