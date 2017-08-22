define('modules/main', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common) {
    var Widget = function(options) {
        var _self = this;
        _self.options = options;
        _self.ajaxUtil = new ajaxUtil(_self.options.proxyUrl);
        _self.common = new common();
        _self._init();
    };
    Widget.prototype = {
        _init: function() {
            var _self = this;
            if (_self.options.isLogin == true) {
                _self._getAuthorInfo();
            }
            _self._requsstStaticsDatas();
            _self._requestDatas();
            _self._constructLineChart();
            _self._logout();
        },
        _getAuthorInfo: function() {
            var _self = this;
            var cookies = _self.common.getCookieValue(_self.options.authorInfoKey);
            if (cookies == "" || cookies == null || cookies == undefined) {
                window.location.href = "login.html";
            } else {
                _self.options.authorInfo = $.parseJSON(cookies);
                $(".dropdown-toggle").html(' <img alt="" class="admin-pic img-circle" src="images/user.png"> 欢迎，' + _self.options.authorInfo.username + '  <b class="caret"></b>');
                if (_self.options.authorInfo.localBureau != '中国地震局地球物理研究所') {
                    $('#usermanager').css('display', 'none');
                    $('#statics').css('display', 'none');
                }
            }
        },
        _logout: function() {
            var _self = this;
            $("#logout").on("click", function() {
                _self.common.deleteCookie(_self.options.authorInfoKey, "/");
                window.location.href = "login.html";
            });
        },
        _requsstStaticsDatas: function() {
            var _self = this;
            _self.ajaxUtil.statics(_self.options.OprUrls.statistics.allCountUrl, function(respons) {
                if (respons) {
                    var staticsData = respons;
                    for (i = 0; i < staticsData.length; i++) {
                        var perData = staticsData[i];
                        if (perData.name == '访问总量') {
                            $('#clickNum').html(perData.num);
                        } else if (perData.name == '单位总量') {
                            $('#departNum').html(perData.num);
                        } else if (perData.name == '工程记录') {
                            $('#engineerNum').html(perData.num);
                        } else if (perData.name == '区划总量') {
                            $('#localNum').html(perData.num);
                        }

                    }
                }
            });
        },
        _requestDatas: function() {
            var _self = this;
            $('#table-container').empty();
            $('.tfooter').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.bureau.queryUrl, '1=1', function(respons) {
                if (respons.result) {
                    _self.datas = respons.list;
                    _self.viewModuls = _self.datas;
                    _self._constructBdMap();
                }
            });
        },
        _constructBdMap: function() {
            var _self = this;
            if (!_self.map) {
                _self.map = new BMap.Map("map-user"); // 创建Map实例
                _self.map.setMapStyle({
                    style: _self.options.city.style
                });
                _self.map.centerAndZoom(_self.options.city, '6');
                _self.map.addControl(new BMap.NavigationControl()); // 添加平移缩放控件
                _self.map.addControl(new BMap.ScaleControl()); // 添加比例尺控件
                _self.map.addControl(new BMap.OverviewMapControl()); //添加缩略地图控件
                _self.map.enableScrollWheelZoom(); //启用滚轮放大缩小
                _self.map.addControl(new BMap.MapTypeControl({ type: BMAP_MAPTYPE_CONTROL_MAP })); //添加地图类型控件
            }
            if (_self.viewModuls) {
                _self.map.closeInfoWindow();
                _self.map.clearOverlays();
                $.each(_self.viewModuls, function(key, data) {
                    var marker = new BMap.Marker(new BMap.Point(data.longitude, data.latitude));
                    var content = data;
                    _self.map.addOverlay(marker); // 将标注添加到地图中
                    _self._addClickHandler(content, marker);
                });
            }
        },
        _addClickHandler: function(content, marker) {
            var _self = this;
            marker.addEventListener("click", function(e) {
                _self._openInfo(content, e)
            });
        },
        _constructLineChart: function() {
            var _self = this;
            _self.lineChart = echarts.init(document.getElementById("echarts-line-chart"));
            var lineoption = {
                // title: {
                //     text: '未来一周气温变化'
                // },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['建设工程许可备案记录', '村镇地震区划管理记录', '区划APP访问量']
                },
                grid: {
                    x: 40,
                    x2: 40,
                    y2: 24
                },
                calculable: true,
                xAxis: [{
                    type: 'category',
                    boundaryGap: false,
                    data: ['2017-01', '2017-02', '2017-03', '2017-04', '2017-05', '2017-06', '2017-07']
                }],
                yAxis: [{
                    type: 'value',
                }],
                series: [{
                        name: '建设工程许可备案记录',
                        type: 'line',
                        data: [1810, 1123, 1113, 1323, 1245, 1312, 1034],
                        markPoint: {
                            data: [
                                { type: 'max', name: '最大值' },
                                { type: 'min', name: '最小值' }
                            ]
                        },
                        markLine: {
                            data: [
                                { type: 'average', name: '平均值' }
                            ]
                        }
                    },
                    {
                        name: '村镇地震区划管理记录',
                        type: 'line',
                        data: [1143, 983, 1574, 1545, 1323, 832, 1209],
                        markPoint: {
                            data: [
                                { name: '周最低', value: -2, xAxis: 1, yAxis: -1.5 }
                            ]
                        },
                        markLine: {
                            data: [
                                { type: 'average', name: '平均值' }
                            ]
                        }
                    },
                    {
                        name: '区划APP访问量',
                        type: 'line',
                        data: [1998, 1763, 1243, 1367, 789, 234, 1768],
                        markPoint: {
                            data: [
                                { name: '周最低', value: -2, xAxis: 1, yAxis: -1.5 }
                            ]
                        },
                        markLine: {
                            data: [
                                { type: 'average', name: '平均值' }
                            ]
                        }
                    }
                ]
            };
            _self.lineChart.setOption(lineoption, true);
        },
    }
    return Widget;
});