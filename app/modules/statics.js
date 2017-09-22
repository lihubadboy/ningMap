define('modules/statics', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common) {
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
            _self.pieChart = echarts.init(document.getElementById("piechart"));
            _self.barChart = echarts.init(document.getElementById("echarts-bar-chart"));
            _self.lineChart = echarts.init(document.getElementById("echarts-line-chart"));
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
        _logout: function() {
            var _self = this;
            $("#logout").on("click", function() {
                _self.common.deleteCookie(_self.options.authorInfoKey, "/");
                window.location.href = "login.html";
            });
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
        _setDefaultOptions: function() {
            var _self = this;
            _self.common.fixExtention();
        },
        _requestDatas: function(id) {
            var _self = this;
            $('.left').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.calculator.staticUrl, '1=1', function(respons) {
                if (respons.result) {
                    _self.datas = respons.data;
                    _self._requireStaticDatas(id);
                    _self._constructPieChart();
                    _self._constructBarChart();
                    _self._constructLineChart();
                    _self._convertData(_self.datas, id);
                    _self._constructTable();
                    $('.footable-res').footable();
                    $('.tfooter').removeClass('loading-light');
                } else {
                    _self._raiseMessage('获取用量数失败！');
                }
                $('.left').removeClass('loading-light');
            });
        },
        _requireStaticDatas: function(id) {
            var _self = this;
            $('.left').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.calculator.querySimpleUrl, '1=1', function(respons) {
                if (respons.result) {
                  _self.staticdatas = respons.list;
                  _self.points = [], _self.markers = [], _self.hpoints=[];
                  $.each(_self.staticdatas, function(k1, v1) {
                    _self.points.push({
                      name: (v1[0] ? v1[0] : '公众版') + ' - ' + (new Date(v1[5])).Format('yyyy年MM月dd日'),
                      value: [v1[1], v1[2], v1[3], v1[4]]
                    });
                    _self.hpoints.push({"lng":v1[1],"lat":v1[2],"count":v1[3]});
                    _self.markers.push(new BMap.Marker(new BMap.Point(v1[1], v1[2])));
                  });
                  if(id == 'pointmap')
                    _self._constructPointVisualMap(_self.points, 'mapDiv');
                  else if(id == 'heatmap')
                    _self._constructPointHeatMap(_self.hpoints, 'mapDiv');
                  else if(id == 'staticmap')
                    _self._constructClusterMap(_self.markers, 'mapDiv');
                } else {
                  _self._raiseMessage('获取用量数失败！');
                }
            }, _self.options.authorInfo.userid);
        },
        _constructPointVisualMap: function(datas, domID) {
            var _self = this;
            var myChart = echarts.init(document.getElementById(domID));
            var option = {
                title: {
                    text: '区划APP用量点云图',
                    subtext: '中国地震局地球物理研究所© 公益服务',
                    sublink: 'http://www.cea-igp.ac.cn/',
                    left: 'center',
                    textStyle: {
                        color: '#fff'
                    }
                },
                bmap: {
                    roam: true,
                    mapStyle: {
                        'styleJson': [{
                            'featureType': 'water',
                            'elementType': 'all',
                            'stylers': {
                                'color': '#031628'
                            }
                        }, {
                            'featureType': 'land',
                            'elementType': 'geometry',
                            'stylers': {
                                'color': '#000102'
                            }
                        }, {
                            'featureType': 'highway',
                            'elementType': 'all',
                            'stylers': {
                                'visibility': 'off'
                            }
                        }, {
                            'featureType': 'arterial',
                            'elementType': 'geometry.fill',
                            'stylers': {
                                'color': '#000000'
                            }
                        }, {
                            'featureType': 'arterial',
                            'elementType': 'geometry.stroke',
                            'stylers': {
                                'color': '#0b3d51'
                            }
                        }, {
                            'featureType': 'local',
                            'elementType': 'geometry',
                            'stylers': {
                                'color': '#000000'
                            }
                        }, {
                            'featureType': 'railway',
                            'elementType': 'geometry.fill',
                            'stylers': {
                                'color': '#000000'
                            }
                        }, {
                            'featureType': 'railway',
                            'elementType': 'geometry.stroke',
                            'stylers': {
                                'color': '#08304b'
                            }
                        }, {
                            'featureType': 'subway',
                            'elementType': 'geometry',
                            'stylers': {
                                'lightness': -70
                            }
                        }, {
                            'featureType': 'building',
                            'elementType': 'geometry.fill',
                            'stylers': {
                                'color': '#000000'
                            }
                        }, {
                            'featureType': 'all',
                            'elementType': 'labels.text.fill',
                            'stylers': {
                                'color': '#857f7f'
                            }
                        }, {
                            'featureType': 'all',
                            'elementType': 'labels.text.stroke',
                            'stylers': {
                                'color': '#000000'
                            }
                        }, {
                            'featureType': 'building',
                            'elementType': 'geometry',
                            'stylers': {
                                'color': '#022338'
                            }
                        }, {
                            'featureType': 'green',
                            'elementType': 'geometry',
                            'stylers': {
                                'color': '#062032'
                            }
                        }, {
                            'featureType': 'boundary',
                            'elementType': 'all',
                            'stylers': {
                                'color': '#465b6c'
                            }
                        }, {
                            'featureType': 'manmade',
                            'elementType': 'all',
                            'stylers': {
                                'color': '#022338'
                            }
                        }, {
                            'featureType': 'label',
                            'elementType': 'all',
                            'stylers': {
                                'visibility': 'off'
                            }
                        }]
                    }
                },
                tooltip: {
                  trigger: 'item',
                  formatter: function (params, ticket, callback) {
                    return params.name + '<br />' + '地震动峰值加速度：' + params.value[2] + '<br />' + '地震动反应谱特征周期：' + params.value[3];
                  }
                },
                legend: {
                  show: false
                },
                visualMap: {
                    show: false,
                    splitNumber: 5,
                    min: 0,
                    max: 0.5,
                    seriesIndex: 0,
                    showLabel: false,
                    calculable: true,
                    inRange: {
                        color: ['green', '#eac736', '#d94e5d']
                    }

                },
                series: [{
                  name: '区划点',
                  type: 'scatter',
                  data: datas,
                  coordinateSystem: 'bmap',
                  symbolSize: function(val) {
                    return (val[2] + val[3]) * 5;
                  },
                  label: {
                    normal: {
                      formatter: '{b}',
                      position: 'right',
                      show: false
                    },
                    emphasis: {
                      show: true
                    }
                  }
                }]
            };
            myChart.setOption(option);
            var map = myChart.getModel().getComponent('bmap').getBMap();
            map.centerAndZoom(_self.options.city, _self.options.zoomlevel);
            map.addControl(new BMap.NavigationControl({ anchor: BMAP_ANCHOR_TOP_RIGHT }));
            map.addControl(new BMap.ScaleControl());
            map.enableScrollWheelZoom();
        },
        _constructPointHeatMap: function(datas, domID) {
            var _self = this;
            var map = new BMap.Map(domID);
            map.addEventListener('load', function() {
                var heatmapOverlay = new BMapLib.HeatmapOverlay({
                    "radius": 20
                });
                map.addOverlay(heatmapOverlay);
                heatmapOverlay.setDataSet({
                    data: datas,
                    max: 1
                });
                heatmapOverlay.show();
            });
            map.centerAndZoom(_self.options.city, _self.options.zoomlevel);
            map.addControl(new BMap.NavigationControl({ anchor: BMAP_ANCHOR_TOP_RIGHT }));
            map.addControl(new BMap.ScaleControl());
            map.enableScrollWheelZoom();
        },
        _constructClusterMap: function(datas, domID) {
            var _self = this;
            var map = new BMap.Map(domID);
            map.addEventListener('load', function() {
                var markerClusterer = new BMapLib.MarkerClusterer(map, { markers: datas });
            });
            map.centerAndZoom(_self.options.city, _self.options.zoomlevel);
            map.addControl(new BMap.NavigationControl({ anchor: BMAP_ANCHOR_TOP_RIGHT }));
            map.addControl(new BMap.ScaleControl());
            map.enableScrollWheelZoom();
        },
        _constructMapChart: function() {
            var _self = this;
            echarts.dispose(document.getElementById("mapchart"));
            _self.mapChart = echarts.init(document.getElementById("mapchart"));
            _self.mapChart.showLoading();
            var chartOptions = {
                backgroundColor: '#404a59',
                title: {
                    text: '区划APP用量聚合图',
                    subtext: '中国地震局地球物理研究所© 公益服务',
                    sublink: 'http://www.cea-igp.ac.cn/',
                    left: 'center',
                    textStyle: {
                        color: '#fff'
                    }
                },
                tooltip: {
                    trigger: 'item',
                    formatter: function(params) {
                        return params.name + ' : ' + params.value[2] + '次';
                    }
                },
                legend: {
                    orient: 'vertical',
                    y: 'bottom',
                    x: 'right',
                    data: ['访问量'],
                    textStyle: {
                        color: '#fff'
                    }
                },
                geo: {
                    map: 'china',
                    label: {
                        emphasis: {
                            show: false
                        }
                    },
                    roam: true,
                    itemStyle: {
                        normal: {
                            areaColor: '#323c48',
                            borderColor: '#111'
                        },
                        emphasis: {
                            areaColor: '#2a333d'
                        }
                    }
                },
                series: [{
                    name: '访问量',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    data: _self.res,
                    symbolSize: function(val) {
                        return val[2] == 0 ? 1 : val[2] / 10;
                    },
                    label: {
                        normal: {
                            formatter: '{b}',
                            position: 'right',
                            show: true
                        },
                        emphasis: {
                            show: true
                        }
                    },
                    itemStyle: {
                        normal: {
                            color: '#ddb926'
                        }
                    }
                }, {
                    name: 'Top 3',
                    type: 'effectScatter',
                    coordinateSystem: 'geo',
                    data: _self.res_top3,
                    symbolSize: function(val) {
                        return val[2] == 0 ? 1 : val[2] / 10;
                    },
                    showEffectOn: 'render',
                    rippleEffect: {
                        brushType: 'stroke'
                    },
                    hoverAnimation: true,
                    label: {
                        normal: {
                            formatter: '{b}',
                            position: 'right',
                            show: true
                        }
                    },
                    itemStyle: {
                        normal: {
                            color: '#f4e925',
                            shadowBlur: 10,
                            shadowColor: '#333'
                        }
                    },
                    zlevel: 1
                }]
            };

            _self.mapChart.setOption(chartOptions, true);
            _self.mapChart.hideLoading();
        },
        _constructHeatMap: function() {
            var _self = this;
            echarts.dispose(document.getElementById("mapchart"));
            _self.mapChart = echarts.init(document.getElementById("mapchart"));
            _self.mapChart.showLoading();
            var chartOptions = {
                backgroundColor: '#404a59',
                title: {
                    text: '区划APP用量热力图',
                    subtext: '中国地震局地球物理研究所© 公益服务',
                    sublink: 'http://www.cea-igp.ac.cn/',
                    left: 'center',
                    textStyle: {
                        color: '#fff'
                    }
                },
                visualMap: {
                    min: 0,
                    max: _self.datas.sort(function(a, b) { return b.count - a.count; })[0].count + 10,
                    splitNumber: 5,
                    inRange: {
                        color: ['#d94e5d', '#eac736', '#50a3ba'].reverse()
                    },
                    textStyle: {
                        color: '#fff'
                    }
                },
                legend: {
                    show: false
                },
                geo: {
                    map: 'china',
                    label: {
                        emphasis: {
                            show: false
                        }
                    },
                    roam: true,
                    itemStyle: {
                        normal: {
                            areaColor: '#323c48',
                            borderColor: '#111'
                        },
                        emphasis: {
                            areaColor: '#2a333d'
                        }
                    }
                },
                series: [{
                    name: '访问量',
                    type: 'heatmap',
                    coordinateSystem: 'geo',
                    data: _self.res
                }]
            };

            _self.mapChart.setOption(chartOptions, true);
            _self.mapChart.hideLoading();
        },
        _constructCloudMap: function() {
            var _self = this;
            echarts.dispose(document.getElementById("mapchart"));
            _self.mapChart = echarts.init(document.getElementById("mapchart"));
            _self.mapChart.showLoading();
            chartOptions = {
                backgroundColor: '#404a59',
                color: ['rgba(14, 241, 242, 0.8)'],
                title: {
                    text: '区划APP用量点云图',
                    subtext: '中国地震局地球物理研究所© 公益服务',
                    sublink: 'http://www.cea-igp.ac.cn/',
                    x: 'center',
                    textStyle: {
                        color: '#fff'
                    }
                },
                legend: {
                    x: 'right',
                    y: 'bottom',
                    data: ['点云'],
                    textStyle: {
                        color: '#ccc'
                    }
                },
                geo: {
                    name: '点云',
                    type: 'scatter',
                    map: 'china',
                    roam: true,
                    label: {
                        emphasis: {
                            show: false
                        }
                    },
                    itemStyle: {
                        normal: {
                            areaColor: '#323c48',
                            borderColor: '#111'
                        },
                        emphasis: {
                            areaColor: '#2a333d'
                        }
                    }
                },
                series: [{
                    name: '点云',
                    type: 'scatter',
                    coordinateSystem: 'geo',
                    symbolSize: 1,
                    large: true,
                    showEffectOn: 'render',
                    rippleEffect: {
                        brushType: 'stroke'
                    },
                    hoverAnimation: true,
                    label: {
                        normal: {
                            show: false
                        },
                        emphasis: {
                            formatter: '{b}',
                            position: 'right',
                            show: true
                        }
                    },
                    itemStyle: {
                        normal: {
                            shadowBlur: 1,
                            shadowColor: 'rgba(214, 158, 63, 0.8)',
                            color: 'rgba(214, 158, 63, 0.8)'
                        }
                    },
                    data: (function() {
                        var data = [];
                        $.each(_self.staticdatas, function(k, v) {
                            data.push({
                                name: v.userid,
                                value: [v.longitude, v.latitude, 1]
                            })
                        });
                        return data;
                    })()
                }]
            };
            _self.mapChart.setOption(chartOptions, true);
            _self.mapChart.hideLoading();
        },
        _convertData: function(datas, id) {
            var _self = this;
            _self.res = [];
            _self.pieres = [];
            _self.barX = [];
            _self.barY = [];
            var totalNum = 0;
            $.each(datas, function(key, val) {
                totalNum += val.count;
                //pie chart
                _self.pieres.push({
                    name: (val.name ? val.name : '未知'),
                    value: val.count
                });
                if (val.name) {
                    _self.barX.push(val.name ? val.name : '未知');
                    _self.barY.push(val.count);
                }
                _self.pielegends.push(val.name);
            });
            $('.total-num').html('总访问量：' + totalNum);
            _self.pieChart.setOption({
                legend: {
                    data: _self.pielegends
                },
                series: [{
                    name: '访问来源',
                    data: _self.pieres
                }]
            });
            _self.barChart.setOption({
                xAxis: [{
                    type: 'category',
                    data: _self.barX
                }],
                series: [{
                    name: '访问来源',
                    data: _self.barY
                }]
            });
        },
        _constructPieChart: function() {
            var _self = this;
            var option = {
                // title: {
                //     text: '区划APP访问来源',
                //     subtext: '中国地震局地球物理研究所© 公益服务',
                //     sublink: 'http://www.cea-igp.ac.cn/',
                //     x: 'left'
                // },
                tooltip: {
                    trigger: 'item',
                    formatter: "{a} <br/>{b} : {c} ({d}%)"
                },
                legend: {
                    show: false
                },
                series: [{
                    name: '访问来源',
                    type: 'pie',
                    radius: '60%',
                    center: ['50%', '55%'],
                    data: _self.pieres,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, 0.5)'
                        }
                    }
                }]
            };
            _self.pieChart.setOption(option, true);
        },
        _constructBarChart: function() {
            var _self = this;
            var baroption = {
                // title: {
                //     text: '区划APP访问来源',
                //     subtext: '中国地震局地球物理研究所© 公益服务',
                //     sublink: 'http://www.cea-igp.ac.cn/',
                //     x: 'left'
                // },
                tooltip: {
                    trigger: 'axis'
                },
                legend: {
                    data: ['访问量']
                },
                grid: {
                    x: 30,
                    x2: 40,
                    y2: 24
                },
                calculable: true,
                xAxis: [{
                    type: 'category',
                    data: ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
                }],
                yAxis: [{
                    type: 'value'
                }],
                series: [{
                    name: '访问量',
                    type: 'bar',
                    data: [2.0, 4.9, 7.0, 23.2, 25.6, 76.7, 135.6, 162.2, 32.6, 20.0, 6.4, 3.3],
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
            _self.barChart.setOption(baroption, true);
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
                    data: [1123, 1145, 1534, 1314, 1246, 1378, 1098],
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
        _constructTable: function() {
            var _self = this;
            var html = '';
            $.each(_self.datas.sort(function(a, b) { return b.count - a.count; }), function(key, val) {
                html += '<tr index="' + key + '">';
                html += '<td style="width:65%;">' + (val.name ? val.name : '未知') + '</td>';
                html += '<td style="width:35%;">' + val.count + '</td>';
                html += '</tr>';
            });
            $('.tableContent').html(html);
        },
        _switching: function() {
            var _self = this;

            $('.typeswitch > .btn').on('click', function(e) {
                if ($(this).hasClass('select')) return -1;
                $('.typeswitch > .btn').removeClass('select');
                $(this).addClass('select');
                if ($(this).attr('id') == 'pointmap') {
                    _self._constructPointVisualMap(_self.points, 'mapDiv');
                } else if ($(this).attr('id') == 'heatmap') {
                    _self._constructPointHeatMap(_self.hpoints, 'mapDiv');
                } else {
                    _self._constructClusterMap(_self.markers, 'mapDiv');
                }
            });
        },
        _initTableScrollBar: function(id, position) {
            $.mCustomScrollbar.defaults.theme = "dark";
            $(id).mCustomScrollbar({ scrollbarPosition: position == null ? 'inside' : position, autoHideScrollbar: true });
            $(id).mCustomScrollbar('update');
        },
        _updateTableScrollBar: function(id) {
            $(id).mCustomScrollbar('update');
        },
        _destroyTableScrollBar: function(id) {
            $(id).mCustomScrollbar('destroy');
        },
        _setMainContentHeight: function() {
            var _self = this;
            $('#piechart').css('height', $('.right').innerHeight() / 2);
            $('#table').css('max-height', $('.right').innerHeight() / 2);
            // window resize
            $(window).on('resize', function(e) {
                //clear any existing resize timer
                clearTimeout(_self.options.mapTimer);
                //create new resize timer with delay of 300 milliseconds
                _self.options.mapTimer = setTimeout(function() {
                    _self.resize();
                    $(_self).trigger('resize');
                }, 300);
            });
        },
        resize: function(event) {
            var _self = this;
            _self._setMainContentHeight();
        },
        _raiseMessage: function(msg) {
            $('.top-right').notify({
                message: {
                    html: msg
                },
                type: 'success',
                transition: 'fade',
                fadeOut: {
                    delay: 2500
                }
            }).show();
        }
    };

    return Widget;
});