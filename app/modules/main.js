define('modules/main', [
    "assets/js/clock/date.js",

    "assets/js/custom/scriptbreaker-multiple-accordion-1.js",
    "assets/js/slidebars/slidebars.min.js",
    "http://cdnjs.cloudflare.com/ajax/libs/jquery-easing/1.3/jquery.easing.min.js",
    "assets/js/tip/jquery.tooltipster.js",
    "assets/js/nano/jquery.nanoscroller.js",

], function() {
    var Widget = function() {
        var _self = this;
        _self._init();
    };
    Widget.prototype = {
        _init: function() {
            var _self = this;
            _self._constructMainMethods();
        },
        _constructMainMethods: function() {
            var _self = this;
            // _self._constructSlidingmenu();

        },
        ////Acordion and Sliding menu
        _constructSlidingmenu: function() {
            $(".topnav").accordionze({
                accordionze: true,
                speed: 500,
                closedSign: '<img src="assets/img/plus.png">',
                openedSign: '<img src="assets/img/minus.png">'
            });

        },
    }
    return Widget;
});