export class AnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';

  annotation: any;

  /** @ngInject */
  constructor() {
    this.annotation.query = this.annotation.query || {};
    this.annotation.databases = this.annotation.databases || [];
    this.annotation.templates = this.annotation.templates || [];
    this.annotation.regex = this.annotation.regex || {};
    this.annotation.attribute = this.annotation.attribute || {};
    this.annotation.showEndTime = this.annotation.showEndTime || false;
    this.getDatabases();
  }
  templateChanged() {
  }
  databaseChanged() {
    this.getEventFrames();
  }
  getDatabases() {
    var ctrl = this;
    // @ts-ignore
    return ctrl.datasource.getDatabases(ctrl.datasource.afserver.webid!).then((dbs: any) => {
      ctrl.annotation.databases = dbs;
    });
  }
  getEventFrames() {
    var ctrl = this;
    // @ts-ignore
    return ctrl.datasource.getEventFrameTemplates(this.annotation.database.WebId).then((templates: any) => {
      ctrl.annotation.templates = templates;
    });
  }
}
