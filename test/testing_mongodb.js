require("dotenv").config();
const dbConnect = require("../lib/dbConnect");

(async () => {
    try {
        await dbConnect();
        console.log("✅ MongoDB Connected Successfully!");
        process.exit(0);
    } catch (err) {
        console.error("❌ MongoDB Connection Failed:", err);
        process.exit(1);
    }
})();
