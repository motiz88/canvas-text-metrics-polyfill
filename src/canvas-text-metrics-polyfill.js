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