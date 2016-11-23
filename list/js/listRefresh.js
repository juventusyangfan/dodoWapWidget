/**
 * 加载更多组件
 */

(function (dodoWap, $, undefined) {
    dodoWap.define('Refresh', {
        options: {
            load: null,//加载内容时调用。在此方法中使用ajax加载数据，调用afterDataLoading改变加载状态。
            statechange: null//样式改变时触发
        },

        _init: function () {
            var me = this,
                opts = me._options;

            me.on('ready', function () {
                if (me.$el.find('.ui-refresh-up').length <= 0) {
                    me.$el.css('top', '0px');
                }
                $.each(['up', 'down'], function (i, dir) {
                    var $elem = opts['$' + dir + 'Elem'],
                        elem = $elem.get(0);

                    if ($elem.length) {
                        me._status(dir, true);    //初始设置加载状态为可用
                        if (!elem.childNodes.length || ($elem.find('.ui-refresh-icon').length && $elem.find('.ui-refresh-label').length)) {   //若内容为空则创建，若不满足icon和label的要求，则不做处理
                            !elem.childNodes.length && me._createBtn(dir);
                            opts.refreshInfo || (opts.refreshInfo = {});
                            opts.refreshInfo[dir] = {
                                $icon: $elem.find('.ui-refresh-icon'),
                                $label: $elem.find('.ui-refresh-label'),
                                text: $elem.find('.ui-refresh-label').html()
                            }
                        }
                        $elem.on('click', function () {
                            if (!me._status(dir) || opts._actDir) return;//检查是否处于可用状态，同一方向上的仍在加载中，或者不同方向的还未加载完成
                            me._setStyle(dir, 'loading');
                            me._loadingAction(dir, 'click');
                        });
                    }
                });
            });

            me.on('destroy', function () {
                me.$el.remove();
            });
        },

        _create: function () {
            var me = this,
                opts = me._options,
                $el = me.$el;

            if (me._options.setup) {
                // 值支持setup模式，所以直接从DOM中取元素
                opts.$upElem = $el.find('.ui-refresh-up');
                opts.$downElem = $el.find('.ui-refresh-down');
                $el.addClass('ui-refresh');
            }
        },

        _createBtn: function (dir) {
            this._options['$' + dir + 'Elem'].html('<span class="ui-refresh-icon"></span><span class="ui-refresh-label">加载更多</span>');

            return this;
        },

        _setStyle: function (dir, state) {
            var me = this,
                stateChange = $.Event('statechange');

            me.trigger(stateChange, me._options['$' + dir + 'Elem'], state, dir);
            if (stateChange.defaultPrevented) {
                return me;
            }
            return me._changeStyle(dir, state);
        },

        _changeStyle: function (dir, state) {
            var opts = this._options,
                refreshInfo = opts.refreshInfo[dir];

            switch (state) {
                case 'loaded':
                    refreshInfo['$label'].html(refreshInfo['text']);
                    refreshInfo['$icon'].removeClass();
                    opts._actDir = '';
                    break;
                case 'loading':
                    refreshInfo['$label'].html('加载中...');
                    refreshInfo['$icon'].addClass('ui-loading');
                    opts._actDir = dir;
                    break;
                case 'disable':
                    refreshInfo['$label'].html('没有更多内容了');
                    break;
            }

            return this;
        },

        _loadingAction: function (dir, type) {
            var me = this,
                opts = me._options,
                loadFn = opts.load;

            $.isFunction(loadFn) && loadFn.call(me, dir, type);
            me._status(dir, false);

            return me;
        },

        /**
         * 当组件调用load，在load中通过ajax请求内容回来后，需要调用此方法，来改变refresh状态。
         */
        afterDataLoading: function (dir) {
            var me = this,
                dir = dir || me._options._actDir;

            me._setStyle(dir, 'loaded');
            me._status(dir, true);

            return me;
        },

        /**
         * 用来设置加载是否可用，分方向的。
         */
        _status: function (dir, status) {
            var opts = this._options;

            return status === undefined ? opts['_' + dir + 'Open'] : opts['_' + dir + 'Open'] = !!status;
        },

        _setable: function (able, dir, hide) {
            var me = this,
                opts = me._options,
                dirArr = dir ? [dir] : ['up', 'down'];

            $.each(dirArr, function (i, dir) {
                var $elem = opts['$' + dir + 'Elem'];
                if (!$elem.length) return;
                //若是enable操作，直接显示，disable则根据text是否是true来确定是否隐藏
                able ? $elem.show() : (hide ? $elem.hide() : me._setStyle(dir, 'disable'));
                me._status(dir, able);
            });

            return me;
        },

        /**
         * 如果已无类容可加载时，可以调用此方法来，禁用Refresh。
         */
        disable: function (dir, hide) {
            return this._setable(false, dir, hide);
        },

        /**
         * 启用组件
         */
        enable: function (dir) {
            return this._setable(true, dir);
        }
    });
})(dodoWap, dodoWap.$);

/**
 * 实现列表滚动加载
 */
(function (dodoWap, $, undefined) {
    dodoWap.Refresh.register('iscroll', {
        _init: function () {
            var me = this,
                opts = me._options,
                $el = me.$el,
                wrapperH = $el.height();

            $.extend(opts, {
                useTransition: true,
                speedScale: 1,
                topOffset: opts['$upElem'] ? opts['$upElem'].height() : 0
            });
            opts.threshold = opts.threshold || 40;

            $el.wrapAll($('<div class="ui-refresh-wrapper"></div>').height(wrapperH)).css('height', 'auto');

            me.on('ready', function () {
                me._loadIscroll();
            });
        },
        _changeStyle: function (dir, state) {
            var me = this,
                opts = me._options,
                refreshInfo = opts.refreshInfo[dir];

            me.origin(dir, state);
            switch (state) {
                case 'loaded':
                    if (dir == "up") {
                        me.$el.css("top", "-40px");
                    }
                    refreshInfo['$icon'].addClass('ui-refresh-icon');
                    break;
                case 'beforeload':
                    if (dir == "up") {
                        me.$el.css("top", "0px");
                    }
                    refreshInfo['$label'].html('松开立即加载');
                    refreshInfo['$icon'].addClass('ui-refresh-flip');
                    break;
                case 'loading':
                    if (dir == "up") {
                        me.$el.css("top", "0px");
                        refreshInfo['$label'].html('努力刷新中......');
                    }
                    else{
                        refreshInfo['$label'].html('奋力加载中......');
                    }
                    refreshInfo['$icon'].removeClass().addClass('ui-loading');
                    break;
            }
            return me;
        },
        _loadIscroll: function () {
            var me = this,
                opts = me._options,
                threshold = opts.threshold;

            opts.iScroll = new iScroll(me.$el.parent().get(0), opts.iScrollOpts = $.extend({
                useTransition: opts.useTransition,
                speedScale: opts.speedScale,
                topOffset: opts.topOffset
            }, opts.iScrollOpts, {
                onScrollStart: function (e) {
                    me.trigger('scrollstart', e);
                },
                onScrollMove: (function () {
                    var up = opts.$upElem && opts.$upElem.length,
                        down = opts.$downElem && opts.$downElem.length;

                    return function (e) {
                        var upRefreshed = opts['_upRefreshed'],
                            downRefreshed = opts['_downRefreshed'],
                            upStatus = me._status('up'),
                            downStatus = me._status('down');

                        if (up && !upStatus || down && !downStatus || this.maxScrollY >= 0) return;    //上下不能同时加载
                        if (downStatus && down && !downRefreshed && this.y < (this.maxScrollY - threshold)) {    //下边按钮，上拉加载
                            me._setMoveState('down', 'beforeload', 'pull');
                        } else if (upStatus && up && !upRefreshed && this.y > threshold) {     //上边按钮，下拉加载
                            me._setMoveState('up', 'beforeload', 'pull');
                            this.minScrollY = 0;
                        } else if (downStatus && downRefreshed && this.y > (this.maxScrollY + threshold)) {      //下边按钮，上拉恢复
                            me._setMoveState('down', 'loaded', 'restore');
                        } else if (upStatus && upRefreshed && this.y < threshold) {      //上边按钮，下拉恢复
                            me._setMoveState('up', 'loaded', 'restore');
                            this.minScrollY = -opts.topOffset;
                        }
                        me.trigger('scrollmove', e);
                    };
                })(),
                onScrollEnd: function (e) {
                    var actDir = opts._actDir;
                    if (actDir && me._status(actDir)) {
                        me._setStyle(actDir, 'loading');
                        me._loadingAction(actDir, 'pull');
                    }
                    me.trigger('scrollend', e);
                }
            }));
        },
        _setMoveState: function (dir, state, actType) {
            var me = this,
                opts = me._options;

            me._setStyle(dir, state);
            opts['_' + dir + 'Refreshed'] = actType == 'pull';
            opts['_actDir'] = actType == 'pull' ? dir : '';

            return me;
        },
        afterDataLoading: function (dir) {
            var me = this,
                opts = me._options,
                dir = dir || opts._actDir;

            opts.iScroll.refresh();
            opts['_' + dir + 'Refreshed'] = false;
            return me.origin(dir);
        }
    });
})(dodoWap, dodoWap.$);

