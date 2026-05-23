/**
 * localStorage 数据读写封装
 */
var Store = (function () {
  'use strict';

  var KEYS = {
    items: 'eater_menu_items',
    categories: 'eater_categories',
    history: 'eater_history',
    settings: 'eater_settings'
  };

  function load(key) {
    try {
      return JSON.parse(localStorage.getItem(key)) || null;
    } catch (e) {
      return null;
    }
  }

  function save(key, data) {
    localStorage.setItem(key, JSON.stringify(data));
  }

  // === 菜品 ===
  function getItems() {
    return load(KEYS.items) || [];
  }

  function saveItems(items) {
    save(KEYS.items, items);
  }

  function addItem(item) {
    var items = getItems();
    items.push(item);
    saveItems(items);
    return item;
  }

  function updateItem(id, updates) {
    var items = getItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].id === id) {
        Object.assign(items[i], updates);
        saveItems(items);
        return items[i];
      }
    }
    return null;
  }

  function deleteItem(id) {
    var items = getItems().filter(function (it) { return it.id !== id; });
    saveItems(items);
  }

  // === 分类 ===
  function getCategories() {
    return load(KEYS.categories) || [];
  }

  function saveCategories(cats) {
    save(KEYS.categories, cats);
  }

  function addCategory(cat) {
    var cats = getCategories();
    cats.push(cat);
    saveCategories(cats);
    return cat;
  }

  function deleteCategory(id) {
    var cats = getCategories().filter(function (c) { return c.id !== id; });
    saveCategories(cats);
    // 把该分类下的菜品移到"未分类"
    var items = getItems();
    var changed = false;
    for (var i = 0; i < items.length; i++) {
      if (items[i].categoryId === id) {
        items[i].categoryId = '';
        changed = true;
      }
    }
    if (changed) saveItems(items);
  }

  // === 历史 ===
  function getHistory() {
    return load(KEYS.history) || [];
  }

  function addHistory(entry) {
    var list = getHistory();
    list.unshift(entry);
    // 保留最近 365 条
    if (list.length > 365) list = list.slice(0, 365);
    save(KEYS.history, list);
  }

  function clearHistory() {
    save(KEYS.history, []);
  }

  // === 设置 ===
  function getSettings() {
    return load(KEYS.settings) || {
      excludeTags: [],
      sceneFilter: 'any',
      antiRepeatHours: 24,
      version: 1
    };
  }

  function saveSettings(s) {
    save(KEYS.settings, s);
  }

  // === 一键导出 ===
  function exportAll() {
    return {
      items: getItems(),
      categories: getCategories(),
      history: getHistory(),
      settings: getSettings(),
      exportedAt: Date.now()
    };
  }

  function importAll(data) {
    if (data.items) saveItems(data.items);
    if (data.categories) saveCategories(data.categories);
    if (data.history) save(KEYS.history, data.history);
    if (data.settings) saveSettings(data.settings);
  }

  function resetAll() {
    Object.values(KEYS).forEach(function (k) { localStorage.removeItem(k); });
  }

  // === 预置数据（仅首次） ===
  function seedIfEmpty() {
    if (getItems().length > 0) return;

    var now = Date.now();

    var cats = [
      { id: 'cat-home', name: '家常菜', icon: '🏠', sortOrder: 0 },
      { id: 'cat-out', name: '外卖', icon: '🥡', sortOrder: 1 },
      { id: 'cat-canteen', name: '食堂', icon: '🍽️', sortOrder: 2 }
    ];
    saveCategories(cats);

    var items = [
      { id: Utils.uuid(), name: '红烧排骨', emoji: '🍖', categoryId: 'cat-home', tags: ['家常', '肉'], createdAt: now },
      { id: Utils.uuid(), name: '番茄炒蛋', emoji: '🍅', categoryId: 'cat-home', tags: ['家常', '清淡'], createdAt: now },
      { id: Utils.uuid(), name: '麻婆豆腐', emoji: '🫘', categoryId: 'cat-home', tags: ['家常', '辣'], createdAt: now },
      { id: Utils.uuid(), name: '蛋炒饭', emoji: '🍳', categoryId: 'cat-home', tags: ['家常', '清淡'], createdAt: now },
      { id: Utils.uuid(), name: '牛肉面', emoji: '🍜', categoryId: 'cat-out', tags: ['面食', '汤'], createdAt: now },
      { id: Utils.uuid(), name: '披萨', emoji: '🍕', categoryId: 'cat-out', tags: ['外卖', '油炸'], createdAt: now },
      { id: Utils.uuid(), name: '寿司', emoji: '🍣', categoryId: 'cat-out', tags: ['外卖', '清淡'], createdAt: now },
      { id: Utils.uuid(), name: '汉堡薯条', emoji: '🍔', categoryId: 'cat-out', tags: ['外卖', '油炸'], createdAt: now },
      { id: Utils.uuid(), name: '黄焖鸡米饭', emoji: '🐔', categoryId: 'cat-out', tags: ['外卖', '辣'], createdAt: now },
      { id: Utils.uuid(), name: '麻辣香锅', emoji: '🥘', categoryId: 'cat-canteen', tags: ['辣', '重口'], createdAt: now },
      { id: Utils.uuid(), name: '凯撒沙拉', emoji: '🥗', categoryId: 'cat-canteen', tags: ['轻食', '清淡'], createdAt: now },
      { id: Utils.uuid(), name: '煎饼果子', emoji: '🥞', categoryId: 'cat-canteen', tags: ['早餐', '清淡'], createdAt: now }
    ];
    saveItems(items);

    saveSettings({
      excludeTags: [],
      sceneFilter: 'any',
      antiRepeatHours: 24,
      version: 1
    });
  }

  return {
    getItems: getItems,
    saveItems: saveItems,
    addItem: addItem,
    updateItem: updateItem,
    deleteItem: deleteItem,
    getCategories: getCategories,
    saveCategories: saveCategories,
    addCategory: addCategory,
    deleteCategory: deleteCategory,
    getHistory: getHistory,
    addHistory: addHistory,
    clearHistory: clearHistory,
    getSettings: getSettings,
    saveSettings: saveSettings,
    exportAll: exportAll,
    importAll: importAll,
    resetAll: resetAll,
    seedIfEmpty: seedIfEmpty
  };
})();
