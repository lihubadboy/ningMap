define('modules/administrative', ['utils/ajaxUtil', 'utils/common', 'utils/SeismogramUtil'], function(ajaxUtil, common, SeismogramUtil) {
    var Widget = function(options) {
        var _self = this;
        _self.options = options;
        _self.ajaxUtil = new ajaxUtil(_self.options.proxyUrl);
        _self.common = new common();
        _self.SeismogramUtil = new SeismogramUtil();
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
            _self._switching();
            _self._requestDatas();
            _self._dialog();
            _self._delete();
            _self._refresh();
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
        _constructBdMap: function(isheatmap) {
            var _self = this;
            if (!_self.map) {
                _self.map = new BMap.Map("map-container"); // 创建Map实例
                _self.map.setMapStyle({
                    style: _self.options.city.style
                });
                _self.map.centerAndZoom(_self.options.city, _self.options.city.zoomlevel);
                _self.map.addControl(new BMap.NavigationControl()); // 添加平移缩放控件
                _self.map.addControl(new BMap.ScaleControl()); // 添加比例尺控件
                _self.map.addControl(new BMap.OverviewMapControl()); //添加缩略地图控件
                _self.map.enableScrollWheelZoom(); //启用滚轮放大缩小
                _self.map.addControl(new BMap.MapTypeControl({ type: BMAP_MAPTYPE_CONTROL_MAP })); //添加地图类型控件
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
        _addClickHandler: function(content, marker) {
            var _self = this;
            marker.addEventListener("click", function(e) {
                _self._openInfo(content, e)
            });
        },
        _isSupportCanvas: function() {
            var elem = document.createElement('canvas');
            return !!(elem.getContext && elem.getContext('2d'));
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
                    "所属省：" + content.administRegion.province + "<br/>所属市：" + content.administRegion.city + "<br/>所属区/县：" + content.administRegion.county + "<br/>采集员：" + content.administRegion.claimsman + "<br/>Tg：" + content.tg + "<br/>PGA：" + content.pga +
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
        _constructDetialMap: function(data) {
            var _self = this;
            if (!_self.detialMap) {
                _self.detialMap = new BMap.Map("detial-map"); // 创建Map实例
                _self.detialMap.setMapStyle({
                    style: _self.options.city.style
                });
                _self.detialMap.addControl(new BMap.NavigationControl({ anchor: BMAP_ANCHOR_TOP_LEFT, type: BMAP_NAVIGATION_CONTROL_SMALL }));
            }
            _self.selectMarker && _self.detialMap.removeOverlay(_self.selectMarker);
            var point = new BMap.Point(data.longitude, data.latitude);
            _self.selectMarker = new BMap.Marker(point);
            _self.detialMap.addOverlay(_self.selectMarker);
            _self.selectMarker.setAnimation(BMAP_ANIMATION_BOUNCE);
            _self.detialMap.centerAndZoom(point, 18);
        },
        _requestDatas: function() {
            var _self = this;
            $('.tfooter').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.zoningInfo.queryUrl, 'engine=null', function(respons) {
                if (respons.result) {
                    _self.datas = respons.list;
                    _self.viewModuls = _self.datas;
                    _self._constructTable();
                    _self._constructBdMap();
                    $('.footable-res').footable();
                    // _self._constructTypeaHead();
                    $('.tfooter').removeClass('loading-light');
                }
            }, 'cb49c793-2572-4687-8347-7a14e97c0848');
        },
        _constructTable: function() {
            var _self = this;
            var html = '';
            $.each(_self.viewModuls, function(key, val) {
                html += '<tr index="' + key + '">';
                html += '<td style="width:5%;"><input type="checkbox"></td>';
                html += '<td style="width:25%;">' + val.administRegion.address + '</td>';
                html += '<td style="width:20%;">' + val.administRegion.claimsman + '</td>';
                html += '<td style="width:10%;">' + val.longitude + '</td>';
                html += '<td style="width:10%;">' + val.latitude + '</td>';
                html += '<td style="width:10%;"><strong>' + val.tg + '</strong></td>';
                html += '<td style="width:10%;"><strong>' + val.pga + '<strong></td>';
                html += '<td style="width:10%;">' + (new Date(val.createTime)).Format('yyyy年MM月dd日') + '</td>';
                html += '</tr>';
            });
            $('.tableContent').html(html);
            $('#chkAll').attr('checked', false);

            //handel events
            $('.footable > tbody > tr').on('click', function(e) {
                if (e.target.tagName == 'INPUT') return -1;
                _self.selectData = _self.viewModuls[parseInt($(this).attr('index'))];
                _self._showDetialPanel();
                _self._constructDetialInfo(_self.selectData);
                setTimeout(function(e) {
                    _self._constructDetialMap(_self.selectData);
                }, 300);
                $('.backBtn').on('click', function() {
                    _self._hideDetialPanel();
                })
            });

            //connect check for all
            $('#chkAll').on('click', function(event) {
                $.each($('#admTable input'), function(index, node) {
                    node.checked = event.currentTarget.checked;
                });
            });

            $('#admTable input').on('click', function(e) {
                $('#chkAll').prop('checked', $('#admTable input:checked').length == $('#admTable input').length);
            });
        },
        _constructDetialInfo: function(data) {
            var _self = this;
            var html = '';
            $('.projectTitle').html(data.administRegion.address);

            html += _self._constructInfoPanel_6('省', data.administRegion.province, 1);
            html += _self._constructInfoPanel_6('市', data.administRegion.city, 0);
            html += _self._constructInfoPanel_6('区/县', data.administRegion.county, 1);
            html += _self._constructInfoPanel_6('镇', data.administRegion.town, 0);
            html += _self._constructInfoPanel_6('村', data.administRegion.village, 1);
            html += _self._constructInfoPanel_6('调查员', data.administRegion.claimsman, 0);

            $('#detial-info').html(html);

            var peakData = _self._constructPeakTable(data);
            _self._constructPeriodTable(data);
            _self._constructPHeightTable(peakData);
            _self._constructThumbs(data);
            // _self._initTableScrollBar('#detials', 'outside');
        },
        _constructThumbs: function(data) {
            var _self = this;
            var html = '';
            html += '<p class="sub-title">附件信息</p>';
            if (data.administRegion.attachments == null || data.administRegion.attachments.length == 0) {
                html += '<p class="text-muted text-center">未上传附件信息</p>';
            } else {
                html += '<div class="row">';
                $.each(data.administRegion.attachments, function(key, val) {
                    html += '<div class="col-xs-6 col-md-3">';
                    html += '<a href="#" class="thumbnail" role="button">';
                    html += '<img src="' + _self.options.thumbnailBaseUrl + val.url + '">';
                    html += '</a>';
                    html += '</div>';
                });
                html += '</div>';
            }
            $('.attachments').html(html);

            $('.attachments a').on('click', function(e) {
                var selectUrl = $(this).children('img').attr('src');
                var thtml = '';
                thtml += '<div class="carousel-inner" role="listbox">';
                thtml += '<div class="item active" style="background: url(' + selectUrl + ') no-repeat center center;background-size:contain;"></div>';
                $.each(_self.selectData.administRegion.attachments, function(key, val) {
                    if (selectUrl.indexOf(val.url) < 0)
                        thtml += '<div class="item" style="background: url(' + _self.options.thumbnailBaseUrl + val.url + ') no-repeat center center;background-size:contain;"></div>';
                });
                thtml += '</div>';
                thtml += '<a class="left carousel-control" href="#carousel-example-generic" role="button" data-slide="prev"><span class="glyphicon glyphicon-chevron-left" aria-hidden="true"></span><span class="sr-only">Previous</span></a>';
                thtml += '<a class="right carousel-control" href="#carousel-example-generic" role="button" data-slide="next"><span class="glyphicon glyphicon-chevron-right" aria-hidden="true"></span><span class="sr-only">Next</span></a>';
                $('#carousel-example-generic').html(thtml);
                $('#dlgThumb').modal('show');
                $('.carousel .item').css('height', document.body.clientHeight - 120);
                $('.carousel .item').on('dblclick', function(e) {
                    $('#dlgThumb').modal('hide');
                });
            });
        },
        _constructPeakTable: function(data) {
            var peakdata;
            var _self = this;
            var html = '';
            peakdata = _self.SeismogramUtil.peak(data.pga);
            $.each(peakdata, function(key, val) {
                html += '<tr>';
                html += '<td><strong>' + _self._getParmeterAlias(key) + '</strong></td>';
                html += '<td>' + val[0] + '</td>';
                html += '<td>' + val[1] + '</td>';
                html += '<td>' + val[2] + '</td>';
                html += '<td>' + val[3] + '</td>';
                html += '<td>' + val[4] + '</td>';
                html += '</tr>';
            });
            $('.peakTable0').html(html);
            return peakdata;
        },
        _constructPeriodTable: function(data) {
            var peakdata;
            var _self = this;
            var html = '';
            peakdata = _self.SeismogramUtil.period(data.tg);
            $.each(peakdata, function(key, val) {
                html += '<tr>';
                html += '<td><strong>' + _self._getParmeterAlias(key) + '</strong></td>';
                html += '<td>' + val[0] + '</td>';
                html += '<td>' + val[1] + '</td>';
                html += '<td>' + val[2] + '</td>';
                html += '<td>' + val[3] + '</td>';
                html += '<td>' + val[4] + '</td>';
                html += '</tr>';
            });
            $('.peakTable1').html(html);
            return peakdata;
        },
        _constructPHeightTable: function(peakData) {
            var phdata;
            var _self = this;
            var html = '';
            phdata = _self.SeismogramUtil.platformHeight(peakData);
            $.each(phdata, function(key, val) {
                html += '<tr>';
                html += '<td><strong>' + _self._getParmeterAlias(key) + '</strong></td>';
                html += '<td>' + val[0] + '</td>';
                html += '<td>' + val[1] + '</td>';
                html += '<td>' + val[2] + '</td>';
                html += '<td>' + val[3] + '</td>';
                html += '<td>' + val[4] + '</td>';
                html += '</tr>';
            });
            $('.peakTable2').html(html);
            return phdata;
        },
        _constructInfoPanel_6: function(header, content, isleft) {
            var html = '';
            html += (isleft ? '<div class="col-md-6 info clear-padding-left">' : '<div class="col-md-6 info clear-padding-right">');
            html += '<p class="high-light">' + header + '<strong class="pull-right">' + content + '</strong></p>';
            html += '</div>';
            return html;
        },
        _constructInfoPanel_12: function(header, content) {
            var html = '';
            html += '<div class="col-md-12 info clear-padding-left clear-padding-right">';
            html += '<p class="high-light">' + header + '<strong class="pull-right">' + content + '</strong></p>';
            html += '</div>';
            return html;
        },
        _constructTypeaHead: function() {
            var _self = this;
            //get typeahead source
            var source = _self._getTypeaheadSource();
            var admin_adrs = new Bloodhound({
                datumTokenizer: Bloodhound.tokenizers.obj.whitespace('adminAdr'),
                queryTokenizer: Bloodhound.tokenizers.whitespace,
                local: $.map(source.adminadrs, function(data) {
                    return {
                        adminAdr: data
                    };
                })
            });
            admin_adrs.initialize();
            $('#searchDiv .typeahead').typeahead({
                highlight: true,
                hint: false
            }, {
                name: 'admin_adrs',
                displayKey: 'adminAdr',
                source: admin_adrs.ttAdapter(),
                templates: {
                    empty: [
                        '<p class="empty-message muted">',
                        '未能找到匹配的项',
                        '</p>'
                    ].join('\n')
                }
            });
            $('#searchDiv .typeahead').on('typeahead:selected', function(args, data, name) {
                _self.viewModuls = _self.datas;
                if (data != null && name != null) {
                    if (name == 'admin_adrs') {
                        _self.viewModuls = $.grep(_self.viewModuls, function(val, key) {
                            return val.administRegion.address.indexOf(data.adminAdr) > -1;
                        });
                    }
                    _self._raiseMessage('共找到<strong>' + _self.viewModuls.length + '</strong>条记录.');
                    _self._hideDetialPanel();
                    _self.resize();
                    _self._constructTable();
                }
            });
            $('#searchDiv .typeahead').on('keyup', function(event) {
                if ((event.keyCode == 8 || event.keyCode == 46 || event.keyCode == 32) && $('#searchDiv .typeahead').val().trim() == '') {
                    _self.viewModuls = _self.datas;
                    _self._hideDetialPanel();
                    _self.resize();
                    _self._constructTable();
                }
            });
            $('#searchDiv .typeahead').on('keydown', function(event) {
                if (event.keyCode == 13 && $('#searchDiv .typeahead').val().trim() != '') {
                    if ($('#searchDiv .typeahead').val().trim() == '') return;
                    $('#searchDiv .typeahead').blur();
                    var searchVal = $('#searchDiv .typeahead').val().trim();
                    _self.viewModuls = $.grep(_self.datas, function(val, key) {
                        return (val.administRegion.address.indexOf(searchVal) > -1);
                    });
                    _self._raiseMessage('共找到<strong>' + _self.viewModuls.length + '</strong>条记录.');
                    _self._hideDetialPanel();
                    _self.resize();
                    _self._constructTable();
                    return false;
                }
            });
            //set menu width
            $('.tt-dropdown-menu').css('width', $('#searchBox').innerWidth());

            // window resize
            $(window.app).on('resize', function() {
                if ($('.tt-dropdown-menu').length > 0)
                    $('.tt-dropdown-menu').css('width', $('#searchBox').innerWidth());
            });
        },
        _getTypeaheadSource: function() {
            var _self = this;
            var result = {
                adminadrs: []
            };
            if (_self.datas == null) return result;
            $.each(_self.datas, function(index, val) {
                if ($.inArray(val.administRegion.address, result.adminadrs) == -1)
                    result.adminadrs.push(val.administRegion.address);
            });
            return result;
        },
        _initTableScrollBar: function(id, position) {
            $.mCustomScrollbar.defaults.theme = "dark";
            $(id).mCustomScrollbar({
                scrollbarPosition: position == null ? 'inside' : position,
                autoHideScrollbar: true
            });
            $(id).mCustomScrollbar('update');
        },
        _updateTableScrollBar: function(id) {
            $(id).mCustomScrollbar('update');
        },
        _destroyTableScrollBar: function(id) {
            $(id).mCustomScrollbar('destroy');
        },
        _getParmeterAlias: function(index) {
            switch (index) {
                case 0:
                    return '多遇地震动';
                    break;
                case 1:
                    return '基本地震动';
                    break;
                case 2:
                    return '罕遇地震动';
                    break;
                case 3:
                    return '极罕遇地震动';
                    break;
            }
        },
        _setMainContentHeight: function() {
            var _self = this;
            $('.tab-pane').css('height', document.body.clientHeight - $('.navbar-dark').innerHeight() - $('.header').outerHeight(true) - 24);
            $('.content').css('max-height', document.body.clientHeight - $('.navbar-dark').innerHeight() - $('.header').outerHeight(true) - 24);
            $('#admTable').css('max-height', document.body.clientHeight - $('.navbar-dark').innerHeight() - $('.header').outerHeight(true) - $('#admTableHeader').outerHeight(true) - 24);
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
            _self._updateTableScrollBar('#detials');
            _self._updateTableScrollBar('#admTable');
        },
        _showDetialPanel: function() {
            var _self = this;
            $('.title-alt').hide();
            $('.departmentlist').hide();
            $('#contentDetail').show();;
        },
        _hideDetialPanel: function() {
            var _self = this;
            $('.title-alt').show();
            $('.departmentlist').show();
            $('#contentDetail').hide();
        },
        _switching: function() {
            var _self = this;
            $('.btn-switch > .btn').on('click', function(e) {
                if ($(this).hasClass('select')) return -1;
                $('.btn-switch > .btn').removeClass('select');
                $(this).addClass('select');
                if ($(this).attr('id') == 'list') {
                    $('.header').show();
                    $('#table-container').show();
                    $('.btn-typeswitch').hide();
                    $('#map-container').hide();
                } else {
                    $('.header').hide();
                    $('#table-container').hide();
                    $('.btn-typeswitch').show();
                    $('#map-container').show();
                }
                _self.map.centerAndZoom(_self.options.city, _self.options.zoomlevel);
            });

            $('.btn-typeswitch > .btn').on('click', function(e) {
                if ($(this).hasClass('select')) return -1;
                $('.btn-typeswitch > .btn').removeClass('select');
                $(this).addClass('select');

                if ($(this).attr('id') == 'pointmap')
                    _self._constructBdMap(false);
                else
                    _self._constructBdMap(true);
            });
        },
        _dialog: function() {
            var _self = this;

        },
        _delete: function() {
            var _self = this;
            $('#btnDeleteSelected').on('click', function(e) {
                if ($('#admTable input:checked').length == 0) {
                    $('#deleteContent').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> 请先选择要删除的数据！');
                    $('#dlgDelete .modal-footer').css('display', 'none');
                    $('#dlgDelete').modal('show');
                } else {
                    $('#deleteContent').html('<span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span> 确认删除选中的数据？');
                    $('#dlgDelete .modal-footer').css('display', 'block');
                    $('#dlgDelete').modal({
                        backdrop: 'static'
                    });
                }
                _self.isDeleteSingle = false;
            });

            $('#btnDeleteCurrent').on('click', function(e) {
                $('#deleteContent').html('<span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span> 确认删除该记录？');
                $('#dlgDelete .modal-footer').css('display', 'block');
                $('#dlgDelete').modal({
                    backdrop: 'static'
                });
                _self.isDeleteSingle = true;
            });

            $('#btnDelete').on('click', function(e) {
                $('#deleteContent').html('<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span> 正在删除...');
                if (!_self.isDeleteSingle) {
                    var selectNodes = $('#admTable').find('input:checked');
                    var deleteDatas = [];
                    $.each(selectNodes, function(index, val) {
                        deleteDatas.push(_self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))].id);
                    });
                    _self.ajaxUtil.delete(_self.options.OprUrls.zoningInfo.deleteUrl, deleteDatas, function(respons) {
                        if (respons.result) {
                            $('#deleteContent').html('<span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> 删除数据成功！');
                            _self._hideDetialPanel();
                            _self.resize();
                            _self._requestDatas();
                        } else {
                            $('#deleteContent').html('<span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span> 删除数据失败！');
                        }
                        setTimeout(function(e) {
                            $('#dlgDelete').modal('hide');
                        }, 300);
                    });
                } else {
                    var deleteDatas = [_self.selectData.id];
                    _self.ajaxUtil.delete(_self.options.OprUrls.zoningInfo.deleteUrl, deleteDatas, function(respons) {
                        if (respons.result) {
                            $('#deleteContent').html('<span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> 删除数据成功！');
                            _self._hideDetialPanel();
                            _self.resize();
                            _self._requestDatas();
                        } else {
                            $('#deleteContent').html('<span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span> 删除数据失败！');
                        }
                        setTimeout(function(e) {
                            $('#dlgDelete').modal('hide');
                        }, 300);
                    });
                }
            });
        },
        _refresh: function() {
            var _self = this;
            $('#btnRefresh').on('click', function(e) {
                _self._hideDetialPanel();
                _self.resize();
                _self._requestDatas();
            });
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