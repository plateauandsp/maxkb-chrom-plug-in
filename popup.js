// 配置常量
const CONFIG = {
  storageKey: 'mk_apps'
};

function loadApps() {
  chrome.storage.sync.get([CONFIG.storageKey], (data) => {
    let apps = Array.isArray(data[CONFIG.storageKey]) ? data[CONFIG.storageKey] : [];
    if (apps.length === 0) apps = [getDefaultApp()];
    renderApps(apps);
    window._mk_apps = apps;
  });
}

function getDefaultApp() {
  return {
    name: '',
    baseUrl: '',
    apiKey: ''
  };
}

function renderApps(apps) {
  const list = document.getElementById('apps-list');
  list.innerHTML = '';
  apps.forEach((app, idx) => {
    const card = document.createElement('div');
    card.className = 'app-card';
    
    // header
    const header = document.createElement('div');
    header.className = 'app-card-header';
    
    // 应用图标
    const icon = document.createElement('div');
    icon.className = 'app-icon';
    icon.innerHTML = '📦';
    header.appendChild(icon);

    // 应用名称输入框
    const nameInput = document.createElement('input');
    nameInput.className = 'app-title-input';
    nameInput.type = 'text';
    nameInput.required = true;
    nameInput.placeholder = '输入应用名称';
    nameInput.value = app.name || '';
    nameInput.maxLength = 20;
    nameInput.oninput = (e) => {
      app.name = e.target.value;
      nameInput.classList.toggle('is-invalid', !app.name);
    };
    header.appendChild(nameInput);

    // 操作按钮
    const actions = document.createElement('div');
    actions.className = 'app-card-actions';
    
    // 展开按钮
    const toggleBtn = document.createElement('button');
    toggleBtn.className = 'action-btn toggle-btn';
    toggleBtn.innerHTML = '▼';
    toggleBtn.setAttribute('data-tooltip', '展开/折叠');
    actions.appendChild(toggleBtn);

    // 删除按钮
    const delBtn = document.createElement('button');
    delBtn.className = 'action-btn delete-btn';
    delBtn.innerHTML = '🗑';
    delBtn.setAttribute('data-tooltip', '删除应用');
    delBtn.onclick = (e) => {
      e.stopPropagation();
      apps.splice(idx, 1);
      renderApps(apps);
    };
    actions.appendChild(delBtn);
    
    header.appendChild(actions);
    card.appendChild(header);

    // 内容区域
    const content = document.createElement('div');
    content.className = 'app-card-content';
    content.innerHTML = `
      <div class="form-group">
        <label class="form-label">
          <span>🔗</span>
          <span>MaxKB 地址</span>
        </label>
        <div class="form-input-wrapper">
          <input class="form-input app-baseurl" type="text" placeholder="如：http://ip:8080" value="${app.baseUrl || ''}" data-idx="${idx}" />
        </div>
      </div>
      <div class="form-group">
        <label class="form-label">
          <span>🔑</span>
          <span>应用 API 密钥</span>
        </label>
        <div class="form-input-wrapper">
          <input class="form-input app-apikey" type="text" placeholder="请输入 API_KEY" value="${app.apiKey || ''}" data-idx="${idx}" />
        </div>
      </div>
    `;
    
    card.appendChild(content);
    
    // 折叠/展开逻辑
    const toggleCard = () => {
      card.classList.toggle('expanded');
      toggleBtn.innerHTML = card.classList.contains('expanded') 
        ? '▲'
        : '▼';
    };
    
    header.onclick = toggleCard;
    list.appendChild(card);
  });
  
  // 监听URL和KEY输入
  document.querySelectorAll('.app-baseurl').forEach(input => {
    input.oninput = (e) => {
      const idx = e.target.dataset.idx;
      apps[idx].baseUrl = e.target.value;
    };
  });
  document.querySelectorAll('.app-apikey').forEach(input => {
    input.oninput = (e) => {
      const idx = e.target.dataset.idx;
      apps[idx].apiKey = e.target.value;
    };
  });
}

// 初始化事件监听
document.addEventListener('DOMContentLoaded', () => {
  loadApps();

  // 添加新应用
  document.getElementById('add-app-btn').onclick = () => {
    window._mk_apps.push(getDefaultApp());
    renderApps(window._mk_apps);
  };

  // 保存配置
  document.getElementById('save-all-btn').onclick = () => {
    // 校验必填字段
    if (window._mk_apps.some(app => !app.name)) {
      alert('请填写所有应用的名称');
      return;
    }
    chrome.storage.sync.set({
      [CONFIG.storageKey]: window._mk_apps
    }, () => {
      // 显示保存成功的提示
      const toast = document.createElement('div');
      toast.className = 'toast';
      toast.innerHTML = '<span>✓</span><span>配置已保存</span>';
      document.body.appendChild(toast);
      
      // 显示动画
      setTimeout(() => {
        toast.classList.add('show');
      }, 10);
      
      // 2秒后移除
      setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => {
          if (toast.parentNode) {
            toast.parentNode.removeChild(toast);
          }
        }, 300);
      }, 2000);
    });
  };
});
