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
            // if (_self.options.isLogin == true) {
            //   _self._getAuthorInfo();
            // }
            _self._setDefaultOptions();
            _self._setMainContentHeight();
            _self.mapChart = echarts.init(document.getElementById("mapDiv"));
            // _self.pieChart = echarts.init(document.getElementById("piechart"));
            _self._switching();
            _self._requestDatas('heatmap');
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
        _setDefaultOptions: function() {
            var _self = this;
            _self.common.fixExtention();
        },
        _requestDatas: function(id) {
            var _self = this;
            $('#table-container').empty();
            $('.left').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.calculator.staticUrl, '1=1', function(respons) {
                if (respons.result) {
                    _self.datas = respons.data;
                    _self._requireStaticDatas(id);
                    // _self._constructPieChart();
                    // _self._convertData(_self.datas, id);
                    // _self._constructTable();
                } else {
                    _self._raiseMessage('获取用量数失败！');
                }
                $('.left').removeClass('loading-light');
            });
        },
        _requireStaticDatas: function(id) {
            var _self = this;
            $('.left').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.calculator.queryUrl, '1=1', function(respons) {
                if (respons.result) {
                    _self.staticdatas = respons.list;
                    _self.points = [], _self.markers = [], _self.hpoints = [];
                    $.each(_self.staticdatas, function(k1, v1) {
                        _self.points.push({
                            name: (new Date(v1.createTime)).Format('yyyy年MM月dd日'),
                            value: [v1.longitude, v1.latitude, v1.tg, v1.pga]
                        });
                        _self.hpoints.push({ "lng": v1.longitude, "lat": v1.latitude, "count": v1.pga });
                        if (v1.longitude == null || v1.latitude == null) {
                            console.log(v1.longitude);
                        }
                        _self.markers.push(new BMap.Marker(new BMap.Point(v1.longitude, v1.latitude)));
                    });
                    if (id == 'pointmap')
                        _self._constructPointVisualMap(_self.points, 'mapDiv');
                    else if (id == 'heatmap')
                        _self._constructPointHeatMap(_self.hpoints, 'mapDiv');
                    else if (id == 'staticmap')
                        _self._constructClusterMap(_self.markers, 'mapDiv');
                } else {
                    _self._raiseMessage('获取用量数失败！');
                }
                $('.left').removeClass('loading-light');
            }, 'cb49c793-2572-4687-8347-7a14e97c0848');
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
                    trigger: 'item'
                },
                legend: {
                    orient: 'vertical',
                    y: 'bottom',
                    x: 'right',
                    data: ['区划点'],
                    textStyle: {
                        color: '#fff'
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
                    },
                    itemStyle: {
                        normal: {
                            color: '#a6c84c'
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
            var totalNum = 0;
            $.each(datas, function(key, val) {
                totalNum += val.count;
                //map chart
                // if (!id || id == 'staticmap') {
                //   val.longitude && _self.res.push({
                //         name: val.name,
                //         value: [val.longitude, val.latitude, val.count]
                //   });
                //     _self.mapChart.setOption({
                //       series: [{
                //         name: '访问量',
                //         data: _self.res
                //       }]
                //     });
                //     if (key == datas.length - 1) {
                //       _self.res_top3 = _self.res.sort(function(a, b) {
                //         return b.value[2] - a.value[2];
                //       }).slice(0, 3);
                //       _self.mapChart.setOption({
                //         series: [{
                //           name: 'Top 3',
                //           data: _self.res_top3
                //         }]
                //       });
                //     }
                // }
                //pie chart
                _self.pieres.push({
                    name: (val.name ? val.name : '未知'),
                    value: val.count
                });
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
        },
        _constructPieChart: function() {
            var _self = this;
            var option = {
                title: {
                    text: '区划APP访问来源',
                    subtext: '中国地震局地球物理研究所© 公益服务',
                    sublink: 'http://www.cea-igp.ac.cn/',
                    x: 'center'
                },
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
        _constructTable: function() {
            var _self = this;
            var html = '';
            html += '<div id="admTableHeader" class="col-md-12 clear-padding-left clear-padding-right">';
            html += '<table class="table table-striped table-hover">';
            html += '<thead>';
            html += '<tr>';
            html += '<th style="width:65%;">单位名称</th>';
            html += '<th style="width:35%;">访问量</th>';
            html += '</tr>';
            html += '</thead>';
            html += '</table>';
            html += '</div>';
            html += '<div id="admTable" class="col-md-12 clear-padding-left clear-padding-right">';
            html += '<table class="table table-striped table-hover">';
            html += '<tbody>';
            $.each(_self.datas.sort(function(a, b) { return b.count - a.count; }), function(key, val) {
                html += '<tr index="' + key + '">';
                html += '<td style="width:65%;">' + (val.name ? val.name : '未知') + '</td>';
                html += '<td style="width:35%;">' + val.count + '</td>';
                html += '</tr>';
            });
            html += '</tbody>';
            html += '</table>';
            html += '</div>';

            $('#table').html(html);
            $('#admTable').css('max-height', $('.right').innerHeight() / 2 - $('#admTableHeader').outerHeight(true));
            _self._initTableScrollBar('#admTable');
            $('.right').removeClass('loading-dark');
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