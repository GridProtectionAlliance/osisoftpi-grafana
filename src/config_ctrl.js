import _ from 'lodash'
import './css/query-editor.css!'

export class PiWebApiConfigCtrl {
  constructor ($scope) {
    this.current.jsonData = this.current.jsonData || {}

    this.current.jsonData.url = this.current.url
    this.current.jsonData.access = this.current.access
  }
}


PiWebApiConfigCtrl.templateUrl = 'partials/config.html'
