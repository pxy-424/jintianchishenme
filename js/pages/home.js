/**
 * 首页 — 决策
 */
var HomePage = (function () {
  'use strict';

  var currentResult = null;
  var isSpinning = false;
  var lastExcludedIds = [];

  function getSceneLabel() {
    var btn = document.querySelector('#scene-filter .scene-btn.active');
    return btn ? btn.getAttribute('data-scene') : 'any';
  }

  function getExcludedTags() {
    // 从页面 filter-bar 获取
    var tags = [];
    document.querySelectorAll('#filter-bar .filter-tag.excluded').forEach(function (t) {
      tags.push(t.getAttribute('data-tag'));
    });
    return tags;
  }

  function getCandidateItems() {
    var items = Store.getItems();
    if (items.length === 0) return [];

    var settings = Store.getSettings();
    var history = Store.getHistory();
    var now = Date.now();
    var antiRepeatMs = (settings.antiRepeatHours || 24) * 3600000;

    var excludedTags = getExcludedTags();
    var scene = getSceneLabel();

    // 场景名称到标签的映射
    var sceneTagMap = { breakfast: '早餐', lunch: '午餐', dinner: '晚餐' };
    var sceneTag = sceneTagMap[scene] || null;

    var filtered = items.filter(function (item) {
      // 场景筛选
      if (sceneTag && (item.tags || []).indexOf(sceneTag) === -1) return false;

      // 排除标签
      if (excludedTags.length > 0) {
        for (var i = 0; i < excludedTags.length; i++) {
          if ((item.tags || []).indexOf(excludedTags[i]) !== -1) return false;
        }
      }

      // 排除最近选过的（防重复）
      if (antiRepeatMs > 0) {
        for (var j = 0; j < history.length; j++) {
          if (history[j].menuItemId === item.id && (now - history[j].timestamp) < antiRepeatMs) {
            return false;
          }
        }
      }

      // 排除本轮已出现过的
      if (lastExcludedIds.indexOf(item.id) !== -1) return false;

      return true;
    });

    // 如果场景筛选后没有可选菜品，去掉场景限制
    if (filtered.length === 0 && sceneTag) {
      filtered = items.filter(function (item) {
        if (excludedTags.length > 0) {
          for (var i = 0; i < excludedTags.length; i++) {
            if ((item.tags || []).indexOf(excludedTags[i]) !== -1) return false;
          }
        }
        if (antiRepeatMs > 0) {
          for (var j = 0; j < history.length; j++) {
            if (history[j].menuItemId === item.id && (now - history[j].timestamp) < antiRepeatMs) {
              return false;
            }
          }
        }
        if (lastExcludedIds.indexOf(item.id) !== -1) return false;
        return true;
      });
    }

    return filtered;
  }

  function renderFilterBar() {
    var bar = document.getElementById('filter-bar');
    if (typeof bar === 'undefined' || !bar) return;

    // 从已有菜品中收集标签
    var items = Store.getItems();
    var tagSet = {};
    items.forEach(function (item) {
      (item.tags || []).forEach(function (t) { tagSet[t] = true; });
    });
    var allTags = Object.keys(tagSet);

    if (allTags.length === 0) {
      bar.innerHTML = '<span style="font-size:0.75rem;color:var(--color-text-light);">暂无标签</span>';
      return;
    }

    bar.innerHTML = allTags.map(function (t) {
      return '<span class="filter-tag" data-tag="' + escHtml(t) + '">' + escHtml(t) + '</span>';
    }).join('');

    bar.querySelectorAll('.filter-tag').forEach(function (tag) {
      tag.addEventListener('click', function () {
        tag.classList.toggle('excluded');
        refreshRoulette();
      });
    });
  }

  function refreshRoulette() {
    var items = getCandidateItems();
    var canvas = document.getElementById('roulette-canvas');
    Roulette.draw(canvas, items);

    // 更新排除计数提示
    var excluded = getExcludedTags();
    var btn = document.getElementById('btn-spin');
    if (items.length === 0) {
      btn.textContent = '😅 没有可选的菜品了';
      btn.disabled = true;
    } else {
      btn.textContent = '🎰 随便吃点什么';
      btn.disabled = false;
    }
  }

  function showResult(item) {
    if (!item) return;
    currentResult = item;
    var card = document.getElementById('result-card');
    document.getElementById('result-emoji').textContent = item.emoji;
    document.getElementById('result-name').textContent = item.name;
    document.getElementById('result-tags').innerHTML = (item.tags || []).map(function (t) {
      return '<span class="tag">' + escHtml(t) + '</span>';
    }).join('');
    card.style.display = 'block';
    // 滚动到卡片
    card.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function hideResult() {
    document.getElementById('result-card').style.display = 'none';
    currentResult = null;
  }

  function handleSpin() {
    if (isSpinning) return;

    var items = getCandidateItems();
    if (items.length === 0) {
      alert('没有可选的菜品，请检查菜单或排除标签设置。');
      return;
    }

    isSpinning = true;
    hideResult();
    document.getElementById('btn-spin').textContent = '🎰 旋转中...';
    document.getElementById('btn-spin').disabled = true;

    var canvas = document.getElementById('roulette-canvas');
    Roulette.spin(canvas, items, function (result) {
      isSpinning = false;
      document.getElementById('btn-spin').textContent = '🎰 随便吃点什么';
      document.getElementById('btn-spin').disabled = false;
      if (result) {
        showResult(result);
        // 把这次结果加入本轮排除
        lastExcludedIds.push(result.id);
      }
    });
  }

  function handleConfirm() {
    if (!currentResult) return;
    Store.addHistory({
      id: Utils.uuid(),
      menuItemId: currentResult.id,
      menuItemName: currentResult.name,
      menuItemEmoji: currentResult.emoji,
      timestamp: Date.now(),
      scene: getSceneLabel()
    });
    hideResult();
    lastExcludedIds = [];
    refreshRoulette();
    // 简单动画提示
    var btn = document.getElementById('btn-confirm');
    btn.textContent = '✅ 已记录！';
    setTimeout(function () { btn.textContent = '👍 就它了'; }, 1500);
  }

  function handleReroll() {
    hideResult();
    // 不等用户点按钮，直接触发旋转
    setTimeout(handleSpin, 200);
  }

  function updateGreeting() {
    var hour = new Date().getHours();
    var timeText, emoji;
    if (hour < 10) { timeText = '早上好'; emoji = '🌅'; }
    else if (hour < 14) { timeText = '中午好'; emoji = '☀️'; }
    else if (hour < 18) { timeText = '下午好'; emoji = '🌤️'; }
    else { timeText = '晚上好'; emoji = '🌙'; }
    document.getElementById('greeting-time').textContent = timeText + ' ' + emoji;
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function init() {
    updateGreeting();
    renderFilterBar();
    refreshRoulette();

    document.getElementById('btn-spin').addEventListener('click', handleSpin);
    document.getElementById('btn-confirm').addEventListener('click', handleConfirm);
    document.getElementById('btn-reroll').addEventListener('click', handleReroll);

    // 场景筛选
    document.querySelectorAll('#scene-filter .scene-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.querySelectorAll('#scene-filter .scene-btn').forEach(function (b) { b.classList.remove('active'); });
        btn.classList.add('active');
        lastExcludedIds = [];
        refreshRoulette();
      });
    });

    // 结果卡片按钮
    document.getElementById('btn-confirm').textContent = '👍 就它了';
  }

  return {
    init: init,
    refresh: function () {
      renderFilterBar();
      lastExcludedIds = [];
      hideResult();
      refreshRoulette();
    }
  };
})();
