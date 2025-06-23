import createProjectDialog from '../dialog/project-dialog.js'
import createTodoDialog from '../dialog/dialog.js'
import createProject from '../project/projectFactory.js'
import folderImg from '../images/folder-file-svgrepo-com.svg'
import timeSvg from './images/alarm-clock-svgrepo-com.svg'
import './app-manager.css'

let allApplicationTasks = []
let allProjectsAndTaskCategories = []
let activeProject = null

const todayProject = createProject('Today')
todayProject.getTasks = () => {
  const today = new Date().toISOString().slice(0, 10)
  return allApplicationTasks.filter(
    (task) => !task.completed && task.dueDate === today,
  )
}

const scheduledProject = createProject('Scheduled')
scheduledProject.getTasks = () => {
  const today = new Date().toISOString().slice(0, 10)
  return allApplicationTasks.filter(
    (task) => !task.completed && task.dueDate > today,
  )
}

const overdueProject = createProject('Overdue')
overdueProject.getTasks = () => {
  const today = new Date().toISOString().slice(0, 10)
  return allApplicationTasks.filter(
    (task) => !task.completed && task.dueDate < today,
  )
}

const allTasksProject = createProject('All Tasks')
allTasksProject.getTasks = () => allApplicationTasks

const groceryProject = createProject('Grocery')
const educationalProject = createProject('Educational')
const personalNotesProject = createProject('Personal Notes')

let projectList
let taskList
let mainContent
let addTaskBtn

activeProject = groceryProject

const todoDialog = createTodoDialog((taskDataFromDialog) => {
  if (!activeProject) {
    alert('Please select a project first before adding a task.')
    return
  }

  if (
    [todayProject, scheduledProject, overdueProject, allTasksProject].includes(
      activeProject,
    )
  ) {
    alert(
      'You cannot add tasks directly to "Today", "Scheduled", "Overdue", or "All Tasks" categories. Please select a custom project or create a new one to add tasks.',
    )
    return
  }

  const newTaskId =
    Date.now().toString() + Math.random().toString(36).substring(2, 9)
  const newTask = {
    id: newTaskId,
    ...taskDataFromDialog,
    completed: false,
    projectTitle: activeProject.title,
  }

  allApplicationTasks.push(newTask)
  activeProject.addTask(newTask)
  saveAllData()

  renderTasks()
  updateProjectTaskCounts()
})

const projectDialog = createProjectDialog((title) => {
  if (
    allProjectsAndTaskCategories.some(
      (p) => p.title.toLowerCase() === title.toLowerCase(),
    )
  ) {
    alert(`A project with the title "${title}" already exists!`)
    return
  }

  const newProject = createProject(title)
  allProjectsAndTaskCategories.push(newProject)
  saveAllData()

  renderSidebarItems()
  updateProjectTaskCounts()
  setActiveProjectAndRender(newProject, null)
})

function loadAllData() {
  try {
    const storedTasks = localStorage.getItem('allApplicationTasks')
    if (storedTasks) {
      allApplicationTasks = JSON.parse(storedTasks)
      allApplicationTasks = allApplicationTasks.map((task) => ({
        ...task,
        completed: task.completed !== undefined ? task.completed : false,
        id:
          task.id ||
          Date.now().toString() + Math.random().toString(36).substring(2, 9),
        projectTitle: task.projectTitle || 'Unassigned',
      }))
    } else {
      allApplicationTasks = []
    }

    const storedProjectTitles = localStorage.getItem(
      'allProjectsAndTaskCategories',
    )
    const loadedProjectTitles = storedProjectTitles
      ? JSON.parse(storedProjectTitles)
      : []

    allProjectsAndTaskCategories = [
      todayProject,
      scheduledProject,
      overdueProject,
      allTasksProject,
      groceryProject,
      educationalProject,
      personalNotesProject,
    ]

    loadedProjectTitles.forEach((projData) => {
      const isAlreadyDefined = allProjectsAndTaskCategories.some(
        (p) => p.title === projData.title,
      )

      if (!isAlreadyDefined) {
        const newProject = createProject(projData.title)
        allProjectsAndTaskCategories.push(newProject)
      }
    })

    allProjectsAndTaskCategories.forEach((project) => {
      if (
        ![
          todayProject,
          scheduledProject,
          overdueProject,
          allTasksProject,
        ].includes(project)
      ) {
        if (project.getTasks().length > 0) {
          project.getTasks().length = 0
        }

        allApplicationTasks
          .filter((task) => task.projectTitle === project.title)
          .forEach((task) => project.addTask(task))
      }
    })

    const lastActiveProjectTitle = localStorage.getItem('activeProjectTitle')
    if (lastActiveProjectTitle) {
      activeProject = allProjectsAndTaskCategories.find(
        (p) => p.title === lastActiveProjectTitle,
      )
    }

    if (!activeProject) {
      activeProject = groceryProject
    }
  } catch (e) {
    console.error(
      'Error loading data from localStorage, resetting app state:',
      e,
    )
    // Fallback to initial default state if loading fails or data is corrupt
    allApplicationTasks = []
    allProjectsAndTaskCategories = [
      todayProject,
      scheduledProject,
      overdueProject,
      allTasksProject,
      groceryProject,
      educationalProject,
      personalNotesProject,
    ]
    activeProject = groceryProject
  }
}

function saveAllData() {
  localStorage.setItem(
    'allApplicationTasks',
    JSON.stringify(allApplicationTasks),
  )

  // I'm avoiding saving task objects multiple times or creating circular references.
  const projectsToSave = allProjectsAndTaskCategories.map((p) => ({
    title: p.title,
  }))
  localStorage.setItem(
    'allProjectsAndTaskCategories',
    JSON.stringify(projectsToSave),
  )

  localStorage.setItem(
    'activeProjectTitle',
    activeProject ? activeProject.title : '',
  )
}

function setupSidebar(
  todayDiv,
  scheduledDiv,
  overdueDiv,
  allDiv,
  groceryDiv,
  addProjectBtnElement,
  addTaskBtnElement,
  projectListElement,
  mainContentElement,
) {
  projectList = projectListElement
  taskList = document.createElement('ul')
  taskList.id = 'task-list'
  mainContent = mainContentElement
  addTaskBtn = addTaskBtnElement

  mainContent.appendChild(taskList)
  mainContent.appendChild(addTaskBtn)

  todayDiv.addEventListener('click', () =>
    setActiveProjectAndRender(todayProject, todayDiv),
  )
  scheduledDiv.addEventListener('click', () =>
    setActiveProjectAndRender(scheduledProject, scheduledDiv),
  )
  overdueDiv.addEventListener('click', () =>
    setActiveProjectAndRender(overdueProject, overdueDiv),
  )
  allDiv.addEventListener('click', () =>
    setActiveProjectAndRender(allTasksProject, allDiv),
  )

  groceryDiv.addEventListener('click', () =>
    setActiveProjectAndRender(groceryProject, groceryDiv),
  )

  document
    .querySelector('.educational')
    .addEventListener('click', () =>
      setActiveProjectAndRender(
        educationalProject,
        document.querySelector('.educational'),
      ),
    )
  document
    .querySelector('.personal-notes')
    .addEventListener('click', () =>
      setActiveProjectAndRender(
        personalNotesProject,
        document.querySelector('.personal-notes'),
      ),
    )

  addProjectBtnElement.addEventListener('click', () =>
    projectDialog.showModal(),
  )

  addTaskBtn.addEventListener('click', () => {
    if (
      [
        todayProject,
        scheduledProject,
        overdueProject,
        allTasksProject,
      ].includes(activeProject)
    ) {
      alert(
        'You cannot add tasks directly to "Today", "Scheduled", "Overdue", or "All Tasks" categories. Please select a custom project or create a new one to add tasks.',
      )
      return
    }
    todoDialog.showModal()
  })

  loadAllData()
  renderSidebarItems()
  updateProjectTaskCounts()

  let activeElement = null
  if (activeProject === todayProject) activeElement = todayDiv
  else if (activeProject === scheduledProject) activeElement = scheduledDiv
  else if (activeProject === overdueProject) activeElement = overdueDiv
  else if (activeProject === allTasksProject) activeElement = allDiv
  else if (activeProject === groceryProject) activeElement = groceryDiv
  else if (activeProject === educationalProject)
    activeElement = document.querySelector('.educational')
  else if (activeProject === personalNotesProject)
    activeElement = document.querySelector('.personal-notes')
  else {
    activeElement = projectList
      .querySelector(
        `.dynamic-project p:first-of-type[textContent="${activeProject.title}"]`,
      )
      ?.closest('.dynamic-project')
  }

  if (activeElement) {
    setActiveProjectAndRender(activeProject, activeElement)
  } else {
    console.warn(
      'Last active project HTML element not found, defaulting to Grocery.',
    )
    setActiveProjectAndRender(groceryProject, groceryDiv)
  }
}

function renderSidebarItems() {
  document.querySelectorAll('.dynamic-project').forEach((el) => el.remove())

  const staticHtmlProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
    groceryProject,
    educationalProject,
    personalNotesProject,
  ]

  const dynamicProjects = allProjectsAndTaskCategories.filter(
    (p) => !staticHtmlProjects.includes(p),
  )

  const addProjectBtn = projectList.querySelector('.add-project')

  dynamicProjects.forEach((project) => {
    const btn = document.createElement('div')
    btn.className = 'dynamic-project'

    if (project === activeProject) {
      btn.classList.add('active')
    }

    const img = document.createElement('img')
    img.src = folderImg
    img.alt = 'folder svg'
    img.width = 25
    img.height = 25

    const titleP = document.createElement('p')
    titleP.textContent = project.title

    const numberP = document.createElement('p')
    numberP.className = 'number'
    numberP.textContent = project
      .getTasks()
      .filter((task) => !task.completed).length

    btn.appendChild(img)
    btn.appendChild(titleP)
    btn.appendChild(numberP)

    btn.addEventListener('click', () => {
      setActiveProjectAndRender(project, btn)
    })

    projectList.insertBefore(btn, addProjectBtn)
  })
}

function setActiveProjectAndRender(projectObj, htmlElement) {
  document
    .querySelectorAll(
      'div.task.test > div.active, div.projects.test > div.active, .dynamic-project.active',
    )
    .forEach((el) => el.classList.remove('active'))

  activeProject = projectObj
  console.log(activeProject)

  if (htmlElement) {
    htmlElement.classList.add('active')
  } else {
    let elementToActivate = null
    if (activeProject === todayProject)
      elementToActivate = document.querySelector('.today')
    else if (activeProject === scheduledProject)
      elementToActivate = document.querySelector('.schedule')
    else if (activeProject === overdueProject)
      elementToActivate = document.querySelector('.overdue')
    else if (activeProject === allTasksProject)
      elementToActivate = document.querySelector('.all')
    else if (activeProject === groceryProject)
      elementToActivate = document.querySelector('.grocery')
    else if (activeProject === educationalProject)
      elementToActivate = document.querySelector('.educational')
    else if (activeProject === personalNotesProject)
      elementToActivate = document.querySelector('.personal-notes')
    else {
      elementToActivate = projectList
        .querySelector(
          `.dynamic-project p:first-of-type[textContent="${activeProject.title}"]`,
        )
        ?.closest('.dynamic-project')
    }
    if (elementToActivate) {
      elementToActivate.classList.add('active')
    }
  }

  const restrictedProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
  ]
  if (restrictedProjects.includes(activeProject)) {
    addTaskBtn.style.display = 'none'
  } else {
    addTaskBtn.style.display = 'block'
  }

  renderTasks()
  saveAllData()
}

function updateProjectTaskCounts() {
  const todayNumberElem = document.querySelector('.today .number')
  if (todayNumberElem) {
    todayNumberElem.textContent = todayProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  const scheduledNumberElem = document.querySelector('.schedule .number')
  if (scheduledNumberElem) {
    scheduledNumberElem.textContent = scheduledProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  const overdueNumberElem = document.querySelector('.overdue .number')
  if (overdueNumberElem) {
    overdueNumberElem.textContent = overdueProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  const allNumberElem = document.querySelector('.all .number')
  if (allNumberElem) {
    allNumberElem.textContent = allTasksProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  const groceryNumberElem = document.querySelector('.grocery .number')
  if (groceryNumberElem) {
    groceryNumberElem.textContent = groceryProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  const educationalNumberElem = document.querySelector('.educational .number')
  if (educationalNumberElem) {
    educationalNumberElem.textContent = educationalProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  const personalNotesNumberElem = document.querySelector(
    '.personal-notes .number',
  )
  if (personalNotesNumberElem) {
    personalNotesNumberElem.textContent = personalNotesProject
      .getTasks()
      .filter((task) => !task.completed).length
  }

  document.querySelectorAll('.dynamic-project').forEach((dynamicDiv) => {
    const title = dynamicDiv.querySelector('p:first-of-type').textContent
    const project = allProjectsAndTaskCategories.find((p) => p.title === title)
    if (project) {
      const numberElem = dynamicDiv.querySelector('.number')
      if (numberElem) {
        numberElem.textContent = project
          .getTasks()
          .filter((task) => !task.completed).length
      }
    }
  })
}

function getRandomGradient() {
  const angle = Math.floor(Math.random() * 360)
  const color1 = `hsl(${Math.floor(Math.random() * 200)}, 70%, 70%)`
  const color2 = `hsl(${Math.floor(Math.random() * 200)}, 70%, 70%)`
  return `linear-gradient(${angle}deg, ${color1}, ${color2})`
}

function renderTasks() {
  taskList.innerHTML = ''
  if (!activeProject) {
    const noProjectMessage = document.createElement('p')
    noProjectMessage.textContent = 'Please select a project to view tasks.'
    taskList.appendChild(noProjectMessage)
    return
  }

  const tasksToDisplay = activeProject.getTasks()

  if (tasksToDisplay.length === 0) {
    const noTasksMessage = document.createElement('p')
    noTasksMessage.classList.add('no-tasks-message')
    if (
      activeProject === todayProject ||
      activeProject === scheduledProject ||
      activeProject === overdueProject
    ) {
      noTasksMessage.textContent = `You have no tasks "${activeProject.title}".`
    } else {
      noTasksMessage.textContent = `You have no tasks in "${activeProject.title}".`
    }
    taskList.appendChild(noTasksMessage)
  } else {
    const tasksHeading = document.createElement('p')
    tasksHeading.classList.add('tasks-heading')
    tasksHeading.textContent = `${activeProject.title}`
    taskList.appendChild(tasksHeading)

    tasksToDisplay.forEach((task) => {
      const descriptionContent = task.description
      const maxLength = 40

      const li = document.createElement('li')
      li.classList.add('task-item')
      li.style.backgroundImage = getRandomGradient()

      const taskCheckboxWrapper = document.createElement('div')
      taskCheckboxWrapper.classList.add('task-checkbox-wrapper')

      const checkboxLabel = document.createElement('label')
      checkboxLabel.classList.add('custom-checkbox-label')

      const customCheckboxDisplay = document.createElement('span')
      customCheckboxDisplay.classList.add('custom-checkbox-display')

      const checkbox = document.createElement('input')
      checkbox.type = 'checkbox'
      checkbox.classList.add('task-checkbox')
      checkbox.id = `task-${task.id}`
      checkbox.checked = task.completed

      checkbox.addEventListener('change', (event) => {
        const isChecked = event.target.checked
        const taskIndex = allApplicationTasks.findIndex((t) => t.id === task.id)
        if (taskIndex !== -1) {
          allApplicationTasks[taskIndex].completed = isChecked
        }

        if (isChecked) {
          li.classList.add('completed')
        } else {
          li.classList.remove('completed')
        }

        saveAllData()
        updateProjectTaskCounts()
        renderTasks()
      })

      checkboxLabel.appendChild(checkbox)
      checkboxLabel.appendChild(customCheckboxDisplay)

      taskCheckboxWrapper.appendChild(checkboxLabel)

      const taskBody = document.createElement('div')
      taskBody.classList.add('task-body')

      taskBody.addEventListener('click', () => {
        console.log('Task body clicked for:', task.title, task)
        if (typeof showTaskDetailsModal === 'function') {
          showTaskDetailsModal(task)
        } else {
          console.error('showTaskDetailsModal is not defined.')
        }
      })

      const taskDetailsContainer = document.createElement('div')
      taskDetailsContainer.classList.add('task-details')

      const firstPara = document.createElement('p')
      firstPara.classList.add('first-para')

      const titleSpan = document.createElement('span')
      titleSpan.textContent = task.title

      const timePillSpan = document.createElement('span')
      timePillSpan.classList.add('time-pill')

      const timeImage = document.createElement('img')
      timeImage.src = timeSvg
      timeImage.alt = 'time svg'
      timeImage.width = 15
      timeImage.height = 15

      const timeTextSpan = document.createElement('span')
      timeTextSpan.textContent = formatTime(task.dueTime)

      timePillSpan.appendChild(timeImage)
      timePillSpan.appendChild(timeTextSpan)

      const secondPara = document.createElement('p')
      secondPara.classList.add('second-para')

      const descriptionSpan = document.createElement('span')
      const datePillSpan = document.createElement('span')
      datePillSpan.classList.add('date-pill')
      datePillSpan.textContent = formatDate(task.dueDate)

      if (descriptionContent && descriptionContent.length > maxLength) {
        descriptionSpan.textContent =
          descriptionContent.substring(0, maxLength) + '...'
      } else {
        descriptionSpan.textContent = descriptionContent || ''
      }

      firstPara.appendChild(titleSpan)
      firstPara.appendChild(descriptionSpan)

      secondPara.appendChild(timePillSpan)
      secondPara.appendChild(datePillSpan)

      taskDetailsContainer.appendChild(firstPara)
      taskDetailsContainer.appendChild(secondPara)

      taskBody.appendChild(taskDetailsContainer)

      li.appendChild(taskCheckboxWrapper)
      li.appendChild(taskBody)

      if (task.completed) {
        li.classList.add('completed')
      }

      taskList.appendChild(li)
    })
  }
}

export function initApp(
  todayDiv,
  scheduledDiv,
  overdueDiv,
  allDiv,
  groceryDiv,
  addProjectBtnElement,
  addTaskBtnElement,
  projectListElement,
  mainContentElement,
) {
  setupSidebar(
    todayDiv,
    scheduledDiv,
    overdueDiv,
    allDiv,
    groceryDiv,
    addProjectBtnElement,
    addTaskBtnElement,
    projectListElement,
    mainContentElement,
  )
}

function formatTime(timeString) {
  if (!timeString) return ''

  const dummyDate = new Date()
  const [hours, minutes] = timeString.split(':').map(Number)
  dummyDate.setHours(hours, minutes, 0, 0)
  const optionsTime = { hour: 'numeric', minute: 'numeric', hour12: true }
  return dummyDate.toLocaleTimeString('en-US', optionsTime)
}

function formatDate(dateString) {
  if (!dateString) return ''
  const date = new Date(dateString + 'T00:00:00')
  const optionsDate = { weekday: 'short', day: 'numeric', month: 'short' }
  return date.toLocaleDateString('en-US', optionsDate)
}
