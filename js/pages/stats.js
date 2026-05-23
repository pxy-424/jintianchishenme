/**
 * 统计记录页
 */
var StatsPage = (function () {
  'use strict';

  function renderCalendar() {
    var history = Store.getHistory();
    var grid = document.getElementById('calendar-grid');
    var empty = document.getElementById('calendar-empty');

    if (history.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    // 统计每天的记录数
    var dayCount = {};
    history.forEach(function (h) {
      var day = Utils.formatDate(h.timestamp);
      dayCount[day] = (dayCount[day] || 0) + 1;
    });

    var now = new Date();
    var year = now.getFullYear();
    var month = now.getMonth();
    var days = Utils.daysInMonth(year, month);
    var firstDay = Utils.firstDayOfMonth(year, month); // 0=日

    // 调整：周一起始
    var startPad = firstDay === 0 ? 6 : firstDay - 1;

    var headers = ['一','二','三','四','五','六','日'].map(function (d) {
      return '<div class="calendar-header">' + d + '</div>';
    }).join('');

    var cells = '';
    for (var i = 0; i < startPad; i++) {
      cells += '<div class="calendar-cell" style="background:transparent;"></div>';
    }
    for (var d = 1; d <= days; d++) {
      var dateStr = year + '-' + (month + 1 < 10 ? '0' : '') + (month + 1) + '-' + (d < 10 ? '0' : '') + d;
      var count = dayCount[dateStr] || 0;
      var level = count === 0 ? '' : count === 1 ? 'level-1' : count <= 2 ? 'level-2' : count <= 4 ? 'level-3' : 'level-4';
      var title = dateStr + (count > 0 ? ' — ' + count + '次' : '');
      cells += '<div class="calendar-cell ' + level + '" title="' + title + '"></div>';
    }

    grid.innerHTML = headers + cells;
  }

  function renderRanking() {
    var history = Store.getHistory();
    var list = document.getElementById('rank-list');
    var empty = document.getElementById('rank-empty');

    var weekStart = Utils.getWeekStart();
    var weekHistory = history.filter(function (h) { return h.timestamp >= weekStart; });

    if (weekHistory.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    // 统计
    var countMap = {};
    weekHistory.forEach(function (h) {
      var key = h.menuItemName;
      if (!countMap[key]) countMap[key] = { name: key, emoji: h.menuItemEmoji, count: 0 };
      countMap[key].count++;
    });

    var sorted = Object.values(countMap).sort(function (a, b) { return b.count - a.count; }).slice(0, 5);
    var maxCount = sorted[0] ? sorted[0].count : 1;

    list.innerHTML = sorted.map(function (item, i) {
      var pct = (item.count / maxCount * 100).toFixed(0);
      return '<div class="rank-item">' +
        '<div class="rank-num">' + (i + 1) + '</div>' +
        '<div class="rank-emoji">' + item.emoji + '</div>' +
        '<div class="rank-info">' +
          '<div class="rank-name">' + escHtml(item.name) + '</div>' +
          '<div class="rank-bar-wrap"><div class="rank-bar" style="width:' + pct + '%"></div></div>' +
        '</div>' +
        '<div class="rank-count">' + item.count + '次</div>' +
      '</div>';
    }).join('');
  }

  function renderHistory() {
    var history = Store.getHistory();
    var list = document.getElementById('history-list');
    var empty = document.getElementById('history-empty');

    if (history.length === 0) {
      list.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    var recent = history.slice(0, 20);
    list.innerHTML = recent.map(function (h) {
      return '<div class="history-item">' +
        '<div class="history-emoji">' + h.menuItemEmoji + '</div>' +
        '<div class="history-info">' +
          '<div class="history-name">' + escHtml(h.menuItemName) + '</div>' +
          '<div class="history-date">' + Utils.formatDate(h.timestamp) + ' ' + Utils.formatTime(h.timestamp) + '</div>' +
        '</div>' +
      '</div>';
    }).join('');
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function render() {
    renderCalendar();
    renderRanking();
    renderHistory();
  }

  return { render: render };
})();
