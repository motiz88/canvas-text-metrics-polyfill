(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
var baselineCache_ = {};

function styleKey_(style) {
	return (typeof(style) === 'string') ? style : ('font: ' + style.font + '; textBaseline: ' + style.textBaseline);
}

function fetch(style) {
	var styleKey = styleKey_(style);
	if (baselineCache_.hasOwnProperty(styleKey))
		return baselineCache_[styleKey];
	else
		return {};
}

function store(style, metrics) {
	var styleKey = styleKey_(style);

	var allBaselineProperties = ['alphabeticBaseline', 'hangingBaseline', 'ideographicBaseline', 'emHeightAscent', 'emHeightDescent'];
	var cacheObj = fetch(styleKey);

	for (var i = 0; i < allBaselineProperties; ++i) {
		var prop = allBaselineProperties[i];
		if (cacheObj.hasOwnProperty(prop))
			continue;
		if (metrics.hasOwnProperty(prop) && (metrics[prop] !== undefined))
			cacheObj[prop] = metrics[prop] - cacheObj[prop];
	}

	baselineCache_[styleKey] = cacheObj;
}

function clear() {
	baselineCache_ = {};
}

module.exports = {
	fetch : fetch,
	store : store,
	clear : clear
};
},{}],2:[function(require,module,exports){
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

			var len, i, scan;
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

},{}],3:[function(require,module,exports){
var svgNS = 'http://www.w3.org/2000/svg';

module.exports = function SVGMeasurementContext() {
	'use strict';

	var document_ = null;
	var text_ = "";
	var rootElement_ = null;
	var textElement_ = null;
	var font_ = "";

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
				text_ = s;
				makeTextElement_();
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
				makeTextElement_();
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
			rootElement_ = document_.createElementNS(svgNS, 'svg');
			rootElement_.setAttributeNS(svgNS, 'height', 100);
			rootElement_.setAttributeNS(svgNS, 'width', 100);
			rootElement_.style.visibility = 'hidden';
		}
	};

	var makeTextElement_ = function () {
		makeRootElement_();
		if (!document_ || !rootElement_)
			return;
		if (!textElement_) {
			textElement_ = document_.createElementNS(svgNS, 'text');
			textElement_.x.baseVal = 0;
			textElement_.y.baseVal = 0;
			textElement_.setAttributeNS(svgNS, 'fill', 'black');
		}
		if (textElement_.textContent != text_) {
			textElement_.textContent = text_;
		}
		if (font_ && (textElement_.style.font != font_)) {
			textElement_.style.font = font_;
		}
	};

	var killAndUninstall_ = function () {
		/*uninstall_();
		rootElement_ = null;*/
		text_ = "";
		textElement_ = "";
		font_ = "";
	};

	var install_ = function () {
		if (!document_)
			return;
		makeRootElement_();
		if (rootElement_ && !rootElement_.parentNode) {
			document_.body.appendChild(rootElement_);
		}
	};

	var uninstall_ = function () {
		if (!document_)
			return;
		if (rootElement_ && rootElement_.parentNode)
			rootElement_.parentNode.removeChild(rootElement_);
	};

	this.measure = function (style) {
		makeTextElement_();
		if (!textElement_)
			return undefined;
		install_();
		//debugger;
		textElement_.style.direction = style.direction;
		var isRtl = style.direction == 'rtl';
		switch (style.textAlign) {
		case 'left':
			textElement_.style.textAnchor = isRtl ? 'end' : 'start';
			break;
		case 'right':
			textElement_.style.textAnchor = isRtl ? 'start' : 'end';
			break;
		case 'center':
			textElement_.style.textAnchor = 'middle';
			break;
		case 'start':
		/* falls through */
		case 'end':
		/* falls through */
		default:
			textElement_.style.textAnchor = style.textAlign;
			break;
		}

		switch (style.textBaseline) {
		case 'top':
			textElement_.style.alignmentBaseline = 'before-edge';
			break;
		case 'hanging':
			textElement_.style.alignmentBaseline = 'text-before-edge';
			break;
		case 'alphabetic':
			textElement_.style.alignmentBaseline = 'text-after-edge';
			break;
		case 'bottom':
			textElement_.style.alignmentBaseline = 'after-edge';
			break;
		case 'middle':
			textElement_.style.alignmentBaseline = 'central';
			break;
		case 'ideographic':
		/* falls through */
		default:
			textElement_.style.alignmentBaseline = style.textBaseline;
			break;
		}

		rootElement_.appendChild(textElement_);
		var bbox = textElement_.getBBox();
		rootElement_.removeChild(textElement_);

		var metrics = {
			actualBoundingBoxLeft : bbox.x,
			actualBoundingBoxRight : bbox.width + bbox.x,
			fontBoundingBoxAscent : -bbox.y,
			fontBoundingBoxDescent : bbox.height + bbox.y
		};
		return metrics;
	};

	this.end = function () {
		uninstall_();
	};

	return this;
};

},{}],4:[function(require,module,exports){
(function (global){
/**

  A polyfill for the enhanced context.measureText() in HTML <canvas> v5 / Canvas
  2D Context Level 2. This API returns the 2D bounding box (and the vertical
  positions corresponding to various textBaseline settings) for a given text,
  taking into account the <canvas>'s font, textAlign, textBaseline and
  direction properties.
  

  Substantially based on fontmetrics.js version 1-2012.0121.1300 by Mike "Pomax"
  Kamermans, found at https://github.com/Pomax/fontmetrics.js .
  
  This library is licensed under the MIT (Expat) license,
  the text for which is included below.

** -----------------------------------------------------------------------------
  
  canvas-text-metrics-polyfill changelog:
	2014-11-19 - Initial release.
				 Changes on top of fontmetrics.js:
				 * Reworked API to work as a polyfill for <canvas> v5.
				 * Optimized pixel scanning using Uint32Array where available.
				 * Added SVG measurement module. This turns out to be of
				   limited use, as browsers calculate a slightly different
				   bounding box for <svg:text> than what canvas.measureText
				   returns (at least in the one available native implementation
				   -  Google Chrome Canary). However this is now used for the
				   fontBoundingBox(A|Des)cent metrics.
				 * Extended API for increased performance: A second argument to
				   measureText() now lets the caller request specific metrics.
				 * Split out the code into multiple files, AMD-style, and added 
				   package.json, Gruntfile.
				   
  
  fontmetrics.js changelog:

    2012-01-21 - Whitespace handling added by Joe Turner
                 (https://github.com/oampo)

** -----------------------------------------------------------------------------

  
  
  fontmetrics.js Copyright (C) 2011 by Mike "Pomax" Kamermans
  
  Additions and repackaging as canvas-text-metrics-polyfill -
	Copyright (C) 2014 by Moti Zilberman
  
  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in
  all copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
  THE SOFTWARE.
**/
/* jshint node: true */
'use strict';

var CanvasMeasurementContext = require('./CanvasMeasurementContext');
var SVGMeasurementContext = require('./SVGMeasurementContext');
var sniffSVG = require('./sniffsvg');
var BaselineCache = require('./BaselineCache');


if (document.createElement("canvas")
	.getContext("2d")
	.measureText("")
	.hasOwnProperty("actualBoundingBoxAscent"))
	// nothing to polyfill
	return;

var sniff = sniffSVG(document);

function TextMetrics(metrics) {
	this.width = 
		this.actualBoundingBoxLeft = 
		this.actualBoundingBoxRight = 
		this.fontBoundingBoxAscent = 
		this.fontBoundingBoxDescent = 
		this.actualBoundingBoxAscent = 
		this.actualBoundingBoxDescent = 
		this.emHeightAscent = 
		this.emHeightDescent = 
		this.hangingBaseline = 
		this.alphabeticBaseline = 
		this.ideographicBaseline = undefined;

	this.raw = metrics;

	for (var prop in metrics)
		if (this.hasOwnProperty(prop))
			this[prop] = metrics[prop];
}

function convertToStandardMetrics(metrics) {
	return new TextMetrics({
		width : metrics.width,
		actualBoundingBoxAscent : metrics.ascent,
		actualBoundingBoxDescent : metrics.descent,
		actualBoundingBoxLeft : metrics.bounds.minx,
		actualBoundingBoxRight : metrics.bounds.maxx
	});
}

// store the old text metrics function on the Canvas2D prototype
global.CanvasRenderingContext2D.prototype.measureTextWidth = global.CanvasRenderingContext2D.prototype.measureText;

/**
 *  shortcut function for getting computed CSS values
 */

function getDirection(el) {
	var dir = 'ltr';
	if (el.currentStyle)
		dir = el.currentStyle.direction;
	else if (global.getComputedStyle)
		dir = el.ownerDocument.defaultView.getComputedStyle(el, null).getPropertyValue('direction');
	return dir;
}

var canvasMeasuringContext = null, svgMeasuringContext = null;

/**
 * The new text metrics function
 */
global.CanvasRenderingContext2D.prototype.measureText = function measureText(textstring, model) {
	if (typeof(model) === 'string')
		switch (model) {
		case 'native':
			return this.measureTextWidth();
		case 'clear-baselines':
			BaselineCache.clear();
			break;
		}

	var requestedProperties;

	if ((typeof(model) === 'object') && model) {
		requestedProperties = {
			width : true,
			alphabeticBaseline : false,
			hangingBaseline : false,
			ideographicBaseline : false,
			emHeightAscent : false,
			emHeightDescent : false,
			actualBoundingBoxLeft : false,
			actualBoundingBoxRight : false,
			actualBoundingBoxAscent : false,
			actualBoundingBoxDescent : false,
			fontBoundingBoxAscent : false,
			fontBoundingBoxDescent : false
		};

		for (var prop in model)
			requestedProperties[prop] = model[prop] !== undefined;
	} else
		requestedProperties = {
			width : true,
			alphabeticBaseline : true,
			hangingBaseline : true,
			ideographicBaseline : true,
			emHeightAscent : true,
			emHeightDescent : true,
			actualBoundingBoxLeft : true,
			actualBoundingBoxRight : true,
			actualBoundingBoxAscent : true,
			actualBoundingBoxDescent : true,
			fontBoundingBoxAscent : true,
			fontBoundingBoxDescent : true
		};

	var doc = (this.canvas && this.canvas.ownerDocument) ? this.canvas.ownerDocument : document;
	if (!sniff)
		sniff = sniffSVG(this.doc);

	var isSpace = !(/\S/.test(textstring)),
	isDirRtl = (this.direction == 'rtl') || (this.direction == 'inherit' && getDirection(this.canvas) == 'rtl');

	var curStyle = {
		textBaseline : this.textBaseline,
		textAlign : this.textAlign,
		direction : (isDirRtl ? 'rtl' : 'ltr')
	};

	var collectedMetrics = {};

	var baselineProperties = {
		alphabeticBaseline : 'alphabetic',
		hangingBaseline : 'hanging',
		ideographicBaseline : 'ideographic',
		emHeightAscent : 'top',
		emHeightDescent : 'bottom'
	};
	var fontGlobalProperties = {
		alphabeticBaseline : true,
		hangingBaseline : true,
		ideographicBaseline : true,
		emHeightAscent : true,
		emHeightDescent : true,
		fontBoundingBoxAscent : true,
		fontBoundingBoxDescent : true
	};

	if (isSpace) {
		collectedMetrics.width = this.measureTextWidth(textstring).width;
		collectedMetrics.actualBoundingBoxLeft = 0;
		collectedMetrics.actualBoundingBoxRight = collectedMetrics.width;
		var dx = 0;
		switch (curStyle.textAlign) {
		case 'end':
			dx = (!isDirRtl) ? collectedMetrics.width : 0;
			break;
		case 'left':
			dx = 0;
			break;
		case 'center':
			dx = collectedMetrics.width / 2;
			break;
		case 'right':
			dx = collectedMetrics.width;
			break;
		case 'start':
		/* falls through */
		default:
			dx = (!isDirRtl) ? 0 : collectedMetrics.width;
			break;
		}
		collectedMetrics.actualBoundingBoxLeft -= dx;
		collectedMetrics.actualBoundingBoxRight -= dx;

		var fontGlobalModel = {};
		var anyFontGlobalsRequested = false;
		for (var requestedProperty in requestedProperties) {
			if (requestedProperties[requestedProperty]) {
				if (fontGlobalProperties.hasOwnProperty(requestedProperty))
					anyFontGlobalsRequested = fontGlobalModel[requestedProperty] = true;
				else if ((requestedProperty == 'actualBoundingBoxAscent') || (requestedProperty == 'actualBoundingBoxDescent'))
					anyFontGlobalsRequested = fontGlobalModel.alphabeticBaseline = true;
			}
		}

		if (anyFontGlobalsRequested) {
			var nonspace = '_';
			var nonspaceMetrics = measureText.call(this, nonspace, fontGlobalModel);

			for (var fontGlobalProperty in nonspaceMetrics) {
				if (requestedProperties[fontGlobalProperty] && fontGlobalProperties.hasOwnProperty(fontGlobalProperty) && nonspaceMetrics[fontGlobalProperty] !== undefined)
					collectedMetrics[fontGlobalProperty] = nonspaceMetrics[fontGlobalProperty];
			}
			collectedMetrics.actualBoundingBoxAscent = -nonspaceMetrics.alphabeticBaseline;
			collectedMetrics.actualBoundingBoxDescent = nonspaceMetrics.alphabeticBaseline;
		}

		return new TextMetrics(collectedMetrics);
	}
	//debugger;

	if (!canvasMeasuringContext)
		canvasMeasuringContext = new CanvasMeasurementContext();

	canvasMeasuringContext.document(doc).font(this.font).text(textstring);

	var edges = {
		top : true,
		left : true,
		right : true,
		bottom : true
	};
	edges.left = requestedProperties.actualBoundingBoxLeft;
	edges.right = requestedProperties.actualBoundingBoxRight;
	edges.top = requestedProperties.actualBoundingBoxAscent || requestedProperties.alphabeticBaseline || requestedProperties.hangingBaseline || requestedProperties.ideographicBaseline || requestedProperties.emHeightAscent || requestedProperties.emHeightDescent;
	edges.bottom = requestedProperties.actualBoundingBoxDescent;

	var cachedBaselines = BaselineCache.fetch(curStyle);

	var partialMetrics = canvasMeasuringContext.measure(curStyle, edges);

	var actualBoundingBoxAscent = partialMetrics.actualBoundingBoxAscent; // save it separately so we don't mask it out if it wasn't requested

	for (var metric in partialMetrics) {
		if (requestedProperties[metric] && partialMetrics[metric] !== undefined) {
			collectedMetrics[metric] = partialMetrics[metric];
		}
	}

	var baselineMetrics = {};

	var firstBaseline = true;

	for (var baselineProperty in baselineProperties) {
		if (!requestedProperties[baselineProperty])
			continue;
		if (baselineProperties[baselineProperty] == this.textBaseline) {
			collectedMetrics[baselineProperty] = 0;
			continue;
		}
		if (cachedBaselines.hasOwnProperty(baselineProperty)) {
			collectedMetrics[baselineProperty] = cachedBaselines[baselineProperty];
			continue;
		}
		if (collectedMetrics.hasOwnProperty(baselineProperty))
			continue;
		var baselineValue = baselineProperties[baselineProperty];

		if (firstBaseline) {
			if (textstring.length > 1) // fudge the text string because we're only looking for font metrics independent of the text
			{
				actualBoundingBoxAscent = canvasMeasuringContext.text('_').measure(curStyle, {
						top : true
					}).actualBoundingBoxAscent;
			}
			firstBaseline = false;
		}

		var altmeas = canvasMeasuringContext.measure({
				textBaseline : baselineValue,
				textAlign : this.textAlign,
				direction : (isDirRtl ? 'rtl' : 'ltr')
			}, {
				top : true
			});
		collectedMetrics[baselineProperty] = altmeas.actualBoundingBoxAscent - actualBoundingBoxAscent;
	}
	canvasMeasuringContext.end();

	if (requestedProperties.width && !collectedMetrics.hasOwnProperty('width'))
		collectedMetrics.width = this.measureTextWidth(textstring).width;

	if (requestedProperties.fontBoundingBoxAscent || requestedProperties.fontBoundingBoxDescent) {
		if (sniff.svg && sniff.svgText11) {
			if (!svgMeasuringContext)
				svgMeasuringContext = new SVGMeasurementContext();
			svgMeasuringContext.document(doc).font(this.font).text(textstring);
			var svgmeas = svgMeasuringContext.measure(curStyle, {
					top : true,
					bottom : true
				});
			if (requestedProperties.fontBoundingBoxAscent)
				collectedMetrics.fontBoundingBoxAscent = svgmeas.fontBoundingBoxAscent;
			if (requestedProperties.fontBoundingBoxDescent)
				collectedMetrics.fontBoundingBoxDescent = svgmeas.fontBoundingBoxDescent;
			svgMeasuringContext.end();
		}
	}
	BaselineCache.store(curStyle, collectedMetrics);

	return new TextMetrics(collectedMetrics);
};
}).call(this,typeof global !== "undefined" ? global : typeof self !== "undefined" ? self : typeof window !== "undefined" ? window : {})
},{"./BaselineCache":1,"./CanvasMeasurementContext":2,"./SVGMeasurementContext":3,"./sniffsvg":5}],5:[function(require,module,exports){
var svgNS = 'http://www.w3.org/2000/svg';
module.exports = function sniffSVG(document) {
	if (!document) {
		return undefined;
	}
	return {
		svg : (!!document.createElementNS &&
			!!document.createElementNS(
				svgNS,
				"svg")
			.createSVGRect),

		svgText11 : document.implementation.hasFeature('http://www.w3.org/TR/SVG11/feature#Text', '1.1')
	};
};
},{}]},{},[4]);
