/*
Author: Fèline Interactive
http://www.feline.cl
Version: 1.2
Based on https://dzone.com/articles/html5-drag-and-drop-multiple logic
*/

var dropazing={
	scan:function(){
		$$('.dropazing').each(function(el){
			dropazing.prepare(el);
		});
	},
	prepare:function(el){
		this.el=el;
		this.el.counter=0;
		this.el.dropped=0;
		this.el.progressBars=[];
		this.el.uploadQueue=[];
		
		//set default vars
		this.el.vars={
			uploadUrl: false,
			postUploadName: 'file',
			fileNameMaxLength: 50,
			allowedExtensions: false,
			maxFilesAllowed: 0, //0=infinite, any other number will limit the max amount of files allowed to drop in the dropazing box
			aditionalVars: {},
			onSuccess: false, //function: handles response and then MUST return a message to show
			onError: false, //function: handles error message (no need to return a value)
			onDragOver: false, //function: will be executed on the dragOver event
			onDragLeave: false, //function: will be executed on the dragLeave event
			onDrop: false, //function: will be executed on the drop event
			onFinish: false
		}
		//update with parameter vars
		if(typeof(vars)!="object"){ vars={}; }
		this.el.vars=Object.merge(this.el.vars,vars);
		//update with inline vars
		var inlineVars=this.el.get('data-vars');
		if(typeof(inlineVars=="string")){
			this.el.vars=Object.merge(this.el.vars,eval('('+inlineVars+')'));
			for(i in this.el.vars){
				if(this.el.vars[i]=="true"){ this.el.vars[i]=true; }
				if(this.el.vars[i]=="false"){ this.el.vars[i]=false; }
			}
		}
		//fix vars
		if(this.el.vars.allowedExtensions){ this.el.vars.allowedExtensions.split(","); }
		else{ this.el.vars.allowedExtensions=[]; }
		if(typeof(this.el.vars.onSuccess)!="function"){ this.el.vars.onSuccess=function(response){ return response; } }
		if(typeof(this.el.vars.onError)!="function"){ this.el.vars.onError=function(message){ console.log(message); } }
		if(typeof(this.el.vars.maxFilesAllowed)!="number"){ this.el.vars.maxFilesAllowed=0; }
		
		this.el.button_container=new Element("div.dropazing-button",{ html:'<input type="file" multiple name="'+this.el.vars.postUploadName+'" id="'+this.el.vars.postUploadName+'">' });
		this.el.button_container.getElement('input').addEvent('change',function(event){
			this.processFiles(event.target.files);
			this.button_container.value="";
		}.bind(this.el));
		this.el.files_container=new Element("div.dropazing-files",{ html:this.el.get('html') });
		this.el.list_container=new Element("div.dropazing-list");
		this.el.set('html','');
		this.el.adopt(this.el.button_container,this.el.files_container,this.el.list_container);
		
		document.addEventListener('dragover', dropazing.handleDocumentDragOver, false);
		document.addEventListener('dragleave', dropazing.handleDocumentDragLeave, false);
		
		this.el.addEventListener('dragover', function(event){ this.handleDragOver(event); }, false);
		this.el.addEventListener('dragleave', function(event){ this.handleDragLeave(event); }, false);
		this.el.addEventListener('drop', function(event){ this.handleDrop(event); }, false);
		
		this.el.handleDragOver=function(event){
			event.preventDefault();
			this.addClass('hover');
			if(typeof(this.vars.onDragOver)=="function"){ this.vars.onDragOver(); }
		};
		this.el.handleDragLeave=function(event) {
			event.preventDefault();
			this.removeClass('hover');
			if(typeof(this.vars.onDragLeave)=="function"){ this.vars.onDragLeave(); }
		};
		this.el.handleDrop=function(event){
			event.preventDefault();
			if(typeof(this.vars.onDrop)=="function"){ this.vars.onDrop(); }
			
			var allow=true;
			if(this.vars.maxFilesAllowed>0){
				if(this.dropped+event.dataTransfer.files.length>this.vars.maxFilesAllowed){
					allow=false;
				}
			}
			
			if(allow){
				this.processFiles(event.dataTransfer.files);
				this.removeClass('hover');
				document.body.removeClass('dropazing-active');
			}
			else{
				this.vars.onError("Only "+this.vars.maxFilesAllowed+" file(s) allowed to upload");
			}
		};
		
		this.el.processFiles=function(files){
			if(this.vars.uploadUrl){
				for(i=0;i<files.length;i++){
					var tempIndex=this.uploadQueue.length;
					
					//allowedExtensions
					if(this.vars.allowedExtensions.contains(files[i].name.split('.').pop()) || !this.vars.allowedExtensions.length){
						this.dropped++;
						files[i].status="pending";
						this.uploadQueue.push(files[i]);
						
						var fileName=files[i].name;
						if(fileName.length>this.vars.fileNameMaxLength){ fileName=fileName.slice(0,this.vars.fileNameMaxLength)+"..."; }
						this.progressBars[tempIndex]=new Element("div.progress-bar.disabled",{ html:'<div class="file-description">'+fileName+'</div><div class="total"><div class="loaded"></div><a href="" onClick="this.parentNode.parentNode.parentNode.parentNode.cancelUpload(); return false;">X</a></div><div class="response"></div>' });
						this.progressBars[tempIndex].getElement('.response').slide('hide');
						this.list_container.adopt(this.progressBars[tempIndex]);
					}
					else{
						if(typeof(this.vars.onError)=="function"){
							this.vars.onError("File extension not allowed");
						}
					}
				}
				this.uploadNext();
			}
			else{
				this.el.vars.onError("Error: uploadUrl not defined");
			}
		};
		this.el.uploadNext=function(){
			if(this.uploadQueue.length){
				if(this.uploadQueue[this.counter].status=="pending"){
					this.uploadFile(this.uploadQueue[this.counter]);
				}
				else if(this.uploadQueue[this.counter].status=="uploaded" || this.uploadQueue[this.counter].status=="error"){
					if(this.uploadQueue.length>this.counter+1){
						this.counter++;
						this.uploadFile(this.uploadQueue[this.counter]);
					}
					else{
						if(typeof(this.vars.onFinish)=="function"){ this.vars.onFinish(); }
					}
				}
			}
		};
		this.el.handleProgress=function(event){
			var progress = Math.round(event.loaded*100/this.uploadQueue[this.counter].size);
			if(progress>100){ progress=100; }
			this.progressBars[this.counter].getElement('.loaded').set('tween',{ unit:'%', duration: 250, transition: Fx.Transitions.Linear }).tween('width',progress).set('html',progress+"%");
		};
		this.el.uploadFile=function(file){
			this.xhr = new XMLHttpRequest();
			this.xhr.open('POST', this.vars.uploadUrl);
			this.xhr.onload = function(event) {
				var response=event.target.response;
				this.uploadQueue[this.counter].status="uploaded";
				this.progressBars[this.counter].getElement('.loaded').addClass("success");
				this.progressBars[this.counter].getElement('a').dispose();
				if(typeof(this.vars.onSuccess)=="function"){ response=this.vars.onSuccess(event.target.response,this.progressBars[this.counter].getElement('.loaded')); }
				this.progressBars[this.counter].getElement('.response').set('html',response);
				this.progressBars[this.counter].getElement('.response').slide('in');
				this.uploadNext();
			}.bind(this);
			this.xhr.onerror = function() {
				this.el.vars.onError("error");
				this.uploadQueue[this.counter].status="error";
				this.progressBars[this.counter].getElement('.loaded').addClass("error");
				this.progressBars[this.counter].getElement('a').dispose();
			}.bind(this);
			this.xhr.upload.onprogress = function(event){
				this.handleProgress(event);
			}.bind(this);
			this.xhr.upload.onloadstart = function(event){
				this.uploadQueue[this.counter].status="uploading";
				this.progressBars[this.counter].removeClass("disabled");
			}.bind(this);
			
			var formData = new FormData();  
			formData.append(this.vars.postUploadName,file);
			for(var i in this.vars.aditionalVars){
				formData.append(i,this.vars.aditionalVars[i]);
			}
			this.xhr.send(formData);
		};
		this.el.cancelUpload=function(){
			this.xhr.abort();
			this.uploadQueue[this.counter].status="error";
			this.progressBars[this.counter].getElement('.loaded').addClass("error");
			this.progressBars[this.counter].getElement('a').dispose();
			this.uploadNext();
		}
	},
	handleDocumentDragOver:function(event){
		event.preventDefault();
		document.body.addClass('dropazing-active');
	},
	handleDocumentDragLeave:function(event){
		event.preventDefault();
		document.body.removeClass('dropazing-active');
	},
	init:function(){
	}
}

window.addEvent('domready', function() {
	dropazing.scan();
});