document.addEventListener('DOMContentLoaded', async () => {
  // 初始化配置
  AV.init({
    appId: 'VAgLVxn6K0K1bY3M4TtF6L5f-MdYXbMMI',
    appKey: 'UZeQErSDTCpc8EJzyH1HVci0',
  });

  // 元素引用
  const viewsElement = document.getElementById('dynamic-views-counter');
  const refreshBtn = document.querySelector('.refresh-btn');
  if (!viewsElement) return;

  // 核心函数：更新计数器（force模式跳过检查）
  const updateCounter = async (force = false) => {
    const getSlug = () => window.location.pathname.split('/').filter(Boolean).pop() || 'home';
    const postSlug = getSlug();
    const storageKey = `viewed-${postSlug}`;

    try {
      localStorage.removeItem(storageKey);

      // 查询现有数据
      const existingCounter = await new AV.Query('Counter')
        .equalTo('postSlug', postSlug)
        .first();

      // 判断是否需要更新
      if (!localStorage.getItem(storageKey)) {
        // 乐观更新
        viewsElement.textContent = existingCounter 
          ? existingCounter.get('views') + 1 
          : 1;

        // 保存数据
        if (existingCounter) {
          existingCounter.increment('views', 1);
          await existingCounter.save();
        } else {
          await new AV.Object('Counter').save({ postSlug, views: 1 });
        }
        
        localStorage.setItem(storageKey, 'true');
      } else {
        viewsElement.textContent = existingCounter?.get('views') || '--';
      }
    } catch (error) {
      console.error('更新失败:', error);
      viewsElement.textContent = '--';
    }
  };

  // 初始自动统计
  updateCounter();
});