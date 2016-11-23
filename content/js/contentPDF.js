/**
 * PDF阅读组件
 */
(function (dodoWap, $, undefined) {
    dodoWap.define("Pdf", {
        options: {
            pdfUrl: 'http://files.dodoedu.com/wenku/55dbc9de70d27.pdf',
            pdfDoc: null,
            pageNum: 1,
            scale: 0.8,
            canvas: null,
            canvasFull: null
        },
        _init: function () {
            var me = this,
                opts = me._options;

            me.on("ready", function () {
                opts.pdfDoc = null;
                opts.pageNum = 1;
                opts.scale = 0.8;
                opts.canvas = document.getElementById('the-canvas');
                ctx = opts.canvas.getContext('2d');
                opts.canvasFull = document.getElementById('the-full');
                ctxFull = opts.canvasFull.getContext('2d');

                PDFJS.getDocument(opts.pdfUrl).then(function getPdfHelloWorld(_pdfDoc) {
                    opts.pdfDoc = _pdfDoc;
                    me.renderPage(opts.pageNum);
                });

                me.$el.find("#previous").off().on("click", function () {
                    me.goPrevious();
                });
                me.$el.find("#next").off().on("click", function () {
                    me.goNext();
                });
                me.$el.find("#fullScreen").off().on("click", function () {
                    me.fullScreen();
                });
            });
        },
        renderPage: function (num) {
            var me = this,
                opts = me._options;

            opts.pdfDoc.getPage(num).then(function (page) {
                var viewport = page.getViewport(opts.scale);
                opts.canvas.height = viewport.height;
                opts.canvas.width = viewport.width;
                opts.canvasFull.height = viewport.height;
                opts.canvasFull.width = viewport.width;

                var renderContext = {
                    canvasContext: ctx,
                    viewport: viewport
                };
                page.render(renderContext);

                var renderContextFull = {
                    canvasContext: ctxFull,
                    viewport: viewport
                };
                page.render(renderContextFull);
            });

            document.getElementById('page_num').value = opts.pageNum;
            document.getElementById('page_count').textContent = opts.pdfDoc.numPages;

            document.getElementById('pageNumFull').value = opts.pageNum;
            document.getElementById('labCountFull').textContent = opts.pdfDoc.numPages;
        },
        goPrevious: function () {
            var me = this,
                opts = me._options;

            if (opts.pageNum <= 1) {
                return;
            }
            opts.pageNum--;
            me.renderPage(opts.pageNum);
        },
        goNext: function () {
            var me = this,
                opts = me._options;

            if (opts.pageNum >= opts.pdfDoc.numPages) {
                return;
            }
            opts.pageNum++;
            me.renderPage(opts.pageNum);
        },
        fullScreen: function () {
            var me = this,
                opts = me._options;

            opts.scale = 2.0;
            opts.canvas.style.width = "100%";
            opts.canvasFull.style.width = "100%";
            document.getElementById('normal').style.display = "none";
            document.getElementById('full').style.display = "block";
            me.renderPage(opts.pageNum);
            var fullTimer = setTimeout(function () {
                $("#full").find("div.ui-content-fulltool").hide();
                clearTimeout(fullTimer);
            }, 3000);

            $("#full").off().on("click", function (e) {
                clearTimeout(fullTimer);
                var srcEle = e.target || e.srcElement;
                if ($(srcEle).is(".ui-content-fulltool,.ui-content-fulltool *")) {
                    fullTimer = setTimeout(function () {
                        $("#full").find("div.ui-content-fulltool").hide();
                        clearTimeout(fullTimer);
                    }, 3000);
                    return;
                }
                if ($("#full").find("div.ui-content-fulltool").css("display") == "none") {
                    $("#full").find("div.ui-content-fulltool").show();

                    fullTimer = setTimeout(function () {
                        $("#full").find("div.ui-content-fulltool").hide();
                        clearTimeout(fullTimer);
                    }, 3000);
                } else {
                    $("#full").find("div.ui-content-fulltool").hide();
                }
            });
            $("#previousFull").off().on("click", function () {
                me.goPrevious();
            });
            $("#nextFull").off().on("click", function () {
                me.goNext();
            });
            $("#exitFullScreen").off().on("click", function () {
                me.exitFullScreen();
            });
        },
        exitFullScreen: function () {
            var me = this,
                opts = me._options;

            opts.scale = 0.8;
            opts.canvas.style.width = "100%";
            opts.canvasFull.style.width = "100%";
            document.getElementById('full').style.display = "none";
            document.getElementById('normal').style.display = "block";
            me.renderPage(pageNum);
        }
    });
})(dodoWap, dodoWap.$);