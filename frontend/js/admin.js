import {
  auth,
  db,
  firebaseConfigured,
  loginWithEmail,
  logout,
  onAuthStateChanged
} from "./firebase-client.js?v=20260803-1";

import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  writeBatch
} from "https://www.gstatic.com/firebasejs/12.16.0/firebase-firestore.js";


const authPanel = document.getElementById("authPanel");
const adminPanel = document.getElementById("adminPanel");
const authForm = document.getElementById("authForm");
const authStatus = document.getElementById("authStatus");
const adminStatus = document.getElementById("adminStatus");
const logoutBtn = document.getElementById("logoutBtn");
const seedBtn = document.getElementById("seedBtn");
const productForm = document.getElementById("productForm");
const categorySelect = document.getElementById("categorySlug");
const brandSelect = document.getElementById("brandSlug");
const specFields = document.getElementById("specFields");
const productList = document.getElementById("productList");
const adminSearch = document.getElementById("adminSearch");
const cancelEditBtn = document.getElementById("cancelEditBtn");
const formTitle = document.getElementById("formTitle");
const productImageInput = document.getElementById("productImage");
const existingImageDataUrlInput = document.getElementById("existingImageDataUrl");
const imagePreview = document.getElementById("imagePreview");
const imagePreviewPlaceholder = document.getElementById("imagePreviewPlaceholder");
const removeImageBtn = document.getElementById("removeImageBtn");

let currentUser = null;
let currentRole = null;
let categories = [];
let brands = [];
let products = [];
let currentDefinitions = [];
let unsubscribeProducts = null;
let pendingImageDataUrl = "";
let removeCurrentImage = false;
let imageProcessingPromise = Promise.resolve();

const CATEGORY_SEEDS = [
  { slug:"cpu", name:"CPU", description:"หน่วยประมวลผลกลาง", iconName:"cpu", sortOrder:10 },
  { slug:"gpu", name:"GPU", description:"การ์ดประมวลผลกราฟิก", iconName:"gpu", sortOrder:20 },
  { slug:"notebook", name:"Notebook", description:"คอมพิวเตอร์โน้ตบุ๊ก", iconName:"laptop", sortOrder:30 },
  { slug:"ram", name:"RAM", description:"หน่วยความจำหลัก", iconName:"ram", sortOrder:40 },
  { slug:"ssd", name:"SSD", description:"อุปกรณ์จัดเก็บข้อมูล", iconName:"ssd", sortOrder:50 },
  { slug:"mainboard", name:"Mainboard", description:"เมนบอร์ดคอมพิวเตอร์", iconName:"board", sortOrder:60 }
];

const BRAND_SEEDS = [
  "AMD","Intel","NVIDIA","ASUS","MSI","Gigabyte","Samsung","Corsair","Kingston","Crucial"
].map((name) => ({
  name,
  slug:name.toLowerCase().replaceAll(" ", "-"),
  isActive:true
}));

const SPEC_SEEDS = {
  cpu: [
    ["architecture","สถาปัตยกรรม","text","", "neutral"],
    ["socket","ซ็อกเก็ต","text","", "neutral"],
    ["cores","จำนวนคอร์","number","คอร์","higher_better"],
    ["threads","จำนวนเธรด","number","เธรด","higher_better"],
    ["base_clock_ghz","ความเร็วพื้นฐาน","number","GHz","higher_better"],
    ["boost_clock_ghz","ความเร็วสูงสุด","number","GHz","higher_better"],
    ["l3_cache_mb","แคช L3","number","MB","higher_better"],
    ["tdp_w","กำลังไฟ TDP","number","W","lower_better"],
    ["integrated_graphics","กราฟิกในตัว","boolean","", "neutral"]
  ],
  gpu: [
    ["gpu_chip","ชิปกราฟิก","text","", "neutral"],
    ["vram_gb","หน่วยความจำการ์ดจอ","number","GB","higher_better"],
    ["memory_type","ชนิดหน่วยความจำ","text","", "neutral"],
    ["memory_bus_bit","บัสหน่วยความจำ","number","bit","higher_better"],
    ["shader_cores","จำนวนแกนประมวลผล","number","แกน","higher_better"],
    ["boost_clock_mhz","ความเร็วสูงสุด","number","MHz","higher_better"],
    ["tdp_w","กำลังไฟ","number","W","lower_better"],
    ["length_mm","ความยาวการ์ด","number","mm","neutral"]
  ],
  notebook: [
    ["cpu_model","รุ่น CPU","text","", "neutral"],
    ["gpu_model","รุ่น GPU","text","", "neutral"],
    ["ram_gb","RAM","number","GB","higher_better"],
    ["storage_gb","พื้นที่จัดเก็บ","number","GB","higher_better"],
    ["display_size_inch","ขนาดหน้าจอ","number","นิ้ว","neutral"],
    ["resolution","ความละเอียด","text","", "neutral"],
    ["refresh_rate_hz","อัตรารีเฟรช","number","Hz","higher_better"],
    ["weight_kg","น้ำหนัก","number","kg","lower_better"],
    ["battery_wh","ความจุแบตเตอรี่","number","Wh","higher_better"]
  ],
  ram: [
    ["capacity_gb","ความจุรวม","number","GB","higher_better"],
    ["kit_configuration","จำนวนแถว","text","", "neutral"],
    ["memory_type","ชนิดหน่วยความจำ","text","", "neutral"],
    ["speed_mts","ความเร็ว","number","MT/s","higher_better"],
    ["cas_latency","ค่า CAS Latency","number","CL","lower_better"],
    ["voltage_v","แรงดันไฟ","number","V","lower_better"],
    ["rgb","ไฟ RGB","boolean","", "neutral"]
  ],
  ssd: [
    ["capacity_gb","ความจุ","number","GB","higher_better"],
    ["interface","อินเทอร์เฟซ","text","", "neutral"],
    ["form_factor","รูปแบบ","text","", "neutral"],
    ["sequential_read_mbps","ความเร็วอ่านต่อเนื่อง","number","MB/s","higher_better"],
    ["sequential_write_mbps","ความเร็วเขียนต่อเนื่อง","number","MB/s","higher_better"],
    ["tbw","ความทนทาน TBW","number","TBW","higher_better"],
    ["warranty_years","ระยะเวลารับประกัน","number","ปี","higher_better"]
  ],
  mainboard: [
    ["socket","ซ็อกเก็ต CPU","text","", "neutral"],
    ["chipset","ชิปเซ็ต","text","", "neutral"],
    ["form_factor","ขนาดเมนบอร์ด","text","", "neutral"],
    ["memory_type","ชนิด RAM","text","", "neutral"],
    ["max_memory_gb","RAM สูงสุด","number","GB","higher_better"],
    ["m2_slots","ช่อง M.2","number","ช่อง","higher_better"],
    ["pcie_x16_slots","ช่อง PCIe x16","number","ช่อง","higher_better"],
    ["wifi","Wi-Fi ในตัว","boolean","", "neutral"]
  ]
};

function setStatus(element, message, kind = "info") {
  element.textContent = message;
  element.dataset.kind = kind;
}

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}


function getProductImage(product) {
  return product?.imageDataUrl
    || product?.primaryImageUrl
    || product?.imageUrls?.[0]
    || "";
}

function updateImagePreview(source = "") {
  if (source) {
    imagePreview.src = source;
    imagePreview.classList.remove("hidden");
    imagePreviewPlaceholder.classList.add("hidden");
    removeImageBtn.classList.remove("hidden");
    return;
  }

  imagePreview.removeAttribute("src");
  imagePreview.classList.add("hidden");
  imagePreviewPlaceholder.classList.remove("hidden");
  removeImageBtn.classList.add("hidden");
}

function loadImageFromFile(file) {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const image = new Image();

    image.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error("ไม่สามารถอ่านไฟล์รูปภาพนี้ได้"));
    };
    image.src = objectUrl;
  });
}

async function compressProductImage(file) {
  if (!file) return "";
  if (!file.type.startsWith("image/")) {
    throw new Error("กรุณาเลือกไฟล์รูปภาพเท่านั้น");
  }
  if (file.size > 12 * 1024 * 1024) {
    throw new Error("ไฟล์รูปใหญ่เกิน 12 MB");
  }

  const source = await loadImageFromFile(file);
  let maxDimension = 720;
  let result = "";

  for (let attempt = 0; attempt < 7; attempt += 1) {
    const scale = Math.min(1, maxDimension / Math.max(source.width, source.height));
    const width = Math.max(1, Math.round(source.width * scale));
    const height = Math.max(1, Math.round(source.height * scale));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d", { alpha: false });
    if (!context) throw new Error("เบราว์เซอร์ไม่รองรับการย่อรูป");

    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(source, 0, 0, width, height);

    const quality = Math.max(0.48, 0.84 - (attempt * 0.06));
    result = canvas.toDataURL("image/jpeg", quality);

    if (result.length <= 180000) return result;
    maxDimension = Math.round(maxDimension * 0.82);
  }

  if (result.length > 260000) {
    throw new Error("รูปยังมีขนาดใหญ่เกินไป กรุณาเลือกรูปที่เล็กลง");
  }
  return result;
}

async function handleProductImageChange() {
  const file = productImageInput.files?.[0];
  if (!file) return;

  setStatus(adminStatus, "กำลังย่อและบีบอัดรูปสินค้า...");
  try {
    pendingImageDataUrl = await compressProductImage(file);
    removeCurrentImage = false;
    updateImagePreview(pendingImageDataUrl);
    setStatus(adminStatus, "เตรียมรูปเรียบร้อย กดบันทึกสินค้าได้", "success");
  } catch (error) {
    console.error(error);
    pendingImageDataUrl = "";
    productImageInput.value = "";
    updateImagePreview(existingImageDataUrlInput.value);
    setStatus(adminStatus, error.message, "error");
    throw error;
  }
}

function toSpecFields(rows) {
  return rows.map((row, index) => ({
    code:row[0],
    name:row[1],
    dataType:row[2],
    unit:row[3],
    compareDirection:row[4],
    sortOrder:(index + 1) * 10
  }));
}

async function ensureViewerProfile(user) {
  const userRef = doc(db, "users", user.uid);
  const snapshot = await getDoc(userRef);
  if (!snapshot.exists()) {
    await setDoc(userRef, {
      displayName:user.displayName || "",
      email:user.email || "",
      role:"viewer",
      createdAt:serverTimestamp(),
      updatedAt:serverTimestamp()
    });
    return "viewer";
  }
  return snapshot.data().role || "viewer";
}

async function requireAdmin(user) {
  const role = await ensureViewerProfile(user);
  currentRole = role;
  if (role !== "admin") {
    throw new Error(
      `บัญชีนี้มีสิทธิ์ ${role} กรุณาเปิด Firestore > users > ${user.uid} แล้วเปลี่ยน role เป็น admin`
    );
  }
}

async function loadOptions() {
  const [categorySnapshot, brandSnapshot] = await Promise.all([
    getDocs(collection(db, "categories")),
    getDocs(collection(db, "brands"))
  ]);

  categories = categorySnapshot.docs
    .map((item) => ({ id:item.id, ...item.data() }))
    .sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0));
  brands = brandSnapshot.docs
    .map((item) => ({ id:item.id, ...item.data() }))
    .sort((a,b) => a.name.localeCompare(b.name));

  categorySelect.innerHTML = categories.length
    ? categories.map((item) => `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.name)}</option>`).join("")
    : '<option value="">กรุณาสร้างข้อมูลเริ่มต้น</option>';
  brandSelect.innerHTML = brands.length
    ? brands.map((item) => `<option value="${escapeHtml(item.slug)}">${escapeHtml(item.name)}</option>`).join("")
    : '<option value="">กรุณาสร้างข้อมูลเริ่มต้น</option>';

  await renderSpecFields(categorySelect.value);
}

async function renderSpecFields(categorySlug, values = {}) {
  if (!categorySlug) {
    specFields.innerHTML = '<p class="note">เลือกหมวดสินค้าก่อน</p>';
    currentDefinitions = [];
    return;
  }

  const snapshot = await getDoc(doc(db, "specDefinitions", categorySlug));
  currentDefinitions = snapshot.exists() ? (snapshot.data().fields || []) : [];

  if (!currentDefinitions.length) {
    specFields.innerHTML = '<p class="note">ยังไม่มีนิยามสเปกสำหรับหมวดนี้</p>';
    return;
  }

  specFields.innerHTML = currentDefinitions
    .sort((a,b) => (a.sortOrder || 0) - (b.sortOrder || 0))
    .map((field) => {
      const value = values[field.code];
      const id = `spec-${field.code}`;

      if (field.dataType === "boolean") {
        return `
          <div class="field">
            <label for="${id}">${escapeHtml(field.name)}</label>
            <select class="control spec-input" id="${id}" data-code="${field.code}" data-type="boolean">
              <option value="">ไม่ระบุ</option>
              <option value="true" ${value === true ? "selected" : ""}>มี</option>
              <option value="false" ${value === false ? "selected" : ""}>ไม่มี</option>
            </select>
          </div>`;
      }

      return `
        <div class="field">
          <label for="${id}">${escapeHtml(field.name)}${field.unit ? ` (${escapeHtml(field.unit)})` : ""}</label>
          <input class="control spec-input" id="${id}" data-code="${field.code}" data-type="${field.dataType}"
            type="${field.dataType === "number" ? "number" : "text"}" step="any" value="${escapeHtml(value ?? "")}">
        </div>`;
    }).join("");
}

async function seedDefaults() {
  setStatus(adminStatus, "กำลังสร้างข้อมูลเริ่มต้น...");
  seedBtn.disabled = true;
  try {
    const batch = writeBatch(db);
    CATEGORY_SEEDS.forEach((item) => {
      batch.set(doc(db, "categories", item.slug), {
        ...item, isActive:true, updatedAt:serverTimestamp()
      }, { merge:true });
    });
    BRAND_SEEDS.forEach((item) => {
      batch.set(doc(db, "brands", item.slug), {
        ...item, updatedAt:serverTimestamp()
      }, { merge:true });
    });
    Object.entries(SPEC_SEEDS).forEach(([categorySlug, rows]) => {
      batch.set(doc(db, "specDefinitions", categorySlug), {
        categorySlug, fields:toSpecFields(rows), updatedAt:serverTimestamp()
      }, { merge:true });
    });
    await batch.commit();
    await loadOptions();
    setStatus(adminStatus, "สร้างข้อมูลเริ่มต้นสำเร็จ", "success");
  } catch (error) {
    console.error(error);
    setStatus(adminStatus, error.message, "error");
  } finally {
    seedBtn.disabled = false;
  }
}

function readSpecs() {
  const specs = {};
  document.querySelectorAll(".spec-input").forEach((input) => {
    if (input.value === "") return;
    let value = input.value;
    if (input.dataset.type === "number") {
      value = Number(value);
      if (!Number.isFinite(value)) return;
    } else if (input.dataset.type === "boolean") {
      value = value === "true";
    }
    specs[input.dataset.code] = value;
  });
  return specs;
}

async function saveProduct(event) {
  event.preventDefault();
  if (currentRole !== "admin") return;

  const saveBtn = document.getElementById("saveBtn");
  saveBtn.disabled = true;
  setStatus(adminStatus, "กำลังบันทึกสินค้า...");

  try {
    const existingId = document.getElementById("productId").value;
    const productRef = existingId
      ? doc(db, "products", existingId)
      : doc(collection(db, "products"));

    let previous = {};
    if (existingId) {
      const snapshot = await getDoc(productRef);
      previous = snapshot.exists() ? snapshot.data() : {};
    }

    const title = document.getElementById("title").value.trim();
    const model = document.getElementById("model").value.trim();
    const brandSlug = brandSelect.value;
    const brand = brands.find((item) => item.slug === brandSlug);
    await imageProcessingPromise;

    const previousImageDataUrl = previous.imageDataUrl || "";
    const previousExternalUrl = previous.primaryImageUrl || previous.imageUrls?.[0] || "";
    const imageDataUrl = removeCurrentImage
      ? ""
      : (pendingImageDataUrl || previousImageDataUrl);
    const primaryImageUrl = removeCurrentImage || imageDataUrl
      ? ""
      : previousExternalUrl;
    const imageUrls = primaryImageUrl ? [primaryImageUrl] : [];

    const data = {
      title,
      model,
      slug:document.getElementById("slug").value.trim(),
      categorySlug:categorySelect.value,
      brandSlug,
      brandName:brand?.name || brandSlug,
      price:Number(document.getElementById("price").value || 0),
      currency:"THB",
      warrantyMonths:Number(document.getElementById("warrantyMonths").value || 0),
      summary:document.getElementById("summary").value.trim(),
      description:document.getElementById("description").value.trim(),
      sourceUrl:document.getElementById("sourceUrl").value.trim(),
      status:document.getElementById("status").value,
      featured:previous.featured || false,
      specs:readSpecs(),
      imageUrls,
      imagePaths:[],
      imageDataUrl,
      primaryImageUrl,
      searchKeywords:[
        title.toLowerCase(),
        model.toLowerCase(),
        brandSlug.toLowerCase(),
        categorySelect.value.toLowerCase()
      ],
      updatedAt:serverTimestamp(),
      updatedBy:currentUser.uid
    };

    if (existingId) {
      await updateDoc(productRef, data);
    } else {
      await setDoc(productRef, {
        ...data,
        createdAt:serverTimestamp(),
        createdBy:currentUser.uid
      });
    }

    resetForm();
    setStatus(adminStatus, "บันทึกสินค้าสำเร็จ", "success");
  } catch (error) {
    console.error(error);
    setStatus(adminStatus, `บันทึกไม่สำเร็จ: ${error.message}`, "error");
  } finally {
    saveBtn.disabled = false;
  }
}

function resetForm() {
  productForm.reset();
  document.getElementById("productId").value = "";
  existingImageDataUrlInput.value = "";
  pendingImageDataUrl = "";
  removeCurrentImage = false;
  imageProcessingPromise = Promise.resolve();
  updateImagePreview("");
  formTitle.textContent = "เพิ่มสินค้า";
  cancelEditBtn.classList.add("hidden");
  renderSpecFields(categorySelect.value).catch(console.error);
}

async function editProduct(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product) return;

  document.getElementById("productId").value = product.id;
  document.getElementById("title").value = product.title || "";
  document.getElementById("model").value = product.model || "";
  document.getElementById("slug").value = product.slug || "";
  document.getElementById("status").value = product.status || "draft";
  categorySelect.value = product.categorySlug || "";
  brandSelect.value = product.brandSlug || "";
  document.getElementById("price").value = product.price ?? "";
  document.getElementById("warrantyMonths").value = product.warrantyMonths ?? "";
  document.getElementById("summary").value = product.summary || "";
  document.getElementById("description").value = product.description || "";
  document.getElementById("sourceUrl").value = product.sourceUrl || "";

  const currentImage = getProductImage(product);
  existingImageDataUrlInput.value = currentImage;
  pendingImageDataUrl = "";
  removeCurrentImage = false;
  productImageInput.value = "";
  updateImagePreview(currentImage);

  await renderSpecFields(product.categorySlug, product.specs || {});
  formTitle.textContent = `แก้ไข: ${product.title}`;
  cancelEditBtn.classList.remove("hidden");
  window.scrollTo({ top:0, behavior:"smooth" });
}

async function deleteProductById(productId) {
  const product = products.find((item) => item.id === productId);
  if (!product || !confirm(`ลบสินค้า "${product.title}" ใช่หรือไม่`)) return;

  setStatus(adminStatus, "กำลังลบสินค้า...");
  try {
    await deleteDoc(doc(db, "products", productId));
    setStatus(adminStatus, "ลบสินค้าสำเร็จ", "success");
  } catch (error) {
    console.error(error);
    setStatus(adminStatus, `ลบไม่สำเร็จ: ${error.message}`, "error");
  }
}

function renderProducts() {
  const keyword = adminSearch.value.trim().toLowerCase();
  const filtered = products.filter((product) =>
    [product.title, product.model, product.brandName, product.categorySlug]
      .filter(Boolean).join(" ").toLowerCase().includes(keyword)
  );

  productList.innerHTML = filtered.length
    ? filtered.map((product) => `
      <article class="product-row">
        ${getProductImage(product)
          ? `<img class="thumb" src="${escapeHtml(getProductImage(product))}" alt="">`
          : '<div class="thumb placeholder">ไม่มีรูป</div>'}
        <div>
          <div class="product-title">${escapeHtml(product.title)}</div>
          <div class="product-meta">${escapeHtml(product.brandName || "")} · ${escapeHtml((product.categorySlug || "").toUpperCase())} · ${escapeHtml(product.status || "draft")}</div>
        </div>
        <div class="row-actions">
          <button class="btn btn-light edit-btn" data-id="${product.id}" type="button">แก้ไข</button>
          <button class="btn btn-danger delete-btn" data-id="${product.id}" type="button">ลบ</button>
        </div>
      </article>`).join("")
    : '<p class="note">ยังไม่มีสินค้า</p>';
}

function watchProducts() {
  unsubscribeProducts?.();
  const productsQuery = query(collection(db, "products"), orderBy("updatedAt", "desc"));
  unsubscribeProducts = onSnapshot(productsQuery, (snapshot) => {
    products = snapshot.docs.map((item) => ({ id:item.id, ...item.data() }));
    renderProducts();
  }, (error) => {
    console.error(error);
    setStatus(adminStatus, error.message, "error");
  });
}

authForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  setStatus(authStatus, "กำลังเข้าสู่ระบบ...");
  try {
    await loginWithEmail(
      document.getElementById("email").value.trim(),
      document.getElementById("password").value
    );
  } catch (error) {
    console.error(error);
    setStatus(authStatus, error.message, "error");
  }
});

logoutBtn.addEventListener("click", () => logout());
seedBtn.addEventListener("click", seedDefaults);
productForm.addEventListener("submit", saveProduct);
categorySelect.addEventListener("change", () => renderSpecFields(categorySelect.value));
adminSearch.addEventListener("input", renderProducts);
cancelEditBtn.addEventListener("click", resetForm);

productImageInput.addEventListener("change", () => {
  imageProcessingPromise = handleProductImageChange().catch(() => undefined);
});

removeImageBtn.addEventListener("click", () => {
  pendingImageDataUrl = "";
  removeCurrentImage = true;
  existingImageDataUrlInput.value = "";
  productImageInput.value = "";
  updateImagePreview("");
  setStatus(adminStatus, "ลบรูปออกจากสินค้าแล้ว กดบันทึกเพื่อยืนยัน", "success");
});

document.getElementById("title").addEventListener("input", (event) => {
  if (!document.getElementById("productId").value) {
    document.getElementById("slug").value = slugify(event.target.value);
  }
});

productList.addEventListener("click", (event) => {
  const editButton = event.target.closest(".edit-btn");
  const deleteButton = event.target.closest(".delete-btn");
  if (editButton) editProduct(editButton.dataset.id);
  if (deleteButton) deleteProductById(deleteButton.dataset.id);
});

if (!firebaseConfigured) {
  setStatus(authStatus, "ยังไม่ได้ตั้งค่า frontend/js/firebase-config.js", "error");
} else {
  setStatus(authStatus, "Firebase พร้อมแล้ว กรุณาเข้าสู่ระบบ", "success");

  onAuthStateChanged(auth, async (user) => {
    currentUser = user;

    if (!user) {
      currentRole = null;
      authPanel.classList.remove("hidden");
      adminPanel.classList.add("hidden");
      logoutBtn.classList.add("hidden");
      unsubscribeProducts?.();
      return;
    }

    setStatus(authStatus, "กำลังตรวจสอบสิทธิ์...");
    try {
      await requireAdmin(user);
      await loadOptions();
      watchProducts();
      authPanel.classList.add("hidden");
      adminPanel.classList.remove("hidden");
      logoutBtn.classList.remove("hidden");
      setStatus(adminStatus, `เข้าสู่ระบบด้วย ${user.email}`, "success");
    } catch (error) {
      console.error(error);
      setStatus(authStatus, error.message, "error");
      await logout();
    }
  });
}
