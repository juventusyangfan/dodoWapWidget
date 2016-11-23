/**
 *表单提交所用组件--checkBox
 **/
(function (dodoWap, $, undefined) {
    dodoWap.define("Checkbox", {
        options: {},
        _init: function () {
            var me = this,
                opts = me._options;

            me.on("ready", function () {
                me.$el.on("click", function () {
                    if ($(this).find("a").attr("class").indexOf("ui-form-checkGray") > -1) {
                        $(this).find("a").removeClass("ui-form-checkGray").addClass("ui-form-checkLight");
                    }
                    else {
                        $(this).find("a").removeClass("ui-form-checkLight").addClass("ui-form-checkGray");
                    }
                });
            });
        }
    });
})(dodoWap, dodoWap.$);

/**
 *表单提交所用组件--radio
 **/
(function (dodoWap, $, undefined) {
    dodoWap.define("Radio", {
        options: {},
        _init: function () {
            var me = this,
                opts = me._options;

            me.on("ready", function () {
                var main = me.$el;
                main.find(".ui-form-radioArea").on("click", function () {
                    main.find(".ui-form-radioArea a").removeClass("ui-form-radioLight").addClass("ui-form-radioGray");
                    $(this).find("a").removeClass("ui-form-radioGray").addClass("ui-form-radioLight");
                });
            });
        }
    });
})(dodoWap, dodoWap.$);

/**
 *表单提交所用组件--radio
 **/
(function () {
    dodoWap.define("Select", {
        options: {},
        _init: function () {
            var me = this,
                opts = me._options;

            me.on("ready", function () {
                var main = me.$el;
                main.find(".ui-form-selectChoose").on("click", function () {
                    $(this).parent().find(".ui-form-optionArea").toggle();
                    main.find(".ui-form-optionArea .js-option").on("click", function () {
                        main.find(".ui-form-optionArea .js-option").removeClass("ui-form-optionChoose").addClass("ui-form-option");
                        $(this).removeClass("ui-form-option").addClass("ui-form-optionChoose");
                        var selTxt = $(this).find("label").html();
                        main.find(".ui-form-selectChoose label").html(selTxt);
                        main.find(".ui-form-optionArea").css("display", "none");
                    });
                });
            });
        }
    });
})();