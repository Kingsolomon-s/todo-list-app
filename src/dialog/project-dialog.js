import './project-dialog.css'
export default function createProjectDialog(onSubmitProjectCallback) {
  const dialog = document.createElement('dialog')
  dialog.id = 'project-dialog'

  const form = document.createElement('form')
  form.id = 'project-form'
  form.method = 'dialog'

  const heading = document.createElement('h2')
  heading.textContent = 'New Project'
  form.appendChild(heading)

  const label = document.createElement('label')
  const projectTitleInput = document.createElement('input')
  projectTitleInput.type = 'text'
  projectTitleInput.name = 'projectTitle'
  projectTitleInput.required = true
  label.appendChild(projectTitleInput)
  form.appendChild(label)

  const menu = document.createElement('menu')
  menu.classList.add('menu')

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.textContent = 'Add'

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.id = 'cancel-project-btn'
  cancelBtn.textContent = 'Cancel'

  menu.appendChild(submitBtn)
  menu.appendChild(cancelBtn)
  form.appendChild(menu)

  dialog.appendChild(form)
  document.body.appendChild(dialog)

  cancelBtn.addEventListener('click', () => {
    form.reset()
    dialog.close()
  })

  form.addEventListener('submit', (event) => {
    event.preventDefault()

    const title = projectTitleInput.value.trim()
    if (!title) {
      alert('Project title is required!')
      return
    }

    if (typeof onSubmitProjectCallback === 'function') {
      onSubmitProjectCallback(title)
    }

    form.reset()
    dialog.close()
  })

  dialog.show = function () {
    dialog.showModal()
  }

  return dialog
}
