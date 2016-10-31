import _ from 'lodash'
import './css/query-editor.css!'

export class PiWebApiConfigCtrl {
  constructor ($scope) {
    this.current.jsonData = this.current.jsonData || {}
  }
}


PiWebApiConfigCtrl.templateUrl = 'partials/config.html'
