/*
 * Author: Łukasz Kowalski, http://www.devbricks.com
 * requires: jQuery
 */

(function($){	
	$.fn.microUploader = function(settings){
		var T = this;
		var _files = [];
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
		
		this.selectFiles = function(files){
			_files = files;
			settings.fileSelected(_files);
			if(settings.autoStart) uploader.autoStart();
		}
		
		if(settings.url === null) return console.error('microUpload: no url specified in settings'); //url is required
		if(settings.input === null) settings.input = $('<input type=file />');
		if(settings.multiple) settings.input.attr('multiple', 'multiple');
		
		var uploader = new (function(){
			var getFiles = function(){
				return _files;
			}
			this.getFiles = function(){
				return getFiles();
			}
			this.startUpload = function(){
				var files = this.getFiles();
				for(var i=0; i<files.length; i++){
					(function(file, index){
						var form = new FormData();
						form.append('file', file);
						form.append('index', index);
						var xhr = new XMLHttpRequest();
						xhr.idd = i;
						xhr.upload.addEventListener('progress', function(e){
							if(e.lengthComputable){
								file.progress = Math.round((e.loaded * 100) / e.total);
							}
							settings.fileUploadProgress(file, index);
						}, false);
						
						xhr.onreadystatechange = function(){
							if (this.readyState == 4){
								settings.fileUploadFinish(this.responseText, file, index);
							}
						}
						
						settings.fileUploadStart(file, index);
						xhr.open("POST", settings.url);
						xhr.send(form);
					})(files[i], i);
				}
			}
			this.autoStart = function(){
				this.startUpload();
			}
		})();


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
		}).on('startUpload', function(){
			uploader.startUpload();
		});
	}
})(jQuery);