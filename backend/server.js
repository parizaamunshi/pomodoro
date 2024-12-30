const express = require('express')
const {MongoClient, ObjectId} = require('mongodb')
const cors = require('cors')
const app = express()
const port = 3000
app.use(cors())
app.use(express.json())

const url = 'mongodb://localhost:27017'
const dbName = 'pomodoro'
let db;

MongoClient.connect(url, {useNewUrlParser: true, useUnifiedTopology: true}, (err, client) => {
    if (err){
        console.error('Failed to connect to the database:', err)
        throw err
    }
    db = client.db(dbName);
    console.log(`Connected to database: ${dbName}`)
})

app.get('/tasks', async (req, res) => {
    try{
        const tasks = await db.collection('tasks').find().toArray()
        res.json(tasks)
    } 
    catch (err){
      console.error('Failed to fetch tasks:', err)
      res.status(500).send('Error fetching tasks')
    }
})
  
app.post('/tasks', async (req, res) => {
    try{
        const newTask = req.body
        const result = await db.collection('tasks').insertOne(newTask)
        res.json(result.ops[0])
    } 
    catch (err){
        console.error('Failed to add task:', err)
        res.status(500).send('Error adding task')
    }
})

app.put('/tasks/:id', async (req, res) => {
    try{
        const id = req.params.id
        const updatedTask = req.body
        await db.collection('tasks').updateOne({_id: new ObjectId(id)}, {$set: updatedTask})
        res.send('Task updated');
    } 
    catch (err){
        console.error('Failed to update task:', err)
        res.status(500).send('Error updating task')
    }
})
  
app.delete('/tasks/:id', async (req, res) => {
    try{
        const id = req.params.id
        await db.collection('tasks').deleteOne({_id: new ObjectId(id)})
        res.json({message: 'Task deleted'})
    } 
    catch (err){
        console.error('Failed to delete task:', err)
        res.status(500).send('Error deleting task')
    }
})
  
app.listen(port, () => {   
    console.log(`Server running at http://localhost:${port}`)
})