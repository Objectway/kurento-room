'use strict';
var GulpConfig = (function () {
    function gulpConfig() {
        this.allTypeScript = './src/**/*.ts';
	      this.tsOutputPath = './dist';
    }
    return gulpConfig;
})();
module.exports = GulpConfig;
