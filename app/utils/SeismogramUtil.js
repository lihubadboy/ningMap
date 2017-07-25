define("utils/SeismogramUtil",[],function(){

	/**
     * 地震动峰值加速度系数表 Fa
     * 地震动峰值加速度取值分组 Fag
     * 地震动加速度反应谱特征周期表 Tg
     * 地震动加速度反应谱特征周期分组 Tgb
     * 地震动加速度反应谱特征周期 增加值 tga
     * 地震动峰值加速度 k1,k2,k3
     * 地震动峰值加速度 乘积系数 pt （2.5）
     */
     var Widget  = function(options){
     	var _self = this;
		//options中包含参数：k1,k2,k3,tag;
		_self.options = options;
		
		_self._init();
	};

	Widget.prototype = {
		_init: function() {
			var _self = this;
				//判定如果 options=null，设置默认值
				if (!_self.options) {
					_self.options = {};
					_self.options.k1 = 2.9
					_self.options.k2 = 1.9;
					_self.options.k3 = 0.333;
					_self.options.tga = 0.05;
				}
				//数据初始化
				_self.Fa = [
				[0.72, 0.80, 1.00, 1.30, 1.25],
				[0.74, 0.82, 1.00, 1.25, 1.20],
				[0.75, 0.83, 1.00, 1.15, 1.10],
				[0.76, 0.85, 1.00, 1.00, 1.00],
				[0.85, 0.95, 1.00, 1.00, 0.95],
				[0.90, 1.00, 1.00, 1.00, 0.90]
				];

				_self.Fag = [0.05, 0.10, 0.15, 0.20, 0.30, 0.40];

				_self.Ta = [
				[0.20, 0.25, 0.35, 0.45, 0.65],
				[0.25, 0.30, 0.40, 0.55, 0.75],
				[0.30, 0.35, 0.45, 0.65, 0.90]
				];

				_self.Tgb = [0.35, 0.40, 0.45];

				_self.pt = 2.5;
			},
			peak:function(pga,k1,k2,k3){
				var _self = this;
				var data = [];
				var precision = 3;
				//判定k1,k2,k3是否为空
				if (!k1) {
					k1 = _self.options.k1;
				}
				if (!k2) {
					k2 = _self.options.k2;
				}
				if (!k3) {
					k3 = _self.options.k3;
				}

				var tempPgas = [(pga * k3).toFixed(precision), (pga).toFixed(precision), (pga * k2).toFixed(precision), (pga * k1).toFixed(precision)];

				for(var i=0;i<4;i++){
					var fal = _self._calculateFal(tempPgas[i]);
					var temp = [];
					for(var j=0;j<5;j++){
						temp[j] = (fal[j]*tempPgas[i]).toFixed(precision);
					}
					data[i] = temp;
				}

				return data;

			},
			period:function(tg,tga){
				var _self = this;
				var data = [];
				var precision = 2;
				if (!tga) {
					tga = _self.options.tga;
				}
				for (var i = 0; i<_self.Tgb.length; i++) {
					if (tg == _self.Tgb[i]) {
						data[1] = _self.Ta[i];
						data[0] = _self.Ta[i];
						for (var k=0; k<_self.Ta[i].length; k++) {
							var ta = parseFloat(_self.Ta[i][k]);
							data[0][k] = data[1][k] = ta.toFixed(precision);
						}
						break;
					}
				}
				var temp = [];
				for (var j = 0; j < data[1].length; j++) {
					temp[j] = (parseFloat(data[1][j]) + tga).toFixed(precision);
				}
				data[2] = temp;

				return data;
			},
			platformHeight:function(peakData){
				var _self = this;
				var data = [];
				var precision = 3;
				for (var i = 0; i < 3; i++) {
					var temp = [];
					for (var j=0; j<5; j++) {
						temp[j] = (parseFloat(peakData[i][j]) * _self.pt).toFixed(precision);
					}
					data[i] = temp;
				}

				return data;
			},
			_calculateFal:function(pga){

				var _self = this;
				var data = [];

				for (var i = 0; i<_self.Fag.length;i++) {
					if (pga <_self.Fag[0]) {
						data = _self.Fa[0];
						break;
					}else if(pga == _self.Fag[i]){
						data = _self.Fa[i];
						break;
					}else if( _self.Fag[i] < pga && pga < _self.Fag[i+1]){
						data = _self._differenceFal(_self.Fag[i],_self.Fag[i+1],pga,i);
						break;
					}else if (pga > _self.Fag[5]) {		
						data = _self.Fa[5];
						break;
					}
				}

				return data;

			},
			_differenceFal:function(minFag,maxFag,pga,position){
				var _self = this;
				var data = [];
				var lengthTemp = 5;
				for (var i = 0; i < lengthTemp; i++) {
					data[i] = _self._difference(_self.Fa[position][i],_self.Fa[position+1][i],minFag,maxFag,pga);
				}
				return data;
			},
			_difference:function(minFa,maxFa,minFag,maxFag,pga){
				var data = 0;
				data = minFa + (pga - minFag) * ((maxFa - minFa) / (maxFag - minFag));
				return data.toFixed(3);
			}

		};

		return Widget;
	});