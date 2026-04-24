const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const Potato = require("./models/Potato");
const Razorpay = require("razorpay");
const crypto = require("crypto");

dotenv.config();

const app = express();
app.set("trust proxy", 1);

// ✅ CORS (production + local)
app.use(cors({
  origin: [
    "http://localhost:3000",
    "http://localhost:5173",
    "https://potato-frontend-eight.vercel.app"
  ],
  methods: ["GET", "POST"],
  credentials: true
}));

app.use(express.json());


// ✅ Rate limiter
const pinLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
});

// Apply limiter to sensitive routes
app.use("/api/potato/access", pinLimiter);
app.use("/api/potato/admin/create", pinLimiter);


const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID,
  key_secret: process.env.RAZORPAY_KEY_SECRET
});



// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Error:", err);
  });

app.post("/api/create-order", async (req, res) => {
    try {
      const options = {
        amount: 50000, // ₹500 in paise
        currency: "INR",
        receipt: "receipt_" + Date.now()
      };
  
      const order = await razorpay.orders.create(options);
      res.json(order);
  
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: "Order creation failed" });
    }
});

app.post("/api/verify-payment", (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature
    } = req.body;

    const body = razorpay_order_id + "|" + razorpay_payment_id;

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
      // ✅ You can save order to DB here
      return res.json({ success: true });
    }

    return res.status(400).json({ success: false });

  } catch (err) {
    res.status(500).json({ error: "Verification failed" });
  }
});


// ✅ Admin create potato
app.post("/api/potato/admin/create", async (req, res) => {
  try {
    const { admin_key } = req.body;

    // if (!process.env.ADMIN_KEY || admin_key !== process.env.ADMIN_KEY) {
    //   return res.status(401).json({ error: "Unauthorized" });
    // }
    if (!process.env.ADMIN_KEY) {
      throw new Error("ADMIN_KEY not configured");
    }
    if (admin_key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const { nanoid } = await import("nanoid");
    
    const id = nanoid(8);
    const rawPin = nanoid(6);
    const pinId = nanoid(4);

    const pinHash = await bcrypt.hash(rawPin, 10);

    const potato = new Potato({
      id,
      pinHash,
      pinId,
    });

    await potato.save();

    res.json({
      id,
      pin: rawPin,
      pinId,
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Get potato message
app.get("/api/potato/:id", async (req, res) => {
  try {
    const potato = await Potato.findOne({ id: req.params.id });

    if (!potato) {
      return res.status(404).json({ message: "Not found" });
    }

    res.json({ message: potato.message || "" });

  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// ✅ Access potato (PIN login)
app.post("/api/potato/access", async (req, res) => {
  try {
    const { pinId, pin } = req.body;

    const potato = await Potato.findOne({ pinId });

    if (!potato) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(pin, potato.pinHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // ✅ Only send safe data
    res.json({
      id: potato.id,
      message: potato.message || ""
    });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Update potato message
app.post("/api/potato/update", async (req, res) => {
  try {
    const { pinId, pin, message } = req.body;

    const potato = await Potato.findOne({ pinId });

    if (!potato) {
      return res.status(404).json({ message: "Invalid credentials" });
    }

    const isMatch = await bcrypt.compare(pin, potato.pinHash);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    potato.message = message;
    await potato.save();

    res.json({ success: true });

  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});


// ✅ Server start
const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});