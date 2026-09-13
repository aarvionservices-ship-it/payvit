const crypto = require("crypto");
const snowflake = require("./distributedId");

class DeviceIdUtil {
    /**
     * Generates a cryptographically secure, unique device ID
     * Format: dev_<snowflake>_<randomHex>
     * e.g., dev_172530123456710_a9f8b2c1
     */
    generateDeviceId() {
        const randomSuffix = crypto.randomBytes(4).toString("hex");
        const id = snowflake.nextId();
        return `dev_${id}_${randomSuffix}`;
    }

    /**
     * Resolves device ID from body, header (x-device-id), or generates a new one
     */
    resolveDeviceId(req) {
        const headerId = req.headers ? (req.headers["x-device-id"] || req.headers["x-deviceid"]) : null;
        const bodyId = req.body ? (req.body.deviceId || req.body.device_id) : null;

        if (bodyId && typeof bodyId === "string" && bodyId.trim().length > 0) {
            return bodyId.trim();
        }

        if (headerId && typeof headerId === "string" && headerId.trim().length > 0) {
            return headerId.trim();
        }

        return this.generateDeviceId();
    }

    /**
     * Parses client user agent to extract high-level device/browser info
     */
    parseDeviceInfo(userAgent = "", ip = "") {
        const ua = (userAgent || "").toLowerCase();
        let browser = "Unknown Browser";
        let os = "Unknown OS";
        let deviceType = "desktop";

        // Detect OS
        if (ua.includes("windows")) os = "Windows";
        else if (ua.includes("android")) { os = "Android"; deviceType = "mobile"; }
        else if (ua.includes("iphone") || ua.includes("ipad") || ua.includes("ipod")) {
            os = "iOS";
            deviceType = ua.includes("ipad") ? "tablet" : "mobile";
        }
        else if (ua.includes("mac os") || ua.includes("macintosh")) os = "macOS";
        else if (ua.includes("linux")) os = "Linux";

        // Detect Browser
        if (ua.includes("edg/")) browser = "Microsoft Edge";
        else if (ua.includes("chrome") && !ua.includes("edg") && !ua.includes("opr")) browser = "Google Chrome";
        else if (ua.includes("safari") && !ua.includes("chrome")) browser = "Safari";
        else if (ua.includes("firefox")) browser = "Mozilla Firefox";
        else if (ua.includes("opera") || ua.includes("opr/")) browser = "Opera";

        const deviceName = `${browser} on ${os}`;

        return {
            deviceName,
            browser,
            os,
            deviceType,
            userAgent: userAgent || "",
            ip: ip || ""
        };
    }
}

module.exports = new DeviceIdUtil();
