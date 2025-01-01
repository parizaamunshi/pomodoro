const BASE_URL = "http://localhost:5000/api/tasks"

//TIMER SECTION
document.addEventListener("DOMContentLoaded", () => {
    chrome.storage.local.get(["timer", "timeOption", "isRunning"], (res) => {
        if (!res.timer) chrome.storage.local.set({ timer: 0 });
        if (!res.timeOption) chrome.storage.local.set({ timeOption: 25 });
        if (!res.isRunning) chrome.storage.local.set({ isRunning: false });
    });
    function updateTime(){
        chrome.storage.local.get(["timer", "timeOption"], (res) => {
        const time = document.getElementById("time");
        if (time){
            const minutes = `${res.timeOption - Math.ceil(res.timer/60)}`.padStart(2, "0");
            let seconds = "00";
            if (res.timer%60 !== 0){
                seconds = `${60 - (res.timer%60)}`.padStart(2, "0");
            }
            time.textContent = `${minutes}:${seconds}`;
        }
        });
    }
    updateTime();
    setInterval(updateTime, 1000);

    const startTimerBtn = document.getElementById("start-timer-btn");
    if (startTimerBtn) {
        startTimerBtn.addEventListener("click", () => {
        chrome.storage.local.get(["isRunning"], (res) => {
            chrome.storage.local.set({
                isRunning: !res.isRunning,
            },() => {
                startTimerBtn.textContent = !res.isRunning ? "Pause Timer" : "Start Timer";
                startTimerBtn.style.backgroundColor = !res.isRunning ? "#ff6f61" : "#4CAF50";
            });
        });
        });
    }
    const resetTimerBtn = document.getElementById("reset-timer-btn");
    if (resetTimerBtn){
        resetTimerBtn.addEventListener("click", () => {
        chrome.storage.local.set({
            timer: 0,
            isRunning: false,
            },() => {
                startTimerBtn.textContent = "Start Timer"
            });
        });
    }
});

// TASK SECTION
document.addEventListener("DOMContentLoaded", () => {
    let tasks = [];

    async function fetchTasks(){
        try{
            const response = await fetch(BASE_URL, {
                method: "GET",
                headers: { "Content-Type": "application/json" },
            });
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            tasks = await response.json();
            renderAll();
        } 
        catch (error){
            console.error("Failed to fetch tasks:", error);
        }
    }
    async function saveTask(task){
        try{
            const response = await fetch(BASE_URL, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(task),
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            const newTask = await response.json();
            tasks.push(newTask);
            renderAll();
        } 
        catch (error){
            console.error("Failed to save task:", error);
        }
    }
    async function deleteTaskFromDatabase(task) {
        try{
            const response = await fetch('/delete-task', {
                method: 'DELETE',
                body: JSON.stringify({ task: task }),
                headers: { 'Content-Type': 'application/json' }
            });
            if (!response.ok){
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            console.log('Task deleted from database:', task);
        } 
        catch (error){
            console.error('Error deleting task:', error);
        }
    }

    async function deleteTask(taskId) {
        try{
            const response = await fetch(`${BASE_URL}/${taskId}`, { method: "DELETE" });
            if (!response.ok){
                const errorText = await response.text();
                throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
            }
            tasks = tasks.filter((task) => task._id !== taskId);
            renderAll();
        } 
        catch (error){
            console.error("Failed to delete task:", error);
        }
    }
    function renderTask(task) {
        const taskRow = document.createElement("div");
        const text = document.createElement("input");
        text.type = "text";
        text.placeholder = "Enter a task";
        text.value = task.text;
        text.addEventListener("change", async () => {
            const updatedText = text.value.trim();
            if (updatedText) {
                task.text = updatedText;
                try{
                    const response = await fetch(`${BASE_URL}/${task._id}`, {
                        method: "PUT",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify(task),
                    });
                    if (!response.ok){
                        const errorText = await response.text();
                        throw new Error(`HTTP error! status: ${response.status}, message: ${errorText}`);
                    }
                } 
                catch (error){
                    console.error("Failed to update task:", error);
                }
            } 
            else{
                alert("Task cannot be empty!");
            }
        });
    }
    function renderAll() {
        const taskContainer = document.getElementById("task-container");
        if (taskContainer){
            taskContainer.innerHTML = ""; 
            tasks.forEach(renderTask);
        }
    }
    document.getElementById('add-task-btn').addEventListener('click', function() {
        const taskInput = document.createElement('input');
        taskInput.type = 'text';
        taskInput.classList.add('input');
        taskInput.placeholder = 'Enter task...';
        
        const saveBtn = document.createElement('button');
        saveBtn.innerText = 'Save';
        saveBtn.classList.add('save-btn');

        const deleteBtn = document.createElement('button');
        deleteBtn.innerText = 'X';
        deleteBtn.classList.add('delete-btn');
        deleteBtn.addEventListener('click', function(){
            deleteTask(task._id);
        });

        const taskContainer = document.getElementById('task-container');
        taskContainer.appendChild(taskInput);
        taskContainer.appendChild(saveBtn);
        taskContainer.appendChild(deleteBtn);
        
        saveBtn.addEventListener('click', function() {  
            const taskText = taskInput.value.trim();
            if (taskText){
                addTaskToDatabase(taskText);
            }  
            else {
                alert('Cannot save an empty task');
            }
        });
        deleteBtn.addEventListener('click', function() {
            taskContainer.removeChild(taskInput);   
            taskContainer.removeChild(deleteBtn);
            taskContainer.removeChild(saveBtn);
            deleteTaskFromDatabase(task);
        });
    });

    function addTaskToDatabase(task) {
        fetch('/add-task', {
            method: 'POST',
            body: JSON.stringify({ task: task }),
            headers: { 'Content-Type': 'application/json' }
        }).then(response => response.json()).then(data => {
            console.log('Task added to database:', data);
            tasks.push(data);
            renderAll();
        }).catch(error => console.error('Error adding task:', error));
    }
    fetchTasks();
});
