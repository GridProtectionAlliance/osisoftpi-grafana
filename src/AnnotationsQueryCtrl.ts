export class AnnotationsQueryCtrl {
  static templateUrl = 'partials/annotations.editor.html';

  $scope: any;
  annotation: any;
  datasource: any;

  /** @ngInject */
  constructor($scope: any) {
    this.$scope = $scope;
    this.annotation = $scope.ctrl.annotation;
    this.datasource = $scope.ctrl.datasource;

    // load defaults
    this.annotation.query = this.annotation.query || {};
    this.annotation.databases = this.annotation.databases || [];
    this.annotation.templates = this.annotation.templates || [];
    this.annotation.regex = this.annotation.regex || {};
    this.annotation.attribute = this.annotation.attribute || {};
    this.annotation.showEndTime = this.annotation.showEndTime || false;

    this.datasource.getAssetServer(this.datasource.afserver.name).then((result: any) => {
      return this.getDatabases(result.WebId);
    });
  }
  templateChanged() {
    // do nothing
  }
  databaseChanged() {
    this.annotation.templates = [];
    this.getEventFrames();
  }
  getDatabases(webid: string) {
    const ctrl = this;
    ctrl.datasource.getDatabases(webid).then((dbs: any) => {
      ctrl.annotation.databases = dbs;
      this.$scope.$apply();
    });
  }
  getEventFrames() {
    const ctrl = this;
    ctrl.datasource.getEventFrameTemplates(this.annotation.database.WebId).then((templates: any) => {
      ctrl.annotation.templates = templates;
      this.$scope.$apply();
    });
  }
}
