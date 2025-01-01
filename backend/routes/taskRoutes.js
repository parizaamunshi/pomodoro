const express = require("express")
const Task = require("../models/Task")
const router = express.Router()

router.get("/", async (req, res) => {
    try{
        const tasks = await Task.find()
        res.json(tasks)
    } 
    catch (err){
        res.status(500).json({ error: "Failed to fetch tasks" })
    }
})

router.post("/", async (req, res) => {
    const { text } = req.body
    try{
        const newTask = new Task({ text })
        await newTask.save()
        res.status(201).json(newTask)
    } 
    catch (err){
        res.status(400).json({ error: "Failed to add task" })
    }
})

router.put("/:id", async (req, res) => {
    const {id} = req.params
    const updates = req.body
    try{
        const updatedTask = await Task.findByIdAndUpdate(id, updates, {new: true})
        res.json(updatedTask)
    } 
    catch (err){
        res.status(400).json({ error: "Failed to update task" })
    }
})

router.delete("/:id", async (req, res) => {
    const {id} = req.params
    try{
        await Task.findByIdAndDelete(id)
        res.json({ message: "Task deleted" })
    }
    catch (err){
        res.status(400).json({error: "Failed to delete task"})
    }
})

module.exports = router