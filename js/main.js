require.config({
	urlArgs: `v=${app.version}`,
	baseUrl: "js/lib"
});

require(['jquery'], function ($) {
	/**
	 * 存储获取数据函数
	 * @function get 存储数据
	 * @function set 获取数据
	 */
	var store = {
		/**
		 * 存储名称为key的val数据
		 * @param {String} key 键值
		 * @param {String} val 数据
		 */
		set: function (key, val) {
			if (!val) {
				return;
			}
			try {
				var json = JSON.stringify(val);
				if (typeof JSON.parse(json) === "object") { // 验证一下是否为JSON字符串防止保存错误
					localStorage.setItem(key, json);
				}
			} catch (e) {
				return false;
			}
		},
		/**
		 * 获取名称为key的数据
		 * @param {String} key 键值
		 */
		get: function (key) {
			if (this.has(key)) {
				return JSON.parse(localStorage.getItem(key));
			}
		},
		has: function (key) {
			if (localStorage.getItem(key)) {
				return true;
			} else {
				return false;
			}
		},
		del: function (key) {
			localStorage.removeItem(key);
		}
	};

	var settingsFn = function (storage) {
		this.storage = { engines: "bing", bookcolor: "black", searchHistory: false };
		this.storage = $.extend({}, this.storage, storage);
	}
	settingsFn.prototype = {
		getJson: function () {
			return this.storage;
		},
		// 读取设置项
		get: function (key) {
			return this.storage[key];
		},
		// 设置设置项并应用
		set: function (key, val) {
			this.storage[key] = val;
			store.set("setData", this.storage);
			this.apply();
		},
		// 应用设置项
		apply: function () {
			var that = this;
			// 样式细圆
			if (that.get('styleThin')) {
				$("body").addClass('styleThin');
			}
			$('.ornament-input-group').removeAttr('style');
			// 加载LOGO
			if (that.get('logo')) {
				$(".logo").html('<img src="' + that.get('logo') + '" />');
			} else {
				$(".logo").html('<svg style="max-width:100px;max-height:100px" viewBox="0 0 48 48" version="1.1" xmlns="http://www.w3.org/2000/svg" width="100%" height="100%"><path d="M10.7,21.4c5.1-5.5,10.2-11,15.3-16.5c0.7,3.9,1.4,7.9,2.2,11.8C24.5,20.8,20.8,24.9,17,29  c-2.3,2.5-4.5,5-6.8,7.4c-0.2,0.3-0.6,0.4-1,0.3c-2.8-0.9-5.7-1.9-8.5-2.8c-0.4-0.1-0.7-0.5-0.6-0.9c0.1-0.2,0.2-0.4,0.4-0.5  C4,28.7,7.3,25,10.7,21.4z" fill="#1E88E5"></path><path d="M26.1,4.9c3.2,0.3,6.5,0.5,9.7,0.7c0.6,0.1,1,0.5,1.1,1c3.6,10.5,7.1,21.1,10.6,31.6c0.4,1-0.5,2.1-1.5,2.3  c-3.7,0.7-7.4,1.4-11.2,2.2c-0.5,0.1-1.1,0.1-1.5-0.2c-0.5-0.4-0.5-1.1-0.6-1.7c-1.5-8-3-16-4.5-24.1C27.5,12.8,26.7,8.8,26.1,4.9z" fill="#42A5F5"></path><path d="M4.3,12.5c2.2-0.4,4.4-0.7,6.7-1c0.2-0.1,0.5,0.1,0.5,0.4c-0.2,3.2-0.5,6.4-0.7,9.6C7.3,25,4,28.7,0.6,32.4  c-0.2,0.2-0.3,0.3-0.4,0.5c0-0.5,0.1-1,0.2-1.5c1.1-6.1,2.2-12.2,3.3-18.4C3.7,12.8,4,12.5,4.3,12.5z" fill="#1565C0"></path></svg>'
			);
			}
			// 夜间模式 和 壁纸
			var nightMode = {
				on: function () {
					$("body").removeClass('theme-black theme-white').addClass('theme-white');
					$("body").css("background-image", "");
					$("#nightCss").removeAttr('disabled');
				},
				off: function () {
					if (that.get('wallpaper')) {
						$("body").css("background-image", "url(" + that.get('wallpaper') + ")");
					} else {
						$("body").css("background-image", "");
					}
					$("body").removeClass('theme-black theme-white').addClass('theme-' + that.get('bookcolor'));
					$("#nightCss").attr('disabled', true);
				}
			};
			if (that.get('nightMode') === true) {
				nightMode.on();
			} else {
				nightMode.off();
			}
			// 删除掉VIA浏览器夜间模式的暗色支持
			$("head").on("DOMNodeInserted DOMNodeRemoved", function (evt) {
				if (evt.target.id === "via_inject_css_night") {
					if (evt.type === "DOMNodeInserted") {
						$("#via_inject_css_night").html("");
						nightMode.on();
					} else if (evt.type === "DOMNodeRemoved") {
						nightMode.off();
					}
				}
			});
			if ($("#via_inject_css_night").html("").length > 0) {
				nightMode.on();
			}
		}
	}
	var settings = new settingsFn(store.get("setData"));
	settings.apply();

	/**
	 * DOM长按事件
	 */
	$.fn.longPress = function (fn) {
		var timeout = void 0,
			$this = this,
			startPos,
			movePos,
			endPos;
		for (var i = $this.length - 1; i > -1; i--) {
			$this[i].addEventListener("touchstart", function (e) {
				var touch = e.targetTouches[0];
				startPos = { x: touch.pageX, y: touch.pageY };
				timeout = setTimeout(function () {
					if ($this.attr("disabled") === undefined) {
						fn();
					}
				}, 700);
			}, { passive: true });
			$this[i].addEventListener("touchmove", function (e) {
				var touch = e.targetTouches[0];
				movePos = { x: touch.pageX - startPos.x, y: touch.pageY - startPos.y };
				(Math.abs(movePos.x) > 10 || Math.abs(movePos.y) > 10) && clearTimeout(timeout);
			}, { passive: true });
			$this[i].addEventListener("touchend", function () {
				clearTimeout(timeout);
			}, { passive: true });
		}
	};

	/**
	 * 文件打开函数
	 * @param callback 回调函数
	 */
	var openFile = function (callback) {
		$('.openFile').remove();
		var input = $('<input class="openFile" type="file">');
		input.on("propertychange change", callback);
		$('body').append(input);
		input.click();
	}

	/**
	 * 文件上传函数
	 * @param file 文件
	 * @param callback 回调函数 
	 */
	var uploadFile = function (file, callback) {
		var imageData = new FormData();
		imageData.append("Filedata", file);
		imageData.append("file", "multipart");
		$.ajax({
			url: 'https://api.uomg.com/api/image.ali',
			type: 'POST',
			data: imageData,
			cache: false,
			contentType: false,
			processData: false,
			dataType: 'json',
			success: function (res) {
				if (res.code == 1) {
					callback.success && callback.success(res.imgurl);
				} else {
					callback.error && callback.error(res.msg);
				}
			},
			error: function () {
				callback.error && callback.error('请求失败！');
			},
			complete: function () {
				callback.complete && callback.complete();
			}
		});
	}

	
	

	/**
	 * 更改地址栏URL参数
	 * @param {string} param 参数
	 * @param {string} value 值
	 * @param {string} url 需要更改的URL,不设置此值会使用当前链接
	 */
	var changeParam = function (param, value, url) {
		url = url || location.href;
		var reg = new RegExp("(^|)" + param + "=([^&]*)(|$)");
		var tmp = param + "=" + value;
		return url.match(reg) ? url.replace(eval(reg), tmp) : url.match("[?]") ? url + "&" + tmp : url + "?" + tmp;
	};

	// 更改URL，去除后面的参数
	history.replaceState(null, document.title, location.origin + location.pathname);

	// 绑定主页虚假输入框点击事件
	$(".ornament-input-group").click(function () {
		$('body').css("pointer-events", "none");
		history.pushState(null, document.title, changeParam("page", "search"));
		// 输入框边框动画
		$('.anitInput').remove();
		var ornamentInput = $(".ornament-input-group");
		var top = ornamentInput.offset().top;
		var left = ornamentInput.offset().left;
		var anitInput = ornamentInput.clone();
		anitInput.attr('class', 'anitInput').css({
			'position': 'absolute',
			'top': top,
			'left': left,
			'width': ornamentInput.outerWidth(),
			'height': ornamentInput.outerHeight(),
			'pointer-events': 'none'
		})
		anitInput.on('transitionend', function (evt) {
			if (evt.target !== this) {
				return;
			}
			anitInput.unbind('transitionend');
			$(".input-bg").css("border-color", "var(--dark)");
			anitInput.css("opacity", "0");
		});
		$('body').append(anitInput);
		ornamentInput.css('opacity', 0);
		if ($(window).data('anitInputFn')) {
			$(window).unbind('resize', $(window).data('anitInputFn'));
		}
		var anitInputFn = function () {
			var inputBg = $('.input-bg');
			var scaleX = inputBg.outerWidth() / ornamentInput.outerWidth();
			var scaleY = inputBg.outerHeight() / ornamentInput.outerHeight();
			var translateX = inputBg.offset().left - left - (ornamentInput.outerWidth() - inputBg.outerWidth()) / 2;
			var translateY = inputBg.offset().top - top - (ornamentInput.outerHeight() - inputBg.outerHeight()) / 2;
			anitInput.css({
				'transform': 'translateX(' + translateX + 'px) translateY(' + translateY + 'px) scale(' + scaleX + ',' + scaleY + ') translate3d(0,0,0)',
				'transition': '.3s',
				'border-color': 'var(--dark)'
			});
		}
		$(window).data('anitInputFn', anitInputFn);
		$(window).bind('resize', anitInputFn);
		// 弹出软键盘
		$(".s-temp").focus();
		// 书签动画
		$(".bookmark").addClass("animation");
		// 显示搜索页
		$(".page-search").show();
		setTimeout(function () {
			$(".page-search").on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				$(".page-search").off('transitionend');
				$('body').css("pointer-events", "");
			}).addClass("animation");
			$(".search-input").val("").focus();
			$(".input-bg").addClass("animation");
			$(".shortcut").addClass("animation");
		}, 1);
	});

	$(".page-search").click(function (evt) {
		if (evt.target === evt.currentTarget) {
			history.go(-1);
		}
	});

	// 返回按键被点击
	window.addEventListener("popstate", function () {
		if ($('.page-search').is(":visible")) {
			$('body').css("pointer-events", "none");
			history.replaceState(null, document.title, location.origin + location.pathname);
			// 输入框边框动画
			$(window).unbind('resize', $(window).data('anitInputFn'));
			var anitInput = $('.anitInput');
			anitInput.css({
				'transform': '',
				'transition': '.3s',
				'opacity': '',
				'border-color': ''
			});
			// 书签动画
			// 隐藏搜索页
			$(".input-bg").css("border-color", "").removeClass("animation");
			$(".shortcut").removeClass("animation");
			$(".page-search").removeClass("animation");
			$(".page-search").on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				$(".page-search").off('transitionend');
				$(".page-search").hide();
				$('.ornament-input-group').css({ 'transition': 'none', 'opacity': '' });
				anitInput.remove();
				// 搜索页内容初始化
				$(".suggestion").html("");
				$(".search-btn").html("取消");
				$(".shortcut1").show();
				$(".shortcut2,.shortcut3,.empty-input").hide();
				$(".search-input").val('');
				$('body').css("pointer-events", "");
			});
		}
	}, false);

	$(".suggestion").click(function (evt) {
		if (evt.target.nodeName === "SPAN") {
			$('.search-input').focus().val($(evt.target).parent().text()).trigger("propertychange");
			return;
		} else {
			searchText(evt.target.innerText);
		}
	});
	var qs_ajax = null;
	$(".search-input").on("input propertychange", function () {
		var that = this;
		var wd = $(that).val();
		$(".shortcut1,.shortcut2,.shortcut3").hide();
		if (!wd) {
			$(".empty-input").hide();
			$(".search-btn").html("取消");
			$(".shortcut1").show();
			$(".suggestion").hide().html('');
		} else {
			$(".empty-input").show();
			$(".search-btn").html(/^\b(((https?|ftp):\/\/)?[-a-z0-9]+(\.[-a-z0-9]+)*\.(?:com|net|org|int|edu|gov|mil|arpa|asia|biz|info|name|pro|coop|aero|museum|[a-z][a-z]|((25[0-5])|(2[0-4]\d)|(1\d\d)|([1-9]\d)|\d))\b(\/[-a-z0-9_:\@&?=+,.!\/~%\$]*)?)$/i.test(wd) ? "进入" : "搜索");
			var has_char = escape(wd).indexOf("%u");
			has_char < 0 ? $(".shortcut2").show() : $(".shortcut3").show();
			$.ajax({
				url: "https://suggestion.baidu.com/su",
				type: "GET",
				dataType: "jsonp",
				data: { wd: wd, cb: "sug" },
				timeout: 5000,
				jsonpCallback: "sug",
				success: function (res) {
					if ($(that).val() !== wd) {
						return;
					}
					var data = res.s;
					var isStyle = $(".suggestion").html();
					var html = "";
					for (var i = data.length; i > 0; i--) {
						var style = "";
						if (isStyle === "") {
							style = "animation: fadeInDown both .5s " + (i - 1) * 0.05 + 's"';
						}
						html += '<li style="' + style + '"><div>' + data[i - 1].replace(wd, '<b>' + wd + '</b>') + "</div><span></span></li>";
					}
					$(".suggestion").show().html(html).scrollTop($(".suggestion")[0].scrollHeight);
				}
			});
			if (qs_ajax) {
				qs_ajax.abort();
			}
			if (has_char >= 0) {
				qs_ajax = $.ajax({
					url: "https://bird.ioliu.cn/v1?url=https://quark.sm.cn/api/qs?query=" + wd + "&ve=4.1.0.132",
					type: "GET",
					timeout: 5000,
					success: function (res) {
						if ($(that).val() !== wd) {
							return;
						}
						var data = res.data;
						var html = '<li>快搜:</li>';
						for (var i = 0, l = data.length; i < l; i++) {
							html += '<li>' + data[i] + '</li>';
						}
						$('.shortcut3').html(html);
					}
				});
			}
		}
	});

	$(".empty-input").click(function () {
		$(".search-input").focus().val("").trigger("propertychange");
	});

	

	$(".search-btn").click(function () {
		var text = $(".search-input").val();
		if ($(".search-btn").text() === "进入") {
			!text.match(/^(ht|f)tp(s?):\/\//) && (text = "http://" + text);
			history.go(-1);
			setTimeout(function () {
				location.href = text;
			}, 1);
		} else {
			if (!text) {
				$(".search-input").blur();
				history.go(-1);
			} else {
				searchText(text);
			}
		}
	});

	$(".search-input").keydown(function (evt) {
		// 使用回车键进行搜索
		evt.keyCode === 13 && $(".search-btn").click();
	});

	// 识别浏览器
	var browserInfo = function () {
		if (window.via) {
			return 'via';
		} else if (window.mbrowser) {
			return 'x';
		}
	};

	// 搜索函数
	function searchText(text) {
		if (!text) {
			return;
		}
		setTimeout(function () { // 异步执行 兼容QQ浏览器
			if (settings.get('engines') === "via") {
				window.via.searchText(text);
			} else {
				location.href = {
					baidu: "https://m.baidu.com/s?wd=%s",
					quark: "https://quark.sm.cn/s?q=%s",
					google: "https://www.google.com/search?q=%s",
					bing: "https://cn.bing.com/search?q=%s",
					sm: "https://m.sm.cn/s?q=%s",
					haosou: "https://m.so.com/s?q=%s",
					sogou: "https://m.sogou.com/web/searchList.jsp?keyword=%s",
					diy: settings.get('diyEngines')
				}[settings.get('engines')].replace("%s", text);
			}
		}, 1);
	}

	
	$(".logo").click(() => {
		var browser = browserInfo();
		if (browser === 'via') {
			location.href = "folder://";
		} else if (browser === 'x') {
			location.href = "x:bm?sort=default";
		}
	}).longPress(() => {
		var data = [{ "title": "搜索引擎", "type": "select", "value": "engines", "data": [{ "t": "夸克搜索", "v": "quark" }, { "t": "跟随Via浏览器", "v": "via" }, { "t": "百度搜索", "v": "baidu" }, { "t": "谷歌搜索", "v": "google" }, { "t": "必应搜索", "v": "bing" }, { "t": "神马搜索", "v": "sm" }, { "t": "好搜搜索", "v": "haosou" }, { "t": "搜狗搜索", "v": "sogou" }, { "t": "自定义", "v": "diy" }] }, { "title": "设置壁纸", "value": "wallpaper" }, { "title": "设置LOGO", "value": "logo" }, { "title": "恢复默认壁纸和LOGO", "value": "delLogo" }, { "title": "图标颜色", "type": "select", "value": "bookcolor", "data": [{ "t": "深色图标", "v": "black" }, { "t": "浅色图标", "v": "white" }] }, { "title": "主页样式细圆", "type": "checkbox", "value": "styleThin" }, { "title": "夜间模式", "type": "checkbox", "value": "nightMode" }, { "title": "记录搜索历史", "type": "checkbox", "value": "searchHistory" }, { "type": "hr" }, { "title": "导出主页数据", "value": "export" }, { "title": "导入主页数据", "value": "import" }, { "type": "hr" }, { "title": "源码", "value": "openurl", "description": "https://github.com/TingjiaInFuture/TingjiaInFuture.github.io" }, { "title": "关于", "description": "当前版本：" + app.version }];
		var html = '<div class="page-settings"><div class="set-header"><div class="set-back"></div><p class="set-logo">主页设置</p></div><ul class="set-option-from">';
		for (var json of data) {
			if (json.type === 'hr') {
				html += `<li class="set-hr"></li>`;
			} else {
				html += `<li class="set-option" ${json.value ? `data-value="${json.value}"` : ''}>
							<div class="set-text">
								<p class="set-title">${json.title}</p>
								${json.description ? `<div class="set-description">${json.description}</div>` : ''}
							</div>`;
				if (json.type === 'select') {
					html += `<select class="set-select">`;
					for (var i of json.data) {
						html += `<option value="${i.v}">${i.t}</option>`;
					}
					html += `</select>`;
				} else if (json.type === 'checkbox') {
					html += `<input type="checkbox" class="set-checkbox" autocomplete="off"><label></label>`;
				}
				html += `</li>`;
			}
		}
		html += '</ul></div>';
		$('#app').append(html);

		$(".page-settings").show();
		$(".page-settings").addClass('animation');

		var browser = browserInfo();
		if (browser !== 'via') { // 只有VIA浏览器才能显示
			$('option[value=via]').hide();
		}

		$(".set-option .set-select").map(function () {
			$(this).val(settings.get($(this).parent().data('value')));
		});

		$(".set-option .set-checkbox").map(function () {
			$(this).prop("checked", settings.get($(this).parent().data('value')));
		});

		$(".set-back").click(function () {
			$(".page-settings").css("pointer-events", "none").removeClass("animation");
			$(".page-settings").on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				$(".page-settings").remove();
			});
		});

		$(".set-option").click(function (evt) {
			var $this = $(this);
			var value = $this.data("value");
			if (value === "wallpaper") {
				openFile(function () {
					var file = this.files[0];
					var reader = new FileReader();
					reader.onload = function () {
						settings.set('wallpaper', this.result);
					};
					reader.readAsDataURL(file);
				});
			} else if (value === "logo") {
				openFile(function () {
					var file = this.files[0];
					var reader = new FileReader();
					reader.onload = function () {
						settings.set('logo', this.result);
					};
					reader.readAsDataURL(file);
				});
			} else if (value === "delLogo") {
				settings.set('wallpaper', '');
				settings.set('logo', '');
				settings.set('bookcolor', 'black');
				location.reload();
			} else if (value === "openurl") {
				open($this.find('.set-description').text());
			} else if (value === "export") {
				var oInput = $('<input>');
				oInput.val('{"bookMark":' + JSON.stringify(bookMark.getJson()) + '}');
				//oInput.val('{"bookMark":' + JSON.stringify(bookMark.getJson()) + ',"setData":' + JSON.stringify(settings.getJson()) + '}');
				document.body.appendChild(oInput[0]);
				console.log(store.get('bookMark'));
				oInput.select();
				document.execCommand("Copy");
				alert('已复制到剪贴板，请粘贴保存文件。');
				oInput.remove();
			} else if (value === "import") {
				var data = prompt("在这粘贴主页数据");
				try {
					data = JSON.parse(data);
					store.set("bookMark", data.bookMark);
					store.set("setData", data.setData);
					alert("导入成功!");
					location.reload();
				} catch (e) {
					alert("导入失败!");
				}
			} else if (evt.target.className !== 'set-select' && $this.find('.set-select').length > 0) {
				$.fn.openSelect = function () {
					return this.each(function (idx, domEl) {
						if (document.createEvent) {
							var event = document.createEvent("MouseEvents");
							event.initMouseEvent("mousedown", true, true, window, 0, 0, 0, 0, 0, false, false, false, false, 0, null);
							domEl.dispatchEvent(event);
						} else if (element.fireEvent) {
							domEl.fireEvent("onmousedown");
						}
					});
				}
				$this.find('.set-select').openSelect();
			} else if (evt.target.className !== 'set-checkbox' && $this.find('.set-checkbox').length > 0) {
				$this.find('.set-checkbox').prop("checked", !$this.find('.set-checkbox').prop("checked")).change();
			}
		});

		$(".set-select").change(function () {
			var dom = $(this),
				item = dom.parent().data("value"),
				value = dom.val();
			if (item === "engines" && value === "diy") {
				var engines = prompt("输入搜索引擎网址，（用“%s”代替搜索字词）");
				console.log(engines);
				if (engines) {
					settings.set('diyEngines', engines);
				} else {
					dom.val(settings.get('engines'));
					return false;
				}
			}
			// 保存设置
			settings.set(item, value);
		});

		$(".set-checkbox").change(function () {
			var dom = $(this),
				item = dom.parent().data("value"),
				value = dom.prop("checked");
			// 应用设置
			if (item === 'styleThin' && value === true) {
				$("body").addClass('styleThin');
			} else {
				$("body").removeClass('styleThin');
			}
			// 保存设置
			settings.set(item, value);
		});

	});

	// 下滑进入搜索
	require(['touchSwipe'], function () {
		$(".page-home").swipe({
			swipeStatus: function (event, phase, direction, distance, duration, fingerCount, fingerData) {
				if ($('.delbook').length !== 0) {
					return;
				}
				if (phase === 'start') {
					this.height = $(document).height();
				} else if (phase === 'move') {
					var sliding = Math.max(fingerData[0].end.y - fingerData[0].start.y, 0);
					$('.logo').attr("disabled", true).css({ 'opacity': 1 - (sliding / this.height) * 4, 'transition-duration': '0ms' });
					$('.ornament-input-group').css({ 'transform': 'translate3d(0,' + Math.min((sliding / this.height) * 80, 30) + 'px,0)', 'transition-duration': '0ms' });
					$('.bookmark').attr("disabled", true).css({ 'opacity': 1 - (sliding / this.height) * 4, 'transform': 'scale(' + (1 - (sliding / this.height) * .3) + ')', 'transition-duration': '0ms' });
				} else if (phase === 'end' || phase === 'cancel') {
					$('.logo').removeAttr("disabled style");
					$('.bookmark').removeAttr("disabled style");
					if (distance >= 100 && direction === "down") {
						$('.ornament-input-group').css("transform", "").click();
						$('.logo,.bookmark,.anitInput').css('opacity', '0');
						$('.input-bg').css('border-color', 'var(--dark)');
						setTimeout(function () {
							$('.logo,.bookmark').css('opacity', '');
						}, 300);
					} else {
						$('.ornament-input-group').removeAttr("style");
					}
				}
			}
		});
	})

})
