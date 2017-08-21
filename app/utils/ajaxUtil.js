define('utils/ajaxUtil', [], function() {
    var util = function(proxy) {
        var _self = this;
        _self.proxy = proxy;
    };
    util.prototype = {
        query: function(url, where, callback, userid) {
            var _self = this;
            var search = where == null ? '1=1' : where.trim();
            var query = {
                q: search
            };
            if (userid) query.userid = userid;
            _self._ajaxPost(url, query, callback);
        },
        search: function(url, where, start, num, callback, userid) {
            var _self = this;
            var search = where == null ? '1=1' : where.trim();
            var query = {
                q: search,
                start: start,
                num: num
            };
            if (userid) query.userid = userid;
            _self._ajaxPost(url, query, callback);
        },
        delete: function(url, array, callback) {
            var _self = this;
            var lists = array == null ? [] : array;
            var query = {
                list: lists
            };
            _self._ajaxPost(url, query, callback);
        },
        export: function(url, content, callback) {
            var _self = this;
            _self._ajaxPost(url, content, callback);
        },
        login: function(url, username, password, callback) {
            var _self = this;
            var query = {
                username: username,
                password: password,
            };
            _self._ajaxPost(url, query, callback, true);
        },
        _formartUrl: function(url) {
            var _self = this;
            return url.indexOf(window.location.host) > -1 ? url : _self.proxy + '?' + url;
        },
        _ajaxPost: function(url, query, callback, parse) {
            var _self = this;
            try {
                $.ajax({
                    type: "POST",
                    url: _self._formartUrl(url),
                    data: parse ? JSON.stringify(query) : $.toJSON(query),
                    dataType: "json",
                    contentType: "application/json",
                    timeout: 30000,
                    success: function(data, status, xhr) {
                        if (data.error_code) {
                            if (data.error_code.indexOf('401') >= 0)
                                return; // gotologin
                        }
                        if (callback) callback(data);
                    },
                    error: function(xhr, error, exception) {
                        if (callback) callback(null);
                    }
                });
            } catch (e) { //Here should be delaying with error
                if (callback) callback(null);
            }
        }
    };
    return util;
});