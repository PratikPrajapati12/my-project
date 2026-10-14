
const express = require("express");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const router = express.Router();

// ==================== SIGNUP API ====================
router.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
        return res.status(400).json({
            message: "All fields are required"
        });
    }

    const cleanName = name.trim();
    const cleanEmail = email.trim().toLowerCase();

    if (!cleanName || !cleanEmail) {
        return res.status(400).json({
            message: "Name and email cannot be empty"
        });
    }

    if (password.length < 6) {
        return res.status(400).json({
            message: "Password must be at least 6 characters"
        });
    }

    try {
        // Check if email already exists
        db.query(
            "SELECT id FROM users WHERE email = ?",
            [cleanEmail],
            async (checkError, results) => {
                if (checkError) {
                    console.error("Signup check error:", checkError);

                    return res.status(500).json({
                        message: "Database error while checking email"
                    });
                }

                if (results.length > 0) {
                    return res.status(409).json({
                        message: "Email already registered"
                    });
                }

                try {
                    // Hash password before saving
                    const hashedPassword = await bcrypt.hash(
                        password,
                        10
                    );

                    const sql =
                        "INSERT INTO users (name, email, password) VALUES (?, ?, ?)";

                    db.query(
                        sql,
                        [cleanName, cleanEmail, hashedPassword],
                        (insertError, result) => {
                            if (insertError) {
                                console.error(
                                    "Signup Database Error:",
                                    insertError
                                );

                                if (
                                    insertError.code === "ER_DUP_ENTRY"
                                ) {
                                    return res.status(409).json({
                                        message: "Email already registered"
                                    });
                                }

                                return res.status(500).json({
                                    message: "Signup failed",
                                    error: insertError.message
                                });
                            }

                            return res.status(201).json({
                                message: "Signup successful",
                                user: {
                                    id: result.insertId,
                                    name: cleanName,
                                    email: cleanEmail
                                }
                            });
                        }
                    );
                } catch (hashError) {
                    console.error("Password hashing error:", hashError);

                    return res.status(500).json({
                        message: "Could not process password"
                    });
                }
            }
        );
    } catch (error) {
        console.error("Signup server error:", error);

        return res.status(500).json({
            message: "Server error during signup"
        });
    }
});

// ==================== LOGIN API ====================
router.post("/login", (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required"
        });
    }

    const cleanEmail = email.trim().toLowerCase();

    db.query(
        "SELECT id, name, email, password FROM users WHERE email = ?",
        [cleanEmail],
        async (dbError, results) => {
            if (dbError) {
                console.error("Login Database Error:", dbError);

                return res.status(500).json({
                    message: "Database error during login"
                });
            }

            if (results.length === 0) {
                return res.status(401).json({
                    message: "Invalid email or password"
                });
            }

            const user = results[0];

            try {
                const validPassword = await bcrypt.compare(
                    password,
                    user.password
                );

                if (!validPassword) {
                    return res.status(401).json({
                        message: "Invalid email or password"
                    });
                }

                if (!process.env.JWT_SECRET) {
                    console.error("JWT_SECRET is missing in .env");

                    return res.status(500).json({
                        message: "Server authentication configuration error"
                    });
                }

                const token = jwt.sign(
                    {
                        id: user.id,
                        email: user.email
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: "1d"
                    }
                );

                return res.status(200).json({
                    message: "Login successful",
                    token,
                    user: {
                        id: user.id,
                        name: user.name,
                        email: user.email
                    }
                });
            } catch (loginError) {
                console.error("Login Error:", loginError);

                return res.status(500).json({
                    message: "Server error during login"
                });
            }
        }
    );
});

module.exports = router;
