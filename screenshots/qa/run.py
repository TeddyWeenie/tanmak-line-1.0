#!/usr/bin/env python3
import json, os, subprocess, sys, time

os.environ["AGENT_BROWSER_SESSION"] = os.environ.get("AGENT_BROWSER_SESSION", "weaver-qa-c52ddf65534b")

def ev(src, timeout=60):
    proc = subprocess.run(
        ["agent-browser", "eval", src],
        capture_output=True, text=True, timeout=timeout,
    )
    out = (proc.stdout or "").strip()
    err = (proc.stderr or "").strip()
    if proc.returncode != 0:
        print("EVAL_FAIL", err[-2000:] or out[-2000:])
        return None
    try:
        return json.loads(out) if out.startswith("{") or out.startswith("[") or out.startswith('"') else out
    except Exception:
        return out

def load_lib():
    src = open("/workspace/screenshots/qa/lib.js").read()
    r = ev(src)
    print("lib", r)

SUITES = {}

SUITES["sprites_hub_wasd"] = r'''
(async () => {
  const { qa, T, ok, sleep, S, overlayText } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  const miss = [];
  for (const n of ["miner","wire","spawner","chewer","player","ore","turret","generator"]) {
    try {
      const r = await fetch(location.origin + "/game/sprites/" + n + ".png");
      const b = await r.blob();
      if (!r.ok || !String(b.type).includes("image") || b.size < 100) miss.push(n);
    } catch (e) { miss.push(n + ":" + e.message); }
  }
  ok("sprites core", miss.length === 0, miss.join(","));
  qa.writeSave({ unlocked: ["s1", "free"], cleared: [] });
  qa.showHub();
  await sleep(100);
  const cards = [...document.querySelectorAll(".stage-card")].map((el) => ({
    id: el.getAttribute("data-stage"), disabled: !!el.disabled
  }));
  ok("hub 5 cards", cards.length === 5, String(cards.length));
  ok("hub S1 open", cards.some((c) => c.id === "s1" && !c.disabled));
  ok("hub S2 locked", cards.some((c) => c.id === "s2" && c.disabled));
  ok("hub S4 locked", cards.some((c) => c.id === "s4" && c.disabled));
  ok("hub S5 locked", cards.some((c) => c.id === "s5" && c.disabled));
  document.querySelector('.stage-card[data-stage="s1"]').click();
  await sleep(80);
  ok("S1 drop log", /N-07|REC|낙하/.test(overlayText()), overlayText().slice(0,70));
  document.getElementById("skipLog").click();
  await sleep(80);
  ok("S1 running", S().running && S().spec.id === "s1");
  const x0 = T.getPos().x, y0 = T.getPos().y;
  T.setKeys(["KeyD"]); await sleep(300);
  const xD = T.getPos().x;
  T.setKeys(["KeyA"]); await sleep(300);
  const xA = T.getPos().x;
  T.setKeys(["KeyW"]); await sleep(300);
  const yW = T.getPos().y;
  T.setKeys(["KeyS"]); await sleep(300);
  const yS = T.getPos().y;
  T.setKeys([]);
  ok("D right", xD > x0 + 15, x0.toFixed(0)+">"+xD.toFixed(0));
  ok("A left", xA < xD - 15, xD.toFixed(0)+">"+xA.toFixed(0));
  ok("W up", yW < y0 - 10 || yW < yS - 15, y0.toFixed(0)+">"+yW.toFixed(0));
  ok("S down", yS > yW + 15, yW.toFixed(0)+">"+yS.toFixed(0));
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

SUITES["power_craft_factory"] = r'''
(async () => {
  const { qa, ok, sleep, S, place, waitFor, god } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  qa.startRun("s1"); await sleep(50);
  const ore0 = S().inv.ore;
  S().sel = 5;
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "c", bubbles: true }));
  await sleep(40);
  ok("C craft generator", S().inv.generator === 2 && S().inv.ore === ore0 - 5, "gen="+S().inv.generator+" ore="+S().inv.ore);

  qa.startRun("s1"); await sleep(40);
  place(22, 16, "generator");
  place(20, 10, "miner", { dir: 1 });
  place(2, 2, "miner", { dir: 1 });
  await sleep(90);
  ok("near miner powered", S().grid[10][20].powered === true, String(S().grid[10][20].powered));
  ok("far miner unpowered", S().grid[2][2].powered === false, String(S().grid[2][2].powered));

  qa.startRun("s4"); await sleep(40);
  place(3, 3, "generator");
  place(3, 4, "miner", { dir: 1 });
  place(40, 27, "miner", { dir: 1 });
  await sleep(90);
  ok("S4 near powered", S().grid[4][3].powered === true);
  ok("S4 far unpowered", S().grid[27][40].powered === false);

  qa.startRun("s1"); await sleep(40);
  god();
  place(24, 10, "generator");
  place(22, 11, "miner", { dir: 1 });
  place(23, 11, "belt", { dir: 2 });
  place(23, 12, "belt", { dir: 1 });
  place(24, 12, "inserter", { dir: 1 });
  place(25, 12, "assembler");
  const got = await waitFor(() => S().ammoCrafted > 0, 5000, 40);
  ok("factory crafts ammo", got, "crafted="+S().ammoCrafted+" items="+S().items.length+" powM="+S().grid[11][22].powered+" powA="+S().grid[12][25].powered+" bufIn="+(S().grid[12][25].bufIn));
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

SUITES["s1_goals"] = r'''
(async () => {
  const { qa, ok, sleep, S, overlayText, god, forceClear } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  qa.writeSave({ unlocked: ["s1", "free"], cleared: [] });
  qa.startRun("s1"); await sleep(40);
  god(); S().inv.ammo = 400; S().ammoCrafted = 0;
  await forceClear();
  ok("S1 fail no ammo", overlayText().includes("탄약") && overlayText().includes("상실"), overlayText().slice(0,90));
  ok("S1 fail no S2", !qa.loadSave().unlocked.includes("s2"), JSON.stringify(qa.loadSave()));

  qa.writeSave({ unlocked: ["s1", "free"], cleared: [] });
  qa.startRun("s1"); await sleep(40);
  god(); S().inv.ammo = 400; S().ammoCrafted = 1;
  await forceClear();
  ok("S1 win", /거점 안정|고속 채굴/.test(overlayText()), overlayText().slice(0,100));
  ok("S1 unlocks S2", qa.loadSave().unlocked.includes("s2") && qa.loadSave().cleared.includes("s1"), JSON.stringify(qa.loadSave()));
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

SUITES["s2_goals"] = r'''
(async () => {
  const { qa, ok, sleep, S, overlayText, god, place, waitFor, forceClear } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  qa.writeSave({ unlocked: ["s1","s2","free"], cleared: ["s1"] });
  qa.startRun("s2"); await sleep(40);
  god();
  ok("S2 minerBoost", S().unlocks.minerBoost === true);
  ok("S2 no dual", S().player.dual === false);
  ok("S2 split ore", (function(){let n=0;for(const r of S().grid)for(const c of r)if(c.kind==="ore")n++;return n;})() === 32);
  place(22, 16, "generator");
  place(20, 16, "turret", { ammo: 20 });
  place(24, 16, "turret", { ammo: 20 });
  S().enemies.push({ x: 880, y: 500, hp: 8, max: 8, spd: 8, dmg: 0, kind: "grub", r: 11 });
  await waitFor(() => Object.keys(S().turretShots||{}).length >= 2, 1800, 30);
  ok("two turrets shot", Object.keys(S().turretShots).length >= 2, JSON.stringify(S().turretShots));
  await forceClear();
  ok("S2 win", /거점 안정|이중 사격/.test(overlayText()), overlayText().slice(0,90));
  ok("S2 unlocks S3", qa.loadSave().unlocked.includes("s3"), JSON.stringify(qa.loadSave()));

  qa.startRun("s2"); await sleep(40);
  god(); S().inv.ammo = 400;
  place(22, 16, "generator");
  place(20, 16, "turret", { ammo: 20 });
  S().enemies.push({ x: 880, y: 500, hp: 8, max: 8, spd: 8, dmg: 0, kind: "grub", r: 11 });
  await waitFor(() => Object.keys(S().turretShots||{}).length >= 1, 1200, 30);
  await forceClear();
  ok("S2 fail 1 turret", overlayText().includes("포탑") && overlayText().includes("상실"), overlayText().slice(0,90));
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

SUITES["s3_goals"] = r'''
(async () => {
  const { qa, ok, sleep, S, overlayText, hud, god, place, forceClear, oreCount } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  qa.writeSave({ unlocked: ["s1","s2","s3","free"], cleared: ["s1","s2"] });
  qa.startRun("s3"); await sleep(40);
  god();
  ok("S3 dual+boost", S().player.dual === true && S().unlocks.minerBoost === true);
  ok("S3 ore 35", oreCount() === 35, String(oreCount()));
  let center = 0;
  for (let y = 12; y <= 20; y++) for (let x = 14; x <= 28; x++) if (S().grid[y][x].kind === "ore") center++;
  ok("S3 hollow center", center === 0, String(center));
  ok("S3 HUD 잔해", hud().includes("잔해"), hud().slice(0,80));
  place(22, 16, "belt");
  S().inv.ammo = 0;
  S().enemies = [{ x: 80, y: 640, hp: 40, max: 40, spd: 90, dmg: 6, kind: "chewer", r: 13, walk: 0, flash: 0 }];
  await sleep(350);
  const ch = S().enemies[0];
  ok("chewer seeks belt", ch && ch.x > 100, ch ? ch.x.toFixed(0)+","+ch.y.toFixed(0) : "none");

  qa.startRun("s3"); await sleep(40); god();
  S().wrecks = 4;
  await sleep(90);
  ok("S3 instant fail wrecks", /파괴 한도|상실/.test(overlayText()), overlayText().slice(0,90));

  qa.writeSave({ unlocked: ["s1","s2","s3","free"], cleared: ["s1","s2"] });
  qa.startRun("s3"); await sleep(40); god(); S().inv.ammo = 400; S().wrecks = 2;
  await forceClear();
  ok("S3 win 2 wrecks", /거점 안정|관통/.test(overlayText()), overlayText().slice(0,90));
  ok("S3 unlocks S4", qa.loadSave().unlocked.includes("s4"), JSON.stringify(qa.loadSave()));
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

SUITES["s4_goals"] = r'''
(async () => {
  const { qa, ok, sleep, S, overlayText, god, place, forceClear, oreCount } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  qa.writeSave({ unlocked: ["s1","s2","s3","s4","free"], cleared: ["s1","s2","s3"] });
  qa.startRun("s4"); await sleep(40); god();
  ok("S4 pierce+shell", S().player.pierce && S().unlocks.shell);
  ok("S4 1 gen in inv", S().inv.generator === 1);
  ok("S4 ore 24", oreCount() === 24, String(oreCount()));
  place(4, 4, "generator");
  S().inv.ammo = 0;
  S().enemies = [{ x: 800, y: 640, hp: 40, max: 40, spd: 100, dmg: 0, kind: "wire", r: 12, walk: 0, flash: 0 }];
  const wx0 = 800;
  await sleep(350);
  const w = S().enemies[0];
  ok("wire seeks generator", w && w.x < wx0 - 15 && w.y < 640, w ? w.x.toFixed(0)+","+w.y.toFixed(0) : "none");

  qa.startRun("s4"); await sleep(40); god(); S().inv.ammo = 400;
  place(22, 16, "generator");
  await forceClear();
  ok("S4 fail 1 gen", overlayText().includes("발전기") && overlayText().includes("상실"), overlayText().slice(0,90)+" dual="+S().dualGenWaves);

  qa.writeSave({ unlocked: ["s1","s2","s3","s4","free"], cleared: ["s1","s2","s3"] });
  qa.startRun("s4"); await sleep(40); god(); S().inv.ammo = 400;
  place(4, 4, "generator");
  place(40, 4, "generator");
  S().wave = 1; S().enemies = []; S().nextWave = 0;
  await sleep(80);
  ok("S4 dual credits previous wave", (S().dualGenWaves||0) >= 1, "dual="+S().dualGenWaves+" w="+S().wave);
  S().enemies.push({ x: 10, y: 10, hp: 9, max: 9, spd: 0, dmg: 0, kind: "grub", r: 11 });
  const dualHold = S().dualGenWaves;
  S().nextWave = 0;
  await sleep(80);
  ok("S4 overlap still credits", (S().dualGenWaves||0) > dualHold, "dual="+S().dualGenWaves+" e="+S().enemies.length);
  S().dualGenWaves = 5;
  await forceClear();
  ok("S4 win", /거점 안정|포탑 연사/.test(overlayText()), overlayText().slice(0,90)+" dual="+S().dualGenWaves);
  ok("S4 unlocks S5", qa.loadSave().unlocked.includes("s5"), JSON.stringify(qa.loadSave()));
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

SUITES["s5_free_misc"] = r'''
(async () => {
  const { qa, ok, sleep, S, overlayText, god, forceClear, oreCount, wipeEnemies } = window.__qa;
  window.__qaLog.length = 0; window.__qaFail.length = 0;
  qa.writeSave({ unlocked: ["s1","s2","s3","s4","s5","free"], cleared: ["s1","s2","s3","s4"] });
  qa.startRun("s5"); await sleep(40);
  ok("S5 turretFast", S().unlocks.turretFast === true);
  ok("S5 ammo 50", S().inv.ammo === 50, String(S().inv.ammo));
  ok("S5 ore 20", oreCount() === 20, String(oreCount()));
  ok("S5 dual+pierce", S().player.dual && S().player.pierce);
  god(); S().inv.ammo = 0;
  S().enemies = [{ x: 200, y: 200, hp: 20, max: 20, spd: 50, dmg: 0, kind: "spawner", r: 16, walk: 0, flash: 0 }];
  const sx0 = 200, sy0 = 200;
  await sleep(320);
  const sp = S().enemies.find((e) => e.kind === "spawner");
  ok("spawner to center", sp && sp.x > sx0 + 8 && sp.y > sy0 + 8, sp ? sp.x.toFixed(0)+","+sp.y.toFixed(0) : "gone");

  qa.startRun("s5"); await sleep(40); god(); S().inv.ammo = 0;
  S().enemies.push({ x: 400, y: 400, hp: 1, max: 1, spd: 0, dmg: 0, kind: "spawner", r: 16, walk: 0, flash: 0 });
  await sleep(80);
  wipeEnemies();
  await sleep(80);
  ok("killed spawners increment", (S().spawnersKilled||0) >= 1, String(S().spawnersKilled));
  ok("split grubs", S().enemies.filter((e) => e.kind === "grub").length >= 2, "n="+S().enemies.map(e=>e.kind).join(","));
  S().spawnersKilled = 3;
  await forceClear();
  ok("S5 ending", /대기 궤도|거점 안정|군체핵/.test(overlayText()), overlayText().slice(0,110));
  ok("S5 cleared save", qa.loadSave().cleared.includes("s5"), JSON.stringify(qa.loadSave()));

  qa.startRun("free"); await sleep(50);
  ok("free ammo 100", S().inv.ammo === 100, String(S().inv.ammo));
  ok("free turret 3", S().inv.turret === 3, String(S().inv.turret));
  ok("free turretFast", S().unlocks.turretFast === true);

  qa.startRun("s1"); await sleep(40);
  const d0 = S().dir;
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "r", bubbles: true }));
  await sleep(20);
  ok("R rotates", S().dir === (d0 + 1) % 4, d0+"->"+S().dir);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true }));
  await sleep(30);
  ok("P pause", S().paused === true);
  window.dispatchEvent(new KeyboardEvent("keydown", { key: "p", bubbles: true }));
  await sleep(30);
  ok("P unpause", S().paused === false);

  S().paused = false;
  S().player.hp = 0.01;
  S().enemies.push({ x: S().player.x, y: S().player.y, hp: 40, max: 40, spd: 0, dmg: 90, kind: "grub", r: 22, walk: 0, flash: 0 });
  await sleep(180);
  ok("HP death", S().over === true && overlayText().includes("상실"), overlayText().slice(0,70));

  const stg = qa.stages;
  ok("S3 W4 chewer", (stg.s3.roster[4].chewer||0) >= 1);
  ok("S4 W3 wire", (stg.s4.roster[3].wire||0) >= 1);
  ok("S5 W6 spawner", stg.s5.roster[6].spawner === 1);
  ok("S1 north only", stg.s1.spawnEdges[4].join() === "n");
  ok("S2 WE late", stg.s2.spawnEdges[6].join() === "w,e");
  return { fail: window.__qaFail.slice(), n: window.__qaLog.length, p: window.__qaLog.filter(x=>x.pass).length };
})()
'''

def reopen():
    subprocess.run(["agent-browser", "open", "http://127.0.0.1:8080/"], check=False)
    subprocess.run(["agent-browser", "wait", "--fn", "typeof window.startRun === 'function'", "--timeout", "15000"], check=False)

def main():
    reopen()
    all_fail = []
    total_p = 0
    total_n = 0
    for name, src in SUITES.items():
        print("\n===", name, "===")
        load_lib()
        r = ev(src, timeout=70)
        print(r)
        if not isinstance(r, dict):
            all_fail.append(name + " did not return report")
            continue
        total_p += r.get("p", 0)
        total_n += r.get("n", 0)
        all_fail.extend(r.get("fail") or [])
    summary = {"pass": total_p, "total": total_n, "fail": all_fail}
    open("/workspace/screenshots/qa/report.json", "w").write(json.dumps(summary, ensure_ascii=False, indent=2))
    print("\nSUMMARY", json.dumps(summary, ensure_ascii=False, indent=2))
    return 0 if not all_fail else 1

if __name__ == "__main__":
    sys.exit(main())
