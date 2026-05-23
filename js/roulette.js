/**
 * Canvas 幸运转盘 — 绘制 + 旋转动画
 */
var Roulette = (function () {
  'use strict';

  var COLORS = [
    '#FF8C42', '#FFAB6E', '#FFCC02', '#7CB342',
    '#FF7043', '#FFA726', '#66BB6A', '#FFCA28',
    '#EF5350', '#AB47BC', '#42A5F5', '#26C6DA'
  ];

  var PI = Math.PI;
  var TAU = PI * 2;

  function draw(canvas, items) {
    var ctx = canvas.getContext('2d');
    var w = canvas.width;
    var h = canvas.height;
    var cx = w / 2;
    var cy = h / 2;
    var r = w / 2 - 6;

    ctx.clearRect(0, 0, w, h);

    if (!items || items.length === 0) {
      // 空转盘
      ctx.beginPath();
      ctx.arc(cx, cy, r, 0, TAU);
      ctx.fillStyle = '#EFEBE9';
      ctx.fill();
      ctx.fillStyle = '#8D6E63';
      ctx.font = '14px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.fillText('还没有菜品~', cx, cy);
      return;
    }

    var n = items.length;
    var angleStep = TAU / n;

    for (var i = 0; i < n; i++) {
      var startAngle = i * angleStep - PI / 2;
      var endAngle = startAngle + angleStep;

      // 扇区
      ctx.beginPath();
      ctx.moveTo(cx, cy);
      ctx.arc(cx, cy, r, startAngle, endAngle);
      ctx.closePath();
      ctx.fillStyle = COLORS[i % COLORS.length];
      ctx.fill();
      ctx.strokeStyle = '#fff';
      ctx.lineWidth = 2;
      ctx.stroke();

      // Emoji + 文字
      var midAngle = startAngle + angleStep / 2;
      var textR = r * 0.62;
      var tx = cx + Math.cos(midAngle) * textR;
      var ty = cy + Math.sin(midAngle) * textR;

      ctx.save();
      ctx.translate(tx, ty);
      ctx.fillStyle = '#fff';
      ctx.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';

      var label = items[i].emoji + ' ' + items[i].name;
      if (label.length > 6) label = items[i].emoji + items[i].name.slice(0, 4);
      ctx.fillText(label, 0, 0);
      ctx.restore();
    }
  }

  function spin(canvas, items, onFinish) {
    if (!items || items.length === 0) {
      if (onFinish) onFinish(null);
      return;
    }

    var n = items.length;
    var angleStep = TAU / n;

    // 随机目标扇区
    var targetIndex = Math.floor(Math.random() * n);
    // 多转几圈 + 扇区中间 + 随机偏移
    var extraRounds = 5 + Math.floor(Math.random() * 3);
    var targetAngle = TAU * extraRounds + targetIndex * angleStep + angleStep / 2;
    // 让指针在顶部：顶部是 -PI/2 方向
    targetAngle = targetAngle - PI / 2;

    var startAngle = 0;
    var duration = 3500;
    var startTime = null;

    var prevIndex = -1;

    function easeOut(t) {
      // 自定义缓出：先快后慢
      return 1 - Math.pow(1 - t, 3.5);
    }

    function animate(ts) {
      if (!startTime) startTime = ts;
      var elapsed = ts - startTime;
      var progress = Math.min(elapsed / duration, 1);
      var eased = easeOut(progress);
      var currentAngle = targetAngle * eased;

      // 重绘
      var ctx = canvas.getContext('2d');
      var w = canvas.width;
      var h = canvas.height;
      var cx = w / 2;
      var cy = h / 2;
      var r = w / 2 - 6;

      ctx.clearRect(0, 0, w, h);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.rotate(currentAngle);
      ctx.translate(-cx, -cy);

      for (var i = 0; i < n; i++) {
        var sa = i * angleStep - PI / 2;
        var ea = sa + angleStep;

        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, r, sa, ea);
        ctx.closePath();
        ctx.fillStyle = COLORS[i % COLORS.length];
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 2;
        ctx.stroke();

        var midAngle = sa + angleStep / 2;
        var textR = r * 0.62;
        var tx = cx + Math.cos(midAngle) * textR;
        var ty = cy + Math.sin(midAngle) * textR;

        ctx.fillStyle = '#fff';
        ctx.font = 'bold 11px ' + getComputedStyle(document.body).fontFamily;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        var label = items[i].emoji + ' ' + items[i].name;
        if (label.length > 6) label = items[i].emoji + items[i].name.slice(0, 4);
        ctx.fillText(label, tx, ty);
      }
      ctx.restore();

      // 指针效果：当前在指针下的扇区高亮
      // 指针在顶部(-PI/2)，当前旋转角度为 currentAngle
      // 实际顶部的扇区索引
      var pointerAngle = (-currentAngle % TAU + TAU) % TAU;
      var activeIndex = Math.floor(pointerAngle / angleStep);
      if (activeIndex !== prevIndex && activeIndex >= 0 && activeIndex < n) {
        prevIndex = activeIndex;
      }

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        if (onFinish) onFinish(items[targetIndex]);
      }
    }

    requestAnimationFrame(animate);
  }

  return {
    draw: draw,
    spin: spin
  };
})();
