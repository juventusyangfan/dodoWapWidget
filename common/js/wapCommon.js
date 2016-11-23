/**
 * Created by 杨帆
 */

//依赖于zepto.js
var dodoWap = dodoWap || {
        $: window.Zepto,
        staticCall: (function ($) {
            var proto = $.fn,
                slice = [].slice,

            // 公用此zepto实例
                instance = $();

            instance.length = 1;

            return function (item, fn) {
                instance[0] = item;
                return proto[fn].apply(instance, slice.call(arguments, 2));
            };
        })(Zepto)
    };

/**
 * 提供wap页的事件行为
 */
(function (dodoWap, $) {
    var slice = [].slice,
        separator = /\s+/,

        returnFalse = function () {
            return false;
        },

        returnTrue = function () {
            return true;
        };

    function eachEvent(events, callback, iterator) {

        // 不支持对象，只支持多个event用空格隔开
        (events || '').split(separator).forEach(function (type) {
            iterator(type, callback);
        });
    }

    // 生成匹配namespace正则
    function matcherFor(ns) {
        return new RegExp('(?:^| )' + ns.replace(' ', ' .* ?') + '(?: |$)');
    }

    // 分离event name和event namespace
    function parse(name) {
        var parts = ('' + name).split('.');

        return {
            e: parts[0],
            ns: parts.slice(1).sort().join(' ')
        };
    }

    function findHandlers(arr, name, callback, context) {
        var matcher,
            obj;

        obj = parse(name);
        obj.ns && (matcher = matcherFor(obj.ns));
        return arr.filter(function (handler) {
            return handler &&
                (!obj.e || handler.e === obj.e) &&
                (!obj.ns || matcher.test(handler.ns)) &&
                (!callback || handler.cb === callback || handler.cb._cb === callback) &&
                (!context || handler.ctx === context);
        });
    }

    /**
     * type 事件名字
     * [props] 属性对象，将被复制进event对象。
     */
    function Event(type, props) {
        if (!(this instanceof Event)) {
            return new Event(type, props);
        }

        props && $.extend(this, props);
        this.type = type;

        return this;
    }

    Event.prototype = {
        isDefaultPrevented: returnFalse,//判断此事件是否被阻止
        isPropagationStopped: returnFalse,//判断此事件是否被停止蔓延
        preventDefault: function () {//阻止事件默认行为
            this.isDefaultPrevented = returnTrue;
        },
        stopPropagation: function () {//阻止事件蔓延
            this.isPropagationStopped = returnTrue;
        }
    };

    /**
     * event操作方法。可以将此对象扩张到任意对象，来增加事件行为。
     */
    dodoWap.event = {
        /**
         * 绑定事件。
         */
        on: function (name, callback, context) {
            var me = this,
                set;

            if (!callback) {
                return this;
            }

            set = this._events || (this._events = []);

            eachEvent(name, callback, function (name, callback) {
                var handler = parse(name);

                handler.cb = callback;
                handler.ctx = context;
                handler.ctx2 = context || me;
                handler.id = set.length;
                set.push(handler);
            });

            return this;
        },

        /**
         * 绑定事件，且当handler执行完后，自动解除绑定。
         */
        one: function (name, callback, context) {
            var me = this;

            if (!callback) {
                return this;
            }

            eachEvent(name, callback, function (name, callback) {
                var once = function () {
                    me.off(name, once);
                    return callback.apply(context || me, arguments);
                };

                once._cb = callback;
                me.on(name, once, context);
            });

            return this;
        },

        /**
         * 解除事件绑定
         */
        off: function (name, callback, context) {
            var events = this._events;

            if (!events) {
                return this;
            }

            if (!name && !callback && !context) {
                this._events = [];
                return this;
            }

            eachEvent(name, callback, function (name, callback) {
                findHandlers(events, name, callback, context)
                    .forEach(function (handler) {
                        delete events[handler.id];
                    });
            });

            return this;
        },

        /**
         * 触发事件
         */
        trigger: function (evt) {
            var i = -1,
                args,
                events,
                stoped,
                len,
                ev;

            if (!this._events || !evt) {
                return this;
            }

            typeof evt === 'string' && (evt = new Event(evt));

            args = slice.call(arguments, 1);
            evt.args = args;    // handler中可以直接通过e.args获取trigger数据
            args.unshift(evt);

            events = findHandlers(this._events, evt.type);

            if (events) {
                len = events.length;

                while (++i < len) {
                    if ((stoped = evt.isPropagationStopped()) || false ===
                        (ev = events[i]).cb.apply(ev.ctx2, args)
                    ) {
                        // 如果return false则相当于stopPropagation()和preventDefault();
                        stoped || (evt.stopPropagation(), evt.preventDefault());
                        break;
                    }
                }
            }

            return this;
        }
    };

    dodoWap.Event = Event;
})(dodoWap, dodoWap.$);

/**
 *定义创建组件的方法
 */
(function (dodoWap, $, undefined) {
    var slice = [].slice,
        toString = Object.prototype.toString,
        blankFn = function () {
        },

    // 挂到组件类上的属性、方法
        staticlist = ['options', 'template', 'tpl2html'],

    // 存储和读取数据到指定对象，任何对象包括dom对象
    // 注意：数据不直接存储在object上，而是存在内部闭包中，通过_gid关联
    // record( object, key ) 获取object对应的key值
    // record( object, key, value ) 设置object对应的key值
    // record( object, key, null ) 删除数据
        record = (function () {
            var data = {},
                id = 0,
                ikey = '_gid';

            return function (obj, key, val) {
                var dkey = obj[ikey] || (obj[ikey] = ++id),
                    store = data[dkey] || (data[dkey] = {});

                val !== undefined && (store[key] = val);
                val === null && delete store[key];

                return store[key];
            };
        })(),

        event = dodoWap.event;

    function isPlainObject(obj) {
        return toString.call(obj) === '[object Object]';
    }

    // 遍历对象
    function eachObject(obj, iterator) {
        obj && Object.keys(obj).forEach(function (key) {
            iterator(key, obj[key]);
        });
    }

    // 从某个元素上读取某个属性。
    function parseData(data) {
        try {    // JSON.parse低版本浏览器可能报错

            // 当data===null表示，没有此属性
            data = data === 'true' ? true :
                data === 'false' ? false : data === 'null' ? null :

                    // 如果是数字类型，则将字符串类型转成数字类型
                    +data + '' === data ? +data :
                        /(?:\{[\s\S]*\}|\[[\s\S]*\])$/.test(data) ?
                            JSON.parse(data) : data;
        } catch (ex) {
            data = undefined;
        }

        return data;
    }

    // 从DOM节点上获取配置项
    function getDomOptions(el) {
        var ret = {},
            attrs = el && el.attributes,
            len = attrs && attrs.length,
            key,
            data;

        while (len--) {
            data = attrs[len];
            key = data.name;

            if (key.substring(0, 5) !== 'data-') {
                continue;
            }

            key = key.substring(5);
            data = parseData(data.value);

            data === undefined || (ret[key] = data);
        }

        return ret;
    }

    // 在$.fn上挂对应的组件方法呢
    // $('#btn').button( options );实例化组件
    // $('#btn').button( 'select' ); 调用实例方法
    // $('#btn').button( 'this' ); 取组件实例
    function zeptolize(name) {
        var key = name.substring(0, 1).toLowerCase() + name.substring(1),
            old = $.fn[key];

        $.fn[key] = function (opts) {
            var args = slice.call(arguments, 1),
                method = typeof opts === 'string' && opts,
                ret,
                obj;

            $.each(this, function (i, el) {

                // 从缓存中取，没有则创建一个
                obj = record(el, name) || new dodoWap[name](el,
                    isPlainObject(opts) ? opts : undefined);

                // 取实例
                if (method === 'this') {
                    ret = obj;
                    return false;    // 断开each循环
                } else if (method) {

                    // 当取的方法不存在时，抛出错误信息
                    if (!$.isFunction(obj[method])) {
                        throw new Error('组件没有此方法：' + method);
                    }

                    ret = obj[method].apply(obj, args);

                    // 断定它是getter性质的方法，所以需要断开each循环，把结果返回
                    if (ret !== undefined && ret !== obj) {
                        return false;
                    }

                    // ret为obj时为无效值，为了不影响后面的返回
                    ret = undefined;
                }
            });

            return ret !== undefined ? ret : this;
        };

        $.fn[key].noConflict = function () {
            $.fn[key] = old;
            return this;
        };
    }

    // 加载注册的option
    function loadOption(klass, opts) {
        var me = this;

        // 先加载父级的
        if (klass.superClass) {
            loadOption.call(me, klass.superClass, opts);
        }

        eachObject(record(klass, 'options'), function (key, option) {
            option.forEach(function (item) {
                var condition = item[0],
                    fn = item[1];

                if (condition === '*' ||
                    ($.isFunction(condition) &&
                    condition.call(me, opts[key])) ||
                    condition === opts[key]) {

                    fn.call(me);
                }
            });
        });
    }

    // 加载注册的插件
    function loadPlugins(klass, opts) {
        var me = this;

        // 先加载父级的
        if (klass.superClass) {
            loadPlugins.call(me, klass.superClass, opts);
        }

        eachObject(record(klass, 'plugins'), function (opt, plugin) {

            // 如果配置项关闭了，则不启用此插件
            if (opts[opt] === false) {
                return;
            }

            eachObject(plugin, function (key, val) {
                var oringFn;

                if ($.isFunction(val) && (oringFn = me[key])) {
                    me[key] = function () {
                        var origin = me.origin,
                            ret;

                        me.origin = oringFn;
                        ret = val.apply(me, arguments);
                        origin === undefined ? delete me.origin :
                            (me.origin = origin);

                        return ret;
                    };
                } else {
                    me[key] = val;
                }
            });

            plugin._init.call(me);
        });
    }

    // 合并对象
    function mergeObj() {
        var args = slice.call(arguments),
            i = args.length,
            last;

        while (i--) {
            last = last || args[i];
            isPlainObject(args[i]) || args.splice(i, 1);
        }

        return args.length ?
            $.extend.apply(null, [true, {}].concat(args)) : last; // 深拷贝，options中某项为object时，用例中不能用==判断
    }

    // 初始化widget. 隐藏具体细节，因为如果放在构造器中的话，是可以看到方法体内容的
    function bootstrap(name, klass, uid, el, options) {
        var me = this,
            opts;

        if (isPlainObject(el)) {
            options = el;
            el = undefined;
        }

        // options中存在el时，覆盖el
        options && options.el && (el = $(options.el));
        el && (me.$el = $(el), el = me.$el[0]);

        opts = me._options = mergeObj(klass.options, getDomOptions(el), options);

        me.template = mergeObj(klass.template, opts.template);

        me.tpl2html = mergeObj(klass.tpl2html, opts.tpl2html);

        // 生成eventNs widgetName
        me.widgetName = name.toLowerCase();
        me.eventNs = '.' + me.widgetName + uid;

        me._init(opts);

        // 设置setup参数，只有传入的$el在DOM中，才认为是setup模式
        me._options.setup = (me.$el && me.$el.parent()[0]) ? true : false;

        loadOption.call(me, klass, opts);
        loadPlugins.call(me, klass, opts);

        // 进行创建DOM等操作
        me._create();
        me.trigger('ready');

        el && record(el, name, me) && me.on('destroy', function () {
            record(el, name, null);
        });

        return me;
    }

    /**
     * 创建一个类，构造函数默认为init方法, superClass默认为Base
     */
    function createClass(name, object, superClass) {
        if (typeof superClass !== 'function') {
            superClass = dodoWap.Base;
        }

        var uuid = 1,
            suid = 1;

        function klass(el, options) {
            if (name === 'Base') {
                throw new Error('Base类不能直接实例化');
            }

            if (!(this instanceof klass)) {
                return new klass(el, options);
            }

            return bootstrap.call(this, name, klass, uuid++, el, options);
        }

        $.extend(klass, {
            /**
             * 注册插件
             */
            register: function (name, obj) {
                var plugins = record(klass, 'plugins') ||
                    record(klass, 'plugins', {});

                obj._init = obj._init || blankFn;

                plugins[name] = obj;
                return klass;
            },

            /**
             * 扩充组件的配置项
             */
            option: function (option, value, method) {
                var options = record(klass, 'options') ||
                    record(klass, 'options', {});

                options[option] || (options[option] = []);
                options[option].push([value, method]);

                return klass;
            },

            /**
             * 从该类继承出一个子类，不会被挂到dodoWap命名空间
             */
            inherits: function (obj) {
                // 生成 Sub class
                return createClass(name + 'Sub' + suid++, obj, klass);
            },

            /**
             * 扩充现有组件
             */
            extend: function (obj) {
                var proto = klass.prototype,
                    superProto = superClass.prototype;

                staticlist.forEach(function (item) {
                    obj[item] = mergeObj(superClass[item], obj[item]);
                    obj[item] && (klass[item] = obj[item]);
                    delete obj[item];
                });

                // todo跟plugin的origin逻辑，公用一下
                eachObject(obj, function (key, val) {
                    if (typeof val === 'function' && superProto[key]) {
                        proto[key] = function () {
                            var $super = this.$super,
                                ret;

                            // todo直接让this.$super = superProto[ key ];
                            this.$super = function () {
                                var args = slice.call(arguments, 1);
                                return superProto[key].apply(this, args);
                            };

                            ret = val.apply(this, arguments);

                            $super === undefined ? (delete this.$super) :
                                (this.$super = $super);
                            return ret;
                        };
                    } else {
                        proto[key] = val;
                    }
                });
            }
        });

        klass.superClass = superClass;
        klass.prototype = Object.create(superClass.prototype);

        klass.extend(object);

        return klass;
    }

    /**
     * 定义一个组件
     */
    dodoWap.define = function (name, object, superClass) {
        dodoWap[name] = createClass(name, object, superClass);
        zeptolize(name);
    };

    /**
     * 判断object是不是 widget实例, klass不传时，默认为Base基类
     */
    dodoWap.isWidget = function (obj, klass) {
        // 处理字符串的case
        klass = typeof klass === 'string' ? dodoWap[klass] || blankFn : klass;
        klass = klass || dodoWap.Base;
        return obj instanceof klass;
    };

    /**
     * widget基类。不能直接使用。
     */
    dodoWap.Base = createClass('Base', {
        _init: blankFn,//组件的初始化方法，子类需要重写该方法
        _create: blankFn,//组件创建DOM的方法，子类需要重写该方法
        getEl: function () {//返回组件的$el
            return this.$el;
        },
        on: event.on,//订阅事件
        one: event.one,//订阅事件（只执行一次）
        off: event.off,//解除订阅事件
        trigger: function (name) {//派发事件, 此trigger会优先把options上的事件回调函数先执行
            var evt = typeof name === 'string' ? new dodoWap.Event(name) : name,
                args = [evt].concat(slice.call(arguments, 1)),
                opEvent = this._options[evt.type],

            // 先存起来，否则在下面使用的时候，可能已经被destory给删除了。
                $el = this.getEl();

            if (opEvent && $.isFunction(opEvent)) {
                // 如果返回值是false,相当于执行stopPropagation()和preventDefault();
                false === opEvent.apply(this, args) && (evt.stopPropagation(), evt.preventDefault());
            }

            event.trigger.apply(this, args);

            // triggerHandler不冒泡
            $el && $el.triggerHandler(evt, (args.shift(), args));

            return this;
        },
        tpl2html: function (subpart, data) {//将template输出成html字符串，当传入 data 时，html将通过$.parseTpl渲染。
            var tpl = this.template;

            tpl = typeof subpart === 'string' ? tpl[subpart] :
                ((data = subpart), tpl);

            return data || ~tpl.indexOf('<%') ? $.parseTpl(tpl, data) : tpl;
        },
        destroy: function () {//注销组件

            // 解绑element上的事件
            this.$el && this.$el.off(this.eventNs);

            this.trigger('destroy');
            // 解绑所有自定义事件
            this.off();


            this.destroyed = true;
        }

    }, Object);

    // 向下兼容
    $.ui = dodoWap;
})(dodoWap, dodoWap.$);