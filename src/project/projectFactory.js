function createProject(title) {
  const tasks = []

  return {
    title: title,
    addTask: function (task) {
      tasks.push(task)
      console.log(`Task added internally to project "${this.title}":`, task)
    },
    getTasks: function () {
      return [...tasks] // Return a copy
    },
  }
}
export default createProject
