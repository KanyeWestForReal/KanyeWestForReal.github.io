// 全站统计专用 LeanCloud 配置
AV.init({
      appId: 'VAgLVxn6K0K1bY3M4TtF6L5f-MdYXbMMI',
      appKey: 'UZeQErSDTCpc8EJzyH1HVci0',
});

// 异步加载器 (兼容性优化版)
var lcCaller, lcTag;
!function() {
  var c, d, e, a = !1, b = [];
  
  // DOM就绪检测
  ready = function(c) {
    return a || "interactive" === document.readyState || "complete" === document.readyState ? 
      c.call(document) : b.push(function() { return c.call(this) }), this
  };
  
  d = function() {
    for (var a = 0, c = b.length; c > a; a++) b[a].apply(document);
    b = []
  };
  
  e = function() {
    a || (a = !0, d.call(window), 
    document.removeEventListener ? 
      document.removeEventListener("DOMContentLoaded", e, !1) : 
      document.attachEvent && (document.detachEvent("onreadystatechange", e), 
      window == window.top && (clearInterval(c), c = null)))
  };
  
  document.addEventListener ? 
    document.addEventListener("DOMContentLoaded", e, !1) : 
    document.attachEvent && (document.attachEvent("onreadystatechange", function() {
      /loaded|complete/.test(document.readyState) && e()
    }), window == window.top && (c = setInterval(function() {
      try { a || document.documentElement.doScroll("left") } catch (b) { return }
      e()
    }, 5)))
}();

// LeanCloud 统计核心
lcCaller = {
  initSDK: function() {
    AV.init(TOTAL_READ_CONFIG);
  },

  updateCounter: function() {
    const Counter = AV.Object.extend('GlobalCounter');
    const query = new AV.Query('GlobalCounter');
    query.equalTo('total_read', 'main');

    query.first().then(counter => {
      if (counter) {
        counter.increment('views', 1);
        return counter.save();
      } else {
        const newCounter = new Counter();
        newCounter.set('total_read', 'main');
        newCounter.set('views', 1);
        return newCounter.save();
      }
    }).catch(console.error);
  },

  fetch: function() {
    ready(() => {
      try {
        this.initSDK();
        this.updateCounter();
      } catch (e) {
        console.error('LC统计异常:', e);
      }
    });
  }
};

// 执行统计
lcCaller.fetch();