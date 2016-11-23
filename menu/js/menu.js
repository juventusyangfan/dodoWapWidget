/**
 * @file 导航栏组件
 */
(function (dodoWap, $, undefined) {

    /**
     * 注册导航组件
     */
    dodoWap.define('Navigator', {
        options: {
            content: null,//菜单数组（js初始化html时使用）
            event: 'click'//交互事件
        },

        template: {
            list: '<ul>',
            item: '<li><a<% if( href ) { %> href="<%= href %>"<% } %>>' + '<%= text %></a></li>'
        },

        _create: function () {
            var me = this,
                opts = me._options,
                $el = me.getEl(),
                $list = $el.find('ul').first(),
                name = 'ui-' + me.widgetName,
                renderer,
                html;

            // 如果没有包含ul节点，则说明通过指定content来create
            // 建议把create模式给拆出去。很多时候都是先写好在dom中了。
            if (!$list.length && opts.content) {
                $list = $(me.tpl2html('list'));
                renderer = me.tpl2html('item');

                html = '';
                opts.content.forEach(function (item) {

                    // 如果不提供默认值，然后同时某些key没有传值，parseTpl会报错
                    item = $.extend({
                        href: '',
                        text: ''
                    }, typeof item === 'string' ? {
                        text: item
                    } : item);

                    html += renderer(item);
                });

                $list.append(html).appendTo($el);
            } else {

                // 处理直接通过ul初始化的情况
                if ($el.is('ul, ol')) {
                    $list = $el.wrap('<div>');
                    $el = $el.parent();
                }

                if (opts.index === undefined) {

                    // 如果opts中没有指定index, 则尝试从dom中查看是否有比较为ui-state-active的
                    opts.index = $list.find('.ui-state-active').index();

                    // 没找到还是赋值为0
                    ~opts.index || (opts.index = 0);
                }
            }

            me.$list = $list.addClass(name + '-list');
            me.trigger('done.dom', $el.addClass(name), opts);

            //$list.highlight( 'ui-state-hover', 'li' );
            $list.on(opts.event + me.eventNs,
                'li:not(.ui-state-disable)>a', function (e) {
                    me._switchTo($(this).parent().index(), e);
                });

            me.index = -1;
            me.switchTo(opts.index);
        },

        _switchTo: function (to, e) {
            if (to === this.index) {
                return;
            }

            var me = this,
                list = me.$list.children(),
                evt = dodoWap.Event('beforeselect', e),
                cur;

            me.trigger(evt, list.get(to));

            if (evt.isDefaultPrevented()) {
                return;
            }

            cur = list.removeClass('ui-state-active')
                .eq(to)
                .addClass('ui-state-active');

            me.index = to;
            return me.trigger('select', to, cur[0]);
        },

        /**
         * 切换到导航栏的某一项
         * to: 序号
         */
        switchTo: function (to) {
            return this._switchTo(Math.floor(to));
        },

        /**
         * 取消选择
         */
        unselect: function () {
            this.index = -1;
            this.$list.children().removeClass('ui-state-active');
        },

        /**
         * 获取当前选中的序号
         */
        getIndex: function () {
            return this.index;
        }
    });
})(dodoWap, dodoWap.$);