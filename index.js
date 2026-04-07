// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const dotenv = require("dotenv");
// const { nanoid } = require("nanoid");
// const bcrypt = require("bcrypt");
// const rateLimit = require("express-rate-limit");
// const Potato = require("./models/Potato");

// dotenv.config();

// const app = express();
// app.use(cors());
// app.use(express.json());


// const pinLimiter = rateLimit({
//   windowMs: 15 * 60 * 1000,
//   max: 50,
// });

// app.use("/api/potato/pin", pinLimiter);
// app.use("/api/potato/update-by-pin", pinLimiter);


// mongoose.connect(process.env.MONGO_URI)
//  .then(() => console.log("MongoDB Connected"))
//  .catch(err => console.log(err));


// app.post("/api/potato/admin/create", async (req, res) => {
//   try {
//     const { admin_key } = req.body;
//     if (admin_key !== process.env.ADMIN_KEY && process.env.ADMIN_KEY !== undefined) {
//       return res.status(401).json({ error: "Unauthorized" });
//     }

//     const id = nanoid(8);
//     const rawPin = nanoid(6); // user PIN
//     const pinId = nanoid(4);  // lookup key

//     const pinHash = await bcrypt.hash(rawPin, 10);

//     const potato = new Potato({
//       id,
//       pinHash,
//       pinId,
//     });

//     await potato.save();

//     res.json({
//       id,
//       pin: rawPin,
//       pinId,
//     });

//   } catch (err) {
//     res.status(500).json({ error: "Server error" });
//   }
// });

//   app.get("/api/potato/:id", async (req, res) => {
//     try {
//       const potato = await Potato.findOne({ id: req.params.id });
  
//       if (!potato) {
//         return res.status(404).json({ message: "Not found" });
//       }
  
//       res.json({ message: potato.message });
//     } catch (err) {
//       res.status(500).json({ error: err.message });
//     }
//   });


//   app.post("/api/potato/access", async (req, res) => {
//     try {
//       const { pinId, pin } = req.body;
  
//       const potato = await Potato.findOne({ pinId });
  
//       if (!potato) {
//         return res.status(404).json({ message: "Invalid credentials" });
//       }
  
//       const isMatch = await bcrypt.compare(pin, potato.pinHash);
  
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid credentials" });
//       }
  
//       res.json(potato);
  
//     } catch (err) {
//       res.status(500).json({ error: "Server error" });
//     }
//   });


//   app.post("/api/potato/update", async (req, res) => {
//     try {
//       const { pinId, pin, message } = req.body;
  
//       const potato = await Potato.findOne({ pinId });
  
//       if (!potato) {
//         return res.status(404).json({ message: "Invalid credentials" });
//       }
  
//       const isMatch = await bcrypt.compare(pin, potato.pinHash);
  
//       if (!isMatch) {
//         return res.status(401).json({ message: "Invalid credentials" });
//       }
  
//       potato.message = message;
//       await potato.save();
  
//       res.json({ success: true });
  
//     } catch (err) {
//       res.status(500).json({ error: "Server error" });
//     }
//   });

//   const PORT = process.env.PORT || 3001;

// app.listen(PORT, () => {
//   console.log(`Server running on port ${PORT}`);
// });

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { nanoid } = require("nanoid");
const bcrypt = require("bcrypt");
const rateLimit = require("express-rate-limit");
const Potato = require("./models/Potato");

dotenv.config();

const app = express();


// ✅ CORS (production + local)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://your-frontend.vercel.app"
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
app.use("/api/potato/update", pinLimiter);
app.use("/api/potato/admin/create", pinLimiter);


// ✅ MongoDB connection
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB Error:", err);
  });


// ✅ Admin create potato
app.post("/api/potato/admin/create", async (req, res) => {
  try {
    const { admin_key } = req.body;

    if (!process.env.ADMIN_KEY || admin_key !== process.env.ADMIN_KEY) {
      return res.status(401).json({ error: "Unauthorized" });
    }

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