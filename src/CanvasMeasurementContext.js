module.exports = function CanvasMeasurementContext() {
	'use strict';

	var value_whiteOpaque8 = 255 | 0;
	var value_whiteOpaque32 = 0xffffffff;

	var document_ = null;
	var text_ = "";
	var rootElement_ = null;
	var ctx_ = null;
	var font_ = "";
	var padding_ = {
		top : 0,
		bottom : 0,
		left : 0,
		right : 0
	};
	var fontSize_;
	var nativeMetrics_ = null;
	var isSpace_ = null;

	this.document = function (doc) {
		if (arguments.length > 0) {
			if (document_ != doc) {
				killAndUninstall_();
				document_ = doc;
			}
			return this;
		} else {
			return document_;
		}
	};

	this.text = function (s) {
		if (arguments.length > 0) {
			if (text_ != s) {
				nativeMetrics_ = null;
				isSpace_ = null;
				text_ = s;
				adjustToText_();
			}
			return this;
		} else {
			return text_;
		}
	};

	this.font = function (fontstr) {
		if (arguments.length > 0) {
			if (font_ != fontstr) {
				font_ = fontstr;
				adjustToFont_();
			}
			return this;
		} else {
			return font_;
		}
	};

	var makeRootElement_ = function () {
		if (!document_)
			return;
		if (!rootElement_ || rootElement_.ownerDocument != document_) {
			uninstall_();
			rootElement_ = document_.createElement('canvas');

			rootElement_.height = 1;
			rootElement_.width = 1;
			rootElement_.style.visibility = 'hidden';
			ctx_ = null;
		}
		if (!ctx_)
			ctx_ = rootElement_.getContext('2d', {
					alpha : false
				});

	};

	var killAndUninstall_ = function () {
		uninstall_();
		rootElement_ = null;
		ctx_ = null;
	};

	var install_ = function () {
		if (!document_)
			return;
		makeRootElement_();
		rootElement_.style.display = '';
		document_.body.appendChild(rootElement_);
	};

	var uninstall_ = function () {
		if (rootElement_) {
			rootElement_.width = rootElement_.height = 0;
			rootElement_.style.display = 'none';
			if (rootElement_.parentNode)
				rootElement_.parentNode.removeChild(rootElement_);
		}
	};

	var adjustToFont_ = function () {
		makeRootElement_();
		if (!rootElement_ || !ctx_)
			return;
		if (ctx_.font != font_) {
			rootElement_.style.font = rootElement_.font = ctx_.font = font_;
			fontSize_ = 1 * rootElement_.style.fontSize.replace("px", "");

			var paddingTop,
			paddingBottom,
			paddingLeft,
			paddingRight;
			var basePadding = fontSize_ / 2;

			padding_.top = padding_.bottom = padding_.left = padding_.right = basePadding;
			nativeMetrics_ = null;
		}
	};

	var adjustToText_ = function () {
		makeRootElement_();
		if (!ctx_)
			return;
		adjustToFont_();
		if (!nativeMetrics_)
			nativeMetrics_ = ctx_.measureTextWidth(text_);
		if (isSpace_ === null)
			isSpace_ = !(/\S/.test(text_));
	};

	var forwardScanlineWhile_ = function (pixelData, value) {
		var i = 0;
		while (++i < pixelData.length && pixelData[i] === value) {}
		return i;
	};
	
	var reverseScanlineWhile_ = function (pixelData, value) {
		var i = pixelData.length - 1;
		while (--i > 0 && pixelData[i] === value) {}
		return i;
	};

	var leftScanWhile_ = function (pixelData, value, width, pixelSize) {
		var lineLen = width * pixelSize;
		var i = 0,
		j = 0;
		// find the min-x coordinate
		for (i = 0, j = 0; i < pixelData.length && (j < width) && pixelData[i] === value; ) {
			i += lineLen;
			if (i >= pixelData.length) {
				i = (i - pixelData.length) + pixelSize;
				++j;
			}
		}
		return {
			i : i,
			j : j
		};
	};

	var rightScanWhile_ = function (pixelData, value, width, pixelSize) {
		var lineLen = width * pixelSize;
		var i,
		j;
		var step = 1;
		for (i = pixelData.length - Math.max(pixelSize - 1, 1), j = width - 1; i >= 0 && (j >= 0) && pixelData[i] === value; ) {
			i -= lineLen;
			if (i < 0) {
				i = (pixelData.length - Math.max(pixelSize - 1, 1)) - (step++) * pixelSize;
				--j;
			}
		}
		return {
			i : i,
			j : j
		};
	};

	this.measure = function (style, edges) {

		adjustToText_();

		if (isSpace_) {
			return {
				width : nativeMetrics_.width
			};
		}

		var paddingGrowthFactor = 2;

		install_();

		var isDirRtl = style.direction == 'rtl';

		if (edges === undefined)
			edges = {
				top : true,
				left : true,
				right : true,
				bottom : true
			};

		edges.top = edges.hasOwnProperty('top') && edges.top;
		edges.left = edges.hasOwnProperty('left') && edges.left;
		edges.right = edges.hasOwnProperty('right') && edges.right;
		edges.bottom = edges.hasOwnProperty('bottom') && edges.bottom;

		var scanTop = edges.top,
		scanLeft = edges.left,
		scanRight = edges.right,
		scanBottom = edges.bottom;

		var posx = 0,
		posy = 0,
		w = rootElement_.width = nativeMetrics_.width,
		w4,
		w32,
		h = rootElement_.height;
		if (w === 0)
			throw new Error('cannot measure this string');
		w4 = w * 4;
		w32 = w;

		var miny,
		maxy,
		minx,
		maxx;
		while (scanTop || scanBottom || scanLeft || scanRight) {
			//console.log(ctx.font);
			//debugger;
			var paddingX = padding_.left + padding_.right;
			var paddingY = padding_.top + padding_.bottom;
			if (paddingY > fontSize_ * 10)
				throw new Error('Could not find text on canvas');

			var nextPaddingLeft,
			nextPaddingRight,
			nextPaddingTop,
			nextPaddingBottom;

			w = rootElement_.width = (nativeMetrics_.width + paddingX) | 0;
			w4 = w * 4;
			w32 = w;

			if (scanLeft || scanRight) {

				switch (style.textAlign) {
				case 'end':
					posx = (!isDirRtl) ? (w - padding_.right) : (padding_.left);
					break;
				case 'left':
					posx = padding_.left;
					break;
				case 'center':
					posx = (rootElement_.width - paddingX) / 2 + padding_.left;
					break;
				case 'right':
					posx = w - padding_.right;
					break;
				case 'start':
				/* falls through */
				default:
					posx = (!isDirRtl) ? (padding_.left) : (w - padding_.right);
					break;
				}
				posx -= padding_.left;
				//posx |= 0;
			}

			h = rootElement_.height = (fontSize_ + paddingY) | 0;

			if (scanTop || scanBottom) {
				switch (style.textBaseline) {
				case 'hanging':
				/* falls through */
				case 'top':
					posy = padding_.top;
					break;
				case 'middle':
					posy = (rootElement_.height - paddingY) / 2 + padding_.top;
					break;
				case 'bottom':
				/* falls through */
				case 'ideographic':
				/* falls through */
				case 'alphabetic':
				/* falls through */
				default:
					posy = rootElement_.height - padding_.bottom;
					break;
				}

				posy -= padding_.top;
				//posy |= 0;
			}

			ctx_.fillStyle = "white";
			ctx_.fillRect(-2, -2, w + 2, h + 2);
			ctx_.fillStyle = "black";

			//console.log('posx ', posx + padding_.left, 'posy ', posy + padding_.top);

			ctx_.font = font_; //fontSize + "px " + fontFamily;
			ctx_.textBaseline = style.textBaseline;
			ctx_.textAlign = style.textAlign;
			ctx_.fillText(text_, posx + padding_.left, posy + padding_.top);
			var pixelData8 = ctx_.getImageData(0, 0, w, h).data;

			var isArrayBufferView = Object.prototype.toString.call(pixelData8) === "[object Uint8ClampedArray]";

			var len, i, j, scan;
			var pixelData;
			var value_whiteOpaque;
			var lineLen;
			var pixelSize;

			if (isArrayBufferView) {
				var pixelData32 = new Uint32Array(pixelData8.buffer);
				pixelData = pixelData32;
				value_whiteOpaque = value_whiteOpaque32;
				lineLen = w32;
				pixelSize = 1;
			} else {
				pixelData = pixelData8;
				value_whiteOpaque = value_whiteOpaque8;
				lineLen = w8;
				pixelSize = 4;
			}

			len = pixelData.length;

			var isAllBlank = false;
			if (scanTop) {
				i = forwardScanlineWhile_(pixelData, value_whiteOpaque);
				if (i == len) {
					isAllBlank = true;
				} else {
					miny = ((i / lineLen) | 0) - padding_.top;
					if (miny <= 1 - padding_.top)
						nextPaddingTop = padding_.top ? (padding_.top * paddingGrowthFactor) : basePadding;
					else
						scanTop = false;
				}
			}

			if (!isAllBlank && scanBottom) {
				// Finding the descent uses a reverse scanline
				i = reverseScanlineWhile_(pixelData, value_whiteOpaque);

				if (i === 0) {
					isAllBlank = true;
				} else {
					maxy = ((i / lineLen + 1) | 0) - padding_.top;
					if (maxy >= h - 1 - padding_.top) {
						nextPaddingBottom = padding_.bottom ? (padding_.bottom * paddingGrowthFactor) : basePadding;
						//debugger;
					} else
						scanBottom = false;
				}
			}

			if (!isAllBlank && scanLeft) {
				// find the min-x coordinate
				scan = leftScanWhile_(pixelData, value_whiteOpaque, w, pixelSize);
				i = scan.i;
				j = scan.j;
				if (j == w) {
					isAllBlank = true;
				} else {
					minx = ((((i % lineLen) / pixelSize) | 0) - padding_.left) | 0;

					if (minx <= 1 - padding_.left)
						nextPaddingLeft = padding_.left ? (padding_.left * paddingGrowthFactor) : basePadding;
					else
						scanLeft = false;
				}
			}

			if (scanRight) {
				// find the max-x coordinate
				scan = rightScanWhile_(pixelData, value_whiteOpaque, w, pixelSize);
				i = scan.i;
				j = scan.j;
				if (j < 0) {
					isAllBlank = true;
				} else {
					maxx = ((((i % lineLen) / pixelSize) | 0) + 1 - padding_.left) | 0;
					if (maxx >= w - 1 - padding_.left)
						nextPaddingRight = padding_.right ? (padding_.right * paddingGrowthFactor) : basePadding;
					else
						scanRight = false;
				}
			}

			if (isAllBlank) {
				scanTop = edges.top;
				scanLeft = edges.left;
				scanRight = edges.right;
				scanBottom = edges.bottom;

				padding_.left = nextPaddingLeft = padding_.left ? (padding_.left * paddingGrowthFactor) : basePadding;
				padding_.right = nextPaddingRight = padding_.right ? (padding_.right * paddingGrowthFactor) : basePadding;
				padding_.top = nextPaddingTop = padding_.top ? (padding_.top * paddingGrowthFactor) : basePadding;
				padding_.bottom = nextPaddingBottom = padding_.bottom ? (padding_.bottom * paddingGrowthFactor) : basePadding;
			} else {
				if (scanLeft)
					padding_.left = nextPaddingLeft;
				if (scanRight)
					padding_.right = nextPaddingRight;
				if (scanTop)
					padding_.top = nextPaddingTop;
				if (scanBottom)
					padding_.bottom = nextPaddingBottom;
				if (scanLeft || scanRight || scanTop || scanBottom) {
					scanTop = edges.top;
					scanLeft = edges.left;
					scanRight = edges.right;
					scanBottom = edges.bottom;
				}
			}
			// debugger;
		}

		var metrics = {
			width : nativeMetrics_.width,
			actualBoundingBoxLeft : (edges.left ? (posx - minx) : undefined),
			actualBoundingBoxRight : (edges.right ? (maxx - posx) : undefined),
			actualBoundingBoxAscent : (edges.top ? (posy - miny) : undefined),
			actualBoundingBoxDescent : (edges.bottom ? (maxy - posy) : undefined)
		};

		return metrics;
	};

	this.end = function () {
		uninstall_();
	};
};
