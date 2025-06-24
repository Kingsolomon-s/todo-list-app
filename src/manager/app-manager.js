import createProjectDialog from '../dialog/project-dialog.js'
import createTodoDialog from '../dialog/dialog.js'
import createProject from '../project/projectFactory.js'
import folderImg from '../images/folder-file-svgrepo-com.svg'
import timeSvg from './images/alarm-clock-svgrepo-com.svg'
import popUpSvg from '../images/menu-dots-svgrepo-com.svg'
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
groceryProject.isStatic = true
groceryProject.originalTitle = 'Grocery'
groceryProject.isDefaultRemovable = true

const educationalProject = createProject('Educational')
educationalProject.isStatic = true
educationalProject.originalTitle = 'Educational'
educationalProject.isDefaultRemovable = true

const personalNotesProject = createProject('Personal Notes')
personalNotesProject.isStatic = true
personalNotesProject.originalTitle = 'Personal Notes'
personalNotesProject.isDefaultRemovable = true

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

    const storedProjectStates = localStorage.getItem(
      'allProjectsAndTaskCategories',
    )
    const loadedProjectStates = storedProjectStates
      ? JSON.parse(storedProjectStates)
      : []

    const storedDeletedDefaultTitles = localStorage.getItem(
      'deletedDefaultRemovableProjectTitles',
    )
    const deletedDefaultRemovableProjectTitles = storedDeletedDefaultTitles
      ? new Set(JSON.parse(storedDeletedDefaultTitles))
      : new Set()

    allProjectsAndTaskCategories = [
      todayProject,
      scheduledProject,
      overdueProject,
      allTasksProject,
    ]

    const defaultStaticProjectsMap = new Map([
      ['Grocery', groceryProject],
      ['Educational', educationalProject],
      ['Personal Notes', personalNotesProject],
    ])

    const loadedDefaultRemovableProjectTitles = new Set()

    loadedProjectStates.forEach((projData) => {
      if (
        projData.isStatic &&
        projData.originalTitle &&
        defaultStaticProjectsMap.has(projData.originalTitle)
      ) {
        if (!deletedDefaultRemovableProjectTitles.has(projData.originalTitle)) {
          const staticProjectInstance = defaultStaticProjectsMap.get(
            projData.originalTitle,
          )
          if (staticProjectInstance) {
            staticProjectInstance.title = projData.title // Update its title if renamed
            allProjectsAndTaskCategories.push(staticProjectInstance)
          }
        }
      } else if (!projData.isStatic) {
        const newProject = createProject(projData.title)
        allProjectsAndTaskCategories.push(newProject)
      }
    })

    defaultStaticProjectsMap.forEach((projectInstance, originalTitle) => {
      const isAlreadyPresent = allProjectsAndTaskCategories.some(
        (p) => p === projectInstance,
      )
      if (
        !deletedDefaultRemovableProjectTitles.has(originalTitle) &&
        !isAlreadyPresent
      ) {
        projectInstance.title = originalTitle
        allProjectsAndTaskCategories.push(projectInstance)
      }
    })

    allProjectsAndTaskCategories = Array.from(
      new Set(allProjectsAndTaskCategories),
    )

    allProjectsAndTaskCategories.forEach((project) => {
      const isSystemCategory = [
        todayProject,
        scheduledProject,
        overdueProject,
        allTasksProject,
      ].includes(project)

      if (!isSystemCategory) {
        if (project.tasks) {
          project.tasks = []
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
      activeProject = allTasksProject
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

  const staticNonSaveableProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
  ]

  const staticBaseProjectsMap = new Map([
    [groceryProject.originalTitle, groceryProject],
    [educationalProject.originalTitle, educationalProject],
    [personalNotesProject.originalTitle, personalNotesProject],
  ])

  const projectsToSave = allProjectsAndTaskCategories
    .filter((p) => !staticNonSaveableProjects.includes(p))
    .map((p) => {
      if (p.isStatic) {
        return {
          title: p.title,
          isStatic: true,
          originalTitle: p.originalTitle,
        }
      }
      return { title: p.title }
    })

  localStorage.setItem(
    'allProjectsAndTaskCategories',
    JSON.stringify(projectsToSave),
  )

  localStorage.setItem(
    'activeProjectTitle',
    activeProject ? activeProject.title : '',
  )

  const deletedDefaultRemovableProjectTitles = Array.from(
    staticBaseProjectsMap.keys(),
  ).filter((originalTitle) => {
    const defaultProject = staticBaseProjectsMap.get(originalTitle)
    return !allProjectsAndTaskCategories.some(
      (p) => p.originalTitle === originalTitle || p === defaultProject,
    )
  })

  localStorage.setItem(
    'deletedDefaultRemovableProjectTitles',
    JSON.stringify(deletedDefaultRemovableProjectTitles),
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

  const systemProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
  ]

  const userManagedProjects = allProjectsAndTaskCategories.filter(
    (p) => !systemProjects.includes(p),
  )

  const addProjectBtn = projectList.querySelector('.add-project')

  userManagedProjects.forEach((project) => {
    const btn = document.createElement('div')
    if (project.isStatic && project.originalTitle) {
      btn.classList.add(project.originalTitle.toLowerCase().replace(/\s/g, '-'))
    }
    btn.classList.add('dynamic-project')

    if (project === activeProject) {
      btn.classList.add('active')
    }

    const popUpImgContainer = document.createElement('div')
    popUpImgContainer.classList.add('pop-up-btn')

    const popUpImg = document.createElement('img')
    popUpImg.src = popUpSvg
    popUpImg.alt = 'project menu svg'
    popUpImg.width = '25'
    popUpImg.height = '25'

    popUpImg.addEventListener('click', toggleProjectPopup)
    popUpImgContainer.appendChild(popUpImg)

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
    btn.appendChild(popUpImgContainer)

    btn.addEventListener('click', (event) => {
      if (!event.target.closest('.pop-up-btn')) {
        setActiveProjectAndRender(project, btn)
      }
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
    else if (activeProject.isStatic && activeProject.originalTitle) {
      elementToActivate = document.querySelector(
        `.${activeProject.originalTitle.toLowerCase().replace(/\s/g, '-')}`,
      )
    } else {
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
  document.querySelector('.today .number').textContent = todayProject
    .getTasks()
    .filter((task) => !task.completed).length
  document.querySelector('.schedule .number').textContent = scheduledProject
    .getTasks()
    .filter((task) => !task.completed).length
  document.querySelector('.overdue .number').textContent = overdueProject
    .getTasks()
    .filter((task) => !task.completed).length
  document.querySelector('.all .number').textContent = allTasksProject
    .getTasks()
    .filter((task) => !task.completed).length

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

const sidebarContainer = document.getElementById('sidebar-container')

const popUpDiv = document.createElement('div')
popUpDiv.classList.add('pop-up')

const firstItem = document.createElement('p')
firstItem.textContent = 'Rename'

const secondItem = document.createElement('p')
secondItem.textContent = 'Delete'

secondItem.addEventListener('click', () => {
  if (projectToRename) {
    handleDeleteProject(projectToRename)
    popUpDiv.style.display = 'none'
  }
})

popUpDiv.appendChild(firstItem)
popUpDiv.appendChild(secondItem)

if (!document.body.contains(popUpDiv)) {
  document.body.appendChild(popUpDiv)
}

let currentOpenPopupTrigger = null
let projectToRename = null

function toggleProjectPopup(event) {
  event.stopPropagation()

  const clickedBtnContainer = event.target.closest('.pop-up-btn')
  const projectDiv =
    event.target.closest('.dynamic-project') ||
    event.target.closest('.projects.test > div')

  if (!clickedBtnContainer || !projectDiv) {
    return
  }

  const projectTitleElement = projectDiv.querySelector('p:first-of-type')
  const projectTitle = projectTitleElement
    ? projectTitleElement.textContent
    : ''

  projectToRename = allProjectsAndTaskCategories.find(
    (p) => p.title === projectTitle,
  )

  if (!projectToRename) {
    console.error('Project not found for renaming.')
    return
  }

  const nonRenameableProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
  ]

  if (nonRenameableProjects.includes(projectToRename)) {
    alert(`The "${projectToRename.title}" category cannot be renamed.`)
    popUpDiv.style.display = 'none'
    currentOpenPopupTrigger = null
    projectToRename = null
    return
  }

  if (
    currentOpenPopupTrigger === clickedBtnContainer &&
    popUpDiv.style.display === 'block'
  ) {
    popUpDiv.style.display = 'none'
    currentOpenPopupTrigger = null
    projectToRename = null
  } else {
    if (
      currentOpenPopupTrigger &&
      currentOpenPopupTrigger !== clickedBtnContainer
    ) {
      popUpDiv.style.display = 'none'
    }

    popUpDiv.style.display = 'block'
    currentOpenPopupTrigger = clickedBtnContainer
    positionPopup()
  }
}

function positionPopup() {
  if (popUpDiv.style.display === 'block' && currentOpenPopupTrigger) {
    const rect = currentOpenPopupTrigger.getBoundingClientRect()

    const popupLeft = rect.right + window.scrollX + 5
    const popupTop = rect.top + window.scrollY

    popUpDiv.style.left = `${popupLeft}px`
    popUpDiv.style.top = `${popupTop}px`
  }
}

document.addEventListener('click', (event) => {
  if (
    popUpDiv.style.display === 'block' &&
    !popUpDiv.contains(event.target) &&
    !event.target.closest('.pop-up-btn')
  ) {
    popUpDiv.style.display = 'none'
    currentOpenPopupTrigger = null
    projectToRename = null
  }
})

window.addEventListener('resize', positionPopup)

window.addEventListener('scroll', positionPopup)

const modifyProjectDialog = document.getElementById('modifyProjectDialog')
const modifyProjectForm = document.getElementById('modifyProjectForm')
const closeDialogButton = document.getElementById('closeDialogButton')
const modifyProjectTitleInput = document.getElementById(
  'modifyProjectTitleInput',
)

firstItem.addEventListener('click', () => {
  if (projectToRename) {
    modifyProjectTitleInput.value = projectToRename.title
    modifyProjectDialog.showModal()
    popUpDiv.style.display = 'none'
  }
})

closeDialogButton.addEventListener('click', () => {
  modifyProjectForm.reset()
  modifyProjectDialog.close()
  projectToRename = null
})

modifyProjectForm.addEventListener('submit', (event) => {
  event.preventDefault()

  const newTitle = modifyProjectTitleInput.value.trim()

  if (!newTitle) {
    alert('project title cannot be empty!')
    return
  }

  const exists = allProjectsAndTaskCategories.some(
    (p) =>
      p.title.toLowerCase() === newTitle.toLowerCase() && p !== projectToRename,
  )
  if (exists) {
    alert(`A project with the title "${newTitle}" already exists!`)
    return
  }

  if (projectToRename) {
    const oldTitle = projectToRename.title
    projectToRename.title = newTitle

    allApplicationTasks.forEach((task) => {
      if (task.projectTitle === oldTitle) {
        task.projectTitle = newTitle
      }
    })

    saveAllData()
    renderSidebarItems()
    updateProjectTaskCounts()

    if (activeProject === projectToRename) {
      renderTasks()
    }
  }

  modifyProjectDialog.close()
  modifyProjectForm.reset()
  projectToRename = null
})

function handleDeleteProject(projectToDelete) {
  const nonDeleteableProjects = [
    todayProject,
    scheduledProject,
    overdueProject,
    allTasksProject,
  ]

  if (nonDeleteableProjects.includes(projectToDelete)) {
    alert(`The "${projectToDelete.title}" category cannot be deleted.`)
    return
  }
  const confirmDeletion = confirm(
    `Are you sure you want to delete the project "${projectToDelete.title}" and all its tasks? This action cannot be undone.`,
  )
  if (!confirmDeletion) {
    return
  }

  allApplicationTasks = allApplicationTasks.filter(
    (task) => task.projectTitle !== projectToDelete.title,
  )

  allProjectsAndTaskCategories = allProjectsAndTaskCategories.filter(
    (project) => project !== projectToDelete,
  )

  if (activeProject === projectToDelete) {
    const newActive =
      allProjectsAndTaskCategories.find(
        (p) =>
          p !== todayProject &&
          p !== scheduledProject &&
          p !== overdueProject &&
          p !== allTasksProject,
      ) || allTasksProject
    setActiveProjectAndRender(newActive, null)
  }

  saveAllData()
  renderSidebarItems()
  updateProjectTaskCounts()
  renderTasks()

  console.log(`Project "${projectToDelete.title}" deleted.`)
}

function showTaskDetailsModal(task) {
  console.log('Task Details:', task)
  alert(
    `Task: ${task.title}\nDescription: ${task.description}\nDue Date: ${formatDate(task.dueDate)}\nDue Time: ${formatTime(task.dueTime)}\nPriority: ${task.priority}`,
  )
}
