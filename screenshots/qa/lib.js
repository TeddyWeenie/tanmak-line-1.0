(() => {
  const qa = window.__weaverQa;
  const T = window.__controlsTest;
  const log = window.__qaLog || (window.__qaLog = []);
  const fail = window.__qaFail || (window.__qaFail = []);
  function ok(name, cond, extra) {
    const row = { name, pass: !!cond, extra: extra == null ? undefined : extra };
    log.push(row);
    if (!cond) fail.push(name + (extra ? " :: " + extra : ""));
    return !!cond;
  }
  const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
  function S() { return qa.getState(); }
  function overlayText() {
    const c = document.getElementById("card");
    return c ? c.innerText.replace(/\s+/g, " ").trim() : "";
  }
  function hud() {
    const el = document.getElementById("stats");
    return el ? el.innerText.replace(/\s+/g, " ").trim() : "";
  }
  function findOre() {
    const st = S();
    for (let y = 1; y < 31; y++) for (let x = 1; x < 43; x++) {
      if (st.grid[y][x].kind === "ore") return { x, y };
    }
    return null;
  }
  function blank() {
    return {
      kind: "empty", ore: 0, dir: 1, bufIn: 0, bufOut: 0, bufOutType: "ammo",
      ammo: 0, shell: 0, recipe: "ammo", prog: 0, powered: false, buildAnim: 0,
      rubble: 0, wreckName: "", hp: 12, maxHp: 12,
    };
  }
  function place(gx, gy, kind, extra) {
    const st = S();
    const prev = st.grid[gy][gx];
    const c = Object.assign(blank(), extra || {}, { kind });
    const hp = { miner: 20, belt: 10, inserter: 12, assembler: 24, turret: 22, generator: 30 }[kind] || 12;
    c.hp = extra && extra.hp != null ? extra.hp : hp;
    c.maxHp = extra && extra.maxHp != null ? extra.maxHp : hp;
    if (kind === "miner" && prev && prev.ore) c.ore = prev.ore;
    if (kind === "turret" && (c.ammo == null || c.ammo === 0)) c.ammo = 16;
    st.grid[gy][gx] = c;
    return c;
  }
  async function waitFor(fn, ms, step) {
    const t0 = Date.now();
    while (Date.now() - t0 < ms) {
      if (fn()) return true;
      await sleep(step || 40);
    }
    return !!fn();
  }
  function god() {
    const st = S();
    st.player.hp = 9999;
    st.inv.ammo = Math.max(st.inv.ammo, 400);
  }
  function wipeEnemies() { S().enemies.forEach((e) => { e.hp = 0; }); }
  async function clearField() {
    wipeEnemies();
    await waitFor(() => S().enemies.length === 0, 500, 20);
  }
  async function forceClear() {
    const st = S();
    const cap = (st.spec && st.spec.goal && st.spec.goal.waves) || 8;
    st.wave = cap;
    st.won = true;
    st.enemies = [];
    st.nextWave = 99;
    st.paused = false;
    st.over = false;
    st.running = true;
    await sleep(180);
  }
  function oreCount() {
    let n = 0;
    for (const r of S().grid) for (const c of r) if (c.kind === "ore") n++;
    return n;
  }
  window.__qa = { qa, T, ok, sleep, S, overlayText, hud, findOre, place, waitFor, god, wipeEnemies, clearField, forceClear, oreCount, log, fail };
  return "lib-ok";
})()
