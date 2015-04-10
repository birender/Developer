// Zoom 1.4 - jQuery image zooming plugin
// (c) 2012 Jack Moore - jacklmoore.com
// license: www.opensource.org/licenses/mit-license.php
(function (e) {
    var t = {
        url: !1,
        icon: !0,
        callback: !1,
        duration: 120,
        on: "mouseover"
    };
    e.fn.zoom = function (n) {
        return this.each(function () {
            var r = this,
                i = e(r),
                s = new Image,
                o = e(s),
                u, a = i.css("position"),
                f = e.extend({}, t, n || {}),
                l = "mousemove",
                c = !1;
            i.css({
                position: /(absolute|fixed)/.test(a) ? a : "relative",
                overflow: "hidden"
            });
            if (!f.url) {
                f.url = i.find("img").attr("src");
                if (!f.url) return
            }
            f.icon && (u = e('<div class="zoomIcon"/>').appendTo(i)), s.onload = function () {
                function d() {
                    t = i.outerWidth(), n = i.outerHeight(), r = (s.width - t) / t, u = (s.height - n) / n
                }
                function v(e) {
                    a = e.pageX - p.left, h = e.pageY - p.top, a > t ? a = t : a < 0 && (a = 0), h > n ? h = n : h < 0 && (h = 0), s.style.left = a * -r + "px", s.style.top = h * -u + "px", e.preventDefault()
                }
                function m(t) {
                    p = i.offset(), d(), v(t), o.stop().fadeTo(e.support.opacity ? f.duration : 0, 1)
                }
                function g() {
                    o.stop().fadeTo(f.duration, 0)
                }
                var t, n, r, u, a, h, p = i.offset();
                o.addClass("zoomImg").css({
                    position: "absolute",
                    top: 0,
                    left: 0,
                    opacity: 0,
                    width: s.width,
                    height: s.height,
                    border: "none",
                    maxWidth: "none"
                }).appendTo(i), f.on === "grab" ? o.mousedown(function (t) {
                    p = i.offset(), e(document).one("mouseup", function () {
                        g(), e(document).unbind(l, v)
                    }), m(t), e(document)[l](v), t.preventDefault()
                }) : f.on === "click" ? o.click(function (t) {
                    if (c) return;
                    return c = !0, m(t), e(document)[l](v), e(document).one("click", function () {
                        g(), c = !1, e(document).unbind(l, v)
                    }), !1
                }) : (d(), o.hover(m, g)[l](v)), e.isFunction(f.callback) && f.callback.call(s)
            }, s.src = f.url
        })
    }, e.fn.zoom.defaults = t
})(jQuery);