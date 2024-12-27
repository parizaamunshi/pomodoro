let tasks = []

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

const addTaskBtn=document.getElementById("add-task-btn")
addTaskBtn.addEventListener("click", () => addTask())

chrome.storage.sync.get(["tasks"], (res) => {
    tasks = res.tasks ? res.tasks : []
    renderAll()
})

function saveTask(){
    chrome.storage.sync.set({
        tasks,
    })
}
function renderTask(taskNum){
    const taskRow = document.createElement("div")
    const text = document.createElement("input")
    text.type = "text"
    text.placeholder = "Enter a task"
    text.value = tasks[taskNum] || ""
    text.addEventListener("change", () => {
        tasks[taskNum] = text.value
        saveTask()
    })
    const deleteBtn = document.createElement("input")
    deleteBtn.type = "button"
    deleteBtn.value = "x"
    deleteBtn.addEventListener("click", () => {
        deleteTask(taskNum)
    })
    taskRow.appendChild(text)
    taskRow.appendChild(deleteBtn)

    const taskContainer = document.getElementById("task-container")
    taskContainer.appendChild(taskRow)
}
function addTask(){
    const taskNum = tasks.length
    tasks.push("")
    renderTask(taskNum)
    saveTask()
}
function deleteTask(taskNum){
    tasks.splice(taskNum, 1)
    renderAll()
    saveTask()
}
function renderAll(){
    const taskContainer = document.getElementById("task-container")
    taskContainer.textContent = ""
    tasks.forEach((taskText, taskNum) => {
        renderTask(taskNum)
    })
}