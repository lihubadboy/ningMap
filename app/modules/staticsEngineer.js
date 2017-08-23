define('modules/staticsEngineer', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common) {
    var Widget = function(options) {
        var _self = this;
        _self.options = options;
        _self.ajaxUtil = new ajaxUtil(_self.options.proxyUrl);
        _self.common = new common();
        _self.res = [];
        _self.res_top3 = [];
        _self.pieres = [];
        _self.pielegends = [];
        _self._init();
    };

    Widget.prototype = {
        _init: function() {
            var _self = this;
            if (_self.options.isLogin == true) {
                _self._getAuthorInfo();
            }
            _self._setDefaultOptions();
            _self._requestStaticsDatas();
            // _self._setMainContentHeight();
            _self.mapChart = echarts.init(document.getElementById("mapDiv"));
            _self.lineChart = echarts.init(document.getElementById("echarts-line-chart"));
            _self._constructLineChart();
            _self._switching();
            _self._requestDatas('pointmap');
            _self._logout();
        },
        _getAuthorInfo: function() {
            var _self = this;
            var cookies = _self.common.getCookieValue(_self.options.authorInfoKey);
            if (cookies == "" || cookies == null || cookies == undefined) {
                window.location.href = "login.html";
            } else {
                _self.options.authorInfo = $.parseJSON(cookies);
                $(".dropdown-toggle").html('<img alt="logo" src="images/user.png"> 欢迎，' + _self.options.authorInfo.username + ' <i class="icon-chevron-down"></i>');
                if (_self.options.authorInfo.localBureau != '中国地震局地球物理研究所') {
                    $('#usermanager').css('display', 'none');
                    $('#statics').css('display', 'none');
                }
            }
        },
        _requestStaticsDatas: function() {
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
        _logout: function() {
            var _self = this;
            $("#logout").on("click", function() {
                _self.common.deleteCookie(_self.options.authorInfoKey, "/");
                window.location.href = "login.html";
            });
        },
        _setDefaultOptions: function() {
            var _self = this;
            _self.common.fixExtention();
        },
        _requestDatas: function(id) {
            var _self = this;
            _self.ajaxUtil.query(_self.options.OprUrls.zoningInfo.queryUrl, 'administRegion=null', function(respons) {
                if (respons.result) {
                    _self.datas = respons.list;
                    _self.viewModuls = _self.datas;
                    _self._constructBdMap();
                }
            }, 'cb49c793-2572-4687-8347-7a14e97c0848');
        },
        _constructBdMap: function(isheatmap) {
            var _self = this;
            if (!_self.map) {
                _self.map = new BMap.Map("mapDiv"); // 创建Map实例
                _self.map.setMapStyle({
                    style: _self.options.city.style
                });
                _self.map.centerAndZoom(_self.options.city, '6');
                _self.map.addControl(new BMap.NavigationControl()); // 添加平移缩放控件
                _self.map.addControl(new BMap.ScaleControl()); // 添加比例尺控件
                _self.map.addControl(new BMap.OverviewMapControl()); //添加缩略地图控件
                _self.map.enableScrollWheelZoom(); //启用滚轮放大缩小
                _self.map.addControl(new BMap.MapTypeControl({
                    type: BMAP_MAPTYPE_CONTROL_MAP
                })); //添加地图类型控件
                _self.options.showBound && _self._getBoundary();
            }
            if (_self.viewModuls) {
                _self.map.closeInfoWindow();
                _self.map.clearOverlays();
                if (!isheatmap) {
                    $.each(_self.viewModuls, function(key, data) {
                        var marker = new BMap.Marker(new BMap.Point(data.longitude, data.latitude));
                        var content = data;
                        _self.map.addOverlay(marker); // 将标注添加到地图中
                        _self._addClickHandler(content, marker);
                    });
                } else {
                    if (!_self._isSupportCanvas()) {
                        alert('热力图目前只支持有canvas支持的浏览器,您所使用的浏览器不能使用热力图功能')
                        return;
                    }
                    var points = [];
                    $.each(_self.viewModuls, function(key, data) {
                        points.push({
                            "lng": data.longitude,
                            "lat": data.latitude,
                            "count": 1
                        });
                    });
                    _self.heatmapOverlay = new BMapLib.HeatmapOverlay({
                        "radius": 40
                    });
                    _self.map.addOverlay(_self.heatmapOverlay);
                    _self.heatmapOverlay.setDataSet({
                        data: points,
                        max: 10
                    });
                    _self.heatmapOverlay.show();
                }
            }
            $('.page-loading-overlay').hide();
        },
        _isSupportCanvas: function() {
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
        },
        _addClickHandler: function(content, marker) {
            var _self = this;
            marker.addEventListener("click", function(e) {
                _self._openInfo(content, e);
            });
        },
        _openInfo: function(content, e) {
            var _self = this;
            var opts = {
                title: content.address,
                width: 240, //宽度
                height: 200,
                panel: "panel",
                enableAutoPan: true, //自动平移
                searchTypes: [

                ]
            };
            var sContent = '';
            if (content.administRegion != null) {
                opts.title = '行政区划点';
                sContent =
                    '<div style="margin:0;line-height:20px;padding:2px;">' +
                    "所属省：" + content.administRegion.province + "<br/>所属市：" + content.administRegion.city + "<br/>所属区/县：" + content.administRegion.county + "<br/>采集员：" + content.administRegion.claimsman + "<br/>Tg：" + parseFloat(content.tg).toFixed(2) + "<br/>PGA：" + parseFloat(content.pga).toFixed(2) +
                    "<br/>地址：" + content.administRegion.address + "</div>";
            } else {
                opts.title = '工程场点';
                sContent =
                    '<div style="margin:0;line-height:20px;padding:2px;">' +
                    "项目名称：" + content.engine.projectName + "<br/>设计单位：" + content.engine.designOrg + "<br/>施工单位：" + content.engine.constructOrg + "<br/>建设周期：" + content.engine.buildingCycle + "<br/>开建时间：" + (new Date(content.engine.startDate)).Format('yyyy年MM月dd日') + "<br/>建成时间：" + (new Date(content.engine.endDate)).Format('yyyy年MM月dd日') +
                    "<br/>地址：" + content.engine.address + "<br/>项目简介：" + content.engine.description + "</div>";
            }
            var p = e.target;
            var point = new BMap.Point(p.getPosition().lng, p.getPosition().lat);
            var infoWindow = new BMapLib.SearchInfoWindow(_self.map, sContent, opts); // 创建信息窗口对象 
            infoWindow.open(point);
        },
        _constructLineChart: function() {
            var _self = this;
            var lineoption = {
                // title: {
                //     text: '近几月App访问量变化'
                // },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['最高气温']
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
                    data: ['一月', '二月', '三月', '四月', '五月', '六月', '七月']
                }],
                yAxis: [{
                    type: 'value',
                }],
                series: [{
                    name: '访问量',
                    type: 'line',
                    center: [120, 80],
                    data: [15, 35, 50, 36, 24, 40, 100],
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
                }]
            };
            _self.lineChart.setOption(lineoption, true);
        },
        _switching: function() {
            var _self = this;
            $('.typeswitch > .btn').on('click', function(e) {
                if ($(this).hasClass('select')) return -1;
                $('.typeswitch > .btn').removeClass('select');
                $(this).addClass('select');

                if ($(this).attr('id') == 'pointmap')
                    _self._constructBdMap(false);
                else
                    _self._constructBdMap(true);
            });
        }
    };

    return Widget;
});