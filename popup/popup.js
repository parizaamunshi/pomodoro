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

//SPOTIFY
require('dotenv').config();
const express = require('express');
const axios = require('axios');
const open = require('open');

const app = express();
const port = 3000;

// Spotify API credentials from .env file
const clientId = process.env.SPOTIFY_CLIENT_ID; // Your Spotify Client ID
const clientSecret = process.env.SPOTIFY_CLIENT_SECRET; // Your Spotify Client Secret
const redirectUri = 'http://localhost:3000/callback'; // Redirect URI

let accessToken = ''; // Will hold the Spotify access token

// Step 1: Log in to Spotify
app.get('/login', (req, res) => {
  const scopes = 'user-modify-playback-state user-read-playback-state';
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${clientId}&scope=${encodeURIComponent(
    scopes
  )}&redirect_uri=${encodeURIComponent(redirectUri)}`;
  res.redirect(authUrl);
});

// Step 2: Spotify Callback for Access Token
app.get('/callback', async (req, res) => {
  const code = req.query.code;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', null, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: Basic ${Buffer.from(${clientId}:${clientSecret}).toString('base64')},
      },
      params: {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      },
    });

    accessToken = response.data.access_token;
    res.send('Spotify authentication successful! You can now control playback.');
  } catch (error) {
    console.error('Error authenticating with Spotify:', error.response?.data || error.message);
    res.status(500).send('Authentication failed. Please try again.');
  }
});

// Step 3: Play Music
app.get('/play', async (req, res) => {
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    await axios.put(
      'https://api.spotify.com/v1/me/player/play',
      {
        uris: ['spotify:track:1cKHdTo9u0ZymJdPGSh6nq'], // Replace with your desired track URI
      },
      {
        headers: {
          Authorization: Bearer ${accessToken},
        },
      }
    );

    res.send('Music is playing on Spotify!');
  } catch (error) {
    console.error('Error playing music:', error.response?.data || error.message);
    res.status(500).send('Failed to play music. Ensure you have an active playback device.');
  }
});

// Step 4: Pause Music
app.get('/pause', async (req, res) => {
  if (!accessToken) {
    return res.redirect('/login');
  }

  try {
    await axios.put(
      'https://api.spotify.com/v1/me/player/pause',
      null,
      {
        headers: {
          Authorization: Bearer ${accessToken},
        },
      }
    );

    res.send('Music is paused on Spotify!');
  } catch (error) {
    console.error('Error pausing music:', error.response?.data || error.message);
    res.status(500).send('Failed to pause music.');
  }
});

// Start the server
app.listen(port, () => {
  console.log(Server running at http://localhost:${port});
  open(http://localhost:${port}/login); // Automatically open login URL
});
