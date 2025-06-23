import createProjectDialog from '../dialog/project-dialog.js'
import createTodoDialog from '../dialog/dialog.js'
import createProject from '../project/projectFactory.js'
import folderImg from '../images/folder-file-svgrepo-com.svg'
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
// Add your other static custom projects here if they should exist initially
const educationalProject = createProject('Educational')
const personalNotesProject = createProject('Personal Notes')

let projectList
let taskList
let mainContent
let addTaskBtn

// activeProject is initially set to groceryProject in your original code
// but will be overridden by localStorage load if a preference exists.

const todoDialog = createTodoDialog((taskDataFromDialog) => {
  // This check here is a fallback, but the button visibility is the primary control
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
    id: newTaskId, // Unique ID for the task
    ...taskDataFromDialog, // Spread all properties from dialog (title, description, dueDate, etc.)
    completed: false, // NEW TASKS ALWAYS START AS INCOMPLETE
    projectTitle: activeProject.title, // Link task to its project by title
  }

  allApplicationTasks.push(newTask)
  activeProject.addTask(newTask) // Add to the project's internal task list
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

    // Initialize allProjectsAndTaskCategories with static projects
    allProjectsAndTaskCategories = [
      todayProject,
      scheduledProject,
      overdueProject,
      allTasksProject,
      groceryProject, // Ensure grocery is always in the base list
      // Add other static projects here if they are always present, not dynamically added
      educationalProject,
      personalNotesProject,
    ]

    loadedProjectTitles.forEach((projData) => {
      // Check if this project title is already one of our hardcoded instances
      const isAlreadyDefined = allProjectsAndTaskCategories.some(
        (p) => p.title === projData.title,
      )

      if (!isAlreadyDefined) {
        const newProject = createProject(projData.title)
        allProjectsAndTaskCategories.push(newProject)
      }
    })

    allProjectsAndTaskCategories.forEach((project) => {
      // For custom projects (not static view filters), re-populate their internal task arrays
      if (
        ![
          todayProject,
          scheduledProject,
          overdueProject,
          allTasksProject,
        ].includes(project)
      ) {
        // Clear the internal array before re-adding, if getTasks returns the direct array
        // If getTasks returns a copy, you might need a `project.clearTasks()` method in projectFactory
        // Assuming `project.getTasks().length = 0` correctly clears the *internal* array from projectFactory
        if (project.getTasks().length > 0) {
          // Only clear if not already empty
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
    allApplicationTasks = []
    allProjectsAndTaskCategories = [
      todayProject,
      scheduledProject,
      overdueProject,
      allTasksProject,
      groceryProject,
      educationalProject, // Ensure they are here for fallback
      personalNotesProject, // Ensure they are here for fallback
    ]
    activeProject = groceryProject
  }
}

function saveAllData() {
  localStorage.setItem(
    'allApplicationTasks',
    JSON.stringify(allApplicationTasks),
  )

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

  // Add event listeners for static projects
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
  // Add event listeners for other hardcoded custom projects
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
    // This check is now here for a primary control, preventing modal from opening
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
      return // Prevent dialog from showing
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
    activeElement = document.querySelector('.educational') // Added
  else if (activeProject === personalNotesProject)
    activeElement = document.querySelector('.personal-notes') // Added
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

  // Ensure 'educational' and 'personal-notes' are treated as static if they exist in HTML
  // and are directly added to allProjectsAndTaskCategories
  const staticHtmlProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
    groceryProject,
    educationalProject, // Exclude from dynamic rendering if they are always hardcoded
    personalNotesProject, // Exclude from dynamic rendering if they are always hardcoded
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
  // Remove 'active' class from all previously active elements
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

  // --- NEW LOGIC: Control addTaskBtn visibility/clickability ---
  const restrictedProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
  ]
  if (restrictedProjects.includes(activeProject)) {
    addTaskBtn.style.display = 'none' // Hide the button
    // Optionally, if you prefer to just disable:
    // addTaskBtn.disabled = true;
    // addTaskBtn.classList.add('disabled-btn'); // Add a CSS class for styling
  } else {
    addTaskBtn.style.display = 'flex' // Or 'block', depending on your CSS display property for the button
    // Optionally, if you disabled it:
    // addTaskBtn.disabled = false;
    // addTaskBtn.classList.remove('disabled-btn');
  }
  // --- END NEW LOGIC ---

  renderTasks()
  saveAllData()
}

function updateProjectTaskCounts() {
  document.querySelector('.today .number').textContent = todayProject
    .getTasks()
    .filter((task) => !task.completed).length
  document.querySelector('.schedule .number').textContent = scheduledProject
    .getTasks()
    .filter((task) => !task.completed).length
  document.querySelector('.overdue .number').textContent = overdueProject
    .getTasks()
    .filter((task) => !task.completed).length
  // If "All Tasks" should count all tasks regardless of completion, remove the filter here:
  document.querySelector('.all .number').textContent =
    allTasksProject.getTasks().length
  // If it should only count incomplete:
  // document.querySelector('.all .number').textContent = allTasksProject.getTasks().filter((task) => !task.completed).length;

  document.querySelector('.grocery .number').textContent = groceryProject
    .getTasks()
    .filter((task) => !task.completed).length

  // Update counts for hardcoded 'Educational' and 'Personal Notes'
  document.querySelector('.educational .number').textContent =
    educationalProject.getTasks().filter((task) => !task.completed).length
  document.querySelector('.personal-notes .number').textContent =
    personalNotesProject.getTasks().filter((task) => !task.completed).length

  document.querySelectorAll('.dynamic-project').forEach((dynamicDiv) => {
    const title = dynamicDiv.querySelector('p:first-of-type').textContent
    const project = allProjectsAndTaskCategories.find((p) => p.title === title)
    if (project) {
      dynamicDiv.querySelector('.number').textContent = project
        .getTasks()
        .filter((task) => !task.completed).length
    }
  })
}

function renderTasks() {
  taskList.innerHTML = ''
  if (!activeProject) {
    const noProjectMessage = document.createElement('p')
    noProjectMessage.textContent = 'Please select a project to view tasks.'
    taskList.appendChild(noProjectMessage)
    return
  }

  let tasksToDisplay = activeProject.getTasks()

  // For static view projects (Today, Scheduled, Overdue), their getTasks already filters.
  // For 'All Tasks', it should show all (if that's your intention).
  // For custom projects (like Grocery, Educational, Personal Notes, and dynamic ones),
  // we filter to show only incomplete tasks for the main display.
  // If you want custom projects to show ALL their tasks (completed and incomplete), remove this filter.
  if (
    ![todayProject, scheduledProject, overdueProject, allTasksProject].includes(
      activeProject,
    )
  ) {
    tasksToDisplay = tasksToDisplay.filter((task) => !task.completed)
  }

  if (tasksToDisplay.length === 0) {
    const noTasksMessage = document.createElement('p')
    noTasksMessage.textContent = `No tasks in "${activeProject.title}".`
    taskList.appendChild(noTasksMessage)
  } else {
    tasksToDisplay.forEach((task) => {
      const descriptionContent = task.description
      const maxLength = 40

      const li = document.createElement('li')
      li.classList.add('task-item')

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
        renderTasks() // Re-render to reflect the change (e.g., if task moves out of Today/Scheduled)
      })

      const firstPara = document.createElement('p')
      firstPara.classList.add('first-para')
      const firstSpan = document.createElement('span')
      const secondSpan = document.createElement('span')

      const secondPara = document.createElement('p')
      secondPara.classList.add('second-para')
      const thirdSpan = document.createElement('span')
      const fourthSpan = document.createElement('span')

      firstSpan.textContent = task.title
      secondSpan.textContent = formatTime(task.dueTime)
      fourthSpan.textContent = formatDate(task.dueDate)

      if (descriptionContent && descriptionContent.length > maxLength) {
        const truncatedText = descriptionContent.substring(0, maxLength) + '...'
        thirdSpan.textContent = truncatedText
      } else {
        thirdSpan.textContent = descriptionContent || ''
      }

      firstPara.appendChild(firstSpan)
      firstPara.appendChild(secondSpan)
      secondPara.appendChild(thirdSpan)
      secondPara.appendChild(fourthSpan)

      li.appendChild(checkbox)
      li.appendChild(firstPara)
      li.appendChild(secondPara)

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
