import jwt from "jsonwebtoken";


export const requireAdmin =
    (
        req,
        res,
        next
    ) => {

        try {

            const authorization =
                req.get(
                    "authorization"
                );


            if (
                !authorization ||
                !authorization.startsWith(
                    "Bearer "
                )
            ) {

                return res
                    .status(401)
                    .json({
                        message:
                            "Admin authentication required.",
                    });

            }


            const token =
                authorization
                    .slice(7)
                    .trim();


            const jwtSecret =
                process.env.ADMIN_JWT_SECRET;


            if (!jwtSecret) {

                return res
                    .status(500)
                    .json({
                        message:
                            "Admin authentication is not configured.",
                    });

            }


            const decoded =
                jwt.verify(
                    token,
                    jwtSecret
                );


            if (
                decoded.role !==
                "admin"
            ) {

                return res
                    .status(403)
                    .json({
                        message:
                            "Admin access required.",
                    });

            }


            req.admin =
                decoded;


            return next();

        } catch (error) {

            return res
                .status(401)
                .json({
                    message:
                        "Invalid or expired admin session.",
                });

        }

    };