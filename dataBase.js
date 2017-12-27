/*
* created by liguang 2017-12-27
* 参考网址：http://www.zhangxinxu.com/study/201707/indexeddb-example.html
*/
(function(){
	// 元素们
    var eleForm = $("#form"),
    	eleTbody = $('#result tbody'),
    	eleStatus = $('#status')
    // 模板字符内容
    	strTplList = $('#tplList').html();

    // 简易模板方法
    String.prototype.temp = function(obj) {
        return this.replace(/\$\w+\$/gi, function(matchs) {        
            return obj[matchs.replace(/\$/g, "")] || '';
        });
    };

    //log日志
    var Logger = {
    	error:function(error){
    		eleStatus.removeClass("none");
        	eleStatus.html(error).addClass("error");
    	},
    	info:function(info){
    		eleStatus.removeClass("none");
        	eleStatus.html(info).removeClass("error").addClass("info");
    	},
    	hide:function(){
    		eleStatus.addClass("none");
    	},
    	show:function(){
    		eleStatus.removeClass("none");
    	}
    };

    //数据库实例
    function DataBase (opt) {
    	this.name = opt.name || "";	//数据库名称
    	this.version = opt.version || "";	//版本
    	this.db = opt.db || null;	//数据库数据结果
    	this.open();
    }
    DataBase.prototype = {
    	constructor:DataBase,
    	open:function () {
    		var self = this,
    			DBOpenRequest = window.indexedDB.open(self.name, self.version);
    		// 如果数据库打开失败
		    DBOpenRequest.onerror = function(event) {
		        Logger.error('数据库打开失败');
		    };
		    //打开/创建成功
		    DBOpenRequest.onsuccess = function(event) {        
		        // 存储数据结果
		        self.db = DBOpenRequest.result;
		        // 显示数据
		        self.show();
		    };
		    // 下面事情执行于：数据库首次创建版本，或者window.indexedDB.open传递的新版本（版本数值要比现在的高）
		    DBOpenRequest.onupgradeneeded = function(event) {
		        var _db = event.target.result;
		     
		        _db.onerror = function(event) {
		            Logger.error('数据库打开失败');
		        };
		    
		        // 创建一个数据库存储对象
		        var objectStore = _db.createObjectStore(self.name, { 
		            keyPath: 'id',
		            autoIncrement: true
		        });
		    
		        // 定义存储对象的数据项
		        objectStore.createIndex('id', 'id', {
		            unique: true    
		        });
		        objectStore.createIndex('name', 'name');
		        objectStore.createIndex('begin', 'begin');
		        objectStore.createIndex('end', 'end');
		        objectStore.createIndex('person', 'person');
		        objectStore.createIndex('remark', 'remark');
		    };
    	},
    	add:function(item){
    		var self = this,
    			transaction = self.db.transaction(self.name, "readwrite"),
    			// 打开已经存储的数据对象
    			objectStore = transaction.objectStore(self.name),
    			// 添加到数据对象中
    			objectStoreRequest = objectStore.add(item);

    		objectStoreRequest.onsuccess = function(event) {
                self.show();
            };
    	},
    	edit: function (opt) {
    		var self = this,
            // 编辑数据
           		transaction = self.db.transaction(self.name, "readwrite");
            // 打开已经存储的数据对象
            	objectStore = transaction.objectStore(self.name);
            // 获取存储的对应键的存储对象
            	objectStoreRequest = objectStore.get(opt.id);
            // 获取成功后替换当前数据
            objectStoreRequest.onsuccess = function(event) {
                // 当前数据
                var myRecord = objectStoreRequest.result;
                // 遍历替换
                for (var key in opt.data) {
                    if (typeof myRecord[key] != 'undefined') {
                        myRecord[key] = opt.data[key];
                    }
                }
                // 更新数据库存储数据                
                objectStore.put(myRecord);
            };
        },
        delete: function (id) {
        	var self = this,
            // 打开已经存储的数据对象
            	objectStore = self.db.transaction(self.name, "readwrite").objectStore(self.name);            
            // 直接删除            
            	objectStoreRequest = objectStore.delete(id);
            // 删除成功后
            objectStoreRequest.onsuccess = function() {
                self.show();
            };
        },
        show: function () {
        	var self = this,
            // 最终要展示的HTML数据
           		htmlProjectList = '';
            // 打开对象存储，获得游标列表
            	objectStore = self.db.transaction(self.name).objectStore(self.name);
            Logger.show();
            objectStore.openCursor().onsuccess = function(event) {
                var cursor = event.target.result;
                if (cursor) {// 如果游标没有遍历完，继续下面的逻辑
                    htmlProjectList = htmlProjectList + strTplList.temp(cursor.value);            
                    // 继续下一个游标项
                    cursor.continue();
                } else {// 如果全部遍历完毕
                    if (htmlProjectList == '') {
                        Logger.error('暂无数据');
                        eleTbody.empty();
                    }else{
                    	 Logger.info('加载完毕！');
                    	eleTbody.html(htmlProjectList,function(){
                    		Logger.hide();
                    	});
                    }
                }
            }
            objectStore.openCursor().onerror = function(event) {
            	Logger.error(event)
            }
        }
    }

    var dataBase = new DataBase({
    	name:"project",
    	version:1
    });


    //表单提交新增数据
    function submitForm(){
    	var formData = {};
    	eleForm.find("input,textarea").each(function(){
    		formData[this.name] = this.value;
    	});
    	if(!formData.name){
    		alert("请填写项目名称！");return;
    	}
    	if(!formData.person){
    		alert("请填写参与人员！");return;
    	}
    	dataBase.add(formData);
    	eleForm.find("input,textarea").val("");
    }

    //追加数据
    $("#add").click(function(){
    	submitForm();
    });

    //删除数据
    $('#result tbody').on("click",".del",function(){
    	var id = $(this).data("id") * 1;
    	dataBase.delete(id);
    });

    //编辑数据
    eleTbody.on("focusout","td",function(e){
    	var id = $(this).data("id"),
    		data = {
    			id:id*1
    		};
    	if(!id || !/td/i.test(e.target.tagName)){
    		return;
    	}
    	$(this).parents("tr").find("td[data-key]").each(function(){
    		var _self = $(this);
    		data[_self.data("key")] = _self.text();
    	});
    	dataBase.edit({
        	id:id,
        	data:data
        });
    });

})()

