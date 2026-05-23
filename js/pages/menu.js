/**
 * 菜单管理页
 */
var MenuPage = (function () {
  'use strict';

  var currentFilter = 'all';
  var searchQuery = '';

  var COMMON_EMOJIS = ['🍖','🍜','🥗','🍕','🍔','🍣','🍳','🥘','🍅','🐔','🥞','🍲','🍝','🥟','🍱','🍛','🍩','🥩','🍤','🧆','🫕','🍿','🥨','🥪','🌮','🍙','🍚','🍢','🍡','🍧','🍦','🥧','🍰','🎂','☕','🍵','🥤','🧋'];

  function renderMenu() {
    var items = Store.getItems();
    var categories = Store.getCategories();
    var grid = document.getElementById('menu-grid');
    var empty = document.getElementById('menu-empty');

    // 筛选
    var filtered = items.filter(function (item) {
      if (currentFilter !== 'all' && item.categoryId !== currentFilter) return false;
      if (searchQuery && item.name.indexOf(searchQuery) === -1) return false;
      return true;
    });

    if (filtered.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
    } else {
      empty.style.display = 'none';
      grid.innerHTML = filtered.map(function (item) {
        var cat = categories.find(function (c) { return c.id === item.categoryId; });
        var catName = cat ? cat.name : '未分类';
        var tagsHtml = (item.tags || []).map(function (t) {
          return '<span class="tag">' + escHtml(t) + '</span>';
        }).join('');
        return '<div class="menu-card" data-id="' + item.id + '">' +
          '<div class="menu-emoji">' + item.emoji + '</div>' +
          '<div class="menu-name">' + escHtml(item.name) + '</div>' +
          '<div class="menu-tags">' + tagsHtml + '<span class="tag tag-green">' + escHtml(catName) + '</span></div>' +
        '</div>';
      }).join('');
    }

    // 绑定点击
    grid.querySelectorAll('.menu-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var id = card.getAttribute('data-id');
        openEditor(id);
      });
    });
  }

  function renderCategories() {
    var categories = Store.getCategories();
    var scroll = document.getElementById('category-scroll');
    scroll.innerHTML = '<button class="category-pill active" data-category="all">全部</button>' +
      categories.map(function (c) {
        return '<button class="category-pill" data-category="' + c.id + '">' + c.icon + ' ' + escHtml(c.name) + '</button>';
      }).join('') +
      '<button class="category-pill" id="btn-add-category" style="font-size:1.25rem;">+</button>';

    // 恢复选中状态
    var active = scroll.querySelector('[data-category="' + currentFilter + '"]');
    if (active) active.classList.add('active');

    scroll.querySelectorAll('.category-pill').forEach(function (pill) {
      if (pill.id === 'btn-add-category') {
        pill.addEventListener('click', openCategoryEditor);
        return;
      }
      pill.addEventListener('click', function () {
        currentFilter = pill.getAttribute('data-category');
        scroll.querySelectorAll('.category-pill').forEach(function (p) { p.classList.remove('active'); });
        pill.classList.add('active');
        renderMenu();
      });
    });
  }

  function openEditor(id) {
    var modal = document.getElementById('food-modal');
    var title = document.getElementById('food-modal-title');
    var editId = document.getElementById('food-edit-id');
    var nameInput = document.getElementById('food-name');
    var emojiInput = document.getElementById('food-emoji');
    var tagsInput = document.getElementById('food-tags');
    var catSelect = document.getElementById('food-category');
    var deleteBtn = document.getElementById('btn-food-delete');

    // 填充分类下拉
    var categories = Store.getCategories();
    catSelect.innerHTML = '<option value="">未分类</option>' +
      categories.map(function (c) { return '<option value="' + c.id + '">' + c.icon + ' ' + c.name + '</option>'; }).join('');

    if (id) {
      var item = Store.getItems().find(function (it) { return it.id === id; });
      if (!item) return;
      title.textContent = '编辑菜品';
      editId.value = item.id;
      nameInput.value = item.name;
      emojiInput.value = item.emoji;
      tagsInput.value = (item.tags || []).join(', ');
      catSelect.value = item.categoryId || '';
      deleteBtn.style.display = 'block';
    } else {
      title.textContent = '添加菜品';
      editId.value = '';
      nameInput.value = '';
      emojiInput.value = '';
      tagsInput.value = '';
      catSelect.value = '';
      deleteBtn.style.display = 'none';
    }

    buildEmojiPicker();
    modal.style.display = 'flex';
    nameInput.focus();
  }

  function buildEmojiPicker() {
    var picker = document.getElementById('emoji-picker');
    picker.innerHTML = COMMON_EMOJIS.map(function (e) {
      return '<button class="emoji-opt" style="font-size:1.5rem;padding:4px;border-radius:8px;background:var(--color-cream);cursor:pointer;border:none;line-height:1;">' + e + '</button>';
    }).join('');

    picker.querySelectorAll('.emoji-opt').forEach(function (btn) {
      btn.addEventListener('click', function () {
        document.getElementById('food-emoji').value = btn.textContent;
        picker.querySelectorAll('.emoji-opt').forEach(function (b) { b.style.background = 'var(--color-cream)'; });
        btn.style.background = 'var(--color-primary)';
      });
    });
  }

  function saveFood() {
    var id = document.getElementById('food-edit-id').value;
    var name = document.getElementById('food-name').value.trim();
    var emoji = document.getElementById('food-emoji').value.trim() || '🍽️';
    var tagsStr = document.getElementById('food-tags').value.trim();
    var categoryId = document.getElementById('food-category').value;
    var tags = tagsStr ? tagsStr.split(/[,，]/).map(function (t) { return t.trim(); }).filter(Boolean) : [];

    if (!name) {
      document.getElementById('food-name').style.borderColor = 'var(--color-red)';
      return;
    }

    if (id) {
      Store.updateItem(id, { name: name, emoji: emoji, tags: tags, categoryId: categoryId });
    } else {
      Store.addItem({
        id: Utils.uuid(),
        name: name,
        emoji: emoji,
        tags: tags,
        categoryId: categoryId,
        createdAt: Date.now()
      });
    }

    closeFoodModal();
    renderAll();
  }

  function deleteFood() {
    var id = document.getElementById('food-edit-id').value;
    if (!id) return;
    showConfirm('确定要删除这道菜吗？', function () {
      Store.deleteItem(id);
      closeFoodModal();
      renderAll();
    });
  }

  function closeFoodModal() {
    document.getElementById('food-modal').style.display = 'none';
    document.getElementById('food-name').style.borderColor = '';
  }

  // 分类编辑
  function openCategoryEditor() {
    document.getElementById('cat-modal-title').textContent = '新建分类';
    document.getElementById('cat-edit-id').value = '';
    document.getElementById('cat-icon').value = '';
    document.getElementById('cat-name').value = '';
    document.getElementById('cat-modal').style.display = 'flex';
  }

  function saveCategory() {
    var name = document.getElementById('cat-name').value.trim();
    var icon = document.getElementById('cat-icon').value.trim() || '📁';
    if (!name) return;

    var cats = Store.getCategories();
    Store.addCategory({
      id: 'cat-' + Utils.uuid().slice(0, 6),
      name: name,
      icon: icon,
      sortOrder: cats.length
    });

    closeCatModal();
    renderAll();
  }

  function closeCatModal() {
    document.getElementById('cat-modal').style.display = 'none';
  }

  function escHtml(s) {
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  // === 确认弹窗 ===
  function showConfirm(msg, onOk) {
    document.getElementById('confirm-msg').textContent = msg;
    document.getElementById('confirm-modal').style.display = 'flex';
    document.getElementById('btn-confirm-ok').onclick = function () {
      document.getElementById('confirm-modal').style.display = 'none';
      if (onOk) onOk();
    };
  }

  function renderAll() {
    renderCategories();
    renderMenu();
    // 通知首页更新转盘
    if (typeof HomePage !== 'undefined' && HomePage.refresh) HomePage.refresh();
  }

  function init() {
    renderAll();

    document.getElementById('btn-add-food').onclick = function () { openEditor(null); };
    document.getElementById('btn-food-save').onclick = saveFood;
    document.getElementById('btn-food-cancel').onclick = closeFoodModal;
    document.getElementById('btn-food-delete').onclick = deleteFood;
    document.getElementById('btn-cat-save').onclick = saveCategory;
    document.getElementById('btn-cat-cancel').onclick = closeCatModal;
    document.getElementById('btn-confirm-cancel').onclick = function () {
      document.getElementById('confirm-modal').style.display = 'none';
    };

    document.getElementById('menu-search').addEventListener('input', function () {
      searchQuery = this.value.trim();
      renderMenu();
    });

    // 点击弹窗遮罩关闭
    document.getElementById('food-modal').addEventListener('click', function (e) {
      if (e.target === this) closeFoodModal();
    });
    document.getElementById('cat-modal').addEventListener('click', function (e) {
      if (e.target === this) closeCatModal();
    });
    document.getElementById('confirm-modal').addEventListener('click', function (e) {
      if (e.target === this) { document.getElementById('confirm-modal').style.display = 'none'; }
    });

    // Enter 保存
    document.getElementById('food-name').addEventListener('keydown', function (e) {
      if (e.key === 'Enter') saveFood();
    });
  }

  return {
    init: init,
    refresh: renderAll
  };
})();
