const { MongoClient, ObjectId } = require('mongodb')

const mongoUri = 'mongodb+srv://parizaa:TpuZ6ZAtN8Xqh1N2@pomodoro-ext.szaof.mongodb.net/?retryWrites=true&w=majority'
let db

module.exports = async (req, res) => {
if (!db){
    const client = await MongoClient.connect(mongoUri, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    db = client.db('pomodoro')
    console.log('Connected to MongoDB Atlas')
}

if (req.method === 'GET'){
    try{
        const tasks = await db.collection('tasks').find().toArray()
        res.status(200).json(tasks)
    } 
    catch (err){
      console.error('Error fetching tasks:', err)
      res.status(500).send('Error fetching tasks')
    }
}

if (req.method === 'POST') {
    try{
        const newTask = req.body
        const result = await db.collection('tasks').insertOne(newTask)
        res.status(201).json(result.ops[0])
    } 
    catch (err){
        console.error('Error adding task:', err)
        res.status(500).send('Error adding task')
    }
}

if (req.method === 'PUT'){
    const { id } = req.query
    try{
        const updatedTask = req.body
        const result = await db.collection('tasks').updateOne(
            { _id: new ObjectId(id) },
            { $set: updatedTask }
        )
        if (result.matchedCount === 0) {
            return res.status(404).send('Task not found')
        }
        res.status(200).send('Task updated')
    } 
    catch (err){
      console.error('Error updating task:', err)
      res.status(500).send('Error updating task')
    }
}

if (req.method === 'DELETE'){
    const { id } = req.query
    try{
        const result = await db.collection('tasks').deleteOne({ _id: new ObjectId(id) })
        if (result.deletedCount === 0) {
            return res.status(404).send('Task not found')
        }
        res.status(200).send('Task deleted')
        } 
    catch (err){
        console.error('Error deleting task:', err)
        res.status(500).send('Error deleting task')
    }
  }
}