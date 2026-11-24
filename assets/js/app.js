// Shopping_Glue — Dark Streetwear E-Commerce Engine
// Data source: /data/store.json | Cart: localStorage | Checkout: WhatsApp

const CART_KEY = "shopping_glue_cart_v1";

// 4-System Shoe Sizing Chart (Keyed by IND / UK base size)
const SHOE_SIZE_MAP = {
  "5":  { ind: "5",  uk: "5",  eu: "39", us: "6",  cm: "23.8" },
  "6":  { ind: "6",  uk: "6",  eu: "40", us: "7",  cm: "24.5" },
  "7":  { ind: "7",  uk: "7",  eu: "41", us: "8",  cm: "25.5" },
  "8":  { ind: "8",  uk: "8",  eu: "42", us: "9",  cm: "26.3" },
  "9":  { ind: "9",  uk: "9",  eu: "43", us: "10", cm: "27.1" },
  "10": { ind: "10", uk: "10", eu: "44", us: "11", cm: "28.0" },
  "11": { ind: "11", uk: "11", eu: "45", us: "12", cm: "28.8" },
  "12": { ind: "12", uk: "12", eu: "46", us: "13", cm: "29.6" }
};

let STORE = null;

function formatINR(amount) {
  return "₹" + Number(amount || 0).toLocaleString("en-IN");
}

function getShoeSizeInfo(baseSize) {
  const key = String(baseSize).replace(/[^0-9.]/g, "");
  return SHOE_SIZE_MAP[key] || { ind: baseSize, uk: baseSize, eu: baseSize, us: baseSize, cm: "-" };
}

function formatShoeEquivalent(baseSize) {
  const s = getShoeSizeInfo(baseSize);
  return `IND ${s.ind} / UK ${s.uk} / EU ${s.eu} / US ${s.us}`;
}

function normalizeImages(product) {
  if (!product.images || !product.images.length) {
    return ["/assets/uploads/sample-tee-flame.svg"];
  }
  return product.images.map(item => (typeof item === "string" ? item : item.image)).filter(Boolean);
}

function escapeHTML(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// Cart Management
function getCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY)) || [];
  } catch {
    return [];
  }
}

function saveCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCartBadges();
}

function updateCartBadges() {
  const count = getCart().reduce((sum, item) => sum + item.qty, 0);
  document.querySelectorAll("[data-cart-count]").forEach(el => {
    el.textContent = count;
  });
}

function addToCart(entry) {
  const cart = getCart();
  const idx = cart.findIndex(
    i => i.id === entry.id && i.size === entry.size && i.color === entry.color
  );
  if (idx > -1) {
    cart[idx].qty += entry.qty;
  } else {
    cart.push(entry);
  }
  saveCart(cart);
  showToast(`Added "${entry.name}" to your bag!`);
}

function showToast(message) {
  let toast = document.getElementById("sg-toast");
  if (!toast) {
    toast = document.createElement("div");
    toast.id = "sg-toast";
    toast.className = "toast";
    document.body.appendChild(toast);
  }
  toast.textContent = message;
  toast.classList.add("show");
  clearTimeout(window.__sgToastTimer);
  window.__sgToastTimer = setTimeout(() => toast.classList.remove("show"), 2600);
}

// Shared Store Loader
async function loadStore() {
  if (STORE) return STORE;
  const res = await fetch("/data/store.json?v=" + Date.now());
  if (!res.ok) throw new Error("Could not load store.json");
  STORE = await res.json();
  applyGlobalSettings(STORE.settings);
  return STORE;
}

function applyGlobalSettings(settings) {
  if (!settings) return;
  const ann = document.getElementById("announcement-text");
  if (ann && settings.announcement_bar) ann.textContent = settings.announcement_bar;

  document.querySelectorAll("[data-store-email]").forEach(el => {
    el.textContent = settings.email;
    if (el.tagName === "A") el.href = "mailto:" + settings.email;
  });

  document.querySelectorAll("[data-store-wa]").forEach(el => {
    const clean = (settings.whatsapp_number || "919856701460").replace(/[^0-9]/g, "");
    if (el.tagName === "A") el.href = "https://wa.me/" + clean;
  });

  if (settings.socials) {
    document.querySelectorAll("[data-social-yt]").forEach(el => (el.href = settings.socials.youtube));
    document.querySelectorAll("[data-social-ig]").forEach(el => (el.href = settings.socials.instagram));
    document.querySelectorAll("[data-social-fb]").forEach(el => (el.href = settings.socials.facebook));
  }
}

// Mobile Menu Init
function initNav() {
  updateCartBadges();
  const btn = document.getElementById("mobile-toggle");
  const menu = document.getElementById("mobile-menu");
  if (btn && menu) {
    btn.addEventListener("click", () => {
      menu.classList.toggle("open");
    });
  }
}

// Product Card Renderer
function renderProductCard(product) {
  const imgs = normalizeImages(product);
  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;
  const swatches = (product.colors || [])
    .slice(0, 4)
    .map(c => `<span class="swatch-dot" title="${escapeHTML(c.name)}" style="background:${escapeHTML(c.hex)}"></span>`)
    .join("");

  let badgesHTML = "";
  if (!product.in_stock) {
    badgesHTML += `<span class="badge-pill badge-soldout">SOLD OUT</span>`;
  } else if (product.badge && product.badge !== "None") {
    badgesHTML += `<span class="badge-pill badge-flame">${escapeHTML(product.badge)}</span>`;
  }
  if (discount > 0) {
    badgesHTML += `<span class="badge-pill badge-dark">-${discount}%</span>`;
  }

  return `
    <a class="product-card" href="/product.html?id=${encodeURIComponent(product.id)}">
      <div class="product-img-wrap">
        <img src="${escapeHTML(imgs[0])}" alt="${escapeHTML(product.name)}" loading="lazy" />
        <div class="card-badges">${badgesHTML}</div>
      </div>
      <div class="product-body">
        <div class="product-meta">
          <span>${escapeHTML(product.sub_tag || product.category)}</span>
          <span>${escapeHTML(product.category)}</span>
        </div>
        <h3 class="product-title">${escapeHTML(product.name)}</h3>
        <div class="swatch-row">${swatches}</div>
        <div class="product-footer">
          <div class="price-block">
            <span class="price-now">${formatINR(product.price)}</span>
            ${product.mrp && product.mrp > product.price ? `<span class="price-mrp">${formatINR(product.mrp)}</span>` : ""}
          </div>
          <span class="view-pill">${product.in_stock ? "Select Fit" : "Sold Out"}</span>
        </div>
      </div>
    </a>
  `;
}

// ============================================================
// HOME PAGE
// ============================================================
async function initHomePage() {
  const store = await loadStore();
  const s = store.settings;

  const badgeEl = document.getElementById("hero-badge");
  const titleEl = document.getElementById("hero-title");
  const subEl = document.getElementById("hero-subtitle");
  const exchangeEl = document.getElementById("hero-exchange");
  const codEl = document.getElementById("hero-cod-fee");

  if (badgeEl) badgeEl.textContent = s.hero_badge;
  if (titleEl) {
    const words = s.hero_title.split(" ");
    const splitAt = Math.max(1, Math.floor(words.length / 2));
    titleEl.innerHTML = `${escapeHTML(words.slice(0, splitAt).join(" "))} <span class="flame-text">${escapeHTML(words.slice(splitAt).join(" "))}</span>`;
  }
  if (subEl) subEl.textContent = s.hero_subtitle;
  if (exchangeEl) exchangeEl.textContent = s.exchange_badge;
  if (codEl) codEl.textContent = `COD (+₹${s.cod_fee}) & UPI (₹0)`;

  const featuredContainer = document.getElementById("featured-grid");
  if (featuredContainer) {
    const featured = store.products.filter(p => p.featured);
    const list = featured.length ? featured : store.products.slice(0, 4);
    featuredContainer.innerHTML = list.map(renderProductCard).join("");
  }

  const latestContainer = document.getElementById("latest-grid");
  if (latestContainer) {
    latestContainer.innerHTML = store.products.slice(0, 6).map(renderProductCard).join("");
  }
}

// ============================================================
// SHOP PAGE (Main Category + CMS Sub-Tags + Size + Sort + Search)
// ============================================================
async function initShopPage() {
  const store = await loadStore();
  const params = new URLSearchParams(window.location.search);

  let state = {
    category: params.get("category") || "All",
    subTag: params.get("tag") || "All",
    size: "All",
    sort: "featured",
    search: ""
  };

  const catTabs = document.querySelectorAll("[data-cat-tab]");
  const subtagBar = document.getElementById("subtag-bar");
  const sizeSelect = document.getElementById("size-filter");
  const sortSelect = document.getElementById("sort-filter");
  const searchInput = document.getElementById("search-input");
  const grid = document.getElementById("shop-grid");
  const countLabel = document.getElementById("result-count");

  function renderSubTags() {
    const allTags = store.sub_tags || [];
    const visibleTags = state.category === "All"
      ? allTags
      : allTags.filter(t => t.category.toLowerCase() === state.category.toLowerCase());

    if (state.subTag !== "All" && !visibleTags.some(t => t.name === state.subTag)) {
      state.subTag = "All";
    }

    const pills = [
      `<button class="subtag-pill ${state.subTag === "All" ? "active" : ""}" data-subtag="All">All Styles</button>`,
      ...visibleTags.map(t =>
        `<button class="subtag-pill ${state.subTag === t.name ? "active" : ""}" data-subtag="${escapeHTML(t.name)}">${escapeHTML(t.name)}</button>`
      )
    ];

    subtagBar.innerHTML = `<span class="subtag-label">Streetwear Tags:</span>` + pills.join("");

    subtagBar.querySelectorAll("[data-subtag]").forEach(btn => {
      btn.addEventListener("click", () => {
        state.subTag = btn.dataset.subtag;
        renderSubTags();
        renderGrid();
      });
    });
  }

  function renderSizeOptions() {
    const shirtSizes = ["S", "M", "L", "XL", "XXL"];
    const shoeSizes = Object.keys(SHOE_SIZE_MAP);
    let opts = `<option value="All">All Sizes</option>`;

    if (state.category === "All" || state.category === "Shirts") {
      opts += `<optgroup label="Shirt Sizes">`;
      shirtSizes.forEach(s => { opts += `<option value="${s}">Shirt — ${s}</option>`; });
      opts += `</optgroup>`;
    }
    if (state.category === "All" || state.category === "Shoes") {
      opts += `<optgroup label="Shoe Sizes (IND / UK / EU / US)">`;
      shoeSizes.forEach(s => {
        const info = SHOE_SIZE_MAP[s];
        opts += `<option value="${s}">IND/UK ${info.ind} • EU ${info.eu} • US ${info.us}</option>`;
      });
      opts += `</optgroup>`;
    }

    sizeSelect.innerHTML = opts;
    sizeSelect.value = "All";
    state.size = "All";
  }

  function renderGrid() {
    let items = [...store.products];

    if (state.category !== "All") {
      items = items.filter(p => p.category.toLowerCase() === state.category.toLowerCase());
    }
    if (state.subTag !== "All") {
      items = items.filter(p => (p.sub_tag || "").toLowerCase() === state.subTag.toLowerCase());
    }
    if (state.size !== "All") {
      items = items.filter(p => (p.sizes || []).map(String).includes(String(state.size)));
    }
    if (state.search.trim()) {
      const q = state.search.trim().toLowerCase();
      items = items.filter(p =>
        p.name.toLowerCase().includes(q) ||
        (p.sub_tag || "").toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q)
      );
    }

    if (state.sort === "price-asc") items.sort((a, b) => a.price - b.price);
    else if (state.sort === "price-desc") items.sort((a, b) => b.price - a.price);
    else items.sort((a, b) => Number(b.featured) - Number(a.featured));

    countLabel.textContent = `Showing ${items.length} ${items.length === 1 ? "drop" : "drops"}`;

    if (!items.length) {
      grid.innerHTML = `
        <div class="empty-state" style="grid-column: 1 / -1;">
          <h3>No matching drops found</h3>
          <p>Try clearing your tag or size filters to explore the full Shopping_Glue catalog.</p>
          <button class="btn btn-flame" id="reset-filters-btn">Reset Filters</button>
        </div>
      `;
      document.getElementById("reset-filters-btn").addEventListener("click", () => {
        state = { category: "All", subTag: "All", size: "All", sort: "featured", search: "" };
        searchInput.value = "";
        sortSelect.value = "featured";
        syncTabs();
        renderSubTags();
        renderSizeOptions();
        renderGrid();
      });
      return;
    }

    grid.innerHTML = items.map(renderProductCard).join("");
  }

  function syncTabs() {
    catTabs.forEach(t => {
      t.classList.toggle("active", t.dataset.catTab.toLowerCase() === state.category.toLowerCase());
    });
  }

  catTabs.forEach(tab => {
    tab.addEventListener("click", () => {
      state.category = tab.dataset.catTab;
      state.subTag = "All";
      syncTabs();
      renderSubTags();
      renderSizeOptions();
      renderGrid();
    });
  });

  sizeSelect.addEventListener("change", e => {
    state.size = e.target.value;
    renderGrid();
  });

  sortSelect.addEventListener("change", e => {
    state.sort = e.target.value;
    renderGrid();
  });

  searchInput.addEventListener("input", e => {
    state.search = e.target.value;
    renderGrid();
  });

  syncTabs();
  renderSubTags();
  renderSizeOptions();
  renderGrid();
}

// ============================================================
// PRODUCT DETAIL PAGE (4-System Shoe Switcher + Gallery + Modal)
// ============================================================
async function initProductPage() {
  const store = await loadStore();
  const params = new URLSearchParams(window.location.search);
  const id = params.get("id");
  const product = store.products.find(p => p.id === id) || store.products[0];

  const container = document.getElementById("product-detail-root");
  if (!product) {
    container.innerHTML = `<div class="empty-state"><h3>Product not found</h3><a class="btn btn-flame" href="/shop.html">Back to Shop</a></div>`;
    return;
  }

  document.title = `${product.name} | Shopping_Glue`;

  const isShoe = product.category.toLowerCase() === "shoes";
  const images = normalizeImages(product);
  const colors = product.colors && product.colors.length ? product.colors : [{ name: "Default", hex: "#111111" }];
  const sizes = product.sizes && product.sizes.length ? product.sizes : (isShoe ? ["7", "8", "9", "10"] : ["M", "L", "XL"]);

  let selectedColor = colors[0].name;
  let selectedSize = String(sizes[0]);
  let selectedUnit = "ind"; // ind | uk | eu | us
  let qty = 1;

  const discount = product.mrp && product.mrp > product.price
    ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
    : 0;

  container.innerHTML = `
    <div class="breadcrumb">
      <a href="/index.html">Home</a> <span>/</span>
      <a href="/shop.html">Shop</a> <span>/</span>
      <a href="/shop.html?category=${encodeURIComponent(product.category)}">${escapeHTML(product.category)}</a> <span>/</span>
      <span>${escapeHTML(product.name)}</span>
    </div>

    <div class="pdp-grid">
      <div>
        <div class="gallery-main">
          <img id="pdp-main-img" src="${escapeHTML(images[0])}" alt="${escapeHTML(product.name)}" />
        </div>
        ${images.length > 1 ? `
          <div class="gallery-thumbs">
            ${images.map((src, i) => `
              <button class="thumb-btn ${i === 0 ? "active" : ""}" data-thumb-src="${escapeHTML(src)}">
                <img src="${escapeHTML(src)}" alt="Angle ${i + 1}" />
              </button>
            `).join("")}
          </div>
        ` : ""}
      </div>

      <div>
        <div class="product-meta" style="margin-bottom:4px;">
          <span>${escapeHTML(product.sub_tag || product.category)}</span>
          <span>${product.in_stock ? "IN STOCK" : "SOLD OUT"}</span>
        </div>
        <h1 class="pdp-title">${escapeHTML(product.name)}</h1>

        <div class="pdp-price-row">
          <span class="pdp-price">${formatINR(product.price)}</span>
          ${product.mrp && product.mrp > product.price ? `<span class="price-mrp" style="font-size:1.1rem;">${formatINR(product.mrp)}</span>` : ""}
          ${discount > 0 ? `<span class="pdp-discount">SAVE ${discount}%</span>` : ""}
        </div>

        <p class="pdp-desc">${escapeHTML(product.description)}</p>
        ${product.material ? `<p style="font-size:0.86rem;color:var(--text-muted);margin-bottom:22px;"><strong style="color:var(--text);">Build / Fabric:</strong> ${escapeHTML(product.material)}</p>` : ""}

        <div class="option-block">
          <div class="option-header">
            <div class="option-label">Color: <span id="selected-color-label">${escapeHTML(selectedColor)}</span></div>
          </div>
          <div class="color-picker" id="color-picker">
            ${colors.map((c, idx) => `
              <button type="button" class="color-chip ${idx === 0 ? "active" : ""}" data-color="${escapeHTML(c.name)}">
                <span class="swatch-dot" style="background:${escapeHTML(c.hex)}"></span>
                ${escapeHTML(c.name)}
              </button>
            `).join("")}
          </div>
        </div>

        <div class="option-block">
          <div class="option-header">
            <div class="option-label">
              Select Size
              ${isShoe ? `<span id="shoe-unit-hint">(Viewing in IND)</span>` : ""}
            </div>
            <div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
              ${isShoe ? `
                <div class="unit-switcher" id="unit-switcher">
                  <button type="button" class="unit-btn active" data-unit="ind">IND</button>
                  <button type="button" class="unit-btn" data-unit="uk">UK</button>
                  <button type="button" class="unit-btn" data-unit="eu">EU</button>
                  <button type="button" class="unit-btn" data-unit="us">US</button>
                </div>
              ` : ""}
              <button type="button" class="link-btn" id="open-size-guide">Size Guide</button>
            </div>
          </div>
          <div class="size-grid" id="size-grid"></div>
          ${isShoe ? `<div class="size-equivalent-box" id="size-eq-box"></div>` : ""}
        </div>

        <div class="qty-row">
          <span class="option-label">Quantity:</span>
          <div class="qty-stepper">
            <button type="button" id="qty-minus">−</button>
            <span id="qty-value">1</span>
            <button type="button" id="qty-plus">+</button>
          </div>
        </div>

        <div class="pdp-actions">
          <button type="button" class="btn btn-flame" id="add-bag-btn" ${!product.in_stock ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>
            ${product.in_stock ? "Add to Bag" : "Out of Stock"}
          </button>
          <button type="button" class="btn btn-whatsapp" id="buy-wa-btn" ${!product.in_stock ? "disabled style='opacity:0.5;cursor:not-allowed;'" : ""}>
            Quick Order on WhatsApp
          </button>
        </div>

        <div class="policy-card">
          <div class="policy-row"><span class="perk-dot"></span><span><strong>Payment:</strong> UPI (₹0 extra) or Cash on Delivery (+₹${store.settings.cod_fee} extra) — No bank transfer</span></div>
          <div class="policy-row"><span class="perk-dot"></span><span><strong>Shipping:</strong> ${escapeHTML(store.settings.shipping_note)}</span></div>
          <div class="policy-row"><span class="perk-dot"></span><span><strong>Exchange:</strong> ${escapeHTML(store.settings.exchange_badge)}</span></div>
        </div>
      </div>
    </div>
  `;

  // Gallery thumbs
  container.querySelectorAll("[data-thumb-src]").forEach(btn => {
    btn.addEventListener("click", () => {
      document.getElementById("pdp-main-img").src = btn.dataset.thumbSrc;
      container.querySelectorAll("[data-thumb-src]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Colors
  container.querySelectorAll("[data-color]").forEach(btn => {
    btn.addEventListener("click", () => {
      selectedColor = btn.dataset.color;
      document.getElementById("selected-color-label").textContent = selectedColor;
      container.querySelectorAll("[data-color]").forEach(b => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });

  // Sizes & 4-System Shoe Switcher
  const sizeGrid = document.getElementById("size-grid");
  const eqBox = document.getElementById("size-eq-box");
  const unitHint = document.getElementById("shoe-unit-hint");

  function renderSizes() {
    sizeGrid.innerHTML = sizes.map(sz => {
      const strSz = String(sz);
      let label = strSz;
      if (isShoe) {
        const info = getShoeSizeInfo(strSz);
        label = `${selectedUnit.toUpperCase()} ${info[selectedUnit]}`;
      }
      return `<button type="button" class="size-pill ${strSz === selectedSize ? "active" : ""}" data-size="${escapeHTML(strSz)}">${escapeHTML(label)}</button>`;
    }).join("");

    sizeGrid.querySelectorAll("[data-size]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedSize = btn.dataset.size;
        renderSizes();
      });
    });

    if (isShoe && eqBox) {
      const info = getShoeSizeInfo(selectedSize);
      eqBox.innerHTML = `<strong>Matched Fit:</strong> IND ${info.ind} &nbsp;|&nbsp; UK ${info.uk} &nbsp;|&nbsp; EU ${info.eu} &nbsp;|&nbsp; US ${info.us} &nbsp;(${info.cm} cm foot length)`;
    }
    if (isShoe && unitHint) {
      unitHint.textContent = `(Viewing in ${selectedUnit.toUpperCase()})`;
    }
  }

  if (isShoe) {
    container.querySelectorAll("[data-unit]").forEach(btn => {
      btn.addEventListener("click", () => {
        selectedUnit = btn.dataset.unit;
        container.querySelectorAll("[data-unit]").forEach(b => b.classList.remove("active"));
        btn.classList.add("active");
        renderSizes();
      });
    });
  }

  renderSizes();

  // Qty stepper
  document.getElementById("qty-minus").addEventListener("click", () => {
    if (qty > 1) { qty--; document.getElementById("qty-value").textContent = qty; }
  });
  document.getElementById("qty-plus").addEventListener("click", () => {
    if (qty < 10) { qty++; document.getElementById("qty-value").textContent = qty; }
  });

  function buildFormattedSize() {
    return isShoe ? formatShoeEquivalent(selectedSize) : `Size ${selectedSize}`;
  }

  // Add to Bag
  document.getElementById("add-bag-btn").addEventListener("click", () => {
    if (!product.in_stock) return;
    addToCart({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      image: images[0],
      color: selectedColor,
      size: buildFormattedSize(),
      qty
    });
  });

  // Quick Order on WhatsApp
  document.getElementById("buy-wa-btn").addEventListener("click", () => {
    if (!product.in_stock) return;
    const cleanWa = (store.settings.whatsapp_number || "919856701460").replace(/[^0-9]/g, "");
    const lines = [
      `🔥 *NEW QUICK ORDER — Shopping_Glue*`,
      ``,
      `*Item:* ${product.name}`,
      `*Color:* ${selectedColor}`,
      `*Size:* ${buildFormattedSize()}`,
      `*Quantity:* ${qty}`,
      `*Item Total:* ${formatINR(product.price * qty)}`,
      ``,
      `*Payment Option:* Please confirm UPI (₹0 extra) or COD (+₹${store.settings.cod_fee} extra)`,
      `*Shipping:* ${store.settings.shipping_note}`,
      ``,
      `Hi Shopping_Glue! I want to order this item. Please confirm shipping & availability.`
    ];
    window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(lines.join("\n"))}`, "_blank");
  });

  // Size Guide Modal
  const modal = document.getElementById("size-guide-modal");
  document.getElementById("open-size-guide").addEventListener("click", () => modal.classList.add("open"));
  document.getElementById("close-size-guide").addEventListener("click", () => modal.classList.remove("open"));
  modal.addEventListener("click", e => {
    if (e.target === modal) modal.classList.remove("open");
  });

  // Related Drops
  const relatedGrid = document.getElementById("related-grid");
  if (relatedGrid) {
    const related = store.products.filter(p => p.id !== product.id).slice(0, 4);
    relatedGrid.innerHTML = related.map(renderProductCard).join("");
  }
}

// ============================================================
// CART & WHATSAPP CHECKOUT PAGE (UPI vs COD +₹50)
// ============================================================
async function initCartPage() {
  const store = await loadStore();
  const codFee = Number(store.settings.cod_fee ?? 50);
  let paymentMethod = "UPI"; // "UPI" | "COD"

  const root = document.getElementById("cart-root");

  function renderCart() {
    const cart = getCart();
    if (!cart.length) {
      root.innerHTML = `
        <div class="empty-state">
          <h3>Your Shopping_Glue bag is empty</h3>
          <p>Explore our latest dark streetwear shirts and statement footwear drops.</p>
          <a href="/shop.html" class="btn btn-flame">Explore The Drop</a>
        </div>
      `;
      return;
    }

    const subtotal = cart.reduce((sum, item) => sum + item.price * item.qty, 0);
    const extraFee = paymentMethod === "COD" ? codFee : 0;
    const payable = subtotal + extraFee;

    root.innerHTML = `
      <div class="cart-layout">
        <div class="cart-list">
          ${cart.map((item, idx) => `
            <div class="cart-item">
              <img class="cart-item-img" src="${escapeHTML(item.image)}" alt="${escapeHTML(item.name)}" />
              <div class="cart-item-info">
                <h3><a href="/product.html?id=${encodeURIComponent(item.id)}">${escapeHTML(item.name)}</a></h3>
                <div class="cart-item-meta">
                  <span><strong>Color:</strong> ${escapeHTML(item.color)}</span>
                  <span><strong>Fit:</strong> ${escapeHTML(item.size)}</span>
                  <span><strong>Unit Price:</strong> ${formatINR(item.price)}</span>
                </div>
                <div class="qty-stepper" style="height:34px;">
                  <button type="button" data-qty-dec="${idx}" style="height:34px;width:32px;">−</button>
                  <span>${item.qty}</span>
                  <button type="button" data-qty-inc="${idx}" style="height:34px;width:32px;">+</button>
                </div>
              </div>
              <div class="cart-item-right" style="text-align:right;">
                <div style="font-size:1.15rem;font-weight:800;">${formatINR(item.price * item.qty)}</div>
                <button type="button" class="remove-btn" data-remove="${idx}">Remove</button>
              </div>
            </div>
          `).join("")}
        </div>

        <form class="checkout-card" id="checkout-form">
          <h2>WhatsApp Checkout</h2>
          <div class="form-grid">
            <div class="field-group">
              <label for="cust-name">Full Name *</label>
              <input class="input-dark" id="cust-name" required placeholder="e.g., Rahul Sharma" />
            </div>
            <div class="field-group">
              <label for="cust-phone">WhatsApp / Mobile Number *</label>
              <input class="input-dark" id="cust-phone" type="tel" required placeholder="10-digit mobile number" />
            </div>
            <div class="field-group">
              <label for="cust-address">Full Delivery Address *</label>
              <textarea class="input-dark" id="cust-address" rows="2" required placeholder="House/Flat No., Street, Landmark"></textarea>
            </div>
            <div class="form-row-2">
              <div class="field-group">
                <label for="cust-city">City & State *</label>
                <input class="input-dark" id="cust-city" required placeholder="e.g., Shillong, Meghalaya" />
              </div>
              <div class="field-group">
                <label for="cust-pin">Pincode *</label>
                <input class="input-dark" id="cust-pin" required pattern="[0-9]{6}" placeholder="6-digit PIN" />
              </div>
            </div>
          </div>

          <div class="field-group" style="margin-bottom:10px;">
            <label>Choose Payment Mode (UPI or COD Only)</label>
          </div>
          <div class="payment-options">
            <label class="payment-card ${paymentMethod === "UPI" ? "selected" : ""}">
              <input type="radio" name="pay_mode" value="UPI" ${paymentMethod === "UPI" ? "checked" : ""} />
              <div>
                <div class="payment-title">UPI Prepaid <span class="payment-tag">₹0 Extra Fee</span></div>
                <div class="payment-sub">${escapeHTML(store.settings.upi_note)}</div>
              </div>
            </label>
            <label class="payment-card ${paymentMethod === "COD" ? "selected" : ""}">
              <input type="radio" name="pay_mode" value="COD" ${paymentMethod === "COD" ? "checked" : ""} />
              <div>
                <div class="payment-title">Cash on Delivery (COD) <span class="payment-tag cod">+${formatINR(codFee)} Extra</span></div>
                <div class="payment-sub">Pay cash at delivery. Includes ${formatINR(codFee)} COD handling charge.</div>
              </div>
            </label>
          </div>

          <div class="shipping-banner">
            📦 <strong>Shipping:</strong> ${escapeHTML(store.settings.shipping_note)}.
          </div>

          <div class="summary-box">
            <div class="summary-line">
              <span>Items Subtotal</span>
              <span>${formatINR(subtotal)}</span>
            </div>
            <div class="summary-line">
              <span>${paymentMethod === "COD" ? "COD Extra Charge" : "UPI Payment Fee"}</span>
              <span>${paymentMethod === "COD" ? "+" + formatINR(codFee) : "₹0"}</span>
            </div>
            <div class="summary-line">
              <span>Shipping</span>
              <span>Confirmed on WhatsApp</span>
            </div>
            <div class="summary-line total">
              <span>Total (excl. shipping)</span>
              <span class="flame-text">${formatINR(payable)}</span>
            </div>
          </div>

          <button type="submit" class="btn btn-whatsapp btn-full">
            Confirm Order on WhatsApp →
          </button>
        </form>
      </div>
    `;

    // Bind qty & remove controls
    root.querySelectorAll("[data-qty-dec]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.qtyDec);
        const c = getCart();
        if (c[i].qty > 1) c[i].qty--;
        else c.splice(i, 1);
        saveCart(c);
        renderCart();
      });
    });

    root.querySelectorAll("[data-qty-inc]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.qtyInc);
        const c = getCart();
        if (c[i].qty < 10) c[i].qty++;
        saveCart(c);
        renderCart();
      });
    });

    root.querySelectorAll("[data-remove]").forEach(btn => {
      btn.addEventListener("click", () => {
        const i = Number(btn.dataset.remove);
        const c = getCart();
        c.splice(i, 1);
        saveCart(c);
        renderCart();
      });
    });

    // Payment mode switcher (preserve entered form values!)
    root.querySelectorAll('input[name="pay_mode"]').forEach(radio => {
      radio.addEventListener("change", e => {
        const savedForm = {
          name: document.getElementById("cust-name").value,
          phone: document.getElementById("cust-phone").value,
          address: document.getElementById("cust-address").value,
          city: document.getElementById("cust-city").value,
          pin: document.getElementById("cust-pin").value
        };
        paymentMethod = e.target.value;
        renderCart();
        document.getElementById("cust-name").value = savedForm.name;
        document.getElementById("cust-phone").value = savedForm.phone;
        document.getElementById("cust-address").value = savedForm.address;
        document.getElementById("cust-city").value = savedForm.city;
        document.getElementById("cust-pin").value = savedForm.pin;
      });
    });

    // WhatsApp Order Submit
    document.getElementById("checkout-form").addEventListener("submit", e => {
      e.preventDefault();
      const name = document.getElementById("cust-name").value.trim();
      const phone = document.getElementById("cust-phone").value.trim();
      const address = document.getElementById("cust-address").value.trim();
      const city = document.getElementById("cust-city").value.trim();
      const pin = document.getElementById("cust-pin").value.trim();

      const orderId = "SG-" + Date.now().toString().slice(-6);
      const itemLines = cart.map((item, n) =>
        `${n + 1}. *${item.name}*\n   Color: ${item.color} | Fit: ${item.size}\n   Qty: ${item.qty} × ${formatINR(item.price)} = ${formatINR(item.price * item.qty)}`
      );

      const waLines = [
        `🔥 *NEW ORDER — Shopping_Glue*`,
        `*Order Ref:* ${orderId}`,
        `--------------------------------`,
        ...itemLines,
        `--------------------------------`,
        `*Items Subtotal:* ${formatINR(subtotal)}`,
        `*Payment Mode:* ${paymentMethod === "COD" ? `Cash on Delivery (+${formatINR(codFee)} COD Charge)` : "UPI Prepaid (₹0 Extra)"}`,
        `*Shipping:* ${store.settings.shipping_note}`,
        `*Payable Total (excl. shipping):* ${formatINR(payable)}`,
        `--------------------------------`,
        `*Customer Details:*`,
        `Name: ${name}`,
        `Phone: ${phone}`,
        `Address: ${address}, ${city} - ${pin}`,
        ``,
        `Please confirm shipping charges & order confirmation!`
      ];

      const cleanWa = (store.settings.whatsapp_number || "919856701460").replace(/[^0-9]/g, "");
      window.open(`https://wa.me/${cleanWa}?text=${encodeURIComponent(waLines.join("\n"))}`, "_blank");
    });
  }

  renderCart();
}

// Bootstrap per page
document.addEventListener("DOMContentLoaded", () => {
  initNav();
  const page = document.body.dataset.page;
  if (page === "home") initHomePage();
  else if (page === "shop") initShopPage();
  else if (page === "product") initProductPage();
  else if (page === "cart") initCartPage();
  else loadStore();
});
