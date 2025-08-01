// 配置常量
const APPS_KEY = 'mk_apps';
const PARENT_MENU_ID = 'maxkb-root';

// 创建上下文菜单
function createContextMenus(apps) {
  chrome.contextMenus.removeAll(() => {
    // 创建父菜单
    chrome.contextMenus.create({
      id: PARENT_MENU_ID,
      title: 'MaxKB智能助手',
      contexts: ['selection']
    });

    // 创建应用子菜单
    if (apps && apps.length > 0) {
      apps.forEach((app, idx) => {
        chrome.contextMenus.create({
          id: `maxkb-app-${idx}`,
          parentId: PARENT_MENU_ID,
          title: app.name || `应用${idx+1}`,
          contexts: ['selection']
        });
      });
    }
  });
}

// 初始化菜单
function initMenus() {
  chrome.storage.sync.get([APPS_KEY], (data) => {
    const apps = Array.isArray(data[APPS_KEY]) ? data[APPS_KEY] : [];
    createContextMenus(apps);
  });
}

// 注册事件监听器
chrome.runtime.onInstalled.addListener(initMenus);
chrome.runtime.onStartup.addListener(initMenus);

// 监听存储变化
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && changes[APPS_KEY]) {
    initMenus();
  }
});

// 处理菜单点击事件
chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (!info.menuItemId?.startsWith('maxkb-app-') || !info.selectionText) {
    return;
  }

  // 获取当前活动标签页
  chrome.tabs.query({active: true, currentWindow: true}, function(tabs) {
    if (!tabs || tabs.length === 0) {
      console.error('No active tab found');
      return;
    }
    
    const currentTab = tabs[0];
    if (!currentTab.id || currentTab.id < 0) {
      console.error('Invalid tab ID');
      return;
    }

    const idx = parseInt(info.menuItemId.replace('maxkb-app-', ''));
    
    chrome.storage.sync.get([APPS_KEY], (data) => {
      const apps = Array.isArray(data[APPS_KEY]) ? data[APPS_KEY] : [];
      const app = apps[idx];
      if (!app) return;

      // 检查内容脚本是否已注入
      chrome.tabs.sendMessage(currentTab.id, { action: 'ping' })
        .then(() => {
          // 内容脚本已存在，直接发送消息
          chrome.tabs.sendMessage(currentTab.id, {
            action: 'sendToMaxKB',
            text: info.selectionText,
            appConfig: app
          });
        })
        .catch(() => {
          // 内容脚本不存在，注入后再发送消息
          chrome.scripting.executeScript({
            target: { tabId: currentTab.id },
            files: ['content.js']
          })
          .then(() => {
            // 延迟发送消息，确保脚本已加载
            setTimeout(() => {
              chrome.tabs.sendMessage(currentTab.id, {
                action: 'sendToMaxKB',
                text: info.selectionText,
                appConfig: app
              });
            }, 100);
          })
          .catch((error) => {
            console.error('Failed to inject content script:', error);
          });
        });
    });
  });
});