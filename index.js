const express = require("express");
const mongoose = require("mongoose");

const app = express();

// Middleware
app.use(express.json());

// Database Connection
mongoose.connect("mongodb+srv://gangeswaran375:school@cluster0.veogg.mongodb.net/").then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

// School Schema and Model
const schoolSchema = new mongoose.Schema({
    name: { type: String, required: true },
    address: { type: String, required: true },
    latitude: { type: Number, required: true },
    longitude: { type: Number, required: true },
}, { timestamps: true });

const School = mongoose.model("School", schoolSchema);

// Helper Function: Calculate Distance
const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const toRad = (value) => (value * Math.PI) / 180;
    const R = 6371; // Earth's radius in km

    const dLat = toRad(lat2 - lat1);
    const dLon = toRad(lon2 - lon1);

    const a = Math.sin(dLat / 2) ** 2 +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in km
};

// Routes

// Add School API
app.post("/addSchool", async (req, res) => {
    const { name, address, latitude, longitude } = req.body;

    // Validation
    if (!name || !address || latitude === undefined || longitude === undefined) {
        return res.status(400).json({ error: "All fields are required." });
    }

    if (typeof Number(latitude) !== "number" || isNaN(Number(latitude)) || 
        typeof Number(longitude) !== "number" || isNaN(Number(longitude))) {
        return res.status(400).json({ error: "Latitude and Longitude must be numbers." });
    }

    try {
        const school = new School({ name, address, latitude: Number(latitude), longitude: Number(longitude) });
        await school.save();
        return res.status(201).json({ message: "School added successfully", school });
    } catch (err) {
        return res.status(500).json({ error: "Failed to add school", details: err.message });
    }
});

// List Schools API
app.get("/listSchools", async (req, res) => {
    const { latitude, longitude } = req.query;

    // Parse and Validate
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);

    if (isNaN(lat) || isNaN(lon)) {
        return res.status(400).json({ error: "Latitude and Longitude must be valid numbers." });
    }

    try {
        const schools = await School.find();

        // Calculate distance and sort
        const sortedSchools = schools.map((school) => {
            const distance = calculateDistance(lat, lon, school.latitude, school.longitude);
            return { ...school._doc, distance };
        }).sort((a, b) => a.distance - b.distance);

        return res.status(200).json({ schools: sortedSchools });
    } catch (err) {
        return res.status(500).json({ error: "Failed to list schools", details: err.message });
    }
});

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
