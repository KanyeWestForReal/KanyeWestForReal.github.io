document.addEventListener('DOMContentLoaded', function () {
  // 配置参数 —— 若你有固定 header，请把 HEADER_OFFSET 设为 header 的高度（px）
  const SCROLL_DEBOUNCE = 100; // 滚动节流（ms）
  const HEADER_OFFSET = 10;    // 点击滚动后，内容距离顶部的额外偏移（正数会把目标向上顶出 header）
  const TOP_REFER_LINE = 80;   // 判定“激活 heading”的参考线（离视口顶部 px）

  const tocContainer = document.querySelector('.toc-container');
  if (!tocContainer) return;
  const tocLinks = Array.from(tocContainer.querySelectorAll('a[href^="#"]'));

  // 构建 heading map: link -> { element }
  const headingMap = new Map();
  tocLinks.forEach(link => {
    const hash = decodeURIComponent(link.hash);
    if (!hash) return;
    const heading = document.querySelector(hash);
    if (heading) headingMap.set(link, { element: heading });
  });

  // 程序化滚动标志（防止在我们进行平滑滚动时被 scroll 监听覆盖）
  let programmaticScroll = false;
  let lastScrollTime = 0;

  // 平滑滚动（使用原生 smooth，并用定时器估算结束时间来清理标志）
  function smoothScrollTo(targetElement, offset = HEADER_OFFSET) {
    if (!targetElement) return;
    const elementTop = targetElement.getBoundingClientRect().top + window.pageYOffset;
    const targetY = Math.max(0, Math.round(elementTop - offset));

    const startY = window.pageYOffset;
    const distance = Math.abs(targetY - startY);
    // 根据距离估算动画时间（ms），在 250-1000ms 区间
    const estimatedDuration = Math.min(1000, Math.max(250, Math.round(distance / 2)));

    programmaticScroll = true;
    // 使用浏览器原生平滑滚动
    window.scrollTo({ top: targetY, behavior: 'smooth' });

    // 在动画结束后清理并设置 hash（加一点缓冲）
    setTimeout(() => {
      try {
        if (targetElement.id) history.replaceState(null, null, `#${targetElement.id}`);
      } catch (e) { /* ignore */ }
      programmaticScroll = false;
      // 强制一次视口检测，立刻把 TOC 高亮到准确项（防止微小偏差）
      updateActiveFromViewport();
    }, estimatedDuration + 80);
  }

  // 将某个 link 标记为 active 并更新 TOC 容器滚动
  function setActiveLink(link) {
    if (!link) return;
    tocLinks.forEach(l => l.classList.toggle('current', l === link));
    // 把 active link 居中到 toc 容器视口（平滑）
    const linkTop = link.offsetTop;
    const containerHeight = tocContainer.clientHeight;
    const scrollPos = Math.max(0, Math.round(linkTop - containerHeight / 2));
    tocContainer.scrollTo({ top: scrollPos, behavior: 'smooth' });
  }

  // 根据当前视口计算最接近参考线（TOP_REFER_LINE）的 heading 并设置为 active
  function updateActiveFromViewport() {
    let activeLink = null;
    let minDistance = Infinity;

    headingMap.forEach((data, link) => {
      const rect = data.element.getBoundingClientRect();
      // 计算距离参考线的绝对距离（参考线在视口顶部向下 TOP_REFER_LINE px）
      const distance = Math.abs(rect.top - TOP_REFER_LINE);
      if (distance < minDistance) {
        minDistance = distance;
        activeLink = link;
      }
    });

    if (activeLink) setActiveLink(activeLink);
  }

  // 节流的滚动处理（但在程序化滚动时忽略）
  function handleScroll() {
    const now = Date.now();
    if (now - lastScrollTime < SCROLL_DEBOUNCE) return;
    lastScrollTime = now;

    if (programmaticScroll) return; // 程序化滚动期间跳过（已由 smoothScrollTo 在结束时更新）
    updateActiveFromViewport();
  }

  // 点击事件：平滑滚动到目标
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      const data = headingMap.get(link);
      if (!data || !data.element) return;
      e.preventDefault();
      smoothScrollTo(data.element, HEADER_OFFSET);
      // 主动把 this link 置为 current（更即时的视觉反馈，实际会在 scroll 结束时再次校正）
      setActiveLink(link);
    });
  });

  // 监听滚动（节流）
  window.addEventListener('scroll', handleScroll, { passive: true });

  // 初始化：如果有 hash，滚动到对应位置（不带额外动画以避免 race）
  setTimeout(() => {
    const hash = decodeURIComponent(window.location.hash || '');
    if (hash) {
      const target = document.querySelector(hash);
      if (target) {
        // 直接跳到位置（避免动画期间被重复触发）
        const elementTop = target.getBoundingClientRect().top + window.pageYOffset;
        const targetY = Math.max(0, Math.round(elementTop - HEADER_OFFSET));
        window.scrollTo(0, targetY);
        // 小延时后再更新 TOC 高亮
        setTimeout(updateActiveFromViewport, 50);
      } else {
        updateActiveFromViewport();
      }
    } else {
      updateActiveFromViewport();
    }
  }, 50);
});
