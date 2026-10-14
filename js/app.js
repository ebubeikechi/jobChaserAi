(() => {
"use strict";
const CFG = Object.assign({WEBHOOK_URL:"",LINKEDIN_POST_URL:"#",TIMEOUT_MS:45000}, window.JOBCHASER_CONFIG);
const QS = [["Ready to escape your current job? 👀","Yes, obviously"],["Are you sure your CV is ready for fame? 😂","Born ready"],["One last thing... how badly do you want that offer? 🏃","Desperately"]];
const LOAD = ["Negotiating with the LinkedIn algorithm...","Convincing recruiters you're the chosen one...","Filtering out jobs requiring 17 years of experience for an entry-level role...","Checking whether \"competitive salary\" means exposure...","Preparing your escape plan..."];
const TICK = ["Searching the job market at suspicious speeds.","Rehearsing interview answers nobody asked for.","Refreshing LinkedIn so you don't have to."];
const NOTES = ["You just helped Ebube find his next opportunity. Your own destiny is still loading.","Recruiters have been notified. Just kidding. Ebube is the only one getting these results.","You came looking for your dream job and accidentally became Ebube's unpaid research assistant.","Congratulations! Your search effort has contributed to Ebube's career development.","Three clicks, one chase, zero jobs for you. Ebube says thanks."];
const DEMO = [{title:"Senior Dream Job Specialist",company:"Acme Imagination Ltd",location:"Remote",url:"#"},{title:"Chief Vibes Officer",company:"Totally Real Co.",location:"Lagos / Remote",url:"#"},{title:"Workflow Wrangler",company:"n8n Fan Club",location:"Anywhere",url:"#"}];

const $ = id => document.getElementById(id);
const root = document.documentElement;
const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
const go = $("go"), arena = $("arena");
let tries = 0, inflight = false;
$("li").href = CFG.LINKEDIN_POST_URL;

/* parallax + glow follow pointer */
addEventListener("pointermove", e => {
  root.style.setProperty("--mx", (e.clientX / innerWidth - .5) * 2);
  root.style.setProperty("--my", (e.clientY / innerHeight - .5) * 2);
  root.style.setProperty("--gx", e.clientX / innerWidth);
  root.style.setProperty("--gy", e.clientY / innerHeight);
}, {passive:true});

let ti = 0;
setInterval(() => { ti = (ti + 1) % TICK.length; $("ticker").textContent = TICK[ti]; }, 4200);

function stage(id){
  document.querySelectorAll("[data-stage]").forEach(s => s.hidden = s.id !== id);
  const h = $(id).querySelector("[tabindex='-1']"); if (h) h.focus({preventScroll:true});
  scrollTo({top:0, behavior: reduce ? "auto" : "smooth"});
}
function pop(el){ el.classList.remove("pop"); void el.offsetWidth; el.classList.add("pop"); }

function normalizeWebhookResponse(data){
  const rows = Array.isArray(data) ? data : Array.isArray(data?.jobs) ? data.jobs : data && typeof data === "object" ? [data] : [];
  const statsRow = Array.isArray(data) ? data.find(row => row && row._stats) : data;
  const stats = statsRow && statsRow._stats ? statsRow._stats : {};
  const totalRow = rows.find(row => row && row.total != null);
  const jobs = rows
    .filter(row => row && typeof row === "object" && !row._stats)
    .map(row => row.json && typeof row.json === "object" ? row.json : row)
    .filter(job => job.jobId || job.job_id || job.title || job.job_title || job.jobTitle || job.url || job.link)
    .map(job => {
      const jobId = String(job.jobId || job.job_id || "").trim();
      const workplace = String(job.workplaceHint || job.workplaceType || "").trim();
      let location = String(job.locationRaw || job.location || "").trim();
      if (workplace && !location.toLowerCase().includes(workplace.toLowerCase())) {
        location = location ? location + " · " + workplace : workplace;
      }
      return {
        jobId,
        title: String(job.title || job.job_title || job.jobTitle || "Untitled role").trim(),
        company: String(job.company || job.companyName || "").trim(),
        location,
        url: String(job.url || job.link || (jobId ? "https://www.linkedin.com/jobs/view/" + jobId + "/" : "")).trim()
      };
    });
  const uniqueByKey = new Map();
  jobs.forEach((job, index) => {
    const key = job.jobId || job.url || job.title + "|" + job.company + "|" + job.location || String(index);
    if (!uniqueByKey.has(key)) uniqueByKey.set(key, job);
    else {
      const existing = uniqueByKey.get(key);
      uniqueByKey.set(key, {
        ...job,
        ...Object.fromEntries(Object.entries(existing).filter(([, value]) => value))
      });
    }
  });
  const uniqueJobs = [...uniqueByKey.values()];
  return {jobs: uniqueJobs, stats, visitorCount: Number(data?.visitorCount ?? data?.total ?? totalRow?.total) || 0};
}

/* dodging orb: always clamped inside the arena */
function place(x, y){
  const m = 14, mx = arena.clientWidth - go.offsetWidth - m, my = arena.clientHeight - go.offsetHeight - m;
  go.style.left = Math.min(Math.max(m, x), Math.max(m, mx)) + "px";
  go.style.top = Math.min(Math.max(m, y), Math.max(m, my)) + "px";
}
const center = () => place((arena.clientWidth - go.offsetWidth) / 2, (arena.clientHeight - go.offsetHeight) / 2);
function dodge(){
  const cx = parseFloat(go.style.left) || 0, cy = parseFloat(go.style.top) || 0;
  let x, y, n = 0;
  do { x = Math.random() * arena.clientWidth; y = Math.random() * arena.clientHeight; n++; }
  while (n < 14 && Math.hypot(x - cx, y - cy) < 110);
  place(x, y);
  go.animate([{scale:"1 1"},{scale:"1.3 .78",offset:.35},{scale:".9 1.1",offset:.7},{scale:"1 1"}], {duration:600});
  root.style.setProperty("--gx", (arena.getBoundingClientRect().left + x) / innerWidth);
  root.style.setProperty("--gy", (arena.getBoundingClientRect().top + y) / innerHeight);
}
function advance(moved){
  if (inflight) return;
  if (tries >= 3) return run();
  const [q, b] = QS[tries++];
  $("q").textContent = q; pop($("bubble")); go.textContent = b;
  $("steps").textContent = "Step " + tries + " of 3"; $("live").textContent = q;
  document.querySelectorAll(".dots i").forEach((d, i) => d.classList.toggle("on", i < tries));
  moved && !reduce ? dodge() : center();
}
go.addEventListener("click", () => advance(true));
$("skip").addEventListener("click", () => advance(false));
addEventListener("resize", () => { if (!$("s-start").hidden) place(parseFloat(go.style.left) || 0, parseFloat(go.style.top) || 0); });
center(); document.fonts && document.fonts.ready.then(center);

/* webhook run: guarded against double submits */
async function run(){
  if (inflight) return;
  inflight = true;
  stage("s-load");
  let i = 0; $("slow").hidden = true; $("msg").textContent = LOAD[0];
  const msgT = setInterval(() => { i = (i + 1) % LOAD.length; $("msg").textContent = LOAD[i]; pop($("msg").parentElement); }, 2600);
  const slowT = setTimeout(() => $("slow").hidden = false, 12000);
  try {
    let jobs = DEMO, count = 0, demo = true, stats = {};
    if (CFG.WEBHOOK_URL) {
      demo = false;
      const ctl = new AbortController(), to = setTimeout(() => ctl.abort(), CFG.TIMEOUT_MS);
      try {
        const r = await fetch(CFG.WEBHOOK_URL, {method:"POST", headers:{"Content-Type":"application/json"}, body:JSON.stringify({source:"prank-app", ts:Date.now()}), signal:ctl.signal});
        if (!r.ok) throw new Error("HTTP " + r.status);
        const d = await r.json();
        const normalized = normalizeWebhookResponse(d);
        jobs = normalized.jobs;
        count = normalized.visitorCount;
        stats = normalized.stats;
      } finally { clearTimeout(to); }
    } else await new Promise(r => setTimeout(r, 3800));
    if (!jobs.length) return fail("No jobs matched this time", "The search ran fine, but nothing matched right now. Try again a bit later.");
    show(jobs, count, demo, stats);
  } catch (e) {
    console.error(e);
    fail("Something broke", e.name === "AbortError" ? "The search took too long. Try again in a moment." : "We couldn't reach the job search. Check your connection and try again.");
  } finally { clearInterval(msgT); clearTimeout(slowT); inflight = false; }
}
function fail(t, m){ $("et").textContent = t; $("em").textContent = m; stage("s-err"); }
$("retry").addEventListener("click", run);

function show(jobs, count, demo, stats){
  $("note").textContent = NOTES[Math.floor(Math.random() * NOTES.length)];
  const c = $("count");
  const summary = [];
  const shownCount = Math.min(jobs.length, 18);
  if (Number(stats?.jobLinksFound) > 0) {
    summary.push("Showing " + shownCount + " unique jobs from " + Number(stats.jobLinksFound) + " links found");
  } else if (!demo) summary.push("Showing " + shownCount + " unique jobs");
  if (Number(stats?.emailsSeen) > 0) summary.push(Number(stats.emailsSeen) + " emails checked");
  if (Number(stats?.emailsSkipped) > 0) summary.push(Number(stats.emailsSkipped) + " emails skipped");
  if (count > 0) summary.push(count + " people fooled so far");
  c.hidden = summary.length === 0;
  if (summary.length) c.textContent = summary.join(" · ");
  $("demo").hidden = !demo;
  const ul = $("jobs"); ul.innerHTML = "";
  jobs.slice(0, 18).forEach((j, n) => {
    const li = document.createElement("li"); li.className = "job"; li.style.setProperty("--i", n);
    const h = document.createElement("h3"); h.textContent = j.title; li.append(h);
    [j.company, j.location].forEach(t => { if (t) { const p = document.createElement("p"); p.textContent = t; li.append(p); } });
    const a = document.createElement("a");
    if (/^https?:\/\//i.test(j.url)) { a.href = j.url; a.target = "_blank"; a.rel = "noopener noreferrer"; a.textContent = "View job ↗"; }
    else { a.setAttribute("aria-disabled", "true"); a.textContent = "Link unavailable"; }
    li.append(a); ul.append(li);
  });
  stage("s-res");
  if (!reduce) confetti();
}

function confetti(){
  const box = $("conf"), cols = ["#3d6bff","#9b5cff","#2ee6c9","#ff7a8a","#ffe49a"];
  box.innerHTML = "";
  for (let i = 0; i < 28; i++) {
    const el = document.createElement("i"), a = Math.random() * 6.283, d = 90 + Math.random() * 170;
    el.style.cssText = "--c:" + cols[i % 5] + ";--dx:" + Math.cos(a) * d + "px;--dy:" + (Math.sin(a) * d - 40) + "px";
    box.append(el);
  }
  setTimeout(() => box.innerHTML = "", 1700);
}

$("share").addEventListener("click", async () => {
  const url = location.href.split("#")[0], text = "I tried to escape my job with an AI that runs away from you. Try it:";
  try {
    if (navigator.share) await navigator.share({title:"JobChaser AI", text, url});
    else { await navigator.clipboard.writeText(text + " " + url); $("share").textContent = "Link copied ✓"; setTimeout(() => $("share").textContent = "Share this page", 2500); }
  } catch (e) { if (e.name !== "AbortError") prompt("Copy this link:", url); }
});
})();
