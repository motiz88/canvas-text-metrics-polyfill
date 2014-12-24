(function()
{
	'use strict';
	
	function _show(ctx, text, textMetrics)
	{
		var canvas = document.createElement("canvas");
		
		var maxWidth = Math.max(textMetrics.actualBoundingBoxLeft + textMetrics.actualBoundingBoxRight); //, highTextMetrics.width, lowTextMetrics.width);
		var maxHeight = textMetrics.actualBoundingBoxAscent + textMetrics.actualBoundingBoxDescent;
		if (!(maxWidth >0))
			return false;
		if (!(maxHeight >0))
			return false;
		var paddingX =  maxWidth + 400;
		var paddingY =  maxHeight*2;
		var annotationSpacing = 5;
		canvas.width=maxWidth + paddingX;
		canvas.height=maxHeight + paddingY;
		
		var posx =  textMetrics.actualBoundingBoxLeft + paddingX/2;
		var posy =  textMetrics.actualBoundingBoxAscent + paddingY/2;
		
		document.body.appendChild(canvas);
		document.body.appendChild(document.createElement("br"));
		
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
		
		return true;
	}
		
	function runMetrics(ctx) {
		var h = document.createElement("h3");
		h.textContent = ctx.textBaseline + ", " +  ctx.textAlign + ", " + ctx.font;
		document.body.appendChild(h);
		
		console.log("--");
		console.log("Baseline: ", ctx.textBaseline);
		console.log("Align: ", ctx.textAlign);
		
		console.log("Baseline: ", ctx.textBaseline, " Align: ", ctx.textAlign);
		
		var measureText = CanvasRenderingContext2D.prototype.measureText.bind(ctx);
		
		var texts = {space: "    ", some: "Some Text ♫㎒Ý", high: "M", low: "q"};
		
		var metrics = {};
		var success = 0;
		
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
			
			console.log("Text (" + key + "): " + texts[key]);
			console.log("Width: ", w);
			console.log("Actual Bounding Box Left: ", lb);
			console.log("Actual Bounding Box Right: ", rb);
						
			console.log("Alphabetic Baseline: ", ab);
			console.log("Hanging Baseline: ", hb);
			console.log("Ideographic Baseline: ", ib);
			console.log("Font Bounding Box Ascent: ", fa);
			console.log("Font Bounding Box Descent: ", fd);
			console.log("eM Height Ascent: ", ea);
			console.log("eM Height Descent: ", ed);
			console.log("Actual Bounding Box Ascent (normal): ", textMetrics.actualBoundingBoxAscent);
			console.log("Actual Bounding Box Descent (normal): ", textMetrics.actualBoundingBoxDescent);
			
			if (_show(ctx, texts[key], textMetrics))
				success ++;
			
			
			//debugger;
		}
		return success;
	}

	document.addEventListener('DOMContentLoaded', (function() {
		
		var canvas = document.getElementById("measureHere");
		var ctx = canvas.getContext("2d");
		
		document.getElementById("which").textContent = (ctx.measureTextWidth ? "polyfilled" : "native");
		
		ctx.font = '50px Times New Roman';
		
		ctx.fillStyle = '#0f0';
		ctx.fillRect(0, 0, canvas.width, canvas.height);

		var aligns = ['left','right','center','start','end'];
		var baselines = ['top','hanging','middle','alphabetic','ideographic','bottom'];
		var success = 0;
		for (var i=0; i<aligns.length; ++i)
		{
			for (var j=0; j<baselines.length; ++j)
			{
				ctx.textAlign = aligns[i];
				ctx.textBaseline = baselines[j];
				success += runMetrics(ctx);
			}
		}
		if (success == 0)
		{
			ctx.fillStyle = '#f00';
			ctx.fillRect(0, 0, canvas.width, canvas.height);
			document.body.appendChild(document.createTextNode("No test cases could be drawn successfully."));
		}
	

	}));
	
}) ();