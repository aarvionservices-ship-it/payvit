const express = require("express");

const authController = require("../controller/auth.controller");
const publicKeyController = require("../controller/publicKey.controller");

const validate = require("../../../middlewares/validateRequest");

const registerDTO = require("../dto/register.dto");
const loginDTO = require("../dto/login.dto");
const { sendOtpDTO, verifyOtpDTO } = require("../dto/otp.dto");

const authMiddleware = require("../../../middlewares/auth.middleware");
const asyncHandler = require("../../../middlewares/asyncHandler");

const router = express.Router();

router.get(
    "/device-id",
    asyncHandler(authController.getDeviceId.bind(authController))
);

router.post(
    "/send-registration-otp",
    validate(sendOtpDTO),
    asyncHandler(authController.sendRegistrationOtp.bind(authController))
);

router.post(
    "/send-otp",
    validate(sendOtpDTO),
    asyncHandler(authController.sendRegistrationOtp.bind(authController))
);

router.post(
    "/verify-registration-otp",
    validate(verifyOtpDTO),
    asyncHandler(authController.verifyRegistrationOtp.bind(authController))
);

router.post(
    "/verify-otp",
    validate(verifyOtpDTO),
    asyncHandler(authController.verifyRegistrationOtp.bind(authController))
);

router.post(
    "/resend-registration-otp",
    validate(sendOtpDTO),
    asyncHandler(authController.resendRegistrationOtp.bind(authController))
);

router.post(
    "/resend-otp",
    validate(sendOtpDTO),
    asyncHandler(authController.resendRegistrationOtp.bind(authController))
);

router.post(
    "/send-login-otp",
    validate(sendOtpDTO),
    asyncHandler(authController.sendLoginOtp.bind(authController))
);

router.post(
    "/resend-login-otp",
    validate(sendOtpDTO),
    asyncHandler(authController.resendLoginOtp.bind(authController))
);

router.post(
    "/login-otp",
    validate(verifyOtpDTO),
    asyncHandler(authController.loginWithOtp.bind(authController))
);

router.post(
    "/register",
    validate(registerDTO),
    asyncHandler(authController.register.bind(authController))
);

router.post(
    "/login",
    validate(loginDTO),
    asyncHandler(authController.login.bind(authController))
);

router.post(
    "/refresh",
    asyncHandler(authController.refresh.bind(authController))
);

router.post(
    "/logout",
    authMiddleware,
    asyncHandler(authController.logout.bind(authController))
);

router.get(
    "/public-key",
    asyncHandler(publicKeyController.getPublicKey.bind(publicKeyController))
);

router.get(
    "/me",
    authMiddleware,
    asyncHandler(authController.me.bind(authController))
);

router.post(
    "/forgot-password",
    asyncHandler(authController.forgotPassword.bind(authController))
);

router.get(
    "/validate-reset-token",
    asyncHandler(authController.validateResetToken.bind(authController))
);

router.post(
    "/reset-password",
    asyncHandler(authController.resetPassword.bind(authController))
);

module.exports = router;
