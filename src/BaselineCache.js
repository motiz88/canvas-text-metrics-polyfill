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