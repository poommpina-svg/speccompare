import {
  auth,
  db,
  firebaseConfigured,
  loginWithEmail,
  logout,
  onAuthStateChanged
} from "./firebase-client.js";

import {
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  orderBy,
  query,
  where
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";

const grid = document.getElementById("productGrid");
const statusBox = document.getElementById("firebaseStatus");
const searchInput = document.getElementById("productSearch");
const compareDock = document.getElementById("compareDock");
const compareCount = document.getElementById("compareCount");
const compareNames = document.getElementById("compareNames");
const clearCompare = document.getElementById("clearCompare");
const comparisonCard = document.querySelector("#comparison .comparison-card");
const loginBtn = document.getElementById("loginBtn");

let products = [];
const selected = new Map();

function notify(title, message) {
  if (typeof window.showToast === "function") {
    window.showToast(title, message);
  } else {
    console.info(`${title}: ${message}`);
  }
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function categoryIcon(categorySlug) {
  const icons = {
    cpu: "i-cpu",
    gpu: "i-gpu",
    notebook: "i-laptop",
    ram: "i-ram",
    ssd: "i-ssd",
    mainboard: "i-board"
  };
  return icons[categorySlug] || "i-box";
}

function money(value, currency = "THB") {
  const number = Number(value);
  if (!Number.isFinite(number)) return "ไม่ระบุราคา";
  return new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency,
    maximumFractionDigits: 0
  }).format(number);
}

function setStatus(kind, message) {
  if (!statusBox) return;
  statusBox.dataset.kind = kind;
  statusBox.textContent = message;
  statusBox.hidden = false;
}

function normalizeProduct(snapshot) {
  const data = snapshot.data();
  return {
    id: snapshot.id,
    ...data,
    searchText: [
      data.title,
      data.model,
      data.brandName,
      data.brandSlug,
      data.categorySlug,
      ...(data.searchKeywords || [])
    ].filter(Boolean).join(" ").toLowerCase()
  };
}

function productCard(product) {
  const tags = Object.values(product.specs || {})
    .slice(0, 3)
    .map((value) => `<span class="spec-tag">${escapeHtml(value)}</span>`)
    .join("");

  const image = product.primaryImageUrl
    ? `<img class="product-photo" src="${escapeHtml(product.primaryImageUrl)}" alt="${escapeHtml(product.title)}" loading="lazy">`
    : `<svg class="device-art icon"><use href="#${categoryIcon(product.categorySlug)}"></use></svg>`;

  return `
    <article class="product-card firebase-product-card"
      data-id="${escapeHtml(product.id)}"
      data-search="${escapeHtml(product.searchText)}">
      <div class="product-media">
        <span class="product-badge">${escapeHtml((product.categorySlug || "สินค้า").toUpperCase())}</span>
        <button class="favorite-btn" aria-label="เพิ่มรายการโปรด" type="button">
          <svg class="icon"><use href="#i-heart"></use></svg>
        </button>
        ${image}
      </div>
      <div class="product-body">
        <div class="product-brand">${escapeHtml(product.brandName || product.brandSlug || "ไม่ระบุยี่ห้อ")}</div>
        <div class="product-title">${escapeHtml(product.title)}</div>
        <div class="product-specs">${tags}</div>
        <div class="product-meta">
          <div class="price">${money(product.price, product.currency || "THB")}</div>
          <div class="rating">ข้อมูลจาก Firestore</div>
        </div>
        <button class="compare-btn firebase-compare-btn" type="button" data-id="${escapeHtml(product.id)}">
          <svg class="icon"><use href="#i-plus-square"></use></svg>
          เพิ่มเพื่อเปรียบเทียบ
        </button>
      </div>
    </article>
  `;
}

async function loadProducts() {
  if (!firebaseConfigured || !db) {
    setStatus(
      "warning",
      "ยังไม่ได้เชื่อม Firebase — กำลังแสดงข้อมูลตัวอย่าง กรุณาตั้งค่า frontend/js/firebase-config.js"
    );
    return;
  }

  try {
    setStatus("loading", "กำลังโหลดสินค้าจาก Cloud Firestore...");
    const productsQuery = query(
      collection(db, "products"),
      where("status", "==", "published"),
      orderBy("updatedAt", "desc"),
      limit(24)
    );
    const snapshot = await getDocs(productsQuery);
    products = snapshot.docs.map(normalizeProduct);

    if (!products.length) {
      setStatus("empty", "เชื่อม Firestore สำเร็จ แต่ยังไม่มีสินค้าที่เป็น published");
      return;
    }

    grid.innerHTML = products.map(productCard).join("");
    setStatus("success", `โหลดสินค้า ${products.length} รายการจาก Cloud Firestore สำเร็จ`);
    selected.clear();
    renderSelected();
  } catch (error) {
    console.error(error);
    setStatus("error", `โหลดสินค้าไม่สำเร็จ: ${error.message}`);
  }
}

function filterProducts() {
  const keyword = (searchInput?.value || "").trim().toLowerCase();
  document.querySelectorAll(".firebase-product-card").forEach((card) => {
    card.hidden = !card.dataset.search.includes(keyword);
  });
}

async function getSpecDefinitions(categorySlug) {
  if (!db) return [];
  const snapshot = await getDoc(doc(db, "specDefinitions", categorySlug));
  return snapshot.exists() ? (snapshot.data().fields || []) : [];
}

function formatSpec(value, unit) {
  if (value === undefined || value === null || value === "") return "—";
  if (typeof value === "boolean") return value ? "มี" : "ไม่มี";
  return `${escapeHtml(value)}${unit ? ` ${escapeHtml(unit)}` : ""}`;
}

function bestProductIds(field, chosen) {
  if (!["higher_better", "lower_better"].includes(field.compareDirection)) {
    return new Set();
  }

  const numeric = chosen
    .map((product) => ({
      id: product.id,
      value: Number(product.specs?.[field.code])
    }))
    .filter((item) => Number.isFinite(item.value));

  if (numeric.length < 2) return new Set();
  const values = numeric.map((item) => item.value);
  const best = field.compareDirection === "higher_better"
    ? Math.max(...values)
    : Math.min(...values);

  return new Set(
    numeric.filter((item) => item.value === best).map((item) => item.id)
  );
}

async function renderComparison() {
  if (!comparisonCard || !selected.size) return;

  const chosen = [...selected.values()];
  const definitions = await getSpecDefinitions(chosen[0].categorySlug);
  const fields = definitions.length
    ? definitions.sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    : Object.keys(chosen[0].specs || {}).map((code, index) => ({
        code,
        name: code,
        compareDirection: "neutral",
        sortOrder: index
      }));

  const headers = chosen.map((product) => `
    <th>
      <div class="mini-product">
        ${product.primaryImageUrl
          ? `<img class="comparison-photo" src="${escapeHtml(product.primaryImageUrl)}" alt="${escapeHtml(product.title)}">`
          : `<svg class="device-art icon"><use href="#${categoryIcon(product.categorySlug)}"></use></svg>`
        }
        ${escapeHtml(product.title)}
      </div>
    </th>
  `).join("");

  const rows = fields.map((field) => {
    const winners = bestProductIds(field, chosen);
    const cells = chosen.map((product) => {
      const value = formatSpec(product.specs?.[field.code], field.unit);
      return winners.has(product.id)
        ? `<td><span class="winner"><svg class="icon"><use href="#i-check"></use></svg>${value}</span></td>`
        : `<td>${value}</td>`;
    }).join("");

    return `<tr><td>${escapeHtml(field.name || field.code)}</td>${cells}</tr>`;
  }).join("");

  const priceCandidates = chosen
    .map((product) => ({ id: product.id, value: Number(product.price) }))
    .filter((item) => Number.isFinite(item.value));
  const bestPrice = priceCandidates.length > 1
    ? Math.min(...priceCandidates.map((item) => item.value))
    : null;
  const priceCells = chosen.map((product) => {
    const highlighted = bestPrice !== null && Number(product.price) === bestPrice;
    const value = money(product.price, product.currency || "THB");
    return highlighted
      ? `<td><span class="winner"><svg class="icon"><use href="#i-check"></use></svg>${value}</span></td>`
      : `<td>${value}</td>`;
  }).join("");

  comparisonCard.innerHTML = `
    <div class="comparison-top">
      <div>
        <h3>เปรียบเทียบ ${escapeHtml(chosen[0].categorySlug.toUpperCase())} จำนวน ${chosen.length} รุ่น</h3>
        <p>ข้อมูลจาก Cloud Firestore</p>
      </div>
      <button class="btn btn-light" id="firebaseClearComparison" type="button">
        <svg class="icon"><use href="#i-refresh"></use></svg>ล้างรายการ
      </button>
    </div>
    <div class="table-wrap">
      <table>
        <thead><tr><th>ข้อมูลสินค้า</th>${headers}</tr></thead>
        <tbody>${rows}<tr><td>ราคา</td>${priceCells}</tr></tbody>
      </table>
    </div>
  `;

  document.getElementById("firebaseClearComparison")?.addEventListener("click", () => {
    selected.clear();
    renderSelected();
  });
}

function renderSelected() {
  compareCount.textContent = String(selected.size);
  compareDock.classList.toggle("show", selected.size > 0);
  compareNames.textContent = selected.size
    ? [...selected.values()].map((product) => product.title).join(" • ")
    : "เลือกสินค้าอย่างน้อย 2 รุ่นเพื่อเปรียบเทียบ";

  document.querySelectorAll(".firebase-compare-btn").forEach((button) => {
    const active = selected.has(button.dataset.id);
    button.classList.toggle("selected", active);
    button.innerHTML = active
      ? '<svg class="icon"><use href="#i-check"></use></svg>เลือกแล้ว'
      : '<svg class="icon"><use href="#i-plus-square"></use></svg>เพิ่มเพื่อเปรียบเทียบ';
  });

  if (selected.size) {
    renderComparison().catch(console.error);
  }
}

grid?.addEventListener("click", (event) => {
  const button = event.target.closest(".firebase-compare-btn");
  if (!button) return;

  const product = products.find((item) => item.id === button.dataset.id);
  if (!product) return;

  if (selected.has(product.id)) {
    selected.delete(product.id);
    renderSelected();
    return;
  }

  const first = selected.values().next().value;
  if (first && first.categorySlug !== product.categorySlug) {
    notify("เลือกสินค้าไม่ได้", "กรุณาเปรียบเทียบสินค้าประเภทเดียวกัน");
    return;
  }
  if (selected.size >= 4) {
    notify("รายการเต็ม", "เปรียบเทียบได้สูงสุด 4 รุ่น");
    return;
  }

  selected.set(product.id, product);
  renderSelected();
});

searchInput?.addEventListener("input", filterProducts);
clearCompare?.addEventListener("click", () => {
  selected.clear();
  renderSelected();
});

window.specCompareFirebaseLogin = async (email, password) => {
  const credential = await loginWithEmail(email, password);
  return credential.user;
};

if (auth) {
  onAuthStateChanged(auth, (user) => {
    if (!loginBtn) return;
    loginBtn.innerHTML = user
      ? '<svg class="icon"><use href="#i-user"></use></svg>ออกจากระบบ'
      : '<svg class="icon"><use href="#i-user"></use></svg>เข้าสู่ระบบ';
    loginBtn.title = user?.email || "";
  });

  loginBtn?.addEventListener("click", async (event) => {
    if (!auth.currentUser) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    try {
      await logout();
      notify("ออกจากระบบแล้ว", "บัญชีผู้ดูแลถูกออกจากระบบเรียบร้อย");
    } catch (error) {
      notify("ออกจากระบบไม่สำเร็จ", error.message);
    }
  }, true);
}

loadProducts();
