/**
 * @author DYTH 2015
 */
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');

//require.js config
require({
    parseOnLad: true,
    paths: {},
    shim: {},
    packages: [{
        name: "config",
        location: locationPath + '/app/config'
    }, {
        name: "modules",
        location: locationPath + '/app/modules'
    }, {
        name: "application",
        location: locationPath + '/app/application'
    }, {
        name: "proxy",
        location: locationPath + '/app/proxy'
    }, {
        name: "assets",
        location: locationPath + '/assets/js'
    }, {
        name: "utils",
        location: locationPath + '/app/utils'
    }]
});