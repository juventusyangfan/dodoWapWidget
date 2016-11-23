/**
 *@file 图片上传控件
 **/
(function () {
    dodoWap.define("Upload", {
        options: {
            fileInput: null,				//html file控件
            dragDrop: null,					//拖拽敏感区域
            upButton: null,					//提交按钮
            url: "",						//ajax地址
            fileFilter: [],					//过滤后的文件数组
            filter: function (files) {		//选择文件组的过滤方法
                var arrFiles = [];
                for (var i = 0, file; file = files[i]; i++) {
                    if (file.type.indexOf("image") == 0) {
                        arrFiles.push(file);
                    } else {
                        alert('文件"' + file.name + '"不是图片。');
                    }
                }
                return arrFiles;
            },
            onSelect: function (files) {
                var main = this, html = '', i = 0;
                $("#preview").html('<div class="upload_loading"></div>');
                var funAppendImage = function () {
                    file = files[i];
                    if (file) {
                        var reader = new FileReader();
                        reader.onload = function (e) {
                            //html = html + '<div id="uploadList_'+ i +'" class="upload_append_list"><p><strong>' + file.name + '</strong>'+
                            //'<a href="javascript:" class="upload_delete" title="删除" data-index="'+ i +'">删除</a><br />' +
                            //'<img id="uploadImage_' + i + '" src="' + e.target.result + '" class="upload_image" /></p>'+
                            //'<span id="uploadProgress_' + i + '" class="upload_progress"></span>' +
                            //'</div>';

                            html = html + '<a href="javascript:;" class="ui-submit-image">' +
                            '<img id="uploadImage_' + i + '" src="' + e.target.result + '" width="100%" height="100%">' +
                            '</a>';

                            i++;
                            funAppendImage();
                        };
                        reader.readAsDataURL(file);
                    } else {
                        $(".js_imgCon").html(html);
                        if (html) {
                            $('.ui-submit-image').on('longTap', function () {
                                var index = $(this).index();
                                main.onDelete(files[index]);
                            });
                        }
                    }
                };
                funAppendImage();
            },		//文件选择后
            onDelete: function (file) {
                var main=this;
                var dialogShow = dodoWap.Dialog({
                    width: 288,
                    autoOpen: false,
                    closeBtn: false,
                    buttons: {
                        '是': function () {
                            main.fileFilter.splice(file.index);
                            $("#uploadImage_" + file.index).parent().remove();
                            this.close();
                        },
                        '否': function () {
                            this.close();
                        }
                    },
                    title: '',
                    content: '<div style="padding: 24px 0; text-align: center;color:#333333;">是否移除此图片？</div>'
                });
                dialogShow._options['_wrap'].addClass('share-dialog');

                dialogShow.open();
            },		//文件删除后
            onProgress: function (file, loaded, total) {

            },		//文件上传进度
            onSuccess: function (file, response) {

            },		//文件上传成功时
            onFailure: function (file) {

            },		//文件上传失败时,
            onComplete: function () {

            }		//文件全部上传完毕时
        },
        _init: function () {
            var me = this,
                opts = me._options;

            me.on("ready", function () {
                //文件选择控件选择
                if (opts.fileInput) {
                    opts.fileInput.addEventListener("change", function (e) {
                        me.funGetFiles(e);
                    }, false);
                }
            });
        },
        //获取选择文件，file控件或拖放
        funGetFiles: function (e) {
            var me = this,
                opts = me._options;

            // 获取文件列表对象
            var files = e.target.files || e.dataTransfer.files;
            //继续添加文件
            opts.fileFilter = opts.fileFilter.concat(opts.filter(files));
            me.funDealFiles();
            return this;
        },

        //选中文件的处理与回调
        funDealFiles: function () {
            var me = this,
                opts = me._options;

            for (var i = 0, file; file = opts.fileFilter[i]; i++) {
                //增加唯一索引值
                file.index = i;
            }
            //执行选择回调
            opts.onSelect(opts.fileFilter);
            return this;
        },

        //删除对应的文件
        funDeleteFile: function (fileDelete) {
            var me = this,
                opts = me._options;

            var arrFile = [];
            for (var i = 0, file; file = opts.fileFilter[i]; i++) {
                if (file != fileDelete) {
                    arrFile.push(file);
                } else {
                    opts.onDelete(fileDelete);
                }
            }
            opts.fileFilter = arrFile;
            return this;
        },

        //文件上传
        funUploadFile: function () {
            var me = this,
                opts = me._options;

            if (location.host.indexOf("sitepointstatic") >= 0) {
                //非站点服务器上运行
                return;
            }
            for (var i = 0, file; file = opts.fileFilter[i]; i++) {
                (function (file) {
                    var xhr = new XMLHttpRequest();
                    if (xhr.upload) {
                        // 上传中
                        xhr.upload.addEventListener("progress", function (e) {
                            opts.onProgress(file, e.loaded, e.total);
                        }, false);

                        // 文件上传成功或是失败
                        xhr.onreadystatechange = function (e) {
                            if (xhr.readyState == 4) {
                                if (xhr.status == 200) {
                                    opts.onSuccess(file, xhr.responseText);
                                    me.funDeleteFile(file);
                                    if (!opts.fileFilter.length) {
                                        //全部完毕
                                        opts.onComplete();
                                    }
                                } else {
                                    opts.onFailure(file, xhr.responseText);
                                }
                            }
                        };

                        // 开始上传
                        xhr.open("POST", me.url, true);
                        xhr.setRequestHeader("X_FILENAME", file.name);
                        xhr.send(file);
                    }
                })(file);
            }

        }
    });
})(dodoWap, dodoWap.$);
