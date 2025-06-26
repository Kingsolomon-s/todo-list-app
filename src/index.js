import { initApp } from './manager/app-manager.js'
import './style.css'

const toggleButton = document.getElementById('hamburger')
const sideBar = document.getElementById('sidebar-container')
const overlay = document.querySelector('.overlay')

toggleButton.addEventListener('click', toggleSidebar)

function toggleSidebar() {
  sideBar.classList.toggle('close')
  if (sideBar.classList.contains('close')) {
    overlay.classList.remove('active')
    sideBar.classList.add('hidden-children')
    toggleButton.classList.remove('open')
    toggleButton.classList.add('close')
  } else {
    toggleButton.classList.add('open')
    toggleButton.classList.remove('close')
    setTimeout(() => {
      overlay.classList.add('active')
      sideBar.classList.remove('hidden-children')
    }, 200)
  }
}

overlay.addEventListener('click', () => {
  toggleButton.classList.remove('open')
  toggleButton.classList.add('close')
  sideBar.classList.add('close')
  sideBar.classList.add('hidden-children')
  overlay.classList.remove('active')
})

const todayDiv = document.querySelector('.today')
const scheduledDiv = document.querySelector('.schedule')
const overdueDiv = document.querySelector('.overdue')
const allDiv = document.querySelector('.all')
const groceryDiv = document.querySelector('.grocery')
const addProjectBtn = document.querySelector('.add-project')
const addTaskBtn = document.createElement('button')
addTaskBtn.classList.add('add-task-btn')
addTaskBtn.textContent = '+ Add Task'
const projectList = document.querySelector('.projects')
const mainContent = document.querySelector('.main-content')

initApp(
  todayDiv,
  scheduledDiv,
  overdueDiv,
  allDiv,
  groceryDiv,
  addProjectBtn,
  addTaskBtn,
  projectList,
  mainContent,
)
