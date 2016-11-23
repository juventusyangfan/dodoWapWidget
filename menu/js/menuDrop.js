/**
 * 弹出层组件
 */
(function (dodoWap, $, undefined) {

    /**
     * 弹出层组件，具有点击按钮在周围弹出层的交互效果。通过`content`直接设置内容，
     */
    dodoWap.define('Popover', {
        options: {
            container: null,//下拉框的容器，不指定就在el之后创建
            content: null,//弹出框的内容
            event: 'click'//交互事件
        },

        template: {
            frame: '<div>'
        },

        // 创建dom
        _create: function () {
            var me = this,
                opts = me._options,
                $el = opts.target && $(opts.target) || me.getEl(),
                $root = opts.container && $(opts.container);

            // 创建节点
            $root && $root.length || ($root = $(me.tpl2html('frame'))
                .addClass('ui-mark-temp'));
            me.$root = $root;

            // 插入内容到容器
            opts.content && me.setContent(opts.content);
            me.trigger('done.dom', $root.addClass('ui-' + me.widgetName),
                opts);

            // 把节点插入到$el后面
            $root.parent().length || $el.after($root);

            me.target($el);
        },

        // 删除组件临时的dom
        _checkTemp: function ($el) {
            $el.is('.ui-mark-temp') && $el.off(this.eventNs) &&
            $el.remove();
        },

        /**
         * 显示弹出层。
         */
        show: function () {
            var me = this,
                evt = dodoWap.Event('beforeshow');

            me.trigger(evt);

            // 如果外部阻止了关闭，则什么也不做。
            if (evt.isDefaultPrevented()) {
                return;
            }

            me.trigger('placement', me.$root.addClass('ui-in'), me.$target);
            me._visible = true;
            return me.trigger('show');
        },

        /**
         * 隐藏弹出层。
         */
        hide: function () {
            var me = this,
                evt = new dodoWap.Event('beforehide');

            me.trigger(evt);

            // 如果外部阻止了关闭，则什么也不做。
            if (evt.isDefaultPrevented()) {
                return;
            }

            me.$root.removeClass('ui-in');
            me._visible = false;
            return me.trigger('hide');
        },

        /**
         * 弹出层的显示和隐藏的切换
         */
        toggle: function () {
            var me = this;
            return me[me._visible ? 'hide' : 'show'].apply(me, arguments);
        },

        /**
         * 设置或者获取当前被点击的对象
         */
        target: function (el) {

            // getter
            if (el === undefined) {
                return this.$target;
            }

            var me = this,
                $el = $(el),
                orig = me.$target,
                click = me._options.event + me.eventNs;

            orig && orig.off(click);

            // 绑定事件
            me.$target = $el.on(click, function (e) {
                e.preventDefault();
                me.toggle();
            });

            return me;
        },

        /**
         * 设置当前容器内容。
         */
        setContent: function (val) {
            var container = this.$root;
            container.empty().append(val);
            return this;
        },

        /**
         * 销毁组件
         */
        destroy: function () {
            var me = this;

            me.$target.off(me.eventNs);
            me._checkTemp(me.$root);
            return me.$super('destroy');
        }
    });
})(dodoWap, dodoWap.$);
