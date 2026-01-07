System.register([], function (exports) {
  'use strict';
  return {
    setters: [],
    execute: function () {
      exports('plugin', {});
      exports('AppPlugin', class {
        constructor(app) {
          this.app = app;
        }
      });
    }
  };
});
