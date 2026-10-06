/**
 * geoUtils.js
 *
 * Offline geospatial utilities for Address & GPS Verification.
 * - Haversine distance calculation in kilometers.
 * - Centroid dictionary for Indian states & major cities/pincode zones.
 * - Multi-factor risk engine comparing captured GPS against declared addresses.
 */

// ─── Reference Coordinates for Major Indian Cities & State Centroids ──────────
const CITY_COORDINATES = {
    mumbai:      { lat: 19.0760, lon: 72.8777, state: "maharashtra" },
    pune:        { lat: 18.5204, lon: 73.8567, state: "maharashtra" },
    nagpur:      { lat: 21.1458, lon: 79.0882, state: "maharashtra" },
    delhi:       { lat: 28.6139, lon: 77.2090, state: "delhi" },
    "new delhi": { lat: 28.6139, lon: 77.2090, state: "delhi" },
    noida:       { lat: 28.5355, lon: 77.3910, state: "uttar pradesh" },
    gurugram:    { lat: 28.4595, lon: 77.0266, state: "haryana" },
    gurgaon:     { lat: 28.4595, lon: 77.0266, state: "haryana" },
    bengaluru:   { lat: 12.9716, lon: 77.5946, state: "karnataka" },
    bangalore:   { lat: 12.9716, lon: 77.5946, state: "karnataka" },
    mysuru:      { lat: 12.2958, lon: 76.6394, state: "karnataka" },
    hyderabad:   { lat: 17.3850, lon: 78.4867, state: "telangana" },
    chennai:     { lat: 13.0827, lon: 80.2707, state: "tamil nadu" },
    coimbatore:  { lat: 11.0168, lon: 76.9558, state: "tamil nadu" },
    kolkata:     { lat: 22.5726, lon: 88.3639, state: "west bengal" },
    ahmedabad:   { lat: 23.0225, lon: 72.5714, state: "gujarat" },
    surat:       { lat: 21.1702, lon: 72.8311, state: "gujarat" },
    jaipur:      { lat: 26.9124, lon: 75.7873, state: "rajasthan" },
    jodhpur:     { lat: 26.2389, lon: 73.0243, state: "rajasthan" },
    lucknow:     { lat: 26.8467, lon: 80.9462, state: "uttar pradesh" },
    kanpur:      { lat: 26.4499, lon: 80.3319, state: "uttar pradesh" },
    varanasi:    { lat: 25.3176, lon: 82.9739, state: "uttar pradesh" },
    patna:       { lat: 25.5941, lon: 85.1376, state: "bihar" },
    bhopal:      { lat: 23.2599, lon: 77.4126, state: "madhya pradesh" },
    indore:      { lat: 22.7196, lon: 75.8577, state: "madhya pradesh" },
    chandigarh:  { lat: 30.7333, lon: 76.7794, state: "chandigarh" },
    kochi:       { lat: 9.9312,  lon: 76.2673, state: "kerala" },
    thiruvananthapuram: { lat: 8.5241, lon: 76.9366, state: "kerala" },
    visakhapatnam: { lat: 17.6868, lon: 83.2185, state: "andhra pradesh" },
    vijayawada:  { lat: 16.5062, lon: 80.6480, state: "andhra pradesh" },
    bhubaneswar: { lat: 20.2961, lon: 85.8245, state: "odisha" },
    guwahati:    { lat: 26.1445, lon: 91.7362, state: "assam" },
    ranchi:      { lat: 23.3441, lon: 85.3096, state: "jharkhand" },
    raipur:      { lat: 21.2514, lon: 81.6296, state: "chhattisgarh" },
    dehradun:    { lat: 30.3165, lon: 78.0322, state: "uttarakhand" },
    shimla:      { lat: 31.1048, lon: 77.1734, state: "himachal pradesh" },
    srinagar:    { lat: 34.0837, lon: 74.7973, state: "jammu and kashmir" },
    goa:         { lat: 15.2993, lon: 74.1240, state: "goa" }
};

const STATE_CENTROIDS = {
    maharashtra:        { lat: 19.7515, lon: 75.7139 },
    delhi:              { lat: 28.7041, lon: 77.1025 },
    karnataka:          { lat: 15.3173, lon: 75.7139 },
    telangana:          { lat: 18.1124, lon: 79.0193 },
    "tamil nadu":       { lat: 11.1271, lon: 78.6569 },
    "west bengal":      { lat: 22.9868, lon: 87.8550 },
    gujarat:            { lat: 22.2587, lon: 71.1924 },
    rajasthan:          { lat: 27.0238, lon: 74.2179 },
    "uttar pradesh":    { lat: 26.8467, lon: 80.9462 },
    bihar:              { lat: 25.0961, lon: 85.3131 },
    "madhya pradesh":   { lat: 22.9734, lon: 78.6569 },
    punjab:             { lat: 31.1471, lon: 75.3412 },
    haryana:            { lat: 29.0588, lon: 76.0856 },
    kerala:             { lat: 10.8505, lon: 76.2711 },
    "andhra pradesh":   { lat: 15.9129, lon: 79.7400 },
    odisha:             { lat: 20.9517, lon: 85.0985 },
    assam:              { lat: 26.2006, lon: 92.9376 },
    jharkhand:          { lat: 23.6102, lon: 85.2799 },
    chhattisgarh:       { lat: 21.2787, lon: 81.8661 },
    uttarakhand:        { lat: 30.0668, lon: 79.0193 },
    "himachal pradesh": { lat: 31.1048, lon: 77.1734 },
    goa:                { lat: 15.2993, lon: 74.1240 }
};

// PIN prefix (first 2 digits) to approximate region centroid
const PINCODE_PREFIX_COORDS = {
    "11": { lat: 28.6139, lon: 77.2090, region: "delhi" },
    "12": { lat: 28.4595, lon: 77.0266, region: "haryana" },
    "13": { lat: 29.9695, lon: 76.8783, region: "haryana" },
    "14": { lat: 30.9010, lon: 75.8573, region: "punjab" },
    "16": { lat: 30.7333, lon: 76.7794, region: "chandigarh" },
    "18": { lat: 32.7266, lon: 74.8570, region: "jammu and kashmir" },
    "19": { lat: 34.0837, lon: 74.7973, region: "kashmir" },
    "20": { lat: 27.8974, lon: 78.0880, region: "uttar pradesh" },
    "22": { lat: 26.8467, lon: 80.9462, region: "uttar pradesh" },
    "24": { lat: 29.9457, lon: 78.1642, region: "uttarakhand" },
    "25": { lat: 28.9845, lon: 77.7064, region: "uttar pradesh" },
    "30": { lat: 26.9124, lon: 75.7873, region: "rajasthan" },
    "38": { lat: 23.0225, lon: 72.5714, region: "gujarat" },
    "39": { lat: 21.1702, lon: 72.8311, region: "gujarat" },
    "40": { lat: 19.0760, lon: 72.8777, region: "mumbai / maharashtra" },
    "41": { lat: 18.5204, lon: 73.8567, region: "pune / maharashtra" },
    "44": { lat: 21.1458, lon: 79.0882, region: "nagpur / maharashtra" },
    "45": { lat: 22.7196, lon: 75.8577, region: "indore / madhya pradesh" },
    "46": { lat: 23.2599, lon: 77.4126, region: "bhopal / madhya pradesh" },
    "50": { lat: 17.3850, lon: 78.4867, region: "hyderabad / telangana" },
    "52": { lat: 16.5062, lon: 80.6480, region: "andhra pradesh" },
    "53": { lat: 17.6868, lon: 83.2185, region: "andhra pradesh" },
    "56": { lat: 12.9716, lon: 77.5946, region: "bengaluru / karnataka" },
    "57": { lat: 12.9141, lon: 74.8560, region: "karnataka" },
    "60": { lat: 13.0827, lon: 80.2707, region: "chennai / tamil nadu" },
    "64": { lat: 11.0168, lon: 76.9558, region: "coimbatore / tamil nadu" },
    "68": { lat: 9.9312,  lon: 76.2673, region: "kochi / kerala" },
    "69": { lat: 8.5241,  lon: 76.9366, region: "kerala" },
    "70": { lat: 22.5726, lon: 88.3639, region: "kolkata / west bengal" },
    "75": { lat: 20.2961, lon: 85.8245, region: "odisha" },
    "78": { lat: 26.1445, lon: 91.7362, region: "assam" },
    "80": { lat: 25.5941, lon: 85.1376, region: "bihar" },
    "83": { lat: 23.3441, lon: 85.3096, region: "jharkhand" }
};

/**
 * Calculates great-circle distance between two GPS coordinates using Haversine formula.
 * @param {number} lat1 
 * @param {number} lon1 
 * @param {number} lat2 
 * @param {number} lon2 
 * @returns {number} distance in kilometers (rounded to 2 decimal places)
 */
function calculateHaversineDistanceKm(lat1, lon1, lat2, lon2) {
    const toRad = (deg) => (deg * Math.PI) / 180;
    const R = 6371; // Earth radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);

    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c;

    return Math.round(d * 100) / 100;
}

/**
 * Resolves approximate coordinates for an address by city, state, or PIN code prefix.
 * @param {{ city?: string, state?: string, pincode?: string }} address 
 * @returns {{ lat: number, lon: number, precision: "city"|"pincode"|"state"|"default" }}
 */
function resolveAddressCoordinates(address = {}) {
    const cityKey = (address.city || "").trim().toLowerCase();
    if (cityKey && CITY_COORDINATES[cityKey]) {
        const c = CITY_COORDINATES[cityKey];
        return { lat: c.lat, lon: c.lon, precision: "city" };
    }

    const pinStr = (address.pincode || "").toString().trim();
    if (pinStr.length >= 2) {
        const prefix = pinStr.substring(0, 2);
        if (PINCODE_PREFIX_COORDS[prefix]) {
            const p = PINCODE_PREFIX_COORDS[prefix];
            return { lat: p.lat, lon: p.lon, precision: "pincode" };
        }
    }

    const stateKey = (address.state || "").trim().toLowerCase();
    if (stateKey && STATE_CENTROIDS[stateKey]) {
        const s = STATE_CENTROIDS[stateKey];
        return { lat: s.lat, lon: s.lon, precision: "state" };
    }

    // Default centroid (Nagpur, central India)
    return { lat: 21.1458, lon: 79.0882, precision: "default" };
}

/**
 * Basic risk engine comparing declared address against captured GPS coordinates.
 *
 * Risk Tiers:
 *   - LOW (Score <= 30)   : Distance <= 50 km (or within same city/metro area)
 *   - MEDIUM (Score 31-70): Distance 51 - 250 km (same state/regional travel)
 *   - HIGH (Score > 70)   : Distance > 250 km or out of region / state mismatch
 *
 * @param {{ latitude: number, longitude: number, accuracy?: number }} gpsCoords
 * @param {{ city: string, state: string, pincode: string, street?: string }} address
 * @returns {{ riskScore: number, riskLevel: "LOW"|"MEDIUM"|"HIGH", status: "VERIFIED"|"FLAGGED"|"REJECTED", distanceKm: number, checks: object, flags: string[], details: string }}
 */
function evaluateAddressGpsRisk(gpsCoords, address) {
    const flags = [];
    let riskScore = 10; // Baseline low risk score

    const addressResolved = resolveAddressCoordinates(address);
    const distanceKm = calculateHaversineDistanceKm(
        gpsCoords.latitude,
        gpsCoords.longitude,
        addressResolved.lat,
        addressResolved.lon
    );

    const checks = {
        gpsConsentVerified: true,
        coordinatesValid: true,
        distanceCheckPassed: false,
        cityMatch: false,
        stateMatch: false,
        pincodeRegionMatch: false
    };

    // 1. Boundary & Coordinate Sanity Check
    const isIndiaBounds =
        gpsCoords.latitude >= 6.0 && gpsCoords.latitude <= 38.0 &&
        gpsCoords.longitude >= 68.0 && gpsCoords.longitude <= 98.0;

    if (!isIndiaBounds) {
        flags.push("GPS_OUTSIDE_NATIONAL_BOUNDS");
        riskScore += 45;
        checks.coordinatesValid = false;
    }

    // 2. High Accuracy Jitter Check
    if (gpsCoords.accuracy && gpsCoords.accuracy > 5000) {
        flags.push("LOW_GPS_ACCURACY_GREATER_THAN_5KM");
        riskScore += 15;
    }

    // 3. City / Region matching
    const declaredCity = (address.city || "").trim().toLowerCase();
    if (declaredCity && CITY_COORDINATES[declaredCity]) {
        const cityData = CITY_COORDINATES[declaredCity];
        const distToCity = calculateHaversineDistanceKm(gpsCoords.latitude, gpsCoords.longitude, cityData.lat, cityData.lon);
        if (distToCity <= 65) {
            checks.cityMatch = true;
            checks.stateMatch = true;
        }
    }

    // 4. Distance evaluation
    if (distanceKm <= 50) {
        // Within same city / immediate vicinity
        checks.distanceCheckPassed = true;
        riskScore = Math.min(riskScore, 15);
    } else if (distanceKm <= 200) {
        // Commuter / adjacent district / travel distance
        checks.distanceCheckPassed = true;
        riskScore += 25;
        flags.push("MODERATE_GPS_DISTANCE_COMMUTER_ZONE");
    } else if (distanceKm <= 400) {
        // Intra-state or neighboring state
        riskScore += 50;
        flags.push("SIGNIFICANT_GPS_DISTANCE_INTERCITY");
    } else {
        // Far away from declared address (> 400 km)
        riskScore += 75;
        flags.push("HIGH_GPS_DISTANCE_DISCREPANCY");
    }

    // Clamp risk score to [0, 100]
    riskScore = Math.min(100, Math.max(0, riskScore));

    let riskLevel = "LOW";
    let status = "VERIFIED";

    if (riskScore > 70) {
        riskLevel = "HIGH";
        status = "FLAGGED";
    } else if (riskScore > 30) {
        riskLevel = "MEDIUM";
        status = "FLAGGED";
    }

    const details = riskLevel === "LOW"
        ? `GPS location is within ${distanceKm} km of declared address. Address verification passed.`
        : `GPS location is ${distanceKm} km away from declared address (${address.city || "declared city"}, ${address.state || ""}). Risk assessment: ${riskLevel}.`;

    return {
        riskScore,
        riskLevel,
        status,
        distanceKm,
        checks,
        flags,
        details
    };
}

module.exports = {
    calculateHaversineDistanceKm,
    resolveAddressCoordinates,
    evaluateAddressGpsRisk,
    CITY_COORDINATES,
    STATE_CENTROIDS,
    PINCODE_PREFIX_COORDS
};
