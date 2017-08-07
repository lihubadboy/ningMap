define('modules/usermanager', ['utils/ajaxUtil', 'utils/common'], function(ajaxUtil, common) {
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
            // if (_self.options.isLogin == true) {
            //     _self._getAuthorInfo();
            // }
            _self._setDefaultOptions();
            _self._setMainContentHeight();
            _self._requestDatas();
            _self._bureauManager();
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
        _constructBdMap: function() {
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
                _self.map.addControl(new BMap.MapTypeControl()); //添加地图类型控件
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
            $('.page-loading-overlay').hide();
        },
        _addClickHandler: function(content, marker) {
            var _self = this;
            marker.addEventListener("click", function(e) {
                _self._openInfo(content, e)
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
            var myGeo = new BMap.Geocoder();
            myGeo.getPoint(data.address, function(point) {
                if (point) {
                    _self.selectMarker = new BMap.Marker(point);
                    _self.detialMap.addOverlay(_self.selectMarker);
                    _self.selectMarker.setAnimation(BMAP_ANIMATION_BOUNCE);
                    _self.detialMap.centerAndZoom(point, 11);
                }
            }, "");
        },
        _requestDatas: function() {
            var _self = this;
            $('#table-container').empty();
            $('.left').addClass('loading-light');
            _self.ajaxUtil.query(_self.options.OprUrls.bureau.queryUrl, '1=1', function(respons) {
                if (respons.result) {
                    _self.datas = respons.list;
                    _self.viewModuls = _self.datas;
                    _self._constructTable();
                    // _self._constructTypeaHead();
                    $('.left').removeClass('loading-light');
                }
            });
        },
        _constructTable: function() {
            var _self = this;
            var html = '';
            $.each(_self.viewModuls, function(key, val) {
                html += '<tr index="' + key + '">';
                html += '<td><input type="checkbox"></td>';
                html += '<td>' + val.name + '</td>';
                html += '<td>' + val.ip + '</td>';
                html += '<td>' + val.address + '</td>';
                html += '<td>' + val.description + '</td>';
                html += '</tr>';
            });
            $('.tableContent').html(html);
            $('.footable-res').footable();
            $('#admTable').css('max-height', document.body.clientHeight - $('.navbar-dark').innerHeight() - $('.header').outerHeight(true) - $('#admTableHeader').outerHeight(true) - 24);
            // _self._initTableScrollBar('#admTable', 'outside');
            $('#chkAll').attr('checked', false);

            //handel events
            $('.table > tbody > tr').on('click', function(e) {
                if (e.target.tagName == 'INPUT') return -1;
                if ($(this).hasClass('select')) {
                    $(this).removeClass('select') && _self._hideDetialPanel();
                    _self.selectData = null;
                    return -1;
                }
                $('.table > tbody > tr').removeClass('select') && $(this).addClass('select');
                _self.selectData = _self.viewModuls[parseInt($(this).attr('index'))];
                _self._showDetialPanel();
                _self._constructDetialInfo(_self.selectData);
                setTimeout(function(e) {
                    _self._constructDetialMap(_self.selectData);
                }, 300);
                $('.right').removeClass('loading-dark');
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
            $('.title').html(data.name);

            html += _self._constructInfoPanel_6('IP', data.ip, 1);
            html += _self._constructInfoPanel_6('地址', data.address, 0);
            html += _self._constructInfoPanel_12('备注', data.description);

            $('#detial-info').html(html);
            _self._constructUserTable(data.id);
            _self._initTableScrollBar('#detials', 'outside');
        },
        _constructUserTable: function(bureauid) {
            var _self = this;
            var html = '';
            html += '<ul class="list-inline">';
            html += '<li><p class="sub-title">单位用户列表</p></li>';
            html += '<li class="pull-right">';
            html += '<button id="btnDeleteUser" class="btn btn-default btn-xs btn-custom" type="submit"><span class="glyphicon glyphicon-trash" aria-hidden="true"></span> 删除用户</button>';
            html += '</li>';
            html += '<li class="pull-right">';
            html += '<button id="btnUpdateUser" class="btn btn-default btn-xs btn-custom" type="submit"><span class="glyphicon glyphicon-pencil" aria-hidden="true"></span> 编辑用户</button>';
            html += '</li>';
            html += '<li class="pull-right">';
            html += '<button id="btnAddUser" class="btn btn-default btn-xs btn-custom" type="submit"><span class="glyphicon glyphicon-plus" aria-hidden="true"></span> 添加用户</button>';
            html += '</li>';
            html += '<li class="pull-right">';
            html += '<button id="btnImportUser" class="btn btn-default btn-xs btn-custom" type="submit"><span class="glyphicon glyphicon-import" aria-hidden="true"></span> 导入用户</button>';
            html += '</li>';
            html += '<table class="table table-bordered table-hover" id="userTableHeader" style="margin-bottom: 0;border-bottom: 0;">';
            html += '<thead>';
            html += '<tr>';
            html += '<th style="width:5%;"><input id="chkAllUsr" type="checkbox"></th>';
            html += '<th style="width:15%;">用户名</th>';
            html += '<th style="width:25%;">别名</th>';
            html += '<th style="width:15%;">角色</th>';
            html += '<th style="width:20%;">联系电话</th>';
            html += '<th style="width:20%;">邮箱地址</th>';
            html += '</tr>';
            html += '</thead>';
            html += '</table>';
            html += '</div>';
            html += '<div id="userTable">';
            html += '<table class="table table-bordered table-hover">';
            html += '<tbody>';
            _self.ajaxUtil.query(_self.options.OprUrls.user.queryUrl, "Regionalid='" + bureauid + "'", function(respons) {
                if (respons.result && respons.list) {
                    $.each(respons.list, function(key, val) {
                        html += '<tr index="' + key + '">';
                        html += '<td style="width:5%;"><input type="checkbox"></td>';
                        html += '<td style="width:15%;">' + val.name + '</td>';
                        html += '<td style="width:25%;">' + val.alias + '</td>';
                        html += '<td style="width:15%;">' + (val.role ? val.role.name : '未知') + '</td>';
                        html += '<td style="width:20%;">' + val.telephone + '</td>';
                        html += '<td style="width:20%;">' + val.email + '</td>';
                        html += '</tr>';
                    });
                    _self.currentUsers = respons.list;
                }
                html += '</tbody>';
                html += '</table>';
                html += '</div>';
                $('#detial-tab2').html(html);
                $('#chkAllUsr').attr('checked', false);

                $('#chkAllUsr').on('click', function(event) {
                    $.each($('#userTable input'), function(index, node) {
                        node.checked = event.currentTarget.checked;
                    });
                });

                $('#userTable input').on('click', function(e) {
                    $('#chkAllUsr').prop('checked', $('#userTable input:checked').length == $('#userTable input').length);
                });

                _self._userManager();
            });
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
                            return val.name.indexOf(data.adminAdr) > -1;
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
                        return (val.name.indexOf(searchVal) > -1);
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
                if ($.inArray(val.name, result.adminadrs) == -1)
                    result.adminadrs.push(val.name);
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
            $('.left').removeClass('col-md-12').addClass('col-md-6');
            $('.right').removeClass('col-md-0').addClass('col-md-6');
            // $('.right').css('opacity', 1);
        },
        _hideDetialPanel: function() {
            var _self = this;
            $('.left').removeClass('col-md-6').addClass('col-md-12');
            $('.right').removeClass('col-md-6').addClass('col-md-0');
            // $('.right').css('opacity', 0);
        },
        _bureauManager: function() {
            var _self = this;
            $('#btnAddBureau').on('click', function(e) {
                _self.isAddBureau = true;
                $('#infoLabel').html('添加单位');
                $('#field-1').val('');
                $('#field-2').val('');
                $('#field-3').val('');
                $('#field-4').val('');
                $('#dlgBureau').modal({
                    backdrop: 'static'
                });
            });

            $('#btnEdit').on('click', function(e) {
                _self.isAddBureau = false;
                $('#infoLabel').html('编辑单位');
                $('#field-1').val(_self.selectData.name);
                $('#field-2').val(_self.selectData.ip);
                $('#field-3').val(_self.selectData.address);
                $('#field-4').val(_self.selectData.description);
                $('#dlgBureau').modal({
                    backdrop: 'static'
                });
            });

            $('#btnOK').on('click', function(e) {
                if ($('#field-1').val().trim() == '') { $('#field-1').focus(); return; }
                if ($('#field-2').val().trim() == '') { $('#field-2').focus(); return; }
                if ($('#field-3').val().trim() == '') { $('#field-3').focus(); return; }
                var bureau = {
                    "name": $('#field-1').val().trim(),
                    "ip": $('#field-2').val().trim(),
                    "address": $('#field-3').val().trim(),
                    "description": $('#field-4').val().trim()
                };
                var myGeo = new BMap.Geocoder();
                myGeo.getPoint(bureau.address, function(point) {
                    if (point) {
                        bureau.latitude = point.lat.toFixed(2);
                        bureau.longitude = point.lng.toFixed(2);
                    }
                    if (!_self.isAddBureau) bureau.id = _self.selectData.id;
                    var oprUrl = _self.isAddBureau ? _self.options.OprUrls.bureau.addUrl : _self.options.OprUrls.bureau.updateUrl;
                    _self.ajaxUtil._ajaxPost(oprUrl, bureau, function(respons) {
                        if (respons.result) {
                            _self._raiseMessage(_self.isAddBureau ? '添加单位成功！' : '更新单位信息成功！');
                            _self._hideDetialPanel();
                            _self.resize();
                            _self._requestDatas();
                        } else {
                            _self._raiseError(_self.isAddBureau ? '添加单位失败！' : '更新单位信息失败！');
                        }
                    });
                });

                $('#dlgBureau').modal('hide');
            });
        },
        _userManager: function() {
            var _self = this;

            $('#btnAddUser').off('click');
            $('#btnUpdateUser').off('click');
            $('#btnOKUser').off('click');
            $('#btnDeleteUser').off('click');
            $('#btnImportUser').off('click');
            $('#importFile').off('change');
            $('#btnImport').off('click');

            $('#btnAddUser').on('click', function(e) {
                _self.isUpdateUser = false;
                $('#infoLabelUser').html('添加用户');
                $('#ufield-1').val('');
                $('#ufield-2').val('');
                $('#ufield-3').val('');
                $('#ufield-4').val('');
                $('#ufield-5').val('');
                $('#ufield-6').val('789');
                $('#dlgUser').modal({
                    backdrop: 'static'
                });
            });

            $('#btnImportUser').on('click', function(e) {
                $('#importFile').val('');
                $('#userImportTable tbody').html('');
                $('#btnImport').attr('disabled', 'disabled');
                _self.importDatas = [];
                $('#dlgImport').modal({
                    backdrop: 'static'
                });
            });

            $('#btnUpdateUser').on('click', function(e) {
                _self.isUpdateUser = true;
                if ($('#userTable input:checked').length == 0 || $('#userTable input:checked').length > 1) {
                    $('#deleteLabel').html('编辑用户');
                    $('#deleteContent').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> 请先选择一条要编辑的用户！');
                    $('#dlgDelete .modal-footer').css('display', 'none');
                    $('#dlgDelete').modal('show');
                } else {
                    var selectNodes = $('#userTable').find('input:checked');
                    _self.selectUser = _self.currentUsers[parseInt($(selectNodes[0]).parent().parent('tr').attr('index'))];
                    $('#infoLabelUser').html('编辑用户');

                    $('#ufield-1').val(_self.selectUser.name);
                    $('#ufield-2').val(_self.selectUser.alias);
                    $('#ufield-3').val(_self.selectUser.password);
                    $('#ufield-4').val(_self.selectUser.email);
                    $('#ufield-5').val(_self.selectUser.telephone);
                    $('#ufield-6').val(_self.selectUser.role.id);
                    $('#dlgUser').modal({
                        backdrop: 'static'
                    });
                }
            });

            $('#importFile').on('change', function(e) {
                try {
                    $('#btnImport').attr('disabled', 'disabled');
                    var reader = new FileReader();
                    reader.onload = function(e) {
                        var data = e.target.result;
                        var workbook = XLSX.read(data, {
                            type: 'binary'
                        });
                        var result = _self._workbookToJson(workbook);
                        if (result && result.Sheet1 && result.Sheet1.length > 0) {
                            var html = '';
                            $.each(result.Sheet1, function(i, val) {
                                if (val['用户名（必填）'] && val['用户名（必填）'] != '' && val['密码（必填）'] && val['密码（必填）'] != '') {
                                    val['姓名'] = val['姓名'] ? val['姓名'] : '';
                                    val['角色'] = val['角色'] ? val['角色'] : '采集员';
                                    val['邮箱地址'] = val['邮箱地址'] ? val['邮箱地址'] : '';
                                    val['联系方式'] = val['联系方式'] ? val['联系方式'] : '';
                                    html += '<tr id="' + val['用户名（必填）'] + '">';
                                    html += '<td style="width:15%;padding: 4px 8px !important">' + val['用户名（必填）'] + '</td>';
                                    html += '<td style="width:15%;padding: 4px 8px !important">' + val['姓名'] + '</td>';
                                    html += '<td style="width:15%;padding: 4px 8px !important">' + val['密码（必填）'] + '</td>';
                                    html += '<td style="width:15%;padding: 4px 8px !important">' + val['角色'] + '</td>';
                                    html += '<td style="width:15%;padding: 4px 8px !important">' + val['邮箱地址'] + '</td>';
                                    html += '<td style="width:15%;padding: 4px 8px !important">' + val['联系方式'] + '</td>';
                                    html += '<td style="width:10%;padding: 4px 8px !important" class="text-muted"><span class="glyphicon glyphicon-ok-sign"></span></td>';
                                    html += '</tr>';
                                    _self.importDatas.push(val);
                                }
                            });
                            $('#userImportTable tbody').html(html);
                            _self.importDatas.length > 0 && $('#btnImport').removeAttr('disabled');
                        }
                    };
                    reader.readAsBinaryString(e.target.files[0]);
                } catch (error) {

                }

            });

            $('#btnOKUser').on('click', function(e) {
                if ($('#ufield-1').val().trim() == '') { $('#field-1').focus(); return; }
                if ($('#ufield-3').val().trim() == '') { $('#field-3').focus(); return; }
                var user = {
                    "name": $('#ufield-1').val().trim(),
                    "alias": ($('#ufield-2').val().trim() == '' ? $('#ufield-1').val().trim() : $('#ufield-2').val().trim()),
                    "password": $('#ufield-3').val().trim(),
                    "age": -1,
                    "email": $('#ufield-4').val().trim(),
                    "telephone": $('#ufield-5').val().trim(),
                    "cellphone": $('#ufield-5').val().trim(),
                    "sex": '',
                    "localBureau": {
                        "id": _self.selectData.id
                    },
                    "role": {
                        "id": $('#ufield-6').val()
                    }
                };
                _self.isUpdateUser && (user.id = _self.selectUser.id);
                _self.ajaxUtil._ajaxPost(_self.isUpdateUser ? _self.options.OprUrls.user.updateUrl : _self.options.OprUrls.user.addUrl, user, function(respons) {
                    if (respons.result) {
                        _self._raiseMessage(_self.isUpdateUser ? '编辑用户成功！' : '添加用户成功！');
                        _self._constructUserTable(_self.selectData.id);
                        _self._updateTableScrollBar('#detials');
                    } else {
                        _self._raiseError(_self.isUpdateUser ? '编辑用户失败！' : '添加用户失败！');
                    }
                });
                $('#dlgUser').modal('hide');
            });

            $('#btnImport').on('click', function(e) {
                var checkRequest = function() {
                    if ($('#userImportTable .text-muted').length == 0) {
                        setTimeout(function() {
                            _self._constructUserTable(_self.selectData.id);
                            _self._updateTableScrollBar('#detials');
                            _self.importDatas = [];
                            $('#dlgImport').modal('hide');
                        }, 500);
                    }
                };
                $.each(_self.importDatas, function(i, user) {
                    var user = {
                        "name": user['用户名（必填）'],
                        "alias": user['姓名'],
                        "password": user['密码（必填）'],
                        "age": -1,
                        "email": user['邮箱地址'],
                        "telephone": user['联系方式'],
                        "cellphone": user['联系方式'],
                        "sex": '',
                        "localBureau": {
                            "id": _self.selectData.id
                        },
                        "role": {
                            "id": (user['角色'] == '单位管理员' ? '456' : '789')
                        }
                    };
                    _self.ajaxUtil._ajaxPost(_self.options.OprUrls.user.addUrl, user, function(respons) {
                        if (respons.result) {
                            $('#' + user.name + ' .text-muted').removeClass('text-muted').addClass('text-success');
                        } else {
                            $('#' + user.name + ' .text-muted').removeClass('text-muted').addClass('text-danger');
                        }
                        checkRequest();
                    });
                });
            });

            $('#btnDeleteUser').on('click', function(e) {
                _self.isDeleteUser = true;
                $('#deleteLabel').html('删除用户');
                if ($('#userTable input:checked').length == 0) {
                    $('#deleteContent').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> 请先选择要删除的用户！');
                    $('#dlgDelete .modal-footer').css('display', 'none');
                    $('#dlgDelete').modal('show');
                } else {
                    $('#deleteContent').html('<span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span> 确认删除选中的数据？');
                    $('#dlgDelete .modal-footer').css('display', 'block');
                    $('#dlgDelete').modal('show');
                }
                _self.isDeleteSingle = false;
            });
        },
        _delete: function() {
            var _self = this;
            $('#btnDeleteSelected').on('click', function(e) {
                _self.isDeleteUser = false;
                if ($('#admTable input:checked').length == 0) {
                    $('#deleteContent').html('<span class="glyphicon glyphicon-exclamation-sign" aria-hidden="true"></span> 请先选择要删除的单位数据！');
                    $('#dlgDelete .modal-footer').css('display', 'none');
                    $('#dlgDelete').modal('show');
                } else {
                    $('#deleteContent').html('<span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span> 确认删除选中的数据？');
                    $('#dlgDelete .modal-footer').css('display', 'block');
                    $('#dlgDelete').modal('show');
                }
                _self.isDeleteSingle = false;
            });

            $('#btnDeleteCurrent').on('click', function(e) {
                _self.isDeleteUser = false;
                $('#deleteContent').html('<span class="glyphicon glyphicon-question-sign" aria-hidden="true"></span> 确认删除该记录？');
                $('#dlgDelete .modal-footer').css('display', 'block');
                $('#dlgDelete').modal('show');
                _self.isDeleteSingle = true;
            });

            $('#btnDelete').on('click', function(e) {
                $('#deleteContent').html('<span class="glyphicon glyphicon-info-sign" aria-hidden="true"></span> 正在删除...');
                if (!_self.isDeleteUser) {
                    if (!_self.isDeleteSingle) {
                        var selectNodes = $('#admTable').find('input:checked');
                        var deleteDatas = [];
                        $.each(selectNodes, function(index, val) {
                            deleteDatas.push(_self.viewModuls[parseInt($(this).parent().parent('tr').attr('index'))].id);
                        });
                        _self.ajaxUtil.delete(_self.options.OprUrls.bureau.deleteUrl, deleteDatas, function(respons) {
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
                        _self.ajaxUtil.delete(_self.options.OprUrls.bureau.deleteUrl, deleteDatas, function(respons) {
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
                } else {
                    var selectNodes = $('#userTable').find('input:checked');
                    var deleteDatas = [];
                    $.each(selectNodes, function(index, val) {
                        deleteDatas.push(_self.currentUsers[parseInt($(this).parent().parent('tr').attr('index'))].id);
                    });
                    _self.ajaxUtil.delete(_self.options.OprUrls.user.deleteUrl, deleteDatas, function(respons) {
                        if (respons.result) {
                            $('#deleteContent').html('<span class="glyphicon glyphicon-ok-sign" aria-hidden="true"></span> 删除用户成功！');
                            _self._constructUserTable(_self.selectData.id);
                            _self._updateTableScrollBar('#detials');
                        } else {
                            $('#deleteContent').html('<span class="glyphicon glyphicon-remove-sign" aria-hidden="true"></span> 删除用户失败！');
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
        _workbookToJson: function(workbook) {
            var result = {};
            try {
                workbook.SheetNames.forEach(function(sheetName) {
                    var roa = XLSX.utils.sheet_to_row_object_array(workbook.Sheets[sheetName]);
                    if (roa.length > 0) {
                        result[sheetName] = roa;
                    }
                });
            } catch (error) {

            }
            return result;
        },
        _raiseError: function(msg) {
            $('.top-right').notify({
                message: {
                    html: msg
                },
                type: 'danger',
                transition: 'fade',
                fadeOut: {
                    delay: 2500
                }
            }).show();
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