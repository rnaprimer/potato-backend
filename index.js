const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { nanoid } = require("nanoid");

const Potato = require("./models/Potato");

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

mongoose.connect(process.env.MONGO_URI)
 .then(() => console.log("MongoDB Connected"))
 .catch(err => console.log(err));


 app.post("/api/potato/create", async (req, res) => {
    try {
      const id = nanoid(8);
      const pin = Math.floor(1000 + Math.random() * 9000).toString();
  
      const potato = new Potato({ id, pin });
      await potato.save();
  
      res.json({ id, pin });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/potato/:id", async (req, res) => {
    try {
      const potato = await Potato.findOne({ id: req.params.id });
  
      if (!potato) {
        return res.status(404).json({ message: "Not found" });
      }
  
      res.json({ message: potato.message });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.get("/api/potato/pin/:pin", async (req, res) => {
    try {
      const potato = await Potato.findOne({ pin: req.params.pin });
  
      if (!potato) {
        return res.status(404).json({ message: "Invalid PIN" });
      }
  
      res.json(potato);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post("/api/potato/update-by-pin", async (req, res) => {
    try {
      const { pin, message } = req.body;
  
      const potato = await Potato.findOneAndUpdate(
        { pin },
        { message },
        { new: true }
      );
  
      if (!potato) {
        return res.status(404).json({ message: "Invalid PIN" });
      }
  
      res.json({ success: true, data: potato });
  
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});