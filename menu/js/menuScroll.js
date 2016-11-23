/**
 * 导航的可滚插件，借助iScroll类
 */
(function( dodoWap, $, undefined ) {

    /**
     * 滚动插件的配置文件
     */
    dodoWap.Navigator.options.iScroll = {
        hScroll: true,
        vScroll: false,
        hScrollbar: false,
        vScrollbar: false
    };

    /**
     * Navigator的可滚插件
     */
    dodoWap.Navigator.register( 'scrollable', {

        _init: function() {
            var me = this,
                opts = me._options;

            me.on( 'done.dom', function() {
                me.$list.wrap( '<div class="ui-scroller"></div>' );

                me.trigger( 'init.iScroll' );
                me.$el.iScroll( $.extend( {}, opts.iScroll ) );
            } );

            //$( window ).on( 'ortchange' + me.eventNs, $.proxy( me.refresh, me ) );

            me.on('destroy', function(){
                me.$el.iScroll( 'destroy' );
                //$( window ).off( 'ortchange' + me.eventNs );
            } );
        },

        /**
         * 刷新iscroll
         */
        refresh: function() {
            this.trigger( 'refresh.iScroll' ).$el.iScroll( 'refresh' );
        }
    } );
})( dodoWap, dodoWap.$ );

/**
 * @file 当滚动到边缘的时候，自动把下一个滚出来
 */
(function( dodoWap, $, undefined ) {
    dodoWap.Navigator.options.isScrollToNext = true;

    /**
     * 当滚动到边缘的时候，自动把下一个滚出来
     */
    dodoWap.Navigator.option( 'isScrollToNext', true, function() {
        var me = this,
            prevIndex;

        me.on( 'select', function( e, to, el ) {

            // 第一调用的时候没有prevIndex, 固根据this.index来控制方向。
            if ( prevIndex === undefined ) {
                prevIndex = me.index ? 0 : 1;
            }

            var dir = to > prevIndex,

            // 如果是想左则找prev否则找next
                target = $( el )[ dir ? 'next' : 'prev' ](),

            // 如果没有相邻的，自己的位置也需要检测。存在这种情况
            // 被点击的按钮，只显示了一半
                offset = target.offset() || $( el ).offset(),
                within = me.$el.offset(),
                listOffset;

            if ( dir ? offset.left + offset.width > within.left +
                within.width : offset.left < within.left ) {
                listOffset = me.$list.offset();

                me.$el.iScroll( 'scrollTo', dir ? within.width -
                offset.left + listOffset.left - offset.width :
                listOffset.left - offset.left, 0, 400 );
            }

            prevIndex = to;
        } );
    } );
})( dodoWap, dodoWap.$ );
