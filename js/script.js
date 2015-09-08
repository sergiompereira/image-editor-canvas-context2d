(function(){
	
	var d = document,
		container = d.getElementById("image-container"),
			img, canvas, context,
			originalImageData, width, height,
			bmpUtil;
	
	var ImageDisplay = (function(){
	
		var main = d.getElementById("main"),
			dropArea;
	
		var constructor = function(){
			bmpUtil = new smp.canvas.BitmapData();
			dropArea = new DropArea(container);
			dropArea.addEventListener("ADDED", onImageAdded);	
			
			var self = this;
			
			smp.events.extend(self);
			
			function onImageAdded(evt){
				img = evt.data.image;
				if(!img.width){
					img.addEventListener("load", onImgLoaded);
				}else{
					onImgLoaded();
				}
			}
			
			function onImgLoaded(evt){
				
				container.style.width = img.width+"px";
				container.style.height = img.height+"px";
				
				if(!canvas){
					
					canvas = d.createElement("canvas");
					context = canvas.getContext("2d");
				
					container.style.border = "none";
					container.innerHTML = "";
					container.appendChild(canvas);
					
								
					canvas.addEventListener("click", onPreviewClicked);
				}
				
				width = canvas.width = img.width;
				height = canvas.height = img.height;
				context.drawImage(img,0,0);
				originalImageData = context.getImageData(0,0,width, height);
				
				self.dispatchEvent("update");
				
			}
		}
		
		
	
				
		function onPreviewClicked(evt){
				
			var imageData = canvas.toDataURL("image/png");
			window.open(imageData,'userimage','width='+width+',height='+height+',left=100,top=100,resizable=No');
	
		}
	
		return constructor;
	
	}());
	
	var ImageEffect = (function(){
		
		var bmp,wait = false;
	
		var constructor = function(){
									
			bmp = new smp.canvas.BitmapData;
			bmp.addEventListener("UPDATE", setImageData);
							
		};
		
		function onImageUpdated()  {
			bmp.setData(originalImageData);
			applyEffects();
		}
		
		function applyEffects(){
			
			if (!wait) {
				wait = true;
				try {
					bmp.processFilters();
				}catch(err){
					console.log(err.message)
					wait = false;
				}
			}
			
		}
		function setImageData(evt){
			context.clearRect(0,0,width,height);
			context.putImageData(evt.data,0,0);
			wait = false;
		}
		

		constructor.prototype = {
			onImageUpdated:onImageUpdated,
			applyEffects:applyEffects,
			getBmpData:function(){return bmp}
		}
		
		return constructor;
	}());

	var EffectsController = (function(){
		
		var bmp,inputs, reset,colorPicker1,colorPicker2;
		var constructor = function(_bmp){
			bmp = _bmp;
			inputs = document.getElementById("editorControls").getElementsByTagName("input");
			labels = document.getElementById("editorControls").getElementsByTagName("label");
			pickers = document.getElementById("editorControls").getElementsByTagName("canvas");
			
			var self = this;
			smp.events.extend(self);
			
			smp.each(inputs, function(ind, value){
				if (value.getAttribute("type") == "button") {
					reset = value;
				}
				value.labelspan = (function(){
					var i, len = labels.length;
					for (i = 0; i < len; i++) {
						if (labels[i].getAttribute("for") == value.getAttribute("name")) {
							return labels[i].getElementsByTagName("span")[0];
						}
					}
					
				}());
				value.addEventListener("change", onInputChange);
			});
			
			
			colorPicker1 = new smp.ui.ColorPicker(pickers[0]);
			colorPicker1.drawGradientLinear(smp.ui.ColorPicker.spectrum(pickers[0].width, true), {
				x: pickers[0].width,
				y: pickers[0].height
			}, null, null, true);
			colorPicker1.addEventListener("change", onColorChange);
			colorPicker2 = new smp.ui.ColorPicker(pickers[1]);
			colorPicker2.drawGradientLinear(smp.ui.ColorPicker.spectrum(pickers[1].width, true), {
				x: pickers[1].width,
				y: pickers[1].height
			}, null, null, true);
			colorPicker2.addEventListener("change", onColorChange);
			
			
			function onColorChange(evt){
				var target = evt.currentTarget;
				
				for (i = 0; i < inputs.length; i++) {
					if (target == colorPicker1 && inputs[i].getAttribute("name") == "monotone" && inputs[i].checked == true) {
						bmp.addFilter("monotone", smp.math.ColorUtils.serializeColor(evt.data.r.toString() + evt.data.g.toString() + evt.data.b.toString(), 10), inputs[i + 1].checked);
						break;
					}
					else 
						if (inputs[i].getAttribute("name") == "duotone" && inputs[i].checked == true) {
							var color1 = colorPicker1.getColor();
							var color2 = colorPicker2.getColor();
							bmp.addFilter(el.name, smp.math.ColorUtils.serializeColor(color1.r.toString() + color1.g.toString() + color1.b.toString(), 10), smp.math.ColorUtils.serializeColor(color2.r.toString() + color2.g.toString() + color2.b.toString(), 10));
							break;
						}
				}
				
				self.dispatchEvent("change");
			}
			
			function onInputChange(evt){
				var i, towhite;
				el = evt.currentTarget;
				if (el.labelspan) 
					el.labelspan.innerHTML = el.value.toString();
				
				if (el.name == "threshold") {
				
					if (el.value == 256) {
						bmp.clearFilter(el.name);
					}
					else {
						bmp.addFilter(el.name, el.value);
					}
				}
				else 
					if (el.name == "posterize") {
					
						if (el.value == 0) {
							bmp.clearFilter(el.name);
						}
						else {
							bmp.addFilter(el.name, el.value);
						}
					}
					else 
						if (el.name == "invert") {
						
							if (el.checked == false) {
								bmp.clearFilter(el.name);
							}
							else {
								bmp.addFilter(el.name);
							}
						}
						else 
							if (el.name == "normalize-dark") {
							
								if (el.value > 0) {
									for (i = 0; i < inputs.length; i++) {
										if (inputs[i].getAttribute("name") == "normalize-bright") {
											bmp.addFilter("normalize", parseInt(el.value), parseInt(inputs[i].value));
											break;
										}
									}
								}
								else {
									for (i = 0; i < inputs.length; i++) {
										if (inputs[i].getAttribute("name") == "normalize-bright") {
											if (inputs[i].value == 255) 
												bmp.clearFilter("normalize");
											break;
										}
									}
								}
								
							}
							else 
								if (el.name == "normalize-bright") {
								
									if (el.value < 255) {
										for (i = 0; i < inputs.length; i++) {
											if (inputs[i].getAttribute("name") == "normalize-dark") {
												bmp.addFilter("normalize", parseInt(inputs[i].value), parseInt(el.value));
												break;
											}
										}
									}
									else {
										for (i = 0; i < inputs.length; i++) {
											if (inputs[i].getAttribute("name") == "normalize-dark") {
												if (inputs[i].value == 0) 
													bmp.clearFilter("normalize");
												break;
											}
										}
									}
								}
								else 
									if (el.name == "monotone") {
									
										if (el.checked == false) {
											bmp.clearFilter(el.name);
										}
										else {
										
											for (i = 0; i < inputs.length; i++) {
												if (inputs[i].getAttribute("name") == "duotone") {
													inputs[i].checked = false;
													bmp.clearFilter("duotone");
												}
												else 
													if (inputs[i].getAttribute("name") == "monotone-towhite") {
														towhite = inputs[i].checked;
													}
											}
											var color = colorPicker1.getColor();
											bmp.addFilter(el.name, smp.math.ColorUtils.serializeColor(color.r.toString() + color.g.toString() + color.b.toString(), 10), towhite);
										}
									}
									else 
										if (el.name == "monotone-towhite") {
										
											for (i = 0; i < inputs.length; i++) {
												if (inputs[i].getAttribute("name") == "monotone" && inputs[i].checked == true) {
													var color = colorPicker1.getColor();
													bmp.addFilter("monotone", smp.math.ColorUtils.serializeColor(color.r.toString() + color.g.toString() + color.b.toString(), 10), el.checked);
													break;
												}
											}
											
										}
										else 
											if (el.name == "duotone") {
											
												if (el.checked == false) {
													bmp.clearFilter(el.name);
												}
												else {
												
													for (i = 0; i < inputs.length; i++) {
														if (inputs[i].getAttribute("name") == "monotone") {
															inputs[i].checked = false;
															bmp.clearFilter("monotone");
															break;
														}
													}
													var color1 = colorPicker1.getColor();
													var color2 = colorPicker2.getColor();
													bmp.addFilter(el.name, smp.math.ColorUtils.serializeColor(color1.r.toString() + color1.g.toString() + color1.b.toString(), 10), smp.math.ColorUtils.serializeColor(color2.r.toString() + color2.g.toString() + color2.b.toString(), 10));
												}
											}
											else 
												if (el.name == "blur" || el.name == "sharpen" || el.name == "halftone" || el.name == "dither") {
												
													if (el.value == 0) {
														bmp.clearFilter(el.name);
													}
													else {
														bmp.addFilter(el.name, parseInt(el.value));
													}
													
												}
												else 
													if (el.name == "emboss" || el.name == "edges" || el.name == "sobel") {
													
														if (el.checked == false) {
															bmp.clearFilter(el.name);
														}
														else {
															bmp.addFilter(el.name);
														}
														
													}
													//default
													else {
													
														if (el.value == 1) {
															bmp.clearFilter(el.name);
														}
														else {
															bmp.addFilter(el.name, el.value);
														}
														
													}
													
					self.dispatchEvent("change");
			}
		}
			
		
		return constructor;
	}());

	var ImageEditor = (function() {
		

		var constructor = function() {
			var imageDisplay = new ImageDisplay();
			
			var imageEffect = new ImageEffect();
			var effectsCtl = new EffectsController(imageEffect.getBmpData());
			
			effectsCtl.addEventListener("change", function(){imageEffect.applyEffects();});
			imageDisplay.addEventListener("update", function(){imageEffect.onImageUpdated();})
			
		}
		
		return constructor;
	}());
	
	new ImageEditor();
	
}());
			
			