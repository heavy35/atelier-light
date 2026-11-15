const products = [
  {
    id: "halo", name: "Halo", category: "table", categoryLabel: "Настольный",
    price: 12900, image: "assets/images/table-a.jpg",
    alt: "Белый настольный светильник округлой формы на тумбе",
    description: "Мягкое свечение и простая форма для вечеров, когда хочется приглушить верхний свет.",
    note: "Подойдёт для спальни или тихого уголка гостиной."
  },
  {
    id: "pavilion", name: "Pavilion", category: "floor", categoryLabel: "Напольный",
    price: 24900, image: "assets/images/floor-concrete.jpg",
    alt: "Светильник с деревянными стойками и светящимся корпусом",
    description: "Вертикальная композиция света, дерева и спокойной геометрии.",
    note: "Хорошо смотрится рядом с диваном и в просторной прихожей."
  },
  {
    id: "line", name: "Line", category: "floor", categoryLabel: "Напольный",
    price: 18900, image: "assets/images/floor-minimal.jpg",
    alt: "Чёрный минималистичный напольный светильник у светлой стены",
    description: "Лаконичный силуэт, который даёт комнате направленный свет без лишних деталей.",
    note: "Для чтения, работы и небольших пространств."
  },
  {
    id: "orb", name: "Orb", category: "wall", categoryLabel: "Настенный",
    price: 9900, image: "assets/images/wall-sconce.jpg",
    alt: "Настенный светильник с круглым белым плафоном",
    description: "Небольшой источник света, который добавляет глубину и мягкий акцент стене.",
    note: "Для зоны у кровати или коридора."
  },
  {
    id: "terra", name: "Terra", category: "table", categoryLabel: "Настольный",
    price: 14900, image: "assets/images/wall-a.jpg",
    alt: "Керамический настольный светильник с белым абажуром",
    description: "Тёплая фактура основания и спокойный свет для жилого интерьера.",
    note: "Выразителен даже в выключенном состоянии."
  },
  {
    id: "arc", name: "Arc", category: "pendant", categoryLabel: "Подвесной",
    price: 16900, image: "assets/images/pendant-b.jpg",
    alt: "Тёмный подвесной светильник над обеденным столом",
    description: "Один акцент над столом собирает пространство и задаёт ритм вечернему свету.",
    note: "Для обеденной зоны или кухонного острова."
  },
  {
    id: "duo", name: "Duo", category: "floor", categoryLabel: "Напольный",
    price: 21900, image: "assets/images/floor-pair.jpg",
    alt: "Два тонких напольных светильника на фоне светлой стены",
    description: "Тонкая линия и рассеянное свечение для спокойной жилой комнаты.",
    note: "Лучше всего работает рядом с креслом или диваном."
  },
  {
    id: "ribbon", name: "Ribbon", category: "pendant", categoryLabel: "Подвесной",
    price: 27900, image: "assets/images/pendant-a.jpg",
    alt: "Группа подвесных светильников с лёгкими волнистыми плафонами",
    description: "Группа светящихся форм для интерьера, которому нужен выразительный верхний свет.",
    note: "Для просторной гостиной или большой обеденной зоны."
  }
];

const productById = new Map(products.map(product => [product.id, product]));
const formatPrice = value => new Intl.NumberFormat("ru-RU").format(value) + " ₽";
const $ = selector => document.querySelector(selector);
const grid = $("#product-grid");
const filterGroup = $("#filters");
const searchInput = $("#catalog-search");
const sortInput = $("#catalog-sort");
const productDialog = $("#product-dialog");
const cartDialog = $("#cart-dialog");
const checkoutDialog = $("#checkout-dialog");
const originalCheckoutBody = $("#checkout-body").innerHTML;
let activeCategory = "all";
let cart = loadCart();
let toastTimer;
const useReveals = "IntersectionObserver" in window && !matchMedia("(prefers-reduced-motion: reduce)").matches;
const revealObserver = useReveals ? new IntersectionObserver(entries => {
  entries.forEach(entry => entry.target.classList.toggle("is-visible", entry.isIntersecting));
}, { threshold: 0.08, rootMargin: "0px 0px -32px 0px" }) : null;

function prepareReveals() {
  if (!useReveals) return;
  document.documentElement.classList.add("reveal-ready");
  document.querySelectorAll(".section-head, .product-card, .story-copy, .closing-layout").forEach(element => {
    revealObserver.observe(element);
  });
}

function loadCart() {
  try {
    const saved = JSON.parse(localStorage.getItem("atelier-light-cart") || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([id, quantity]) =>
      productById.has(id) && Number.isInteger(quantity) && quantity > 0 && quantity <= 99
    ));
  } catch {
    return {};
  }
}

function saveCart() {
  try { localStorage.setItem("atelier-light-cart", JSON.stringify(cart)); } catch {}
  updateCartCount();
}

function updateCartCount() {
  const count = Object.values(cart).reduce((sum, quantity) => sum + quantity, 0);
  $("#cart-count").textContent = count;
  $("#open-cart").setAttribute("aria-label", `Открыть корзину, товаров: ${count}`);
}

function pluralize(count) {
  if (count % 10 === 1 && count % 100 !== 11) return "предмет";
  if ([2, 3, 4].includes(count % 10) && ![12, 13, 14].includes(count % 100)) return "предмета";
  return "предметов";
}

function renderCatalog() {
  const query = searchInput.value.trim().toLocaleLowerCase("ru");
  let list = products.filter(product =>
    (activeCategory === "all" || product.category === activeCategory) &&
    (!query || `${product.name} ${product.categoryLabel} ${product.description}`.toLocaleLowerCase("ru").includes(query))
  );
  if (sortInput.value === "price-asc") list.sort((a, b) => a.price - b.price);
  if (sortInput.value === "price-desc") list.sort((a, b) => b.price - a.price);
  if (sortInput.value === "name") list.sort((a, b) => a.name.localeCompare(b.name, "ru"));
  grid.innerHTML = list.map(product => `
    <article class="product-card">
      <button class="product-photo" type="button" data-detail="${product.id}" aria-label="Подробнее о светильнике ${product.name}">
        <img src="${product.image}" alt="${product.alt}" loading="lazy" width="700" height="784">
        <span class="photo-arrow" aria-hidden="true">↗</span>
      </button>
      <div class="product-meta"><span>${product.categoryLabel}</span><span>ATELIER LIGHT</span></div>
      <h3 class="product-name">${product.name}</h3>
      <div class="product-bottom"><span class="product-price">${formatPrice(product.price)}</span>
        <button class="add-button" type="button" data-add="${product.id}" aria-label="Добавить ${product.name} в корзину">В корзину</button>
      </div>
    </article>`).join("");
  $("#catalog-total").textContent = `${list.length} ${pluralize(list.length)}`;
  $("#empty-results").hidden = list.length !== 0;
  prepareReveals();
}

function openDialog(dialog) {
  dialog.showModal();
  document.body.classList.add("modal-open");
}

function closeDialog(dialog) {
  dialog.close();
}

function openProduct(id) {
  const product = productById.get(id);
  if (!product) return;
  $("#product-dialog-content").innerHTML = `
    <div class="detail-photo"><img src="${product.image}" alt="${product.alt}" width="700" height="780"></div>
    <div class="detail-copy">
      <span class="detail-category">${product.categoryLabel} светильник</span>
      <h2 id="product-dialog-title">${product.name}</h2>
      <p>${product.description}</p>
      <p class="detail-note">${product.note}</p>
      <div class="detail-actions"><span class="product-price">${formatPrice(product.price)}</span>
        <button class="button button-dark" type="button" data-add="${product.id}">Добавить в корзину <span aria-hidden="true">↗</span></button>
      </div>
    </div>`;
  openDialog(productDialog);
}

function showToast(message) {
  const toast = $("#toast");
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("show"), 3000);
}

function addToCart(id) {
  const product = productById.get(id);
  if (!product) return;
  cart[id] = Math.min(99, (cart[id] || 0) + 1);
  saveCart();
  if (productDialog.open) closeDialog(productDialog);
  if (cartDialog.open) renderCart();
  showToast(`${product.name} добавлен в корзину`);
}

function cartTotal() {
  return Object.entries(cart).reduce((sum, [id, quantity]) => sum + productById.get(id).price * quantity, 0);
}

function renderCart() {
  const entries = Object.entries(cart);
  $("#cart-items").innerHTML = entries.length ? entries.map(([id, quantity]) => {
    const product = productById.get(id);
    return `<div class="cart-item">
      <img src="${product.image}" alt="" width="90" height="112">
      <div><p class="cart-item-title">${product.name}</p><span class="cart-item-price">${formatPrice(product.price)}</span>
      <div class="cart-item-bottom">
        <div class="qty-controls" aria-label="Количество ${product.name}">
          <button type="button" data-decrease="${id}" aria-label="Уменьшить количество ${product.name}">−</button>
          <span>${quantity}</span>
          <button type="button" data-increase="${id}" aria-label="Увеличить количество ${product.name}">+</button>
        </div>
        <button type="button" class="remove-item" data-remove="${id}">Убрать</button>
      </div></div></div>`;
  }).join("") : `<div class="cart-empty"><h3>Пока пусто</h3><p>Выберите светильник в коллекции — он появится здесь.</p><button type="button" class="text-button" id="continue-shopping">Смотреть коллекцию</button></div>`;
  $("#cart-footer").innerHTML = entries.length ? `
    <div class="cart-total"><span>Итого</span><span>${formatPrice(cartTotal())}</span></div>
    <button type="button" class="button button-dark" id="start-checkout">Оформить демозаказ <span aria-hidden="true">↗</span></button>
    <p class="cart-footnote">Оплата и доставка не выполняются</p>` : "";
}

function openCart() {
  renderCart();
  openDialog(cartDialog);
}

function openCheckout() {
  if (!Object.keys(cart).length) return;
  closeDialog(cartDialog);
  $("#checkout-body").innerHTML = originalCheckoutBody;
  $("#checkout-total").textContent = formatPrice(cartTotal());
  openDialog(checkoutDialog);
}

filterGroup.addEventListener("click", event => {
  const button = event.target.closest("[data-filter]");
  if (!button) return;
  activeCategory = button.dataset.filter;
  filterGroup.querySelectorAll("[data-filter]").forEach(item => {
    const active = item === button;
    item.classList.toggle("active", active);
    item.setAttribute("aria-pressed", String(active));
  });
  renderCatalog();
});
searchInput.addEventListener("input", renderCatalog);
sortInput.addEventListener("change", renderCatalog);
$("#reset-filters").addEventListener("click", () => {
  searchInput.value = "";
  filterGroup.querySelector('[data-filter="all"]').click();
});
grid.addEventListener("click", event => {
  const detail = event.target.closest("[data-detail]");
  const add = event.target.closest("[data-add]");
  if (detail) openProduct(detail.dataset.detail);
  if (add) addToCart(add.dataset.add);
});
productDialog.addEventListener("click", event => {
  const add = event.target.closest("[data-add]");
  if (add) addToCart(add.dataset.add);
});
$("#open-cart").addEventListener("click", openCart);
$("#close-product").addEventListener("click", () => closeDialog(productDialog));
$("#close-cart").addEventListener("click", () => closeDialog(cartDialog));
$("#close-checkout").addEventListener("click", () => closeDialog(checkoutDialog));
$("#cart-dialog").addEventListener("click", event => {
  const id = event.target.dataset.increase || event.target.dataset.decrease || event.target.dataset.remove;
  if (id) {
    if (event.target.dataset.increase) cart[id] = Math.min(99, cart[id] + 1);
    if (event.target.dataset.decrease) cart[id] = Math.max(0, cart[id] - 1);
    if (event.target.dataset.remove) cart[id] = 0;
    if (cart[id] === 0) delete cart[id];
    saveCart();
    renderCart();
  }
  if (event.target.closest("#continue-shopping")) {
    closeDialog(cartDialog);
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  }
  if (event.target.closest("#start-checkout")) openCheckout();
});
checkoutDialog.addEventListener("submit", event => {
  if (event.target.id !== "checkout-form") return;
  event.preventDefault();
  cart = {};
  saveCart();
  $("#checkout-body").innerHTML = `
    <div class="success-message"><span class="drawer-overline">Готово</span>
      <h2 id="checkout-title">Демозаказ оформлен</h2>
      <p>Вы прошли весь путь покупки. Никакие данные не были отправлены, а оплата не проводилась.</p>
      <button type="button" class="button button-dark" id="finish-checkout">Вернуться к коллекции <span aria-hidden="true">↗</span></button>
    </div>`;
});
checkoutDialog.addEventListener("click", event => {
  if (event.target.closest("#finish-checkout")) {
    closeDialog(checkoutDialog);
    $("#catalog").scrollIntoView({ behavior: "smooth" });
  }
});
[productDialog, cartDialog, checkoutDialog].forEach(dialog => {
  dialog.addEventListener("close", () => {
    if (![productDialog, cartDialog, checkoutDialog].some(item => item.open)) document.body.classList.remove("modal-open");
  });
  dialog.addEventListener("click", event => {
    if (event.target === dialog) closeDialog(dialog);
  });
});

renderCatalog();
updateCartCount();
