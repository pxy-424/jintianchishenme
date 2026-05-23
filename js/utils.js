/**
 * 工具函数
 */
var Utils = (function () {
  'use strict';

  function uuid() {
    return 'xxxx-xxxx-xxxx'.replace(/x/g, function () {
      return Math.floor(Math.random() * 16).toString(16);
    });
  }

  function today() {
    var d = new Date();
    return new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  }

  function daysAgo(n) {
    return today() - n * 86400000;
  }

  function formatDate(ts) {
    var d = new Date(ts);
    var m = d.getMonth() + 1;
    var day = d.getDate();
    return d.getFullYear() + '-' + (m < 10 ? '0' + m : m) + '-' + (day < 10 ? '0' + day : day);
  }

  function formatTime(ts) {
    var d = new Date(ts);
    var h = d.getHours();
    var min = d.getMinutes();
    return (h < 10 ? '0' + h : h) + ':' + (min < 10 ? '0' + min : min);
  }

  function getWeekStart() {
    var d = new Date();
    var day = d.getDay();
    var diff = d.getDate() - day + (day === 0 ? -6 : 1);
    return new Date(d.getFullYear(), d.getMonth(), diff).getTime();
  }

  // 当月天数
  function daysInMonth(year, month) {
    return new Date(year, month + 1, 0).getDate();
  }

  // 当月第一天是星期几 (0=日)
  function firstDayOfMonth(year, month) {
    return new Date(year, month, 1).getDay();
  }

  return {
    uuid: uuid,
    today: today,
    daysAgo: daysAgo,
    formatDate: formatDate,
    formatTime: formatTime,
    getWeekStart: getWeekStart,
    daysInMonth: daysInMonth,
    firstDayOfMonth: firstDayOfMonth
  };
})();
