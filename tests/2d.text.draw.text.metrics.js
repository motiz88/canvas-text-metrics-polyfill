(function()
{
	'use strict';
	
	function _show(ctx, text, textMetrics)
	{
		var canvas = document.createElement("canvas");
		
		var maxWidth = Math.max(textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight); //, highTextMetrics.width, lowTextMetrics.width);
		var maxHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
		if (!(maxWidth >0))
			return;
		if (!(maxHeight >0))
			return;
		var paddingX =  maxWidth + 400;
		var paddingY =  maxHeight*2;
		var annotationSpacing = 5;
		canvas.width=maxWidth + paddingX;
		canvas.height=maxHeight + paddingY;
		
		var posx =  textMetrics.actualBoundingBoxLeft + paddingX/2;
		var posy =  textMetrics.actualBoundingBoxAscent + paddingY/2;
		
		_warnDOM(canvas);
		
		 console.log(canvas.width,canvas.height);
		 var locctx = canvas.getContext('2d');
		locctx.font = ctx.font;
		locctx.fillStyle = 'white';
		locctx.fillRect(0, 0, canvas.width, canvas.height);
		locctx.fillStyle = 'black';
		
		locctx.textBaseline = ctx.textBaseline;
		locctx.textAlign = ctx.textAlign;
		locctx.fillText(text, posx, posy );
		locctx.strokeStyle = 'rgba(0, 0, 255, 0.5)';

		locctx.rect(posx - textMetrics.actualBoundingBoxLeft,
				 posy - textMetrics.actualBoundingBoxAscent,
				 textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft,
				 textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent);
		locctx.stroke(); 
		
		{
			var midx = (posx - textMetrics.actualBoundingBoxLeft + posx - textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight + textMetrics.actualBoundingBoxLeft) / 2;
			var showWidthY = posy + textMetrics.actualBoundingBoxDescent + annotationSpacing;
			locctx.beginPath();
			locctx.moveTo(midx - textMetrics.width/2, showWidthY);
			locctx.lineTo(midx + textMetrics.width/2, showWidthY);
			//locctx.closePath();
			locctx.stroke();
		}
		
		{
			var showBaselineX = posx - textMetrics.actualBoundingBoxLeft - 2*annotationSpacing;
			locctx.beginPath();
			locctx.moveTo(showBaselineX + annotationSpacing/2, posy - textMetrics.actualBoundingBoxAscent);
			locctx.lineTo(showBaselineX, posy - textMetrics.actualBoundingBoxAscent);
			locctx.lineTo(showBaselineX, posy + textMetrics.actualBoundingBoxDescent);
			locctx.lineTo(showBaselineX + annotationSpacing/2, posy + textMetrics.actualBoundingBoxDescent);
			//locctx.closePath();
			locctx.stroke();
			
			locctx.beginPath();			
			locctx.moveTo(showBaselineX + annotationSpacing, posy);
			locctx.lineTo(showBaselineX - annotationSpacing, posy);			
			//locctx.closePath();
			locctx.stroke();

		}
		
		{
			var baselines = ['emHeightAscent','hangingBaseline','alphabeticBaseline','ideographicBaseline','emHeightDescent'];
			var showBaselinesX = posx + textMetrics.actualBoundingBoxRight + 2*annotationSpacing;
			
			var shownBaselineX = {};
			
			for (var i=0; i<baselines.length; ++i)
			{
				var baseline = baselines[i];
			
				var baselineX = showBaselinesX;
				
				var baselineY = posy - textMetrics[baseline];
				var baselineYround = Math.round(baselineY);
				if (shownBaselineX.hasOwnProperty(baselineYround+''))
					baselineX = shownBaselineX[baselineYround+''] + 3;
					
				locctx.beginPath();
				locctx.moveTo(baselineX + annotationSpacing/2, baselineY);
				locctx.lineTo(baselineX - annotationSpacing/2, baselineY);
				//locctx.closePath();
				locctx.stroke();
				
				locctx.font = '9px sans-serif';
				locctx.fillStyle = 'rgba(0, 0, 255, 0.5)';
				
				locctx.textBaseline = 'middle';
				locctx.textAlign = 'left';
				locctx.fillText(baseline, baselineX + annotationSpacing, baselineY);
				shownBaselineX[baselineYround+''] = baselineX + annotationSpacing + locctx.measureText(baseline, 'native').width;
			}

		}		
	}
		
	function _printTextMetrics(ctx) {
		_warn("--");
		_warn("Baseline: " + ctx.textBaseline);
		_warn("Align: " + ctx.textAlign);
		
		console.log("Baseline: " + ctx.textBaseline, " Align: " + ctx.textAlign);
		
		var measureText = CanvasRenderingContext2D.prototype.measureText.bind(ctx);
		
		
		// if (CanvasRenderingContext2D.prototype.hasOwnProperty('measureText2'))
		// {
			// measureText = CanvasRenderingContext2D.prototype.measureText2.bind(ctx);		
			// _warn("Using POLYFILL");
		// }
		// else
			// _warn("Using NATIVE");
		
		var texts = {space: "    ", some: "Some Text ♫㎒Ý", high: "M", low: "q"};
		
		var metrics = {};
		for (var key in texts)
		{
			var textMetrics = metrics[key] = measureText(texts[key]);
			var w  = textMetrics.width;
			var ab = textMetrics.alphabeticBaseline;
			var hb = textMetrics.hangingBaseline;
			var ib = textMetrics.ideographicBaseline;
			var fa = textMetrics.fontBoundingBoxAscent;
			var fd = textMetrics.fontBoundingBoxDescent;
			var ea = textMetrics.emHeightAscent;
			var ed = textMetrics.emHeightDescent;
			var lb = textMetrics.actualBoundingBoxLeft;
			var rb = textMetrics.actualBoundingBoxRight;
			
			_warn("Text (" + key + "): " + texts[key]);
			_warn("Width: " + w);
			_warn("Actual Bounding Box Left: " + lb);
			_warn("Actual Bounding Box Right: " + rb);
						
			_warn("Alphabetic Baseline: " + ab);
			_warn("Hanging Baseline: " + hb);
			_warn("Ideographic Baseline: " + ib);
			_warn("Font Bounding Box Ascent: " + fa);
			_warn("Font Bounding Box Descent: " + fd);
			_warn("eM Height Ascent: " + ea);
			_warn("eM Height Descent: " + ed);
			_warn("Actual Bounding Box Ascent (normal): " + textMetrics.actualBoundingBoxAscent);
			_warn("Actual Bounding Box Descent (normal): " + textMetrics.actualBoundingBoxDescent);
			
			//_show(ctx, texts[key], textMetrics);
			
			
			//debugger;
		}
	
	}

	_addTest(function(canvas, ctx) {

	ctx.font = '50px Times New Roman';
	deferTest();
	setTimeout(wrapFunction(function () {
		
		ctx.fillStyle = '#f00';
		ctx.fillRect(0, 0, 100, 50);
		ctx.fillStyle = '#0f0';

		var aligns = ['left','right','center','start','end'];
		var baselines = ['top','hanging','middle','alphabetic','ideographic','bottom'];
		for (var i=0; i<aligns.length; ++i)
		{
			for (var j=0; j<baselines.length; ++j)
			{
				ctx.textAlign = aligns[i];
				ctx.textBaseline = baselines[j];
				_printTextMetrics(ctx);
			}
		}
	}), 500);


	});
}) ();