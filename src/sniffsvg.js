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