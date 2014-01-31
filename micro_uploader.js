/*
 * Author: Łukasz Kowalski, http://www.devbricks.com
 * DOCS: https://github.com/krowal/micro_uploader/blob/master/micro_uploader.js
 * DEMO: http://devbricks.com/labs/micro_uploader/
 * requires: jQuery
 */

(function($){	
	$.fn.microUploader = function(settings){
		//parsing arguments from initialization
		if(typeof arguments[0] != 'object'){
			switch(arguments[0]){
				case 'cancel':
					$(this).trigger('cancel', arguments[1]);
					break;
				case 'startUpload':
					$(this).trigger('startUpload');
					break;
			}
			return;
		}else if(typeof settings == 'object'){
			var settings = $.extend({
				input:null,
				drop:null,
				multiple:true,
				autoStart:false,
				url:null,

				//events handlers
				fileSelected:function(){},			//after file or files are selected
				fileUploadStart:function(){},		//single file upload start
				fileUploadProgress:function(){},	//single file upload progress change
				fileUploadFinish:function(){},		//single file upload finish
				uploadFinish:function(){}			//all files upload finish
			}, settings);
			
			var T = this;
			var _files = [];
			var nextId = 0;
			var xhrs = {};
			var uploader = new (function(){
				this.cancelUpload = function(index){
					if(typeof(xhrs[index]) != 'undefined'){
						xhrs[index].abort();
						delete xhrs[index];
					}
				}
				this.startUpload = function(){
					for(var i=0; i<_files.length; i++){
						(function(file){
							var form = new FormData();
							form.append('file', file);
							form.append('index', file.id);
							var xhr = new XMLHttpRequest();
							xhr.idd = i;
							xhr.upload.addEventListener('progress', function(e){
								if(e.lengthComputable){
									file.progress = Math.round((e.loaded * 100) / e.total);
								}
								settings.fileUploadProgress(file, file.id);
							}, false);

							xhr.onreadystatechange = function(){
								if (this.readyState == 4){
									settings.fileUploadFinish(this.responseText, file, file.id);
									delete xhrs[file.id];
								}
							}

							settings.fileUploadStart(file, file.id);
							xhr.open("POST", settings.url);
							xhr.send(form);

							xhrs[file.id] = xhr;
						})(_files[i]);
					}
					_files = [];
				}
				this.autoStart = function(){
					this.startUpload();
				}
			})();
			
			this.selectFiles = function(files){
				var new_tmp = [];
				for(var i=0; i<files.length; i++){
					files[i].id = nextId++;
					_files.push(files[i]);
					new_tmp.push(files[i]);
				}
				settings.fileSelected(new_tmp);
				if(settings.autoStart) uploader.autoStart();
			}

			if(settings.url === null) return console.error('microUpload: no url specified in settings'); //url is required
			if(settings.input === null) settings.input = $('<input type=file />');
			if(settings.multiple) settings.input.attr('multiple', 'multiple');

			settings.input.change(function(e){
				T.selectFiles(this.files);
			});

			if(settings.drop){
				settings.drop.on('dragover', function(e){e.preventDefault();});
				settings.drop.on('dragenter', function(e){e.preventDefault();});
				settings.drop.on('dragexit', function(e){e.preventDefault();});
				settings.drop.on('drop', function(e){
					T.selectFiles(e.originalEvent.dataTransfer.files)
					e.preventDefault();
				});
			}

			$(this).click(function(){
				settings.input.click();
				return false;
			}).on('cancel', function(){
				uploader.cancelUpload(arguments[1]);
			}).on('startUpload', function(){
				uploader.startUpload();
			});
		}
	}
})(jQuery);