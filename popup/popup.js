//TIMER SECTION
document.addEventListener('DOMContentLoaded', () => {
function updateTime(){
    chrome.storage.local.get(["timer", "timeOption"], (res) => {
        const time = document.getElementById("time")
        const minutes = `${res.timeOption - Math.ceil(res.timer/60)}`.padStart(2, "0")
        let seconds = "00"
        if (res.timer % 60 != 0){
            seconds = `${60 - res.timer % 60}`.padStart(2, "0")
        }
        time.textContent = `${minutes}:${seconds}`
    })
}

updateTime()
setInterval(updateTime, 1000)

const startTimerBtn = document.getElementById("start-timer-btn")
startTimerBtn.addEventListener("click", () => {
    chrome.storage.local.get(["isRunning"], (res) => {
        chrome.storage.local.set({
            isRunning : !res.isRunning,
        }, () => {
            startTimerBtn.textContent = !res.isRunning ? "Pause Timer" : "Start Timer"
            if (!res.isRunning) {
                startTimerBtn.style.backgroundColor = "#ff6f61"
            } else {
                startTimerBtn.style.backgroundColor = "#4CAF50";
            }
        })
    })
})

const resetTimerBtn = document.getElementById("reset-timer-btn")
resetTimerBtn.addEventListener("click", () => {
    chrome.storage.local.set({
        timer : 0,
        isRunning : false,
    }, () => {
        startTimerBtn.textContent = "Start Timer"
    })
})
});

//TASK SECTION
document.addEventListener('DOMContentLoaded', () => {
let tasks = []
async function fetchTasks() {
    try {
        const response = await fetch('https://pomodoro-7anm61hf4-parizaas-projects.vercel.app', {
            method: 'GET',
            headers:{'Content-Type': 'application/json'}
        });
        if (!response.ok){
            throw new Error(`HTTP error! status: ${response.status}`)
        }
        tasks = await response.json()
        renderAll()
    } 
    catch (error){
        console.error('Failed to fetch tasks:', error)
    }
}
async function saveTask(task) {
    try{
        const response = await fetch('https://pomodoro-7anm61hf4-parizaas-projects.vercel.app',{
            method: 'POST',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(task)
        })
        if (!response.ok){
            const errorText = await response.text();
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
        }
        const newTask = await response.json()
        tasks.push(newTask)
        renderAll()
    }
    catch (error) {
        console.error('Failed to save task:', error);
    }
}
async function deleteTask(taskId) {
    try {
        const response = await fetch(`https://pomodoro-7anm61hf4-parizaas-projects.vercel.app/${taskId}`,{
            method:'DELETE'
        })
        if (!response.ok){
            const errorText = await response.text()
            throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
        }
        tasks = tasks.filter(task => task._id !== taskId)
        renderAll()
    } 
    catch (error) {
        console.error('Failed to delete task:', error)
    }
}
function renderTask(task) {
    const taskRow = document.createElement('div');
    const text = document.createElement('input');
    text.type = 'text';
    text.placeholder = 'Enter a task';
    text.value = task.text;
    text.addEventListener('change', async() => {
        task.text = text.value;
        try {
            const response = await fetch(`https://pomodoro-7anm61hf4-parizaas-projects.vercel.app/${task._id}`,{
                method: 'PUT',
                headers: {'Content-Type': 'application/json'},
                body: JSON.stringify(task)
            })
            if (!response.ok) {
                const errorText = await response.text()
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`)
            }
        } 
        catch (error) {
            console.error('Failed to update task:', error)
        }
    });
    const deleteBtn = document.createElement('input')
    deleteBtn.type = 'button'
    deleteBtn.value = 'x'
    deleteBtn.addEventListener('click', () => {
        deleteTask(task._id);
    })
    taskRow.appendChild(text)
    taskRow.appendChild(deleteBtn)
  
    const taskContainer = document.getElementById('task-container')
    taskContainer.appendChild(taskRow)
}
function addTask() {
    const newTask = {text:''}
    saveTask(newTask)
  }
function renderAll(){
    const taskContainer = document.getElementById("task-container")
    taskContainer.textContent = ""
    tasks.forEach(task => {
        renderTask(task)
    })
}
const addTaskBtn = document.getElementById('add-task-btn');
if (addTaskBtn){
    addTaskBtn.addEventListener('click', addTask)
}
fetchTasks()
})