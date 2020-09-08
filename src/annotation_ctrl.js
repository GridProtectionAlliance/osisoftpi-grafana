import _ from 'lodash'

export class PiWebApiAnnotationsQueryCtrl {
  constructor ($scope) {
    this.$scope = $scope
    this.annotation.query = (this.annotation.query || {})
    this.databases = []
    this.templates = []
    this.getDatabases()
  }
  templateChanged () {

  }
  databaseChanged ($event) {
    this.getEventFrames()
  }
  getDatabases () {
    var ctrl = this
    ctrl.datasource.getDatabases(this.datasource.afserver.webid).then(dbs => {
      ctrl.databases = dbs
    })
  }
  getEventFrames () {
    var ctrl = this
    ctrl.datasource.getEventFrameTemplates(ctrl.annotation.database.WebId).then(templates => {
      ctrl.templates = templates
    })
  }
}

PiWebApiAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html'
