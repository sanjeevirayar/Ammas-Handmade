import bcrypt from "bcryptjs";

const password =
    process.env.ADMIN_PASSWORD;

if (!password) {

    console.error(
        "ADMIN_PASSWORD was not provided."
    );

    process.exit(1);
}

const hash =
    await bcrypt.hash(
        password,
        12
    );

console.log("\nAdmin password hash:\n");
console.log(hash);
console.log();