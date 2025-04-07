import express from "express";
import { check } from "express-validator";
const router = express.Router();
import { protect } from "../middleware/auth.js";
import { register, login, getMe, forgotPassword, resetPassword } from "../controllers/auth.controller.js";

router.post(
    '/register',
    [
        (req, res, next) => {
            console.log("Request body before validation:", req.body); // Debug log
            next();
        },
        check('username', 'Username is required').not().isEmpty(),
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    register
);

router.post(
    '/login',
    [
        check('email', 'Please include a valid email').isEmail(),
        check('password', 'Password is required').exists()
    ],
    login
);

router.get(
    '/me',
    protect,
    getMe
)

router.post('/forgotpassword', forgotPassword);

router.put(
    '/resetpassword/:resettoken',
    [
        check('password', 'Please enter a password with 6 or more characters').isLength({ min: 6 })
    ],
    resetPassword
);

export const authRouter = router;  // named export instead of default
