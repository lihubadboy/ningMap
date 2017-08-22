define('utils/common', [], function() {
    var util = function() {};
    util.prototype = {
        getQueryStringByKey: function(key) {
            return (document.location.search.match(new RegExp("(?:^\\?|&)" + key + "=(.*?)(?=&|$)")) || ['', null])[1];
        },
        replaceQueryStringValue: function(key, value, changePage) {
            var newhref = '';
            //default is true, change page to 1
            changePage = ((changePage == null && key != 'page') ? true : changePage);
            if (document.location.search.match(new RegExp("(?:^\\?|&)" + key + "=(.*?)(?=&|$)"))) {
                var queryString = document.location.search.match(new RegExp("(?:^\\?|&)" + key + "=(.*?)(?=&|$)"));
                var newQuery = queryString[0].replace(queryString[1], value);
                newhref = document.location.href.replace(queryString[0], newQuery);
            } else {
                if (document.location.href.indexOf('?') > -1)
                    newhref = (document.location.href + '&' + key + '=' + value)
                else
                    newhref = (document.location.href + '?' + key + '=' + value)
            }

            if (changePage && document.location.search.match(new RegExp("(?:^\\?|&)" + 'page' + "=(.*?)(?=&|$)"))) {
                var pageString = document.location.search.match(new RegExp("(?:^\\?|&)" + 'page' + "=(.*?)(?=&|$)"));
                var newPage = pageString[0].replace(pageString[1], '1');
                newhref = newhref.replace(pageString[0], newPage);
            }

            return newhref;
        },
        deleteQueryStringByKey: function(key) {
            var queryString = document.location.search.match(new RegExp("(?:^\\?|&)" + key + "=(.*?)(?=&|$)"));
            if (queryString == null) return document.location.href;
            var queryCount = queryString.input.split('&').length;

            if (queryCount == 1)
                return document.location.href.replace(queryString[0], '');
            else {
                if (queryString[0].indexOf('?') > -1)
                    return document.location.href.replace(queryString[0] + '&', '?');
                else
                    return document.location.href.replace(queryString[0], '');
            }

        },
        setCookie: function(name, value, hours, path) {
            var name = escape(name);
            var value = escape(value);
            var expires = new Date();
            expires.setTime(expires.getTime() + hours * 3600000);
            path = path == "" ? "" : ";path=" + path;
            _expires = (typeof hours) == "string" ? "" : ";expires=" + expires.toUTCString();
            document.cookie = name + "=" + value + _expires + path;
        },
        getCookieValue: function(name) {
            var name = escape(name);
            var allcookies = document.cookie;
            name += "=";
            var pos = allcookies.indexOf(name);
            if (pos != -1) {
                var start = pos + name.length;
                var end = allcookies.indexOf(";", start);
                if (end == -1) end = allcookies.length;
                var value = allcookies.substring(start, end);
                return unescape(value);
            } else return "";
        },
        quickQueryCust: function(evt) {
            evt = (evt) ? evt : ((window.event) ? window.event : ""); //兼容IE和Firefox获得keyBoardEvent对象
            var key = evt.keyCode ? evt.keyCode : evt.which; //兼容IE和Firefox获得keyBoardEvent对象的键值
            if (key == 13) { //判断是否是回车事件。
                //根据需要执行某种操作。
                return true; //return false是为了停止表单提交，如果return true或者不写的话，表单照样是会提交的。
            }
            return false;
        },
        deleteCookie: function(name, path) {
            var name = escape(name);
            var expires = new Date(0);
            path = path == "" ? "" : ";path=" + path;
            document.cookie = name + "=" + ";expires=" + expires.toUTCString() + path;
        },
        disabledItem: function(select) {
            $(select).attr('disabled', 'disabled');
        },
        enabledItem: function(select) {
            $(select).removeAttr('disabled');
        },
        newDate: function(dateString) {
            if (/msie/.test(navigator.userAgent.toLowerCase())) {
                var isoExp = /^\s*(\d{4})-(\d\d)-(\d\d)\s*$/,
                    date = new Date(NaN),
                    month,
                    parts = isoExp.exec(dateString);

                if (parts) {
                    month = +parts[2];
                    date.setFullYear(parts[1], month - 1, parts[3]);
                    if (month != date.getMonth() + 1) {
                        date.setTime(NaN);
                    }
                }
                return date;
            } else {
                return new Date(dateString);
            }
        },
        fixBug: function() {

        },

        /*****************************CHEN START******************************/
        formatDate: function(dd) {
            var now = new Date(dd);
            var year = now.getFullYear();
            var month = now.getMonth() + 1;
            var date = now.getDate();
            var hour = now.getHours();
            var minute = now.getMinutes();
            var second = now.getSeconds();
            var newMonth = (month < 10) ? "0" + month : month;
            var newDate = (date < 10) ? "0" + date : date;
            var newHour = (hour < 10) ? "0" + hour : hour;
            var newMinute = (minute < 10) ? "0" + minute : minute;
            var newSecond = (second < 10) ? "0" + second : second;
            return year + "-" + newMonth + "-" + newDate;
        },

        formatDateYear: function(dd) {
            var now = new Date(dd);
            var year = now.getFullYear();
            return year;
        },

        rgb2hex: function(rgb) {
            rgb = rgb.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

            function hex(x) {
                return ("0" + parseInt(x).toString(16)).slice(-2);
            }
            return "#" + hex(rgb[1]) + hex(rgb[2]) + hex(rgb[3]);
        },

        fullScreen: function() {
            var el = document.documentElement,
                rfs = el.requestFullScreen || el.webkitRequestFullScreen || el.mozRequestFullScreen || el.msRequestFullScreen,
                wscript;
            if (typeof rfs != "undefined" && rfs) {
                rfs.call(el);
                return;
            }
            if (typeof window.ActiveXObject != "undefined") {
                wscript = new ActiveXObject("WScript.Shell");
                if (wscript) {
                    wscript.SendKeys("{F11}");
                }
            }
        },
        exitFullScreen: function() {
            var el = document,
                cfs = el.cancelFullScreen || el.webkitCancelFullScreen || el.mozCancelFullScreen || el.exitFullScreen,
                wscript;
            if (typeof cfs != "undefined" && cfs) {
                cfs.call(el);
                return;
            }
            if (typeof window.ActiveXObject != "undefined") {
                wscript = new ActiveXObject("WScript.Shell");
                if (wscript != null) {
                    wscript.SendKeys("{F11}");
                }
            }
        },
        /*****************************CHEN END******************************/

        fixExtention: function() {
            //ie trim
            if (!String.prototype.trim) {
                String.prototype.trim = function() {
                    return this.replace(/^\s\s*/, '').replace(/\s\s*$/, '');
                };
            }
            //ie Array
            if (!Array.prototype.indexOf) {
                Array.prototype.indexOf = function(elt /*, from*/ ) {
                    var len = this.length >>> 0;
                    var from = Number(arguments[1]) || 0;
                    from = (from < 0) ? Math.ceil(from) : Math.floor(from);
                    if (from < 0)
                        from += len;
                    for (; from < len; from++) {
                        if (from in this &&
                            this[from] === elt)
                            return from;
                    }
                    return -1;
                };
            }
            // 对Date的扩展，将 Date 转化为指定格式的String
            Date.prototype.Format = function(fmt) {
                var o = {
                    "M+": this.getMonth() + 1, //月份
                    "d+": this.getDate(), //日
                    "h+": this.getHours(), //小时
                    "m+": this.getMinutes(), //分
                    "s+": this.getSeconds(), //秒
                    "q+": Math.floor((this.getMonth() + 3) / 3), //季度
                    "S": this.getMilliseconds() //毫秒
                };
                if (/(y+)/.test(fmt))
                    fmt = fmt.replace(RegExp.$1, (this.getFullYear() + "").substr(4 - RegExp.$1.length));
                for (var k in o)
                    if (new RegExp("(" + k + ")").test(fmt))
                        fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
                return fmt;
            };
        },
        transformData: function(attr) {
            var firstlevel = [];
            for (var i = 0; i < attr.length; i++) {
                for (var j = 0; j < attr.length; j++) {
                    if (attr[i].id == attr[j].parentid) {
                        if (!attr[i].child) {
                            attr[i].child = [];
                        }
                        attr[i].child.push(attr[j]);
                    }
                }
            }
            for (var i = 0; i < attr.length; i++) {
                if (attr[i].parentid == -1) {
                    firstlevel.push(attr[i])
                }
            }
            return firstlevel;
        }
    };
    return util;
});