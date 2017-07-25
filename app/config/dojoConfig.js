/**
 * @author GAO JIE@ESRI 2014
 */
var pathRegex = new RegExp(/\/[^\/]+$/);
var locationPath = location.pathname.replace(pathRegex, '');
//dojo config
var dojoConfig = {
	parseOnLad: true,
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
		name: "widgets",
		location: locationPath + '/app/modules/widgets'
	}, {
		name: "proxy",
		location: locationPath + '/app/proxy'
	}, {
		name: "utils",
		location: locationPath + '/app/utils'
	}]
};