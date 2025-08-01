window._maxkb_firstChunkInserted = false;
// 将需要的函数移到全局作用域
function addNewContentSectionToExistingPopup() {
  // 注意：这个函数需要在使用前设置正确的window._maxkb_streamingPopup变量
  if (!window._maxkb_streamingPopup) return;
  
  const contentContainer = window._maxkb_streamingPopup.querySelector('.content-container');
  if (!contentContainer) return;
  
  // 创建新的内容区域，使用全局变量中的当前文本和应用配置
  createContentSection(contentContainer, window._maxkb_currentText, window._maxkb_currentAppConfig);
}

function renderStreamingPopup(appConfig) {
  // 确保弹窗能够正常显示
  
  if (!window._maxkb_currentText || !appConfig) {
    console.error('Missing required data for popup rendering');
    return;
  }
  
  // 获取当前应用名称
  const currentAppName = appConfig?.name || 'MaxKB 应用';
  
  // 检查该应用是否已有弹窗
  let appPopup = null;
  if (window._maxkb_app_popups) {
    appPopup = window._maxkb_app_popups[currentAppName] || null;
  }
  
  // 如果该应用已经存在弹窗，则复用弹窗
  if (appPopup) {
    window._maxkb_streamingPopup = appPopup;
    // 添加新的内容区域
    addNewContentSectionToExistingPopup();
    // 确保弹窗可见
    if (appPopup.style.display === 'none') {
      appPopup.style.display = 'flex';
    }
    return;
  }
  
  // 创建流式响应弹窗
  const streamingPopup = document.createElement('div');
  
  // 保存应用名称，用于后续判断是否复用弹窗
  streamingPopup.dataset.appName = currentAppName;
  
  // 初始化应用弹窗存储对象
  if (!window._maxkb_app_popups) {
    window._maxkb_app_popups = {};
  }
  
  // 将弹窗与应用关联
  window._maxkb_app_popups[currentAppName] = streamingPopup;
  window._maxkb_streamingPopup = streamingPopup; // 设置当前弹窗
  
  // 确保弹窗内容独立，不叠加到其他应用弹窗上
  streamingPopup.innerHTML = '';
  
  streamingPopup.className = 'maxkb-popup maxkb-result-popup';
  
  streamingPopup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(calc(50vw - 50%), calc(50vh - 50%));
    background-color: #f0f4f8;
    border-radius: 12px;
    box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15);
    z-index: 999999;
    width: 600px;
    max-width: 90vw;
    height: auto;
    max-height: 80vh;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    margin: 0;
    border: 1px solid #d1dce5;
    user-select: text; /* 允许选择弹窗中的文本 */
  `;
  
  // 添加应用名称标题
  const appTitle = document.createElement('div');
  appTitle.className = 'app-title';
  appTitle.style.cssText = `
    background: linear-gradient(135deg, #1976d2 0%, #1565c0 100%);
    color: white;
    padding: 12px 16px;
    font-size: 16px;
    font-weight: 600;
    display: flex;
    align-items: center;
    gap: 8px;
    border-bottom: 1px solid #e0e6ed;
    cursor: grab; /* 标题栏显示可拖拽光标 */
  `;
  
  // 添加应用图标
  const appIcon = document.createElement('span');
  appIcon.innerHTML = '💬';
  appIcon.style.cssText = `
    font-size: 18px;
  `;
  
  // 添加应用名称文本
  const appName = document.createElement('span');
  appName.className = 'app-name';
  appName.textContent = currentAppName;
  appName.style.cssText = `
    flex: 1;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  `;
  
  appTitle.appendChild(appIcon);
  appTitle.appendChild(appName);
  streamingPopup.appendChild(appTitle);
  
  // 添加拖拽功能
  // ✅ 拖拽相关变量
  let isDragging = false;
  let currentX, currentY, initialX, initialY;
  let isTextSelecting = false;

  // ✅ 拖拽开始
  function dragStart(e) {
    if (!e.target.closest('.app-title')) return;

    const selection = window.getSelection();
    if (selection && selection.toString().length > 0) {
      isTextSelecting = true;
      return;
    }

    // 立即开始拖拽，无需延迟
    const rect = streamingPopup.getBoundingClientRect();
    initialX = e.clientX - rect.left;
    initialY = e.clientY - rect.top;

    isDragging = true;
    isTextSelecting = false; // 确保文本选择状态被重置
    streamingPopup.style.cursor = 'grabbing';
    streamingPopup.style.userSelect = 'none'; // 防止拖拽时选择文本

    // 直接添加事件监听器到document以确保能捕获到所有事件
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', dragEnd, { once: true });

    e.preventDefault();
    e.stopPropagation();
  }

  // ✅ 拖拽中
  function drag(e) {
    if (!isDragging || isTextSelecting) return;

    e.preventDefault();
    e.stopPropagation();

    currentX = e.clientX - initialX;
    currentY = e.clientY - initialY;

    streamingPopup.style.transform = `translate(${currentX}px, ${currentY}px)`;
    streamingPopup.style.top = '0';
    streamingPopup.style.left = '0';
    streamingPopup.style.margin = '0';
  }

  // ✅ 拖拽结束
  function dragEnd(e) {
    // 确保所有状态都被正确重置
    isDragging = false;
    isTextSelecting = false;

    // 移除事件监听器
    document.removeEventListener('mousemove', drag);
    // mouseup事件已经通过{ once: true }自动移除

    // 恢复光标样式
    streamingPopup.style.cursor = 'default';
    streamingPopup.style.userSelect = 'text'; // 恢复文本选择功能
    const titleEl = streamingPopup.querySelector('.app-title');
    if (titleEl) titleEl.style.cursor = 'grab';

    // 阻止事件冒泡
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
  }

  // ✅ 绑定事件（只绑定一次）
  const dragTitle = streamingPopup.querySelector('.app-title');
  if (dragTitle) {
    dragTitle.addEventListener('mousedown', dragStart);
    // 鼠标悬停时显示可拖拽光标
    dragTitle.style.cursor = 'grab';
  }
  
  // 添加按钮容器
  const buttonContainer = document.createElement('div');
  buttonContainer.className = 'button-container';
  buttonContainer.style.cssText = `
    position: sticky;
    top: 0;
    margin-bottom: 10px;
    z-index: 1000000;
    background: white;
    padding: 5px;
    border-radius: 4px;
    display: flex;
    justify-content: flex-end;
    gap: 5px;
  `;
  
  // 添加下载按钮
  const downloadButton = document.createElement('button');
  downloadButton.innerHTML = '下载';
  downloadButton.style.cssText = `
    background: #28a745;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
  `;
  downloadButton.addEventListener('click', () => {
    // 收集所有内容
    let allContent = '';
    const contentSections = streamingPopup.querySelectorAll('.content-section');
    contentSections.forEach(section => {
      const timeElement = section.querySelector('.content-time');
      const textElement = section.querySelector('.original-text');
      const contentElement = section.querySelector('.content-display');
      
      if (timeElement) allContent += timeElement.textContent + '\n';
      // 使用完整文本而不是显示的截断文本
      if (textElement) {
        const fullText = textElement.dataset.fullText || textElement.textContent;
        allContent += '原文: ' + fullText + '\n';
      }
      if (contentElement) allContent += contentElement.textContent + '\n\n';
    });
    
    const blob = new Blob([allContent], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'maxkb-content.txt';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  });
  buttonContainer.appendChild(downloadButton);
  
  // 添加复制按钮
  const copyButton = document.createElement('button');
  copyButton.innerHTML = '复制';
  copyButton.style.cssText = `
    background: #0066cc;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
  `;
  copyButton.addEventListener('click', () => {
    // 收集所有内容
    let allContent = '';
    const contentSections = streamingPopup.querySelectorAll('.content-section');
    contentSections.forEach(section => {
      const timeElement = section.querySelector('.content-time');
      const textElement = section.querySelector('.original-text');
      const contentElement = section.querySelector('.content-display');
      
      if (timeElement) allContent += timeElement.textContent + '\n';
      // 使用完整文本而不是显示的截断文本
      if (textElement) {
        const fullText = textElement.dataset.fullText || textElement.textContent;
        allContent += '原文: ' + fullText + '\n';
      }
      if (contentElement) allContent += contentElement.textContent + '\n\n';
    });
    
    navigator.clipboard.writeText(allContent)
      .then(() => {
        // 显示复制成功提示
        const originalText = copyButton.innerHTML;
        copyButton.innerHTML = '已复制';
        setTimeout(() => {
          copyButton.innerHTML = originalText;
        }, 1500);
      })
      .catch(err => {
        console.error('复制失败:', err);
      });
  });
  buttonContainer.appendChild(copyButton);
  
  // 添加关闭按钮
  const closeButton = document.createElement('button');
  closeButton.innerHTML = '关闭';
  closeButton.style.cssText = `
    background: #dc3545;
    color: white;
    border: none;
    border-radius: 4px;
    padding: 4px 8px;
    cursor: pointer;
    font-size: 12px;
    font-weight: bold;
  `;
  closeButton.addEventListener('click', () => {
    // 获取当前弹窗的应用名称
    const appName = streamingPopup.dataset.appName || 'MaxKB 应用';
    
    // 从应用弹窗映射中移除
    if (window._maxkb_app_popups && window._maxkb_app_popups[appName]) {
      delete window._maxkb_app_popups[appName];
    }
    
    // 如果关闭的是当前弹窗，重置相关变量
    if (window._maxkb_streamingPopup === streamingPopup) {
      window._maxkb_streamingPopup = null;
      window._maxkb_currentText = null;
      window._maxkb_currentAppConfig = null;
    }
    
    // 移除弹窗元素
    if (streamingPopup && streamingPopup.parentNode) {
      streamingPopup.parentNode.removeChild(streamingPopup);
    }
  });
  buttonContainer.appendChild(closeButton);
  
  // 将按钮容器添加到弹窗
  streamingPopup.appendChild(buttonContainer);
  
  // 添加内容容器
  const contentContainer = document.createElement('div');
  contentContainer.className = 'content-container';
  contentContainer.style.cssText = `
    width: 100%;
    padding: 10px;
    overflow-y: auto;
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 15px;
  `;
  streamingPopup.appendChild(contentContainer);
  
  // 添加内容样式
  const style = document.createElement('style');
  style.textContent = `
    /* 自定义滚动条样式 */
    .maxkb-result-popup::-webkit-scrollbar {
      width: 8px;
      height: 8px;
    }
    .maxkb-result-popup::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    .maxkb-result-popup::-webkit-scrollbar-thumb {
      background: rgba(25, 118, 210, 0.3);
      border-radius: 4px;
    }
    .maxkb-result-popup::-webkit-scrollbar-thumb:hover {
      background: rgba(25, 118, 210, 0.5);
    }
    
    /* 改进弹窗背景色，避免过亮过白 */
    .maxkb-result-popup {
      background-color: #f0f4f8 !important;
      border: 1px solid #d1dce5;
      box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
      user-select: text; /* 允许选择弹窗中的文本 */
    }
    
    .maxkb-result-popup pre {
      background: #2d2d2d;
      color: #f8f8f2;
      padding: 16px;
      border-radius: 8px;
      overflow-x: auto;
      white-space: pre-wrap;
      margin: 16px 0;
      box-shadow: 0 2px 4px rgba(0,0,0,0.1);
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 0.95em;
      line-height: 1.4;
      user-select: text; /* 允许选择代码块中的文本 */
    }
    
    .maxkb-result-popup code {
      font-family: 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace;
      font-size: 0.9em;
      background: #e2e8f0;
      color: #4a5568;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 500;
      user-select: text; /* 允许选择行内代码中的文本 */
    }
    
    .content-display {
      line-height: 1.6;
      white-space: pre-wrap; /* 保持文本格式 */
      user-select: text; /* 允许选择内容显示区域中的文本 */
    }
    
    /* 内容区域样式 */
    .content-section {
      background-color: #ffffff;
      border-radius: 8px;
      padding: 12px;
      box-shadow: 0 1px 3px rgba(0,0,0,0.1);
      border: 1px solid #e2e8f0;
      user-select: text; /* 允许选择内容区域中的文本 */
    }
    
    .content-section:nth-child(even) {
      background-color: #f8fafc;
    }
    
    .content-time {
      font-size: 12px;
      color: #64748b;
      margin-bottom: 5px;
      font-weight: 500;
      user-select: text; /* 允许选择时间戳中的文本 */
    }
    
    .original-text {
      font-size: 13px;
      color: #64748b;
      background-color: #f1f5f9;
      padding: 8px;
      border-radius: 4px;
      margin-bottom: 10px;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      user-select: text; /* 允许选择原始文本中的文本 */
    }
    
    /* 为代码块添加自定义滚动条 */
    .maxkb-result-popup pre::-webkit-scrollbar {
      height: 8px;
    }
    .maxkb-result-popup pre::-webkit-scrollbar-track {
      background: rgba(255, 255, 255, 0.05);
      border-radius: 4px;
    }
    .maxkb-result-popup pre::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.2);
      border-radius: 4px;
    }
    .maxkb-result-popup pre::-webkit-scrollbar-thumb:hover {
      background: rgba(255, 255, 255, 0.3);
    }
    
    /* 内容容器滚动条 */
    .content-container::-webkit-scrollbar {
      width: 8px;
    }
    .content-container::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.05);
      border-radius: 4px;
    }
    .content-container::-webkit-scrollbar-thumb {
      background: rgba(25, 118, 210, 0.3);
      border-radius: 4px;
    }
    .content-container::-webkit-scrollbar-thumb:hover {
      background: rgba(25, 118, 210, 0.5);
    }
  `;
  streamingPopup.appendChild(style);
  document.body.appendChild(streamingPopup);
  
}

function handleStreamingMarkdownChunk(chunk, appConfig) {
  // chunk: {content: string, ...}
  let text = chunk.content || '';
  if (!text.trim()) return;

  // ✅ 只在第一条非空数据插入内容区
  if (!window._maxkb_firstChunkInserted) {
    addNewContentSectionToExistingPopup();
    window._maxkb_firstChunkInserted = true;
  }

  // 处理 markdown 代码块头尾
  if (text.startsWith('```')) text = text.replace(/^```\x2c?/, ''); // 使用\x2c代替直接的逗号
  if (text.endsWith('``')) text = text.replace(/``$/, '');
  
  // 确保弹窗已创建
  if (!window._maxkb_streamingPopup) {
    renderStreamingPopup(appConfig);
  }
  
  // 渲染内容到当前内容区域
  if (window._maxkb_streamingPopup) {
    const contentContainer = window._maxkb_streamingPopup.querySelector('.content-container');
    if (contentContainer) {
      const contentSections = contentContainer.querySelectorAll('.content-section');
      if (contentSections.length > 0) {
        const currentSection = contentSections[contentSections.length - 1];
        const contentDisplay = currentSection.querySelector('.content-display');
        if (contentDisplay) {
          // 如果有内容返回，移除等待标识
          if (text.trim().length > 0) {
            removeLoadingIndicator(contentDisplay);
          }
          
          // 获取当前已有的内容
          let existingContent = contentDisplay.textContent || '';
          
          // 追加新内容而不是替换，但只在有实际内容时追加
          if (text.trim().length > 0) {
            // 修复换行问题：保持原始文本格式，不进行额外处理
            contentDisplay.textContent = existingContent + text;
            // 直接显示文本内容，保留换行符和空格
            contentDisplay.innerHTML = contentDisplay.textContent
              .replace(/&/g, '&amp;')
              .replace(/</g, '&lt;')
              .replace(/>/g, '&gt;')
              .replace(/\n/g, '<br>')
              .replace(/  /g, '&nbsp;&nbsp;'); // 转换空格为HTML空格
          }
        }
      }
    }
  }
}

function createPopup(title, content) {
  const popup = document.createElement('div');
  popup.className = 'maxkb-popup maxkb-result-popup';
  popup.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    transform: translate(calc(50vw - 50%), calc(50vh - 50%));
    background: #f0f4f8;
    padding: 12px;
    border-radius: 8px;
    box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
    z-index: 999999;
    max-width: 600px;
    height: auto;
    min-height: 100px;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 102, 204, 0.3) rgba(0, 0, 0, 0.05);
    margin: 0;
    border: 1px solid #d1dce5;
  `;
  
  // 添加标题
  const titleElement = document.createElement('h3');
  titleElement.textContent = title;
  titleElement.style.cssText = `
    margin-top: 0;
    margin-bottom: 10px;
    font-size: 18px;
    cursor: move; /* 显示可以拖拽 */
  `;
  popup.appendChild(titleElement);
  
  // 添加内容
  const contentElement = document.createElement('div');
  contentElement.className = 'content-display';
  
  if (typeof content === 'string') {
    contentElement.innerHTML = content;
  } else {
    contentElement.appendChild(content);
  }
  popup.appendChild(contentElement);
  
  // 添加关闭按钮
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '&#10005;'; // X 符号
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 10px;
    background: none;
    border: none;
    cursor: pointer;
    font-size: 18px;
    color: #0066cc;
    font-weight: bold;
    width: 24px;
    height: 24px;
    line-height: 24px;
    text-align: center;
    border-radius: 50%;
  `;
  closeBtn.addEventListener('click', () => {
    if (popup && popup.parentNode) {
      popup.parentNode.removeChild(popup);
    }
  });
  popup.appendChild(closeBtn);
  
  // 添加拖拽功能
  let isDragging = false;
  let currentX;
  let currentY;
  let initialX;
  let initialY;
  let xOffset = 0;
  let yOffset = 0;
  let dragTimer = null;
  
  // 设置弹窗可拖拽
  popup.setAttribute('draggable', true);
  
  // 鼠标按下事件 - 准备拖拽
  popup.addEventListener('mousedown', dragStart);
  
  // 鼠标移动事件 - 拖拽中
  document.addEventListener('mousemove', drag);
  
  // 鼠标释放事件 - 结束拖拽
  document.addEventListener('mouseup', dragEnd);
  
  function dragStart(e) {
    // 只有点击在标题上才允许拖拽
    if (e.target === titleElement) {
      // 设置定时器，长按才触发拖拽
      dragTimer = setTimeout(() => {
        // 使用 getBoundingClientRect 获取元素当前位置
        const rect = popup.getBoundingClientRect();
        
        // 计算偏移量，确保拖拽时鼠标位置相对于弹窗的偏移保持一致
        xOffset = rect.left;
        yOffset = rect.top;
        initialX = e.clientX - xOffset;
        initialY = e.clientY - yOffset;
        
        isDragging = true;
        if (popup) {
          popup.style.cursor = 'grabbing';
        }
        e.preventDefault();
      }, 200); // 200ms长按触发拖拽
      
      // 显示准备拖拽的光标
      if (popup) {
        popup.style.cursor = 'grab';
      }
      e.preventDefault();
    }
  }
  
  function drag(e) {
    if (isDragging && popup) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      
      xOffset = currentX;
      yOffset = currentY;
      
      setTranslate(currentX, currentY, popup);
    }
  }
  
  function dragEnd() {
    // 清除拖拽定时器
    if (dragTimer) {
      clearTimeout(dragTimer);
      dragTimer = null;
    }
    
    // 立即结束拖拽状态
    isDragging = false;
    if (popup) {
      popup.style.cursor = 'default';
    }
  }
  
  function setTranslate(xPos, yPos, el) {
    if (el) {
      // 使用 translate 而不是 translate3d 避免位置计算错误
      el.style.transform = `translate(${xPos}px, ${yPos}px)`;
      // 移除原有的 translate(-50%, -50%) 变换
      el.style.top = '0';
      el.style.left = '0';
      el.style.margin = '0';
    }
  }
  
  return popup;
}


const emojiMap = {
  smile: '😊',
  heart: '❤️',
  fire: '🔥',
  check: '✅',
  warning: '⚠️',
  rocket: '🚀',
  thumbsup: '👍',
  tada: '🎉'
};


// 创建内容区域
function createContentSection(container, text, appConfig) {
  // 创建新的内容区域，确保流式内容按自然段落渲染
  const contentSection = document.createElement('div');
  contentSection.className = 'content-section';
  
  // 添加时间戳
  const timeElement = document.createElement('div');
  timeElement.className = 'content-time';
  timeElement.textContent = new Date().toLocaleString();
  contentSection.appendChild(timeElement);
  
  // 添加原始文本（存储完整文本，但只显示前50个字符）
  const textElement = document.createElement('div');
  textElement.className = 'original-text';
  textElement.textContent = text.length > 50 ? text.substring(0, 50) + '...' : text;
  // 将完整文本存储在自定义属性中，供下载使用
  textElement.dataset.fullText = text;
  contentSection.appendChild(textElement);
  
  // 添加内容显示区域
  const contentDisplay = document.createElement('div');
  contentDisplay.className = 'content-display';
  contentDisplay.style.whiteSpace = 'pre-wrap'; // 确保内容按自然段落显示
  contentDisplay.style.wordBreak = 'break-word'; // 确保长单词可以正确换行
  contentDisplay.style.userSelect = 'text'; // 允许选择文本
  contentDisplay.textContent = ''; // 初始为空
  
  // 添加等待标识
  const loadingIndicator = document.createElement('div');
  loadingIndicator.className = 'loading-indicator';
  loadingIndicator.innerHTML = `
    <div style="text-align: center; padding: 5px; margin-bottom: 10px;">
      <div class="loading-spinner" style="
        display: inline-block;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(0, 102, 204, 0.3);
        border-radius: 50%;
        border-top-color: #0066cc;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 2px;">
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
      <p style="font-size: 12px; color: #333; margin: 3px 0 0;">正在处理您的请求...</p>
    </div>
  `;
  
  contentDisplay.appendChild(loadingIndicator);
  contentSection.appendChild(contentDisplay);
  container.appendChild(contentSection);
  
  // 滚动到底部
  container.scrollTop = container.scrollHeight;
  
  // 返回内容显示区域，用于后续流式更新
  return contentDisplay;
}

// 清理内容区域中的等待标识
function removeLoadingIndicator(contentDisplay) {
  if (contentDisplay) {
    const loadingIndicator = contentDisplay.querySelector('.loading-indicator');
    if (loadingIndicator) {
      loadingIndicator.remove();
    }
  }
}

function ensureCorrectAppContext(appConfig) {
  const appName = appConfig?.name || 'MaxKB 应用';
  
  // 如果当前弹窗不是目标应用的，则切换
  if (!window._maxkb_streamingPopup || window._maxkb_streamingPopup.dataset.appName !== appName) {
    if (window._maxkb_app_popups && window._maxkb_app_popups[appName]) {
      window._maxkb_streamingPopup = window._maxkb_app_popups[appName];
    } else {
      // 创建新弹窗
      renderStreamingPopup(appConfig);
    }
  }
  
  // 更新当前应用配置
  window._maxkb_currentAppConfig = appConfig;
}

chrome.runtime.onMessage.addListener(function(request, sender, sendResponse) {
  if (request.action === 'ping') {
    sendResponse('pong');
    return;
  }

  if (request.action === 'sendToMaxKB') {
    const text = window._selectedText || request.text;
    if (!text) return;

    // 防止重复请求 - 检查是否正在处理相同的请求
    const requestKey = `${request.appConfig?.name || 'default'}_${text}`;
    if (window._maxkb_processingRequest === requestKey) {
      console.log('Duplicate request detected, ignoring');
      return;
    }
    
    // 标记正在处理的请求
    window._maxkb_processingRequest = requestKey;

    // 保存当前文本和应用配置到全局变量
    window._maxkb_currentText = text;
    window._maxkb_currentAppConfig = request.appConfig;
    
    // 强制切换到目标应用的上下文
    ensureCorrectAppContext(request.appConfig);
    
    // 初始化流式弹窗变量
    let loadingPopup; // 声明loadingPopup变量
    
    // 立即创建并显示等待弹窗
    loadingPopup = document.createElement('div');
    loadingPopup.className = 'maxkb-loading-popup';
    loadingPopup.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      background: white;
      padding: 20px;
      border-radius: 8px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
      z-index: 999999;
      width: 200px;
      text-align: center;
    `;
    
    // 添加等待图标
    loadingPopup.innerHTML = `
      <div class="loading-spinner" style="
        display: inline-block;
        width: 30px;
        height: 30px;
        border: 3px solid rgba(0, 102, 204, 0.3);
        border-radius: 50%;
        border-top-color: #0066cc;
        animation: spin 1s ease-in-out infinite;
        margin: 0 auto 10px;">
      </div>
      <p style="font-size: 14px; color: #333;">正在处理您的请求...</p>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `;
    document.body.appendChild(loadingPopup);

    // 获取 chat_id
    fetch(`${request.appConfig.baseUrl}/chat/api/open`, {
      method: 'GET',
      headers: {
        'accept': '*/*',
        'Authorization': `Bearer ${request.appConfig.apiKey}`
      }
    })
    .then(response => response.json())
    .then(chatIdData => {
      const chatId = chatIdData.data;
      
      // 发送文本到API
      return fetch(`${request.appConfig.baseUrl}/chat/api/chat_message/${chatId}`, {
        method: "POST",
        headers: {
          'accept': '*/*',
          "Content-Type": "application/json",
          "Authorization": `Bearer ${request.appConfig.apiKey}`
        },
        body: JSON.stringify({
          message: text,
          stream: true,
          re_chat: true
        })
      });
    })
    .then(response => {
      // 清除处理中的请求标记
      window._maxkb_processingRequest = null;
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      // 处理流式响应
      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = ''; // 用于处理不完整的JSON
      
      // 你需要在流式API每次返回时调用 handleStreamingMarkdownChunk({content: ...})
      // 并在流式结束时重置 streamingContentBuffer = '' 和 streamingPopup = null
      
      // 处理流式响应
      return reader.read().then(function processText({ done, value }) {
        if (done) {
          window._maxkb_firstChunkInserted = false;
          console.log('Stream complete');
          // 流式结束时移除等待弹窗
          if (loadingPopup && loadingPopup.parentNode) {
            loadingPopup.remove();
          }
          
          // 确保按钮在流式内容完成后可见
          if (window._maxkb_streamingPopup) {
            const buttonContainer = window._maxkb_streamingPopup.querySelector('.button-container');
            if (buttonContainer) {
              // 确保按钮容器始终可见
              buttonContainer.style.position = 'sticky';
              buttonContainer.style.top = '0';
              buttonContainer.style.zIndex = '1000000';
            }
            
            // 获取当前内容区域（最后一个）
            const contentContainer = window._maxkb_streamingPopup.querySelector('.content-container');
            if (contentContainer) {
              const contentSections = contentContainer.querySelectorAll('.content-section');
              if (contentSections.length > 0) {
                const currentSection = contentSections[contentSections.length - 1];
                const contentDisplay = currentSection.querySelector('.content-display');
                if (contentDisplay) {
                  // 移除等待标识
                  removeLoadingIndicator(contentDisplay);
                }
              }
            }
          }
          return;
        }
        
        const chunk = decoder.decode(value, { stream: true });
        buffer += chunk;
        
        // 如果有内容返回，移除等待弹窗
        if (buffer.trim().length > 0 && loadingPopup && loadingPopup.parentNode) {
          loadingPopup.remove();
        }
        
        // 处理缓冲区中的数据
        try {
          // 尝试解析每一行JSON
          const lines = buffer.split('\n');
          // 保留最后一行（可能不完整）
          buffer = lines.pop() || '';
          
          for (const line of lines) {
            if (line.trim()) {
              try {
                // 处理可能带有 "data: " 前缀的 JSON 数据
                let jsonStr = line;
                if (line.startsWith('data:')) {
                  jsonStr = line.substring(5).trim();
                }
                
                const jsonData = JSON.parse(jsonStr);
                // 确保只有包含content字段且不是错误信息时才处理
                if (jsonData && jsonData.content && !jsonData.content.startsWith('Exception:')) {
                  // 在处理流式内容前，确保设置正确的应用上下文
                  ensureCorrectAppContext(request.appConfig);
                  handleStreamingMarkdownChunk(jsonData, request.appConfig);
                } else if (jsonData && jsonData.content && jsonData.content.startsWith('Exception:')) {
                  // 处理异常信息
                  // 在处理流式内容前，确保设置正确的应用上下文
                  ensureCorrectAppContext(request.appConfig);
                  handleStreamingMarkdownChunk({content: `**错误**: ${jsonData.content}`}, request.appConfig);
                }
              } catch (e) {
                console.warn('Failed to parse JSON line:', line, e);
              }
            }
          }
        } catch (e) {
          console.error('Error processing stream:', e);
        }
        
        // 继续读取
        return reader.read().then(processText);
      });
    })
    .catch(error => {
      console.error('Error:', error);
      // 清除处理中的请求标记
      window._maxkb_processingRequest = null;
      
      // 移除等待弹窗
      if (loadingPopup && loadingPopup.parentNode) {
        loadingPopup.remove();
      }
      
      // 在弹窗中显示错误信息
      if (window._maxkb_streamingPopup) {
        const contentContainer = window._maxkb_streamingPopup.querySelector('.content-container');
        if (contentContainer) {
          const contentSections = contentContainer.querySelectorAll('.content-section');
          if (contentSections.length > 0) {
            const currentSection = contentSections[contentSections.length - 1];
            const contentDisplay = currentSection.querySelector('.content-display');
            if (contentDisplay) {
              // 移除等待标识
              const loadingIndicator = contentDisplay.querySelector('.loading-indicator');
              if (loadingIndicator) {
                loadingIndicator.remove();
              }
              
              // 显示错误信息
              contentDisplay.innerHTML = `<p style="color: red;">处理请求时出错: ${error.message}</p>`;
            }
          }
        }
      }
      
      // 显示错误弹窗
      const errorPopup = createPopup('错误', `处理请求时出错: ${error.message}`);
      document.body.appendChild(errorPopup);
    });
  }
});