import './dialog.css'

function createLabeledInput(type, name, placeholderText, required = false) {
  const label = document.createElement('label')

  const input = document.createElement('input')
  input.classList.add('input')
  input.type = type
  input.name = name
  if (type === 'text') {
    input.placeholder = placeholderText
  } else {
    label.textContent = placeholderText
  }

  if (required) input.required = true

  label.appendChild(input)
  return label
}

function createLabeledTextarea(name, placeholderText) {
  const label = document.createElement('label')

  const textarea = document.createElement('textarea')
  textarea.classList.add('input')
  textarea.name = name
  textarea.placeholder = placeholderText

  label.appendChild(textarea)
  return label
}

function createLabeledSelect(name, labelText, optionsArray) {
  const label = document.createElement('label')
  label.textContent = labelText

  const select = document.createElement('select')
  select.classList.add('select')
  select.name = name

  optionsArray.forEach((value) => {
    const option = document.createElement('option')
    option.value = value
    option.textContent = value[0].toUpperCase() + value.slice(1)
    select.appendChild(option)
  })

  label.appendChild(select)
  return label
}

function createTodoDialog(onSubmitTask) {
  const dialog = document.createElement('dialog')
  dialog.id = 'todo-dialog'

  const form = document.createElement('form')
  form.id = 'todo-form'
  form.method = 'dialog'

  const title = document.createElement('h2')
  title.textContent = 'Add Task'
  form.appendChild(title)

  form.appendChild(createLabeledInput('text', 'taskTitle', 'Title', true))
  form.appendChild(createLabeledTextarea('description', 'Description:'))
  form.appendChild(createLabeledInput('date', 'dueDate', 'Due Date'))
  form.appendChild(createLabeledInput('time', 'dueTime', 'Due Time'))

  form.appendChild(
    createLabeledSelect('priority', 'Priority:', ['low', 'medium', 'high']),
  )

  const menu = document.createElement('menu')
  menu.classList.add('dialog-menu')

  const submitBtn = document.createElement('button')
  submitBtn.type = 'submit'
  submitBtn.textContent = 'Add'

  const cancelBtn = document.createElement('button')
  cancelBtn.type = 'button'
  cancelBtn.id = 'cancel-btn'
  cancelBtn.textContent = 'Cancel'

  menu.appendChild(submitBtn)
  menu.appendChild(cancelBtn)
  form.appendChild(menu)

  dialog.appendChild(form)
  document.body.appendChild(dialog)

  cancelBtn.addEventListener('click', () => dialog.close())

  form.addEventListener('submit', (e) => {
    e.preventDefault()
    const formData = new FormData(form)
    const task = {
      title: formData.get('taskTitle'),
      dueDate: formData.get('dueDate'),
      dueTime: formData.get('dueTime'),
      priority: formData.get('priority'),
      description: formData.get('description'),
    }

    if (typeof onSubmitTask === 'function') {
      onSubmitTask(task)
    }

    form.reset()
    dialog.close()
  })

  return dialog
}

export default createTodoDialog
