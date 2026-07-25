const SUPABASE_URL = "https://piynqxvjhjeqblyszftc.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InBpeW5xeHZqaGplcWJseXN6ZnRjIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODQ5Nzg1MTUsImV4cCI6MjEwMDU1NDUxNX0.nfQR8PP9OloZZlfABxwM-jqKpCGZLAnfhNGRhTAb8Uk";
const EDONET = "https://www.shisetsuyoyaku.city.edogawa.tokyo.jp/user/Home";

const venues = [
  ["Ichinoe","一之江コミュニティ会館","#2f80ed"],["Plaza Ichinoe","コミュニティプラザ一之江","#8b5cf6"],
  ["Matsue","松江区民プラザ","#ff6257"],["Matsushima","松島コミュニティ会館","#ef7b32"],
  ["Bunka Sports Plaza","文化スポーツプラザ","#13a46b"],["Komatsugawa Sakura","小松川さくらホール","#e84d91"],
  ["Hirai","平井コミュニティ会館","#31a64a"],["Naka-Hirai","中平井コミュニティ会館","#08a5a5"],
  ["Kita-Kasai","北葛西コミュニティ会館","#7457d9"],["Ninoe","二之江コミュニティ会館","#d49a19"],
  ["Rinkai-cho","臨海町コミュニティ会館","#1d9bd1"],["Higashi-Kasai","東葛西コミュニティ会館","#c45a7b"],
  ["Nagashima-Kuwagawa","長島桑川コミュニティ会館","#1f8a70"],["Nishi-Koiwa","西小岩コミュニティ会館","#6277d9"],
  ["Kita-Koiwa","北小岩コミュニティ会館","#db6d32"],["Minami-Koiwa","南小岩コミュニティ会館","#769e23"],
  ["Shinozaki","篠崎コミュニティ会館","#a55bb8"],
].map(([name,japanese,color],id)=>({id,name,japanese,color}));
const periods = [["all","All","All day"],["am","AM","Morning"],["pm","PM–6","Until 6 PM"],["eve","6–9:30","Evening"]];
const headers = { apikey: SUPABASE_ANON_KEY, Authorization: `Bearer ${SUPABASE_ANON_KEY}` };
const state = {
  month: "2026-07",
  day: 27,
  period: "all",
  selected: new Set(venues.map(v=>v.id)),
  slots: [],
};
const $ = id => document.getElementById(id);
const escapeHtml = value => String(value ?? "").replace(/[&<>"']/g, character => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[character]));

function monthBounds() {
  const [year, month] = state.month.split("-").map(Number);
  const next = month === 12 ? `${year + 1}-01-01` : `${year}-${String(month + 1).padStart(2,"0")}-01`;
  return {year, month, next};
}

function visibleSlots() {
  return state.slots.filter(slot => state.selected.has(slot.venue) && (state.period === "all" || slot.period === state.period));
}

function renderPeriods() {
  $("periods").innerHTML = periods.map(([id,label,detail]) =>
    `<button data-period="${id}" class="${state.period === id ? "active" : ""}"><b>${label}</b><small>${detail}</small></button>`
  ).join("");
  $("periods").querySelectorAll("button").forEach(button => button.onclick = () => {
    state.period = button.dataset.period;
    render();
  });
}

function renderVenues() {
  const selected = venues.filter(venue => state.selected.has(venue.id));
  $("selected-count").textContent = selected.length === venues.length ? "All venues selected" : `${selected.length} venues selected`;
  $("chips").innerHTML = selected.slice(0,4).map(venue =>
    `<button data-id="${venue.id}" style="--v:${venue.color}"><b>✓</b>${escapeHtml(venue.name)}</button>`
  ).join("") + (selected.length > 4 ? `<span>+${selected.length - 4}</span>` : "") +
    (selected.length ? "" : `<button class="choose" id="choose">Select venues</button>`);
  $("chips").querySelectorAll("[data-id]").forEach(button => button.onclick = () => toggleVenue(Number(button.dataset.id)));
  if ($("choose")) $("choose").onclick = openSheet;
  $("legend").innerHTML = selected.slice(0,7).map(venue =>
    `<span><i style="background:${venue.color}"></i>${escapeHtml(venue.name)}</span>`
  ).join("");
}

function renderCalendar() {
  const {year,month} = monthBounds();
  const first = new Date(year, month - 1, 1);
  const lastDay = new Date(year, month, 0).getDate();
  const leading = (first.getDay() + 6) % 7;
  $("month-title").textContent = first.toLocaleDateString("en-GB",{month:"long",year:"numeric"});
  const slots = visibleSlots();
  let html = Array.from({length:leading},()=>`<span class="blank"></span>`).join("");
  for (let day=1; day<=lastDay; day++) {
    const ids = [...new Set(slots.filter(slot=>slot.day===day).map(slot=>slot.venue))];
    html += `<button class="date ${state.day===day?"selected":""}" data-day="${day}"><b>${day}</b><span>${ids.map(id=>`<i style="background:${venues[id].color}"></i>`).join("")}</span></button>`;
  }
  $("days").innerHTML = html;
  $("days").querySelectorAll("button").forEach(button => button.onclick = () => {
    state.day = Number(button.dataset.day);
    render();
  });
}

function renderSlots() {
  const {year,month} = monthBounds();
  const date = new Date(year, month - 1, state.day);
  const slots = visibleSlots().filter(slot=>slot.day===state.day);
  $("date-title").textContent = date.toLocaleDateString("en-GB",{month:"short",day:"numeric"});
  $("slot-count").textContent = `${slots.length} available slot${slots.length===1?"":"s"}`;
  $("slots").innerHTML = slots.length ? slots.map((slot,index)=>{
    const venue = venues[slot.venue];
    return `<article style="--v:${venue.color}">
      <i></i><div><h3>${escapeHtml(venue.name)}</h3><p>${escapeHtml(slot.room)}</p></div>
      <strong>${escapeHtml(slot.time)}</strong><em>Available</em>
      <a href="${EDONET}" target="_blank" rel="noreferrer">View</a>
    </article>`;
  }).join("") : `<div class="empty">No openings match the selected venues and time.</div>`;
}

function renderOptions(filter="") {
  const search = filter.trim().toLowerCase();
  $("options").innerHTML = venues.filter(venue => `${venue.name} ${venue.japanese}`.toLowerCase().includes(search)).map(venue =>
    `<button data-id="${venue.id}" class="${state.selected.has(venue.id)?"chosen":""}">
      <i style="background:${venue.color}"></i><span><b>${escapeHtml(venue.name)}</b><small>${escapeHtml(venue.japanese)}</small></span>
      <strong>${state.selected.has(venue.id)?"✓":""}</strong>
    </button>`
  ).join("");
  $("options").querySelectorAll("button").forEach(button => button.onclick = () => {
    toggleVenue(Number(button.dataset.id));
    renderOptions($("search").value);
  });
}

function toggleVenue(id) {
  state.selected.has(id) ? state.selected.delete(id) : state.selected.add(id);
  render();
}
function render() {
  renderPeriods();
  renderVenues();
  renderCalendar();
  renderSlots();
}
function openSheet() {
  $("backdrop").classList.remove("hidden");
  renderOptions();
}
function closeSheet() { $("backdrop").classList.add("hidden"); }

async function loadMonth() {
  $("status").textContent = "Loading live availability…";
  try {
    const {next} = monthBounds();
    const query = new URLSearchParams({
      select:"date,facility,room,status,slot_start,slot_end,time_period,checked_at",
      date:`gte.${state.month}-01`,
      order:"date.asc,facility.asc,slot_start.asc",
    });
    query.append("date",`lt.${next}`);
    const response = await fetch(`${SUPABASE_URL}/rest/v1/edonet_availability?${query}`,{headers});
    if (!response.ok) throw new Error(`SlotDB returned ${response.status}`);
    const rows = await response.json();
    state.slots = rows.map(row => {
      const venue = venues.find(item=>item.japanese===row.facility);
      return venue ? {
        day:Number(row.date.slice(-2)), venue:venue.id, period:row.time_period || "day",
        time:row.slot_start && row.slot_end ? `${row.slot_start.slice(0,5)}–${row.slot_end.slice(0,5)}` : "Time pending",
        room:row.room,
      } : null;
    }).filter(Boolean);
    $("status").textContent = `${state.slots.length} live openings from SlotDB`;
  } catch (error) {
    state.slots = [];
    $("status").textContent = `Could not load SlotDB: ${error.message}`;
  }
  render();
}

async function requestScan() {
  const button = $("refresh");
  button.disabled = true;
  button.textContent = "…";
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/edonet_scan_requests`,{
      method:"POST",
      headers:{...headers,"Content-Type":"application/json",Prefer:"return=minimal"},
      body:JSON.stringify({month:state.month,status:"pending"}),
    });
    if (!response.ok && response.status !== 409) throw new Error(`Request failed (${response.status})`);
    $("status").textContent = response.status === 409 ? "A scan is already queued for this month." : "Fresh scan requested. The PC worker will collect it within 10 minutes.";
  } catch (error) {
    $("status").textContent = error.message;
  } finally {
    button.disabled = false;
    button.textContent = "↻";
  }
}

function shiftMonth(amount) {
  const {year,month} = monthBounds();
  const value = new Date(year,month - 1 + amount,1);
  state.month = `${value.getFullYear()}-${String(value.getMonth()+1).padStart(2,"0")}`;
  state.day = 1;
  state.slots = [];
  render();
  loadMonth();
}

$("refresh").onclick = requestScan;
$("manage").onclick = openSheet;
$("close").onclick = closeSheet;
$("done").onclick = closeSheet;
$("backdrop").onclick = event => { if (event.target === $("backdrop")) closeSheet(); };
$("select-all").onclick = () => { state.selected = new Set(venues.map(v=>v.id)); render(); renderOptions($("search").value); };
$("clear").onclick = () => { state.selected.clear(); render(); renderOptions($("search").value); };
$("search").oninput = event => renderOptions(event.target.value);
$("previous").onclick = () => shiftMonth(-1);
$("next").onclick = () => shiftMonth(1);
render();
loadMonth();
