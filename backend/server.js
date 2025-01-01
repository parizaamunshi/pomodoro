const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(bodyParser.json());

mongoose.connect("mongodb://localhost:27017/pomodoro", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
}).then(() => {
    console.log("Connected to MongoDB");
}).catch((err) => {
    console.error("Error connecting to MongoDB:", err);
});
const taskSchema = new mongoose.Schema({
    text: String,
});

const Task = mongoose.model("Task", taskSchema);
app.get("/tasks", async (req, res) => {
    try {
        const tasks = await Task.find();
        res.json(tasks);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.post("/tasks", async (req, res) => {
    try {
        const newTask = new Task({ text: req.body.text });
        await newTask.save();
        res.json(newTask);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
app.delete("/tasks/:id", async (req, res) => {
    try {
        const task = await Task.findByIdAndDelete(req.params.id);
        if (!task) return res.status(404).send("Task not found");
        res.json(task);
    } catch (err) {
        res.status(500).send(err.message);
    }
});
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});