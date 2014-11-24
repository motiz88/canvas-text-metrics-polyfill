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
