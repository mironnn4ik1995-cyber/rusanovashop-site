// Анимация появления элементов при прокрутке страницы
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.15 });
  revealEls.forEach(el => observer.observe(el));
}

// Простая «корзина» и «аккаунт» на localStorage — для демонстрации без бэкенда

function getCart() {
  return JSON.parse(localStorage.getItem('rusanova_cart') || '[]');
}
function saveCart(cart) {
  localStorage.setItem('rusanova_cart', JSON.stringify(cart));
}
function getUser() {
  return JSON.parse(localStorage.getItem('rusanova_user') || 'null');
}

// Счётчик товаров в корзине — обновляется в шапке на всех страницах
function renderCartCount() {
  const countEl = document.getElementById('cart-count');
  if (countEl) countEl.textContent = getCart().length;
}
renderCartCount();

// Добавление в корзину с каталога
document.querySelectorAll('.add-to-cart').forEach(btn => {
  btn.addEventListener('click', () => {
    const cart = getCart();
    cart.push({ name: btn.dataset.name, price: Number(btn.dataset.price) });
    saveCart(cart);
    renderCartCount();
    btn.textContent = 'Добавлено ✓';
    setTimeout(() => { btn.textContent = 'В корзину'; }, 1200);
  });
});

// Фильтр по категориям и сортировка по цене в каталоге
const productGrid = document.getElementById('product-grid');
if (productGrid) {
  const cards = Array.from(productGrid.querySelectorAll('.product-card'));
  const filterBtns = document.querySelectorAll('.filter-btn');
  const sortSelect = document.getElementById('sort-select');
  let activeFilter = 'all';

  function applyFilterAndSort() {
    cards.forEach(card => {
      const matches = activeFilter === 'all' || card.dataset.category === activeFilter;
      card.classList.toggle('is-hidden', !matches);
    });
    const sortValue = sortSelect ? sortSelect.value : 'default';
    const ordered = sortValue === 'default'
      ? cards
      : [...cards].sort((a, b) => {
          const diff = Number(a.dataset.basePrice) - Number(b.dataset.basePrice);
          return sortValue === 'asc' ? diff : -diff;
        });
    ordered.forEach(card => productGrid.appendChild(card));
  }

  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      activeFilter = btn.dataset.filter;
      applyFilterAndSort();
    });
  });
  sortSelect?.addEventListener('change', applyFilterAndSort);
}

// Подписка на рассылку
const newsletterForm = document.getElementById('newsletter-form');
if (newsletterForm) {
  newsletterForm.addEventListener('submit', e => {
    e.preventDefault();
    const emailInput = document.getElementById('newsletter-email');
    const email = emailInput.value.trim();
    if (!email) return;
    const subscribers = JSON.parse(localStorage.getItem('rusanova_subscribers') || '[]');
    if (!subscribers.includes(email)) {
      subscribers.push(email);
      localStorage.setItem('rusanova_subscribers', JSON.stringify(subscribers));
    }
    document.getElementById('newsletter-msg').textContent = 'Спасибо! Вы подписаны на рассылку RUSANOVAshop.';
    newsletterForm.reset();
  });
}

// Переключатель вкладок «Вход / Регистрация»
document.querySelectorAll('.form-tab').forEach(tab => {
  tab.addEventListener('click', () => {
    document.querySelectorAll('.form-tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.form-panel').forEach(p => p.classList.remove('active'));
    tab.classList.add('active');
    document.getElementById(tab.dataset.target).classList.add('active');
  });
});

// Регистрация
const registerForm = document.getElementById('register-form');
if (registerForm) {
  registerForm.addEventListener('submit', e => {
    e.preventDefault();
    const name = document.getElementById('reg-name').value.trim();
    const email = document.getElementById('reg-email').value.trim();
    const password = document.getElementById('reg-password').value;
    if (!name || !email || password.length < 4) {
      document.getElementById('register-msg').textContent = 'Заполните все поля (пароль — от 4 символов).';
      return;
    }
    localStorage.setItem('rusanova_user', JSON.stringify({ name, email }));
    window.location.href = 'cabinet.html';
  });
}

// Вход
const loginForm = document.getElementById('login-form');
if (loginForm) {
  loginForm.addEventListener('submit', e => {
    e.preventDefault();
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value;
    if (!email || !password) {
      document.getElementById('login-msg').textContent = 'Введите e-mail и пароль.';
      return;
    }
    const existing = getUser();
    const name = (existing && existing.email === email) ? existing.name : email.split('@')[0];
    localStorage.setItem('rusanova_user', JSON.stringify({ name, email }));
    window.location.href = 'cabinet.html';
  });
}

// Этапы статуса заказа — отображаются в личном кабинете в виде трекера
const ORDER_STAGES = ['Оформлен', 'Оплачен', 'Упакован', 'В пути', 'Получен'];

// Личный кабинет (заполняется, только если пользователь авторизован — видимость переключает inline-скрипт в cabinet.html)
const accountBlock = document.getElementById('account-block');
if (accountBlock) {
  const user = getUser();
  if (user) {
    document.getElementById('account-name').textContent = user.name;
    document.getElementById('account-email').textContent = user.email;

    const orders = JSON.parse(localStorage.getItem('rusanova_orders') || '[]');
    const ordersBlock = document.getElementById('orders-list');
    if (orders.length === 0) {
      ordersBlock.innerHTML = '<p class="empty-note">Заказов пока нет — оформите первый в каталоге.</p>';
    } else {
      ordersBlock.innerHTML = orders.map((o, i) => {
        const stageIndex = Math.max(ORDER_STAGES.indexOf(o.status), 0);
        const tracker = ORDER_STAGES.map((stage, si) => {
          const cls = si < stageIndex ? 'done' : (si === stageIndex ? 'current' : '');
          return `<li class="${cls}"><span>${stage}</span></li>`;
        }).join('');
        return `<div class="order-row">
          <div class="order-row-head"><span>Заказ №${i + 1} · ${o.items.length} товар(а)</span><span>${o.total.toLocaleString('ru-RU')} ₽</span></div>
          <ol class="order-tracker">${tracker}</ol>
        </div>`;
      }).join('');
    }
  }

  document.getElementById('logout-btn')?.addEventListener('click', () => {
    localStorage.removeItem('rusanova_user');
    window.location.href = 'index.html';
  });
}

// Страница оплаты
const paySummary = document.getElementById('pay-summary');
if (paySummary) {
  const payForm = document.getElementById('pay-form');

  function renderPaySummary() {
    const cart = getCart();
    if (cart.length === 0) {
      paySummary.innerHTML = '<p class="empty-note">Корзина пуста. Добавьте товары в каталоге.</p>';
      payForm.style.display = 'none';
      return;
    }
    payForm.style.display = '';
    const total = cart.reduce((s, i) => s + i.price, 0);
    paySummary.innerHTML = cart.map((i, idx) =>
      `<div class="summary-row"><span>${i.name}</span><span>${i.price.toLocaleString('ru-RU')} ₽ <button type="button" class="remove-item" data-index="${idx}" aria-label="Удалить «${i.name}» из корзины">✕</button></span></div>`
    ).join('') + `<div class="summary-row total"><span>Итого</span><span>${total.toLocaleString('ru-RU')} ₽</span></div>`;

    paySummary.querySelectorAll('.remove-item').forEach(btn => {
      btn.addEventListener('click', () => {
        const updated = getCart();
        updated.splice(Number(btn.dataset.index), 1);
        saveCart(updated);
        renderCartCount();
        renderPaySummary();
      });
    });
  }

  renderPaySummary();

  payForm.addEventListener('submit', e => {
    e.preventDefault();
    const cart = getCart();
    if (cart.length === 0) return;
    const total = cart.reduce((s, i) => s + i.price, 0);
    const orders = JSON.parse(localStorage.getItem('rusanova_orders') || '[]');
    orders.push({ items: cart, total, status: 'Оплачен' });
    localStorage.setItem('rusanova_orders', JSON.stringify(orders));
    saveCart([]);
    renderCartCount();
    document.getElementById('pay-msg').textContent = 'Оплата прошла успешно! Заказ оформлен и появится в личном кабинете.';
    payForm.reset();
    payForm.querySelector('button').disabled = true;
    renderPaySummary();
  });
}
