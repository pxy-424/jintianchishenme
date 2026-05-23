/**
 * 今天吃什么选择器 — 应用入口
 */
(function () {
  'use strict';

  // === 初始化数据 ===
  Store.seedIfEmpty();

  // === 页面注册 ===
  var pageInits = {
    home: function () { HomePage.init(); },
    menu: function () { MenuPage.init(); },
    stats: function () { StatsPage.render(); },
    settings: function () { SettingsPage.init(); }
  };

  var pageRefreshes = {
    home: function () { if (HomePage.refresh) HomePage.refresh(); },
    menu: function () { if (MenuPage.refresh) MenuPage.refresh(); },
    stats: function () { StatsPage.render(); },
    settings: function () { if (SettingsPage.refresh) SettingsPage.refresh(); }
  };

  var initialized = {};

  // === 路由 ===
  var pages = {
    home: document.getElementById('page-home'),
    menu: document.getElementById('page-menu'),
    stats: document.getElementById('page-stats'),
    settings: document.getElementById('page-settings')
  };

  var navItems = document.querySelectorAll('#bottom-nav .nav-item');

  function getPageFromHash() {
    var hash = window.location.hash.replace('#/', '') || 'home';
    return pages[hash] ? hash : 'home';
  }

  function switchPage(name) {
    var current = document.querySelector('.page.active');
    var next = pages[name];
    if (current === next) return;

    if (current) current.classList.remove('active');
    next.classList.add('active');

    navItems.forEach(function (item) {
      item.classList.toggle('active', item.getAttribute('data-page') === name);
    });

    window.location.hash = '#/' + name;

    // 首次访问初始化，后续访问刷新
    if (!initialized[name]) {
      if (pageInits[name]) pageInits[name]();
      initialized[name] = true;
    } else {
      if (pageRefreshes[name]) pageRefreshes[name]();
    }
  }

  navItems.forEach(function (item) {
    item.addEventListener('click', function () {
      switchPage(item.getAttribute('data-page'));
    });
  });

  window.addEventListener('hashchange', function () {
    var name = getPageFromHash();
    var current = document.querySelector('.page.active');
    if (current && current.id === 'page-' + name) return;
    switchPage(name);
  });

  // 初始加载
  var startPage = getPageFromHash();
  switchPage(startPage);

  // 全局确认弹窗关闭
  document.getElementById('btn-confirm-cancel').addEventListener('click', function () {
    document.getElementById('confirm-modal').style.display = 'none';
  });
  document.getElementById('confirm-modal').addEventListener('click', function (e) {
    if (e.target === this) document.getElementById('confirm-modal').style.display = 'none';
  });

  console.log('🍜 今天吃什么选择器 — 已就绪');
})();
