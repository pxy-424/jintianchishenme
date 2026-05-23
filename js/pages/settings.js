/**
 * 设置页
 */
var SettingsPage = (function () {
  'use strict';

  function render() {
    var settings = Store.getSettings();

    // 排除标签
    var tagsContainer = document.getElementById('settings-tags');
    var excludeTags = settings.excludeTags || [];
    tagsContainer.innerHTML = excludeTags.map(function (t) {
      return '<span class="filter-tag excluded" data-tag="' + escHtml(t) + '">' + escHtml(t) + ' ✕</span>';
    }).join('') + '<button class="btn btn-ghost" id="btn-add-exclude-tag" style="font-size:0.8125rem;">+ 添加</button>';

    // 标签点击移除
    tagsContainer.querySelectorAll('.filter-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        var t = tag.getAttribute('data-tag');
        var tags = (Store.getSettings().excludeTags || []).filter(function (x) { return x !== t; });
        Store.saveSettings(Object.assign({}, Store.getSettings(), { excludeTags: tags }));
        render();
        if (typeof HomePage !== 'undefined' && HomePage.refresh) HomePage.refresh();
      });
    });

    // 添加标签按钮
    var addBtn = tagsContainer.querySelector('#btn-add-exclude-tag');
    if (addBtn) {
      addBtn.addEventListener('click', function () {
        var tag = prompt('输入要排除的标签名：');
        if (tag && tag.trim()) {
          var tags = Store.getSettings().excludeTags || [];
          tag = tag.trim();
          if (tags.indexOf(tag) === -1) {
            tags.push(tag);
            Store.saveSettings(Object.assign({}, Store.getSettings(), { excludeTags: tags }));
            render();
            if (typeof HomePage !== 'undefined' && HomePage.refresh) HomePage.refresh();
          }
        }
      });
    }

    // 防重复
    var antiRepeat = document.getElementById('anti-repeat');
    antiRepeat.value = String(settings.antiRepeatHours || 24);
  }

  function bindEvents() {
    // 防重复
    document.getElementById('anti-repeat').addEventListener('change', function () {
      Store.saveSettings(Object.assign({}, Store.getSettings(), { antiRepeatHours: parseInt(this.value) || 0 }));
    });

    // 导出
    document.getElementById('btn-export').addEventListener('click', function () {
      var data = Store.exportAll();
      var blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      var url = URL.createObjectURL(blob);
      var a = document.createElement('a');
      a.href = url;
      a.download = '今天吃什么-备份-' + Utils.formatDate(Date.now()) + '.json';
      a.click();
      URL.revokeObjectURL(url);
    });

    // 导入
    document.getElementById('btn-import').addEventListener('click', function () {
      document.getElementById('import-file').click();
    });
    document.getElementById('import-file').addEventListener('change', function (e) {
      var file = e.target.files[0];
      if (!file) return;
      var reader = new FileReader();
      reader.onload = function (ev) {
        try {
          var data = JSON.parse(ev.target.result);
          if (!data.items || !data.categories) {
            alert('文件格式不正确，请选择有效的备份文件。');
            return;
          }
          showConfirm('导入将覆盖当前菜单、分类和设置，确定继续？', function () {
            Store.importAll(data);
            render();
            if (typeof MenuPage !== 'undefined' && MenuPage.refresh) MenuPage.refresh();
            if (typeof HomePage !== 'undefined' && HomePage.refresh) HomePage.refresh();
            alert('导入成功！');
          });
        } catch (err) {
          alert('文件解析失败，请检查文件是否完整。');
        }
      };
      reader.readAsText(file);
      this.value = '';
    });

    // 清除历史
    document.getElementById('btn-clear-history').addEventListener('click', function () {
      showConfirm('确定要清除所有历史记录吗？此操作不可恢复。', function () {
        Store.clearHistory();
      });
    });

    // 重置
    document.getElementById('btn-reset-all').addEventListener('click', function () {
      showConfirm('确定要删除所有数据（菜单、记录、设置）吗？此操作不可恢复！', function () {
        Store.resetAll();
        location.reload();
      });
    });
  }

  function showConfirm(msg, onOk) {
    document.getElementById('confirm-msg').textContent = msg;
    document.getElementById('confirm-modal').style.display = 'flex';
    document.getElementById('btn-confirm-ok').onclick = function () {
      document.getElementById('confirm-modal').style.display = 'none';
      if (onOk) onOk();
    };
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function init() {
    render();
    bindEvents();
  }

  return { init: init, refresh: render };
})();
