import { allApplicationTasks } from '../manager/app-manager.js'

function createProject(title) {
  return {
    title: title,
    isStatic: false,
    originalTitle: null,
    isDefaultRemovable: false,

    addTask: function (task) {
      task.projectTitle = this.title
    },

    getTasks: function () {
      return allApplicationTasks.filter(
        (task) => task.projectTitle === this.title,
      )
    },
  }
}

export default createProject
