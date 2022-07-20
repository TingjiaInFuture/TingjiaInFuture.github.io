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
		this.storage = { engines: "quark", bookcolor: "black", searchHistory: true };
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
				$(".logo").html('<svg width="100" height="100" xmlns="http://www.w3.org/2000/svg">
 <g id="Layer_1">
  <title>Layer 1</title>
  <text transform="matrix(4.91141 0 0 2.90388 -409.071 -53.5957)" stroke="#007fff" xml:space="preserve" text-anchor="start" font-family="Noto Sans JP" font-size="24" stroke-width="0" id="svg_2" y="45.23019" x="86.73235" fill="#007fff">S</text>
 </g>
</svg>');
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
	 * 首页书签构建函数
	 * @function init 初始化
	 * @function bind 绑定事件
	 * @function del 删除书签
	 * @function add 添加书签
	 */
	var bookMarkFn = function (ele, options) {
		this.$ele = $(ele);
		this.options = {
			data: [{ "name": "精选", "url": "choice()", "icon": "icon/discover.png" }, { "name": "微博", "url": "https://weibo.com", "icon": "icon/weibo.png" }, { "name": "Bilibili", "url": "https://m.bilibili.com", "icon": "icon/bilibilibog.png" }, { "name": "知乎", "url": "https://www.zhihu.com", "icon": "icon/zhihu.png" }, { "name": "淘宝", "url": "https://m.taobao.com", "icon": "icon/taobao.png" }, { "name": "贴吧", "url": "https://tieba.baidu.com", "icon": "icon/tieba.png" }, { "name": "IT之家", "url": "https://m.ithome.com", "icon": "icon/ithome.png" }, { "name": "网易", "url": "https://3g.163.com", "icon": "icon/netease.png" }, { "name": "热榜", "url": "https://tophub.today", "icon": "icon/tophub.png" }, { "name": "导航", "url": "https://www.pp93.com/m", "icon": "icon/pp93.png" }],
		};
		this.options = $.extend({}, this.options, options);
		this.init();
	}
	bookMarkFn.prototype = {
		init: function () {
			var html = '';
			var data = this.options.data;
			for (var i = 0, l = data.length; i < l; i++) {
				html += '<div class="list" data-url="' + data[i].url + '"><div class="img" style="background-image:url(' + data[i].icon + ')"></div><div class="text">' + data[i].name + "</div></div>";
			}
			this.$ele.html(html);
			this.bind();
		},
		getJson: function () {
			return this.options.data;
		},
		bind: function () {
			var that = this;
			var data = this.options.data;
			// 绑定书签长按事件
			this.$ele.longPress(function () {
				if (that.status !== "editing" && data.length > 0) {
					that.status = "editing";
					$('.logo,.ornament-input-group').css('pointer-events', 'none');
					$('.addbook').remove();
					require(['jquery-sortable'], function () {
						that.$ele.sortable({
							animation: 150,
							fallbackTolerance: 3,
							touchStartThreshold: 3,
							ghostClass: "ghost",
							onEnd: function (evt) {
								var startID = evt.oldIndex,
									endID = evt.newIndex;
								if (startID > endID) {
									data.splice(endID, 0, data[startID]);
									data.splice(startID + 1, 1);
								} else {
									data.splice(endID + 1, 0, data[startID]);
									data.splice(startID, 1);
								}
								store.set("bookMark", data);
							}
						});
					})
					$(document).click(function () {
						$(document).unbind("click");
						$('.logo,.ornament-input-group').css('pointer-events', '');
						$(".delbook").addClass("animation");
						$(".delbook").on('transitionend', function (evt) {
							if (evt.target !== this) {
								return;
							}
							$(".delbook").remove();
							that.$ele.sortable("destroy");
							that.status = "";
						});
					});
					var $list = that.$ele.find(".list");
					for (var i = $list.length; i > -1; i--) {
						$list.eq(i).find(".img").prepend('<div class="delbook"></div>');
					}
				}
			});
			this.$ele.on('click', function (evt) {
				if (evt.target !== this || that.status === 'editing' || $('.addbook').hasClass('animation') || data.length >= 20) {
					return;
				}
				if ($('.addbook').length === 0) {
					that.$ele.append('<div class="list addbook"><div class="img"><svg viewBox="0 0 1024 1024"><path class="st0" d="M673,489.2H534.8V350.9c0-12.7-10.4-23-23-23c-12.7,0-23,10.4-23,23v138.2H350.6c-12.7,0-23,10.4-23,23c0,12.7,10.4,23,23,23h138.2v138.2c0,12.7,10.4,23,23,23c12.7,0,23-10.4,23-23V535.2H673c12.7,0,23-10.4,23-23C696.1,499.5,685.7,489.2,673,489.2z" fill="#222"/></svg></div></div>');
					$('.addbook').click(function () {
						$('.addbook').remove();
						// 取消书签编辑状态
						$(document).click();
						// 插入html
						$('#app').append(`<div class="page-bg"></div>
						<div class="page-addbook">
							<ul class="addbook-choice">
								<li class="current">站点</li>
								<!-- <li>书签</li>
								<li>历史</li> -->
								<span class="active-span"></span>
							</ul>
							<div class="addbook-content">
								<div class="addbook-sites">
								<input type="text" class="addbook-input addbook-url" placeholder="输入网址" value="http://" />
								<input type="text" class="addbook-input addbook-name" placeholder="输入网站名" />
									<div id="addbook-upload">点击选择图标</div>
									<div class="addbook-ok">确认添加</div>
								</div>
								<div class="bottom-close"></div>
							</div>
						</div>`);

						setTimeout(function () {
							$(".page-bg").addClass("animation");
							$(".addbook-choice").addClass("animation");
							$(".addbook-content").addClass("animation");
						}, 50);

						//绑定事件
						$("#addbook-upload").click(function () {
							openFile(function () {
								var file = this.files[0];
								var reader = new FileReader();
								reader.onload = function () {
									$("#addbook-upload").html('<img src="' + this.result + '"></img><p>' + file.name + '</p>');
								};
								$("#addbook-upload").css("pointer-events", "");
								$(".addbook-ok").css("pointer-events", "");
								reader.readAsDataURL(file);
								/*$("#addbook-upload").html('上传图标中...').css("pointer-events", "none");
								$(".addbook-ok").css("pointer-events", "none");
								uploadFile(file, {
									success: function (url) {
										$("#addbook-upload").html('<img src="' + url + '"></img><p>' + file.name + '</p>');
									},
									error: function (msg) {
										$("#addbook-upload").html('上传图标失败！' + msg);
									},
									complete: function () {
										$("#addbook-upload").css("pointer-events", "");
										$(".addbook-ok").css("pointer-events", "");
									}
								})*/
							});
						});
						$(".addbook-ok").click(function () {
							var name = $(".addbook-name").val(),
								url = $(".addbook-url").val(),
								icon = $("#addbook-upload img").attr("src");
							if (name.length && url.length) {
								if (!icon) {
									// 绘制文字图标
									var canvas = document.createElement("canvas");
									canvas.height = 100;
									canvas.width = 100;
									var ctx = canvas.getContext("2d");
									ctx.fillStyle = "#f5f5f5";
									ctx.fillRect(0, 0, 100, 100);
									ctx.fill();
									ctx.fillStyle = "#222";
									ctx.font = "40px Arial";
									ctx.textAlign = "center";
									ctx.textBaseline = "middle";
									ctx.fillText(name.substr(0, 1), 50, 52);
									icon = canvas.toDataURL("image/png");
								}
								$(".bottom-close").click();
								bookMark.add(name, url, icon);
							}
						});
						$(".bottom-close").click(function () {
							$(".page-addbook").css({ "pointer-events": "none" });
							$(".page-bg").removeClass("animation");
							$(".addbook-choice").removeClass("animation");
							$(".addbook-content").removeClass("animation");
							setTimeout(function () {
								$(".page-addbook").remove();
								$(".page-bg").remove();
							}, 300);
						});
						$(".page-addbook").click(function (evt) {
							if (evt.target === evt.currentTarget) {
								$(".bottom-close").click();
							}
						});

					})
				} else {
					$(".addbook").addClass("animation");
					setTimeout(function () {
						$(".addbook").remove();
					}, 400);
				}
			});
			this.$ele.on('click', '.list', function (evt) {
				evt.stopPropagation();
				var dom = $(evt.currentTarget);
				if (that.status !== "editing") {
					var url = dom.data("url");
					if (url) {
						switch (url) {
							case "choice()":
								choice();
								break;
							default:
								location.href = url;
						}
					}
				} else {
					if (evt.target.className === "delbook") {
						that.del(dom.index());
					}
				}
			});
		},
		del: function (index) {
			var that = this;
			var data = this.options.data;
			this.$ele.css("overflow", "visible");
			var dom = this.$ele.find('.list').eq(index);
			dom.css({ transform: "translateY(60px)", opacity: 0, transition: ".3s" });
			dom.on('transitionend', function (evt) {
				if (evt.target !== this) {
					return;
				}
				dom.remove();
				that.$ele.css("overflow", "hidden");
			});
			data.splice(index, 1);
			store.set("bookMark", data);
		},
		add: function (name, url, icon) {
			var data = this.options.data;
			url = url.match(/:\/\//) ? url : "http://" + url;
			var i = data.length - 1;
			var dom = $('<div class="list" data-url="' + url + '"><div class="img" style="background-image:url(' + icon + ')"></div><div class="text">' + name + '</div></div>');
			this.$ele.append(dom);
			dom.css({ marginTop: "60px", opacity: "0" }).animate({ marginTop: 0, opacity: 1 }, 300);
			data.push({ name: name, url: url, icon: icon });
			store.set("bookMark", data);
		}
	}

	/**
	 * 搜索历史构建函数
	 * @function init 初始化
	 * @function load 加载HTML
	 * @function bind 绑定事件
	 * @function add 添加历史
	 * @function empty 清空历史
	 */
	var searchHistoryFn = function (ele, options) {
		this.$ele = $(ele);
		this.options = {
			data: []
		};
		this.options = $.extend({}, this.options, options);
		this.init();
	}
	searchHistoryFn.prototype = {
		init: function () {
			this.options.data = this.options.data.slice(0, 10);
			this.load();
			this.bind();
		},
		load: function () {
			var data = this.options.data;
			var html = '';
			var l = data.length;
			for (var i = 0; i < l; i++) {
				html += '<li>' + data[i] + '</li>';
			}
			this.$ele.find('.content').html(html);
			l ? $('.emptyHistory').show() : $('.emptyHistory').hide();
		},
		bind: function () {
			var that = this;
			// 监听touch事件，防止点击后弹出或收回软键盘
			$('.emptyHistory')[0].addEventListener("touchstart", function (e) {
				e.preventDefault();
			}, false);
			$('.emptyHistory')[0].addEventListener("touchend", function (e) {
				if ($('.emptyHistory').hasClass('animation')) {
					that.empty();
				} else {
					$('.emptyHistory').addClass('animation');
				}
			}, false);
			this.$ele.click(function (evt) {
				if (evt.target.nodeName === "LI") {
					$('.search-input').val(evt.target.innerText).trigger("propertychange");
					$('.search-btn').click();
				}
			});
		},
		add: function (text) {
			var data = this.options.data;
			if (settings.get('searchHistory') === true) {
				var pos = data.indexOf(text);
				if (pos !== -1) {
					data.splice(pos, 1);
				}
				data.unshift(text);
				this.load();
				store.set("history", data);
			}
		},
		empty: function () {
			this.options.data = [];
			store.set("history", []);
			this.load();
		}
	}

	// 开始构建
	var bookMark = new bookMarkFn($('.bookmark'), { data: store.get("bookMark") })
	var searchHistory = new searchHistoryFn($('.history'), { data: store.get("history") });

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
			$(".history").show().addClass("animation");
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
			$(".bookmark").removeClass("animation");
			// 隐藏搜索页
			$(".history").removeClass("animation");
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
				$('.emptyHistory').removeClass('animation');
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
			$(".history").show();
			$(".empty-input").hide();
			$(".search-btn").html("取消");
			$(".shortcut1").show();
			$(".suggestion").hide().html('');
		} else {
			$(".history").hide();
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
		searchHistory.add(text);
		history.go(-1);
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


		// HTML添加到APP
		$('#app').append(html + tabHtml + '<span class="active-span"></span></ul><div class="choice-swipe"><ul class="swiper-wrapper"><div style="position:absolute;text-align:center;top:50%;width:100%;margin-top:-64px;color:#444">正在加载页面中...</div></ul></div><div class="bottom-close"></div></div></div>');

		setTimeout(function () {
			$(".page-bg").addClass("animation");
			$(".page-choice").addClass("animation");
		}, 1);

		var dom = $(".choice-ul li");
		var width = dom.width();
		$(".active-span").css("transform", "translate3d(" + (width / 2 - 9) + "px,0,0)");

		// 动画完成后加载，防止过渡动画卡顿
		$(".page-choice").on("transitionend", function (evt) {
			// 过滤掉子元素
			if (evt.target !== this) {
				return;
			}
			$(".page-choice").off("transitionend");
			$('.choice-swipe').find('.swiper-wrapper').html(contentHtml);
			// 绑定事件
			var last_page = 0;

			require(['Swiper'], function (Swiper) {
				var swiper = new Swiper('.choice-swipe', {
					on: {
						slideChange: function () {
							var i = this.activeIndex;
							dom.eq(last_page).removeClass("current");
							$(".active-span").css("transform", "translate3d(" + (width * i + width / 2 - 9) + "px,0,0)");
							dom.eq(i).addClass("current");
							last_page = i;
						}
					}
				});

				// 绑定TAB点击事件
				$(".choice-ul").click(function (evt) {
					if (evt.target.nodeName == "LI") {
						swiper.slideTo($(evt.target).index());
					}
				});
			})

			// 绑定关闭按钮事件
			$(".bottom-close").click(function () {
				$(".page-choice").css('pointer-events', 'none').removeClass("animation");
				$(".page-bg").removeClass("animation");
				$(".page-choice").on('transitionend', function (evt) {
					if (evt.target !== this) {
						return;
					}
					$(".page-choice").remove();
					$(".page-bg").remove();
				});
			});

			
			// 今日份壁纸
			$.ajax({
				url: "https://bird.ioliu.cn/v2?url=https://cn.bing.com/HPImageArchive.aspx?format=js&cc=jp&idx=0&n=1",
				type: "get",
				dataType: "json",
				success: function (res) {
					var url = 'https://www.bing.com' + res.images[0].url.replace('1920x1080', '1080x1920');
					$('.back-img').css('background-image', 'url(' + url + ')')
					$('.back-btn').show().click(function () {
						settings.set('wallpaper', url);
					});
				}
			});

		})
	}

	$(".logo").click(() => {
		var browser = browserInfo();
		if (browser === 'via') {
			location.href = "folder://";
		} else if (browser === 'x') {
			location.href = "x:bm?sort=default";
		}
	}).longPress(() => {
		var data = [{ "title": "搜索引擎", "type": "select", "value": "engines", "data": [{ "t": "夸克搜索", "v": "quark" }, { "t": "跟随Via浏览器", "v": "via" }, { "t": "百度搜索", "v": "baidu" }, { "t": "谷歌搜索", "v": "google" }, { "t": "必应搜索", "v": "bing" }, { "t": "神马搜索", "v": "sm" }, { "t": "好搜搜索", "v": "haosou" }, { "t": "搜狗搜索", "v": "sogou" }, { "t": "自定义", "v": "diy" }] }, { "title": "设置壁纸", "value": "wallpaper" }, { "title": "设置LOGO", "value": "logo" }, { "title": "恢复默认壁纸和LOGO", "value": "delLogo" }, { "title": "图标颜色", "type": "select", "value": "bookcolor", "data": [{ "t": "深色图标", "v": "black" }, { "t": "浅色图标", "v": "white" }] }, { "title": "主页样式细圆", "type": "checkbox", "value": "styleThin" }, { "title": "夜间模式", "type": "checkbox", "value": "nightMode" }, { "title": "记录搜索历史", "type": "checkbox", "value": "searchHistory" }, { "type": "hr" }, { "title": "导出主页数据", "value": "export" }, { "title": "导入主页数据", "value": "import" }, { "type": "hr" }, { "title": "Github", "value": "openurl", "description": "https://github.com/liumingye/quarkHomePage" }, { "title": "关于", "description": "当前版本：" + app.version }];
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
