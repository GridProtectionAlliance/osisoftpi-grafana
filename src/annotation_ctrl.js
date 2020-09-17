import _ from 'lodash'

export class PiWebApiAnnotationsQueryCtrl {
  constructor ($scope) {
    this.$scope = $scope
    this.annotation.query = (this.annotation.query || {})
    this.annotation.databases = (this.annotation.databases || [])
    this.annotation.templates = (this.annotation.templates || [])
    this.getDatabases().then(() => {
      return this.getEventFrames()
    })
  }
  templateChanged ($event) {

  }
  databaseChanged ($event) {
    this.getEventFrames()
  }
  getDatabases () {
    var ctrl = this
    return ctrl.datasource.getDatabases(this.datasource.afserver.webid).then(dbs => {
      ctrl.annotation.databases = dbs
    })
  }
  getEventFrames () {
    var ctrl = this
    return ctrl.datasource.getEventFrameTemplates(ctrl.annotation.database.WebId).then(templates => {
      ctrl.annotation.templates = templates
    })
  }
}

PiWebApiAnnotationsQueryCtrl.templateUrl = 'partials/annotations.editor.html'
