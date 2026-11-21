"use strict";

const styles = ["親子共學", "工藝文化", "自然攝影", "戶外騎行", "藝文觀展", "賞花散步"];
const counties = "臺北市 新北市 基隆市 桃園市 新竹市 新竹縣 苗栗縣 臺中市 彰化縣 南投縣 雲林縣 嘉義市 嘉義縣 臺南市 高雄市 屏東縣 宜蘭縣 花蓮縣 臺東縣 澎湖縣 金門縣 連江縣".split(" ");
const features = [
  ["親子", "yilan-traditional-arts", "family", ["親子共學", "工藝文化"]],
  ["情侶", "nantou-xiangshan-cycling", "couple", ["戶外騎行", "自然攝影"]],
  ["熟齡", "chiayi-npm-south", "senior", ["藝文觀展"]]
];
const weeklyNotes = ["newtaipei-christmasland-2026", "taipei-shilin-chrysanthemums-2026", "taichung-gaomei-boardwalk"];
const money = new Intl.NumberFormat("zh-TW", { style: "currency", currency: "TWD", maximumFractionDigits: 0 });
const taipeiDate = new Intl.DateTimeFormat("sv-SE", { timeZone: "Asia/Taipei", year: "numeric", month: "2-digit", day: "2-digit" });
const today = () => taipeiDate.format(new Date());
const byId = (id) => document.getElementById(id);
const form = byId("preferences");
let catalogRequest;
let researchRequest;
let searchVersion = 0;

function element(tag, content, className) {
  const node = document.createElement(tag);
  if (content) node.textContent = content;
  if (className) node.className = className;
  return node;
}

function link(title, href, className) {
  const anchor = element("a", title, className);
  anchor.href = href;
  return anchor;
}

async function json(path) {
  if (location.protocol === "file:") {
    const snapshot = document.querySelector(path.startsWith("research/") ? "#offline-research" : "#offline-demo");
    if (!snapshot) throw new Error("找不到內嵌的離線資料");
    return JSON.parse(snapshot.textContent);
  }
  const response = await fetch(path);
  if (!response.ok) throw new Error("無法讀取資料");
  return response.json();
}

function getResearch() {
  if (!researchRequest) {
    researchRequest = json("research/travel-data.json").then(research => {
      if (!Array.isArray(research.records)) throw new Error("研究資料格式不符");
      return new Map(research.records.map(record => [record.id, record]));
    }).catch(error => {
      researchRequest = undefined;
      throw error;
    });
  }
  return researchRequest;
}

function getCatalog() {
  if (!catalogRequest) {
    catalogRequest = Promise.all([getResearch(), json("data/mock/plans-模擬資料.json")]).then(([records, demo]) => {
      if (demo.simulationLabel !== "模擬資料" || !Array.isArray(demo.plans)) {
        throw new Error("資料格式不符");
      }
      return { records, demo };
    }).catch(error => {
      catalogRequest = undefined;
      throw error;
    });
  }
  return catalogRequest;
}

function plusDays(date, days) {
  const value = new Date(`${date}T00:00:00Z`);
  value.setUTCDate(value.getUTCDate() + days);
  return Number.isFinite(value.getTime()) ? value.toISOString().split("T")[0] : "";
}

function recordStatus(record, now) {
  if (!record) return "研究來源待確認";
  if (record.activityDates.end && now > record.activityDates.end) return `已過期・展期截止 ${record.activityDates.end}`;
  if (record.reviewBy && now > record.reviewBy) return `已過期・複查期限 ${record.reviewBy}`;
  if (record.status !== "已驗證") return record.id === "taichung-gaomei-boardwalk" ? "木棧道通行待確認" : "到訪條件待確認";
  if (record.activityDates.start && now < record.activityDates.start) return "即將開始";
  return "";
}

function sources(record) {
  const list = element("ul");
  for (const source of record.sources) {
    const item = element("li");
    item.append(link(source.name, source.url), `（${source.accessedOn} 查詢）`);
    list.append(item);
  }
  const details = element("details");
  details.append(element("summary", "研究來源"), element("p", `研究編號 ${record.id}`), list);
  return details;
}

function renderWeekly(records) {
  const now = today();
  const cards = byId("weekly-cards");
  const notes = byId("weekly-notes");
  cards.replaceChildren();
  notes.replaceChildren();
  for (const [audience, id, imageName, preferred] of features) {
    const record = records.get(id);
    if (!record) continue;
    const card = element("article", "", "tile");
    const image = element("img");
    image.src = `assets/ppt-watercolor-${imageName}.png`;
    image.alt = "";
    image.loading = "lazy";
    card.append(image, element("p", audience, "eyebrow"), element("h3", record.name), element("p", record.features));
    const status = recordStatus(record, now);
    if (status) card.append(element("p", status, "badge"), element("p", record.visitNotes));
    card.append(sources(record));
    if (!status) {
      const cta = link(`規劃${audience}行程`, "#planner", "button outline");
      cta.addEventListener("click", () => {
        form.elements.audience.value = audience;
        for (const box of form.querySelectorAll('[name="style"]')) box.checked = preferred.includes(box.value);
        hideResults();
      });
      card.append(cta);
    }
    cards.append(card);
  }
  for (const id of weeklyNotes) {
    const record = records.get(id);
    if (!record) continue;
    const details = element("details", "", "tile");
    const { start, end } = record.activityDates;
    const status = recordStatus(record, now);
    details.append(element("summary", `${record.name}${status ? `｜${status}` : ""}`));
    if (start && end) details.append(element("p", `活動展期 ${start} 至 ${end}`));
    details.append(element("p", record.visitNotes), sources(record));
    notes.append(details);
  }
  notes.append(link("閱讀完整週報", "docs/weekly-report.md"));
}

function retryButton(action) {
  const button = element("button", "重試", "button outline");
  button.type = "button";
  button.addEventListener("click", action);
  return button;
}

async function loadWeekly() {
  try {
    renderWeekly(await getResearch());
  } catch {
    byId("weekly-notes").replaceChildren(element("p", "暫時無法讀取週報。"), retryButton(loadWeekly));
  }
}

function matchPlans(input, catalog, now) {
  const matches = [];
  const reasons = new Set();
  const { demo, records } = catalog;
  if (input.mode === "official") return { matches, reasons: ["目前尚無旅行社提供的已查核報價方案。"] };
  if (now > demo.validTo) return { matches, reasons: [`示範報價已過期（${demo.validTo}）。`] };

  const travelEnd = plusDays(input.date, input.days - 1);
  for (const plan of demo.plans.filter(item => item.audience === input.audience)) {
    const visits = plan.schedule.map(([id, description], index) => ({
      id, record: records.get(id), description, date: plusDays(input.date, index)
    }));
    const hits = plan.styles.filter(style => input.styles.includes(style));
    const errors = [];
    if (plan.schedule.length !== input.days) errors.push("可用方案的天數與所選天數不同。");
    if (input.people < plan.minPeople || input.people > plan.maxPeople) errors.push("同行人數超出方案報價的適用範圍。");
    if (!travelEnd || input.date < demo.validFrom || travelEnd > demo.validTo) errors.push("出遊日期超出示範方案適用期間。");
    if (input.destination && !visits.some(visit => visit.record?.region.city === input.destination)) errors.push("所選目的地沒有符合的停留點。");
    if (input.origin && plan.origin !== input.origin) errors.push("方案報價未涵蓋所選出發地。");
    if (input.walk !== null && (!Number.isSafeInteger(plan.walk) || plan.walk > input.walk)) errors.push("方案的步行負荷超過上限或尚待確認。");
    if (!input.facilities.every(facility => plan.facilities.includes(facility))) errors.push("方案未確認具備你需要的設施。");
    for (const visit of visits.filter(item => item.id)) {
      const status = recordStatus(visit.record, now);
      if (status.includes("待確認") || status.includes("已過期")) errors.push(`${visit.record?.name ?? visit.id}｜${status}。`);
      if (visit.record?.type === "活動") {
        const { start, end, status: dateStatus } = visit.record.activityDates;
        if (!start || !end || dateStatus !== "已驗證") errors.push("活動日期待確認。");
        else if (visit.date < start || visit.date > end) errors.push("實際到訪日超出活動展期。");
      }
    }
    const hasPrice = Number.isSafeInteger(plan.minPrice) && Number.isSafeInteger(plan.maxPrice)
      && plan.minPrice >= 0 && plan.minPrice <= plan.maxPrice && plan.included && plan.excluded;
    if (!hasPrice) errors.push("方案價格待確認。");
    else if (plan.maxPrice > input.budget) errors.push("方案全團總價上限超出預算。");
    if (!hits.length) errors.push("可用方案與所選的旅遊風格沒有交集。");
    if (errors.length) errors.forEach(error => reasons.add(error));
    else matches.push({ plan, hits, visits });
  }
  matches.sort((a, b) => b.hits.length - a.hits.length || a.plan.maxPrice - b.plan.maxPrice || a.plan.id.localeCompare(b.plan.id, "en"));
  return { matches: matches.slice(0, 3), reasons: [...reasons] };
}

function hideResults() {
  searchVersion++;
  byId("results").hidden = true;
  byId("copy-status").textContent = "";
}

function validate() {
  const data = new FormData(form);
  const input = Object.fromEntries(data);
  input.styles = data.getAll("style");
  input.facilities = data.getAll("facility");
  const errors = {};
  if (!input.audience) errors.audience = "請選擇旅客類型。";
  if (!/^\d{4}-\d{2}-\d{2}$/.test(input.date) || input.date < today()) errors.date = "請選擇今天或之後的出發日期（台北時間）。";
  for (const [key, message] of Object.entries({
    people: "請輸入正整數人數。", budget: "請輸入正整數的新臺幣金額。", days: "請輸入正整數天數。"
  })) {
    input[key] = Number(input[key]);
    if (!Number.isSafeInteger(input[key]) || input[key] < 1) errors[key] = message;
  }
  if (!input.styles.length) errors.style = "請至少選擇一項旅遊風格。";
  input.walk = input.walk === "" ? null : Number(input.walk);
  if (byId("walk").validity.badInput || (input.walk !== null && (!Number.isSafeInteger(input.walk) || input.walk < 0))) {
    errors.walk = "請輸入 0 或以上的整數分鐘數。";
  }
  let firstInvalid;
  for (const key of ["audience", "date", "people", "budget", "days", "style", "walk"]) {
    byId(`${key}-error`).textContent = errors[key] || "";
    const field = byId(key) || form.querySelector(`[name="${key}"]`);
    if (errors[key]) {
      field.setAttribute("aria-invalid", "true");
      firstInvalid ||= field;
    } else field.removeAttribute("aria-invalid");
  }
  if (firstInvalid) {
    const details = firstInvalid.closest("details");
    if (details) details.open = true;
    firstInvalid.focus();
    return null;
  }
  return input;
}

function updateConsult(input, plan) {
  byId("consult-text").value = [
    input.mode === "demo" ? "【模擬資料】旅行諮詢需求" : "旅行諮詢需求",
    `${input.audience}・${input.date} 出發・${input.days} 天・${input.people} 人`,
    `預算上限 ${money.format(input.budget)}（新臺幣／全團全程）`,
    `風格 ${input.styles.join("、")}`,
    `目的地 ${input.destination || "不限"}；出發地 ${input.origin || "不限"}`,
    `步行 ${input.walk === null ? "未指定" : `最長連續 ${input.walk} 分鐘`}；必需設施 ${input.facilities.join("、") || "未指定"}`,
    `選擇方案 ${plan ? `${plan.name}（模擬資料）` : "尚未選擇"}`
  ].join("\n");
  byId("copy-status").textContent = "";
}

function resultCard({ plan, hits, visits }, input, demo) {
  const card = element("article", "", "tile");
  const price = plan.minPrice === plan.maxPrice ? money.format(plan.maxPrice) : `${money.format(plan.minPrice)} 至 ${money.format(plan.maxPrice)}`;
  card.append(
    element("p", "模擬資料｜示範價格與虛構方案", "badge"),
    element("h3", plan.name),
    element("p", price, "price"),
    element("p", `新臺幣／全團全程・${plan.minPeople}–${plan.maxPeople} 人適用・${plan.origin}集合`),
    element("p", `推薦理由｜符合${input.audience}、${input.days} 天與全團預算，並符合你選的${hits.join("、")}。`),
    element("p", `示範步行上限 ${plan.walk} 分鐘；適用出遊與報價截止 ${demo.validTo}。`)
  );
  const details = element("details");
  details.append(element("summary", "分日行程、費用與來源"));
  for (const [index, visit] of visits.entries()) {
    details.append(element("h4", `第 ${index + 1} 天｜${visit.date}`), element("p", visit.description));
    if (visit.record) details.append(element("p", visit.record.visitNotes), sources(visit.record));
  }
  details.append(element("p", `示範費用包含｜${plan.included}`), element("p", `示範費用未含｜${plan.excluded}`));
  const choose = element("button", "選入諮詢摘要", "button outline");
  choose.type = "button";
  choose.setAttribute("aria-pressed", "false");
  choose.addEventListener("click", () => {
    for (const sibling of byId("result-content").querySelectorAll("[aria-pressed]")) {
      sibling.setAttribute("aria-pressed", String(sibling === choose));
      sibling.textContent = sibling === choose ? "已選入諮詢摘要" : "選入諮詢摘要";
    }
    updateConsult(input, plan);
    byId("copy-status").textContent = `已選擇${plan.name}。`;
  });
  card.append(details, choose);
  return card;
}

async function search(input) {
  const version = ++searchVersion;
  const results = byId("results");
  const status = byId("result-status");
  const content = byId("result-content");
  results.hidden = false;
  status.textContent = "正在比對行程。";
  byId("applied").textContent = `${input.mode === "demo" ? "模擬資料｜" : ""}${input.audience}・${input.date}・${input.days} 天・${input.people} 人・${money.format(input.budget)}／全團・${input.styles.join("、")}・出發地 ${input.origin || "不限"}・目的地 ${input.destination || "不限"}・連續步行 ${input.walk === null ? "未指定" : `${input.walk} 分鐘`}・設施 ${input.facilities.join("、") || "未指定"}`;
  content.replaceChildren();
  updateConsult(input);
  byId("result-title").focus();
  try {
    const catalog = input.mode === "demo" ? await getCatalog() : {};
    if (version !== searchVersion) return;
    const { matches, reasons } = matchPlans(input, catalog, today());
    if (matches.length) {
      status.textContent = `找到 ${matches.length} 個符合條件的模擬方案。`;
      const grid = element("div", "", "tiles");
      grid.append(...matches.map(match => resultCard(match, input, catalog.demo)));
      content.append(grid);
      return;
    }
    status.textContent = "目前沒有符合條件且已核對的方案。";
    const list = element("ul");
    for (const reason of reasons) list.append(element("li", reason));
    content.append(list, element("p", "可返回調整條件，或複製諮詢摘要。"));
  } catch {
    if (version !== searchVersion) return;
    status.textContent = "暫時無法讀取方案。";
    content.append(retryButton(() => { void search(input); void loadWeekly(); }));
  }
}

for (const style of styles) {
  const label = element("label");
  const box = element("input");
  box.type = "checkbox";
  box.name = "style";
  box.value = style;
  label.append(box, style);
  byId("styles").append(label);
}
for (const name of ["destination", "origin"]) {
  for (const county of counties) byId(name).add(new Option(county, county));
}
byId("date").min = today();
form.addEventListener("input", () => {
  hideResults();
  byId("demo-badge").hidden = byId("mode").value !== "demo";
  byId("mode-note").textContent = byId("mode").value === "demo"
    ? "方案、價格與成行條件皆為模擬資料。景點介紹附研究來源。"
    : "待旅行社提供已查核的正式方案與報價。";
});
form.addEventListener("submit", event => {
  event.preventDefault();
  const input = validate();
  if (input) void search(input);
  else hideResults();
});
byId("copy").addEventListener("click", async () => {
  const summary = byId("consult-text");
  try {
    await navigator.clipboard.writeText(summary.value);
    byId("copy-status").textContent = "已複製諮詢需求。";
  } catch {
    summary.focus();
    summary.select();
    byId("copy-status").textContent = "已選取摘要，可使用裝置的複製功能。";
  }
});
void loadWeekly();
