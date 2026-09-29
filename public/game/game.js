(() => {
  const VERSION = "1.0";
  const SCRIPT_BASE = (() => {
    try {
      const src = document.currentScript && document.currentScript.src;
      if (src) return new URL("./", src).href;
    } catch {}
    return "/game/";
  })();
  const STANDALONE = !(document.currentScript && document.currentScript.getAttribute("data-weaver"));
  const GUIDE_HREF = STANDALONE ? "guide.html" : "/guide";
  const SPRITE_BASE = new URL("sprites/", SCRIPT_BASE).href;
  const TILE = 40;
  const COLS = 44;
  const ROWS = 32;
  const POWER_R = 8;
  const DIRS = [
    { x: 0, y: -1 },
    { x: 1, y: 0 },
    { x: 0, y: 1 },
    { x: -1, y: 0 },
  ];

  const BUILD = [
    { id: "miner", name: "채굴기", key: "1", cost: 3, rot: true },
    { id: "belt", name: "벨트", key: "2", cost: 1, rot: false },
    { id: "inserter", name: "투입기", key: "3", cost: 1, rot: true },
    { id: "assembler", name: "조립기", key: "4", cost: 5, rot: false },
    { id: "turret", name: "포탑", key: "5", cost: 6, rot: false },
    { id: "generator", name: "발전기", key: "6", cost: 5, rot: false },
  ];

  const SPR = {};
  const SPR_FILES = ["miner","miner_empty","generator","assembler","turret","belt","inserter","ore","player","grub","runner","chewer","wire","spawner","item_ore","item_ammo","item_shell"];
  const BUILD_HP = { miner: 20, belt: 10, inserter: 12, assembler: 24, turret: 22, generator: 30 };
  (function loadSprites() {
    const urls = window.SPRITE_URLS || {};
    SPR_FILES.forEach((n) => {
      const img = new Image();
      img.src = urls[n] || (SPRITE_BASE + n + ".png");
      SPR[n] = img;
    });
  })();

  function hasSpr(n) {
    const img = SPR[n];
    return img && img.complete && img.naturalWidth > 0;
  }

  const SPR_SCALE = 1.15;

  const SAVE_KEY = "weaver-campaign-v1";
  const EDGE_BOX = {
    n: [null, -40],
    s: [null, ROWS * TILE + 40],
    w: [-40, null],
    e: [COLS * TILE + 40, null],
  };

  const STAGES = {
    s1: {
      id: "s1",
      name: "S1 낙하 광맥",
      tag: "튜토리얼 거점",
      blurb: "탄약 한 줄을 만들고 북쪽에서 오는 4파도를 버틴다.",
      next: "s2",
      waves: 4,
      firstDelay: 26,
      waveGap: 34,
      extend: false,
      spawnEdges: { 1: ["n"], 2: ["n"], 3: ["n"], 4: ["n"] },
      roster: {
        1: { grub: 10 },
        2: { grub: 14 },
        3: { grub: 18, runner: 2 },
        4: { grub: 20, runner: 5 },
      },
      ore: [
        { x: 20, y: 10, w: 3, h: 3, ore: 440 },
        { x: 30, y: 22, w: 2, h: 2, ore: 260 },
      ],
      startInv: { ore: 36, ammo: 48, shell: 0, miner: 2, belt: 16, inserter: 4, assembler: 1, turret: 2, generator: 1 },
      modules: [],
      goal: { type: "survive_ammo", waves: 4 },
      winModule: "고속 채굴",
      logs: [
        { tag: "REC", nar: "변경계 개척선단은 응답하지 않는다.", line: "광맥을 열고, 선을 잇고, 거점을 유지하라. 회수 신호는 없다." },
        { tag: "N-07", nar: "식철 군체 갈. 유기체는 거들떠보지 않는다. 공장만 먹는다.", line: "직조함 N-07, 대기." },
        { tag: "N-07", nar: "탄약고 공란. 좌표는 광맥 위.", line: "낙하 개시." },
      ],
    },
    s2: {
      id: "s2",
      name: "S2 벨트 협곡",
      tag: "물류",
      blurb: "갈라진 광맥을 벨트로 잇고, 포탑 두 기가 각각 한 발 이상 쏘게 한다.",
      next: "s3",
      waves: 6,
      firstDelay: 24,
      waveGap: 32,
      extend: false,
      spawnEdges: { 1: ["w"], 2: ["w"], 3: ["e"], 4: ["e"], 5: ["w", "e"], 6: ["w", "e"] },
      roster: {
        1: { grub: 10 },
        2: { grub: 12 },
        3: { grub: 12, runner: 6 },
        4: { grub: 14, runner: 8 },
        5: { grub: 16, runner: 9 },
        6: { grub: 18, runner: 11 },
      },
      ore: [
        { x: 5, y: 8, w: 2, h: 8, ore: 380 },
        { x: 37, y: 8, w: 2, h: 8, ore: 380 },
      ],
      startInv: { ore: 32, ammo: 44, shell: 0, miner: 2, belt: 22, inserter: 6, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost"],
      goal: { type: "turrets_fire", waves: 6, count: 2 },
      winModule: "이중 사격",
      logs: [
        { tag: "N-07", nar: "거점 임시 안정. 탄약 한 줄이 함을 지탱했다.", line: "스킬 포인트 1. 다음 낙하 전에 넣어라." },
        { tag: "REC", nar: "다음 좌표, 협곡. 포탑 전개 포함.", line: "중앙에 광맥이 없다. 선을 건너야 한다." },
      ],
    },
    s3: {
      id: "s3",
      name: "S3 식철 둥지",
      tag: "공장 방어",
      blurb: "고리 안쪽에 공장을 두고 7파도를 버틴다. 건물 파괴 3회를 넘기지 말 것.",
      next: "s4",
      waves: 7,
      firstDelay: 22,
      waveGap: 30,
      extend: false,
      spawnEdges: { 1: ["n"], 2: ["e"], 3: ["s"], 4: ["n", "e"], 5: ["n", "e", "s"], 6: ["n", "e", "s"], 7: ["n", "e", "s"] },
      roster: {
        1: { grub: 10, runner: 3 },
        2: { grub: 12, runner: 4 },
        3: { grub: 14, runner: 5 },
        4: { grub: 12, runner: 5, chewer: 3 },
        5: { grub: 14, runner: 6, chewer: 5 },
        6: { grub: 16, runner: 6, chewer: 7 },
        7: { grub: 18, runner: 7, chewer: 8 },
      },
      ore: [
        { x: 20, y: 6, w: 3, h: 3, ore: 400 },
        { x: 32, y: 14, w: 3, h: 3, ore: 400 },
        { x: 20, y: 22, w: 3, h: 3, ore: 400 },
        { x: 8, y: 14, w: 2, h: 4, ore: 280 },
      ],
      startInv: { ore: 32, ammo: 42, shell: 0, miner: 2, belt: 22, inserter: 6, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost", "dual"],
      goal: { type: "destroy_limit", waves: 7, max: 3 },
      winModule: "관통 + 포탄",
      logs: [
        { tag: "N-07", nar: "두 포탑이 불을 밝혔다. 포인트가 쌓였다.", line: "이중 사격은 탄약을 두 발 먹는다. 찍을지는 네가 정한다." },
        { tag: "REC", nar: "갈이 움직이는 금속만 물던 버릇을 버렸다.", line: "포식 분화 확인. 정지한 금속 = 먹이. 라인을 안으로 접는다." },
      ],
    },
    s4: {
      id: "s4",
      name: "S4 정전 분지",
      tag: "전력",
      blurb: "네 귀퉁이 광맥. 발전기 두 대를 켠 채로 5파도를 유지한다.",
      next: "s5",
      waves: 6,
      firstDelay: 22,
      waveGap: 30,
      extend: false,
      spawnEdges: { 1: ["s"], 2: ["s"], 3: ["n"], 4: ["n"], 5: ["n", "s"], 6: ["n", "s"] },
      roster: {
        1: { grub: 10, runner: 4 },
        2: { grub: 12, runner: 5 },
        3: { grub: 14, runner: 6, wire: 3 },
        4: { grub: 14, runner: 7, wire: 3 },
        5: { grub: 16, runner: 7, wire: 4, chewer: 2 },
        6: { grub: 18, runner: 8, chewer: 5, wire: 4 },
      },
      ore: [
        { x: 2, y: 2, w: 2, h: 3, ore: 360 },
        { x: 40, y: 2, w: 2, h: 3, ore: 360 },
        { x: 2, y: 27, w: 2, h: 3, ore: 360 },
        { x: 40, y: 27, w: 2, h: 3, ore: 360 },
      ],
      startInv: { ore: 36, ammo: 40, shell: 4, miner: 2, belt: 22, inserter: 6, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost", "dual", "pierce"],
      goal: { type: "dual_power", waves: 6, need: 5 },
      winModule: "포탑 연사",
      logs: [
        { tag: "N-07", nar: "파괴 한도 안. 관통과 포탄 레시피를 남긴다.", line: "포식은 가장자리부터 온다." },
        { tag: "REC", nar: "분지. 갈이 전류를 추적한다.", line: "한 반경으로는 광맥이 모자란다. 발전기를 나눈다." },
      ],
    },
    s5: {
      id: "s5",
      name: "S5 군체핵",
      tag: "핵 강하",
      blurb: "잔맥은 빨리 빈다. 8파도 안에 산란충 3마리를 처치하라.",
      next: "s6",
      waves: 8,
      firstDelay: 20,
      waveGap: 28,
      extend: false,
      spawnEdges: {
        1: ["n"], 2: ["e"], 3: ["s"], 4: ["w"],
        5: ["n", "e"], 6: ["s", "w"], 7: ["n", "s"], 8: ["n", "e", "s", "w"],
      },
      roster: {
        1: { grub: 11, runner: 4 },
        2: { grub: 12, runner: 5 },
        3: { grub: 14, runner: 6 },
        4: { grub: 14, runner: 6, chewer: 3 },
        5: { grub: 16, runner: 6, chewer: 4 },
        6: { grub: 14, runner: 6, chewer: 4, spawner: 1 },
        7: { grub: 16, runner: 7, chewer: 5, spawner: 1 },
        8: { grub: 18, runner: 7, chewer: 5, wire: 2, spawner: 1 },
      },
      ore: [
        { x: 20, y: 14, w: 2, h: 2, ore: 140 },
        { x: 24, y: 16, w: 2, h: 2, ore: 140 },
        { x: 21, y: 2, w: 3, h: 1, ore: 60 },
        { x: 41, y: 14, w: 1, h: 3, ore: 60 },
        { x: 21, y: 30, w: 3, h: 1, ore: 60 },
        { x: 2, y: 14, w: 1, h: 3, ore: 60 },
      ],
      startInv: { ore: 30, ammo: 34, shell: 6, miner: 2, belt: 24, inserter: 6, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost", "dual", "pierce", "turretFast"],
      goal: { type: "kill_spawners", waves: 8, count: 3 },
      winModule: "확산탄",
      logs: [
        { tag: "N-07", nar: "전력 거점 유지. 포인트는 낙하 전에 다시 배분한다.", line: "사령, 회수 신호 재요청." },
        { tag: "REC", nar: "광맥을 열고, 선을 잇고, 거점을 유지하라. 회수 신호는 없다.", line: "…수신. 핵 좌표. 회랑은 그 다음이다." },
        { tag: "N-07", nar: "산란 분화. 밀도를 밀도로 응답한다.", line: "직조함 N-07, 핵 낙하." },
      ],
    },
    s6: {
      id: "s6",
      name: "S6 균열 회랑",
      tag: "대각 물류",
      blurb: "광맥이 대각선이다. 포탑 3기가 쏘고, 잔해는 2를 넘기지 마라.",
      next: "s7",
      waves: 7,
      firstDelay: 24,
      waveGap: 30,
      extend: false,
      spawnEdges: {
        1: ["n", "e"], 2: ["s", "w"], 3: ["n", "e"], 4: ["s", "w"],
        5: ["n", "s"], 6: ["e", "w"], 7: ["n", "e", "s", "w"],
      },
      roster: {
        1: { grub: 12, runner: 5 },
        2: { grub: 14, runner: 6 },
        3: { grub: 14, runner: 7, chewer: 3 },
        4: { grub: 16, runner: 7, chewer: 4 },
        5: { grub: 16, runner: 8, chewer: 5, wire: 2 },
        6: { grub: 18, runner: 8, chewer: 6, wire: 3 },
        7: { grub: 20, runner: 9, chewer: 7, wire: 3 },
      },
      ore: [
        { x: 4, y: 4, w: 3, h: 4, ore: 260 },
        { x: 36, y: 22, w: 3, h: 4, ore: 260 },
      ],
      startInv: { ore: 28, ammo: 36, shell: 4, miner: 2, belt: 28, inserter: 8, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost", "dual", "pierce", "turretFast", "spread"],
      goal: {
        type: "compound",
        waves: 7,
        parts: [
          { type: "turrets_fire", count: 3 },
          { type: "destroy_limit", max: 2 },
        ],
      },
      winModule: "심연 전개",
      logs: [
        { tag: "N-07", nar: "핵 밀도는 줄었다. 회랑은 아니다.", line: "전장이 대각으로 갈라져 있다. 확산탄은 직접 찍어야 한다." },
        { tag: "REC", nar: "광맥 둘. 그 사이가 식철의 길이다.", line: "포탑은 두 대뿐이다. 세 번째를 지어라. 잔해 둘." },
      ],
    },
    s7: {
      id: "s7",
      name: "S7 심연 분지",
      tag: "전력 봉쇄",
      blurb: "귀퉁이 잔맥. 발전기 두 대를 켠 채로 7파도를 유지하라.",
      next: "s8",
      waves: 8,
      firstDelay: 22,
      waveGap: 28,
      extend: false,
      spawnEdges: {
        1: ["n", "s"], 2: ["e", "w"], 3: ["n", "e"], 4: ["s", "w"],
        5: ["n", "s", "e"], 6: ["n", "s", "w"], 7: ["n", "e", "s", "w"], 8: ["n", "e", "s", "w"],
      },
      roster: {
        1: { grub: 12, runner: 6 },
        2: { grub: 14, runner: 6, chewer: 2 },
        3: { grub: 14, runner: 7, wire: 3 },
        4: { grub: 16, runner: 7, chewer: 3, wire: 3 },
        5: { grub: 16, runner: 8, chewer: 4, wire: 3, spawner: 1 },
        6: { grub: 18, runner: 8, chewer: 5, wire: 4, spawner: 1 },
        7: { grub: 18, runner: 9, chewer: 5, wire: 4 },
        8: { grub: 20, runner: 9, chewer: 6, wire: 4, spawner: 1 },
      },
      ore: [
        { x: 2, y: 2, w: 2, h: 2, ore: 200 },
        { x: 40, y: 2, w: 2, h: 2, ore: 200 },
        { x: 2, y: 28, w: 2, h: 2, ore: 200 },
        { x: 40, y: 28, w: 2, h: 2, ore: 200 },
      ],
      startInv: { ore: 28, ammo: 32, shell: 6, miner: 2, belt: 28, inserter: 8, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost", "dual", "pierce", "turretFast", "spread"],
      goal: { type: "dual_power", waves: 8, need: 7 },
      winModule: "종점 조준",
      logs: [
        { tag: "N-07", nar: "회랑 통과. 심연은 전류를 먹는다.", line: "발전기가 하나면 파도가 세지지 않는다." },
        { tag: "REC", nar: "귀퉁이 잔맥. 산란이 다시 시작한다.", line: "두 대를 켠 채로 일곱 파도를 넘겨라." },
      ],
    },
    s8: {
      id: "s8",
      name: "S8 종점 궤도",
      tag: "캠페인 클리어",
      blurb: "잔맥은 거의 없다. 산란충 4마리, 잔해 3 이하. 9파도.",
      next: null,
      waves: 9,
      firstDelay: 20,
      waveGap: 26,
      extend: false,
      spawnEdges: {
        1: ["n"], 2: ["e", "w"], 3: ["s"], 4: ["n", "s"],
        5: ["e", "w"], 6: ["n", "e", "s"], 7: ["n", "w", "s"],
        8: ["n", "e", "s", "w"], 9: ["n", "e", "s", "w"],
      },
      roster: {
        1: { grub: 14, runner: 6 },
        2: { grub: 16, runner: 7, chewer: 3 },
        3: { grub: 14, runner: 7, chewer: 3, spawner: 1 },
        4: { grub: 16, runner: 8, chewer: 4, wire: 3 },
        5: { grub: 16, runner: 8, chewer: 4, wire: 3, spawner: 1 },
        6: { grub: 18, runner: 9, chewer: 5, wire: 4 },
        7: { grub: 18, runner: 9, chewer: 5, wire: 4, spawner: 1 },
        8: { grub: 20, runner: 10, chewer: 6, wire: 4 },
        9: { grub: 20, runner: 10, chewer: 6, wire: 5, spawner: 1 },
      },
      ore: [
        { x: 18, y: 14, w: 2, h: 2, ore: 80 },
        { x: 24, y: 14, w: 2, h: 2, ore: 80 },
        { x: 8, y: 6, w: 2, h: 2, ore: 48 },
        { x: 34, y: 6, w: 2, h: 2, ore: 48 },
        { x: 8, y: 24, w: 2, h: 2, ore: 48 },
        { x: 34, y: 24, w: 2, h: 2, ore: 48 },
      ],
      startInv: { ore: 24, ammo: 28, shell: 8, miner: 2, belt: 28, inserter: 8, assembler: 1, turret: 2, generator: 1 },
      modules: ["minerBoost", "dual", "pierce", "turretFast", "spread"],
      goal: {
        type: "compound",
        waves: 9,
        parts: [
          { type: "kill_spawners", count: 4 },
          { type: "destroy_limit", max: 3 },
        ],
      },
      winModule: "도약 잔향",
      logs: [
        { tag: "N-07", nar: "회수 신호, 여전히 없다.", line: "마지막 좌표. 산란충 넷. 잔해 셋." },
        { tag: "REC", nar: "광맥이 거의 없다. 라인은 옮겨야 한다.", line: "직조함 N-07, 종점 낙하." },
      ],
      ending: [
        { tag: "N-07", nar: "종점 밀도 하락. 거점 안정.", line: "목표 달성. 회수 대기." },
        { tag: "REC", nar: "함이 대기 궤도에 뜬다. 아래 조립선은 아직 깜빡인다.", line: "회수 신호는 없다." },
        { tag: "N-07", nar: "직조함은 끄지 않는다. 명령은 유효하다.", line: "대기 궤도. 다음 낙하가 열리기 전까지." },
      ],
    },
    free: {
      id: "free",
      name: "자유 난이도",
      tag: "프로토타입 런",
      blurb: "8웨이브 후 4웨이브마다 자유 포인트. 최대 12.",
      waves: 8,
      firstDelay: 24,
      waveGap: 32,
      extend: true,
      spawnEdges: null,
      roster: null,
      ore: "proto",
      startInv: { ore: 36, ammo: 48, shell: 0, miner: 2, belt: 16, inserter: 4, assembler: 1, turret: 2, generator: 1 },
      modules: [],
      goal: { type: "survive", waves: 8 },
      logs: [
        { tag: "N-07", nar: "거점과 다른 장부다. 8파도까지가 한 사이클이다.", line: "넘기면 끝내거나 계속 돌린다. 8파도에 산란충이 핵으로 오고, 이후 4파도마다 한 마리씩 늘어난다." },
        { tag: "REC", nar: "자유 포인트는 거점에 찍은 스킬과 따로다.", line: "8파도 +1, 이후 4파도마다 +1. 최대 12. 관문에선 올리기만. 빼기는 다음 낙하 전." },
      ],
    },
  };

  const CAMPAIGN = ["s1", "s2", "s3", "s4", "s5", "s6", "s7", "s8"];
  const PLAYABLE = CAMPAIGN.concat(["free"]);

  const SKILLS = [
    { id: "miner", branch: "직조", name: "고속 채굴", max: 2, cost: 1, lines: ["채굴 0.70초 → 0.55초", "채굴 0.55초 → 0.42초"] },
    { id: "assemble", branch: "직조", name: "조립 가속", max: 2, cost: 1, lines: ["탄약 1.1초 → 0.9초. 포탄도 조금 빨라진다", "탄약 0.9초 → 0.75초"] },
    { id: "ammoPack", branch: "직조", name: "비상 탄약", max: 1, cost: 1, lines: ["시작 탄약 +12"] },
    { id: "fireRate", branch: "탄막", name: "연사", max: 2, cost: 1, lines: ["발사 간격 0.22초 → 0.19초", "발사 간격 0.19초 → 0.16초"] },
    { id: "dual", branch: "탄막", name: "이중 사격", max: 1, cost: 2, warn: true, lines: ["한 번에 두 발. 탄약을 두 발 먹는다"] },
    { id: "pierce", branch: "탄막", name: "관통", max: 2, cost: 1, lines: ["탄이 적 1명을 더 관통", "관통 2, 포탄 레시피 해금"] },
    { id: "spread", branch: "탄막", name: "확산탄", max: 1, cost: 2, warn: true, lines: ["빗겨 나가는 추가 탄. 탄약을 더 먹는다"] },
    { id: "turretFast", branch: "거점", name: "포탑 연사", max: 2, cost: 1, lines: ["포탑 간격 0.40초 → 0.30초", "포탑 간격 0.30초 → 0.22초"] },
    { id: "turretRange", branch: "거점", name: "포탑 사거리", max: 1, cost: 1, lines: ["포탑 사거리 280 → 340"] },
    { id: "repair", branch: "거점", name: "수리", max: 1, cost: 1, lines: ["E 수리량 8 → 16"] },
  ];

  function emptySkills() {
    const o = {};
    for (const def of SKILLS) o[def.id] = 0;
    return o;
  }

  function skillRank(skills, id) {
    const def = SKILLS.find((s) => s.id === id);
    const n = skills && skills[id] ? skills[id] | 0 : 0;
    if (!def) return 0;
    return Math.max(0, Math.min(def.max, n));
  }

  function pointsTotal(save) {
    return ((save && save.cleared) || []).filter((id) => CAMPAIGN.includes(id)).length;
  }

  const FREE_POINT_CAP = 12;
  const FREE_LAST_GATE = 8 + (FREE_POINT_CAP - 1) * 4;

  function isFreeGate(wave) {
    return wave >= 8 && wave <= FREE_LAST_GATE && ((wave - 8) % 4) === 0;
  }

  function freePointsFromWave(wave) {
    const w = wave | 0;
    if (w < 8) return 0;
    const n = 1 + Math.floor((Math.min(w, FREE_LAST_GATE) - 8) / 4);
    return Math.min(FREE_POINT_CAP, n);
  }

  function freePointsTotal(save) {
    return freePointsFromWave(save && save.freeWave);
  }

  function pointsSpent(skills) {
    return SKILLS.reduce((n, def) => n + skillRank(skills, def.id) * def.cost, 0);
  }

  function normalizeSkills(raw, budget) {
    const skills = emptySkills();
    let clamped = false;
    if (raw && typeof raw === "object") {
      for (const def of SKILLS) {
        let n = raw[def.id] | 0;
        if (n < 0 || n > def.max || (raw[def.id] != null && (raw[def.id] | 0) !== n)) clamped = true;
        if (n < 0) n = 0;
        if (n > def.max) n = def.max;
        skills[def.id] = n;
      }
    }
    while (pointsSpent(skills) > budget) {
      const def = SKILLS.slice().reverse().find((s) => skills[s.id] > 0);
      if (!def) break;
      skills[def.id] -= 1;
      clamped = true;
    }
    return { skills, clamped };
  }

  function applySkills(state, skills) {
    const miner = skillRank(skills, "miner");
    const assemble = skillRank(skills, "assemble");
    const fire = skillRank(skills, "fireRate");
    const pierce = skillRank(skills, "pierce");
    const turret = skillRank(skills, "turretFast");
    const dual = skillRank(skills, "dual");
    const spread = skillRank(skills, "spread");
    const range = skillRank(skills, "turretRange");
    const repair = skillRank(skills, "repair");
    const pack = skillRank(skills, "ammoPack");
    state.skillRanks = { ...emptySkills(), ...skills };
    state.skills = {
      mineT: [0.7, 0.55, 0.42][miner],
      assembleT: [1.1, 0.9, 0.75][assemble],
      shellT: [1.4, 1.15, 0.95][assemble],
      fireCd: [0.22, 0.19, 0.16][fire],
      turretCd: [0.4, 0.3, 0.22][turret],
      turretRange: range ? 340 : 280,
      repair: repair ? 16 : 8,
    };
    state.unlocks.minerBoost = miner > 0;
    state.player.dual = dual > 0;
    state.unlocks.dual = dual > 0;
    state.player.pierce = pierce;
    state.unlocks.pierce = pierce > 0;
    state.unlocks.shell = pierce >= 2;
    state.player.spread = spread > 0;
    state.unlocks.spread = spread > 0;
    state.unlocks.turretFast = turret > 0;
    if (pack && !state.packGranted) {
      state.inv.ammo += 12;
      state.packGranted = true;
    }
  }

  function skillHudLines() {
    const ranks = (S && S.skillRanks) || {};
    const lines = [];
    for (const def of SKILLS) {
      const r = skillRank(ranks, def.id);
      if (!r) continue;
      lines.push(def.max > 1 ? `${def.name} ${r === 1 ? "I" : "II"}` : `${def.name} ON`);
    }
    if (!lines.length) lines.push("장착 스킬 없음");
    return lines;
  }

  function loadSave() {
    try {
      const s = JSON.parse(localStorage.getItem(SAVE_KEY) || "{}");
      const unlocked = Array.isArray(s.unlocked) && s.unlocked.length ? s.unlocked.slice() : ["s1", "free"];
      const cleared = Array.isArray(s.cleared) ? s.cleared.slice() : [];
      let dirty = false;
      for (const id of cleared) {
        const n = STAGES[id] && STAGES[id].next;
        if (n && !unlocked.includes(n)) {
          unlocked.push(n);
          dirty = true;
        }
      }
      const budget = cleared.filter((id) => CAMPAIGN.includes(id)).length;
      const norm = normalizeSkills(s.skills, budget);
      if (norm.clamped) dirty = true;
      const freeWave = Math.max(0, s.freeWave | 0);
      const freeNorm = normalizeSkills(s.freeSkills, freePointsFromWave(freeWave));
      if (freeNorm.clamped || s.freeSkills == null || s.freeWave == null) dirty = true;
      const save = { unlocked, cleared, skills: norm.skills, freeSkills: freeNorm.skills, freeWave };
      if (dirty) localStorage.setItem(SAVE_KEY, JSON.stringify(save));
      return save;
    } catch {
      return { unlocked: ["s1", "free"], cleared: [], skills: emptySkills(), freeSkills: emptySkills(), freeWave: 0 };
    }
  }

  function writeSave(patch) {
    const cur = loadSave();
    const next = { ...cur, ...patch };
    const budget = ((next.cleared) || []).filter((id) => CAMPAIGN.includes(id)).length;
    next.skills = normalizeSkills(next.skills, budget).skills;
    next.freeWave = Math.max(0, next.freeWave | 0);
    next.freeSkills = normalizeSkills(next.freeSkills, freePointsFromWave(next.freeWave)).skills;
    const packed = {
      unlocked: next.unlocked,
      cleared: next.cleared,
      skills: next.skills,
      freeSkills: next.freeSkills,
      freeWave: next.freeWave,
    };
    localStorage.setItem(SAVE_KEY, JSON.stringify(packed));
    return packed;
  }

  function claimFreeWave(wave) {
    if (!isFreeGate(wave)) return false;
    const save = loadSave();
    if ((save.freeWave | 0) >= wave) return false;
    writeSave({ freeWave: wave });
    return true;
  }

  function unlockStage(id) {
    const save = loadSave();
    if (!save.unlocked.includes(id)) save.unlocked.push(id);
    writeSave(save);
  }

  function markCleared(id) {
    const save = loadSave();
    if (!save.cleared.includes(id)) save.cleared.push(id);
    const spec = STAGES[id];
    if (spec && spec.next) {
      if (!save.unlocked.includes(spec.next)) save.unlocked.push(spec.next);
    }
    writeSave(save);
  }

  function edgePoint(edges) {
    const list = edges && edges.length ? edges : ["n", "s", "w", "e"];
    const key = list[(Math.random() * list.length) | 0];
    const b = EDGE_BOX[key];
    return {
      x: b[0] == null ? Math.random() * COLS * TILE : b[0],
      y: b[1] == null ? Math.random() * ROWS * TILE : b[1],
      edge: key,
    };
  }

  function paintOre(grid, spec) {
    if (!spec || spec === "proto") {
      const patches = [
        [8, 8, 4], [12, 22, 3], [30, 10, 4], [34, 24, 3], [22, 6, 3], [20, 26, 3], [22, 16, 3],
      ];
      for (const [cx, cy, r] of patches) {
        for (let y = cy - r; y <= cy + r; y++) {
          for (let x = cx - r; x <= cx + r; x++) {
            if (x < 1 || y < 1 || x >= COLS - 1 || y >= ROWS - 1) continue;
            if ((x - cx) * (x - cx) + (y - cy) * (y - cy) <= r * r + 1) {
              grid[y][x].kind = "ore";
              grid[y][x].ore = 400 + ((x * 13 + y * 7) % 80);
            }
          }
        }
      }
      return;
    }
    for (const p of spec) {
      for (let y = p.y; y < p.y + p.h; y++) {
        for (let x = p.x; x < p.x + p.w; x++) {
          if (x < 1 || y < 1 || x >= COLS - 1 || y >= ROWS - 1) continue;
          grid[y][x].kind = "ore";
          grid[y][x].ore = (p.ore || 360) + ((x * 11 + y * 5) % 50);
        }
      }
    }
  }

  function countGenerators() {
    let n = 0;
    for (const row of S.grid) {
      for (const c of row) if (c.kind === "generator") n++;
    }
    return n;
  }

  function goalParts(g) {
    if (!g) return [];
    if (g.type === "compound") return g.parts || [];
    return [g];
  }

  function destroyCap(spec) {
    const g = spec && spec.goal;
    const p = goalParts(g).find((x) => x.type === "destroy_limit");
    return p ? (p.max || 3) : 0;
  }

  function partLabel(state, g) {
    if (g.type === "survive_ammo") return `탄약생산 ${state.ammoCrafted > 0 ? 1 : 0}/1`;
    if (g.type === "turrets_fire") {
      const n = Object.keys(state.turretShots || {}).length;
      return `포탑발사 ${n}/${g.count || 2}`;
    }
    if (g.type === "destroy_limit") return `잔해 ${state.wrecks || 0}/${g.max}`;
    if (g.type === "dual_power") return `발전기2기 ${state.dualGenWaves || 0}/${g.need}파도`;
    if (g.type === "kill_spawners") return `산란충 ${state.spawnersKilled || 0}/${g.count}`;
    return "";
  }

  function partMet(state, g) {
    if (g.type === "survive_ammo") return state.ammoCrafted > 0;
    if (g.type === "turrets_fire") return Object.keys(state.turretShots || {}).length >= (g.count || 2);
    if (g.type === "destroy_limit") return (state.wrecks || 0) <= (g.max || 3);
    if (g.type === "dual_power") return (state.dualGenWaves || 0) >= (g.need || 5);
    if (g.type === "kill_spawners") return (state.spawnersKilled || 0) >= (g.count || 3);
    return true;
  }

  function goalLabel(state) {
    const g = (state.spec && state.spec.goal) || { type: "survive", waves: 8 };
    const w = `파도 ${Math.min(state.wave, g.waves)}/${g.waves}`;
    if (g.type === "compound") {
      const bits = goalParts(g).map((p) => partLabel(state, p)).filter(Boolean);
      return `목표 ${bits.join(" · ")} · ${w}`;
    }
    const one = partLabel(state, g);
    return one ? `목표 ${one} · ${w}` : `목표 ${w}`;
  }

  function goalMet(state) {
    const g = (state.spec && state.spec.goal) || { type: "survive", waves: 8 };
    if (state.wave < g.waves) return false;
    if (state.enemies.length > 0) return false;
    return goalParts(g).every((p) => partMet(state, p));
  }

  function goalFailReason(state) {
    const g = (state.spec && state.spec.goal) || {};
    const parts = goalParts(g);
    for (const p of parts) {
      if (p.type === "destroy_limit" && (state.wrecks || 0) > (p.max || 3)) {
        if (state.spec && state.spec.id === "s3") return "파괴 한도를 넘겼다. 포탑을 바깥에, 라인은 고리 안에.";
        return `파괴 한도 ${p.max}를 넘겼다. 긴 벨트는 포식충 밥이다. 포탑을 침입 쪽에.`;
      }
    }
    if ((state.wave || 0) < (g.waves || 0) || (state.enemies && state.enemies.length > 0)) return "";
    for (const p of parts) {
      if (p.type === "survive_ammo" && state.ammoCrafted <= 0) {
        return "파도는 버텼으나 탄약을 한 줄도 만들지 못했다.";
      }
      if (p.type === "turrets_fire" && Object.keys(state.turretShots || {}).length < (p.count || 2)) {
        return `포탑 ${p.count || 2}기가 불을 밝히지 못했다. 탄약을 넣어 쏘게 하라.`;
      }
      if (p.type === "dual_power" && (state.dualGenWaves || 0) < (p.need || 5)) {
        return `발전기 두 대를 ${p.need || 5}파도 유지하지 못했다.`;
      }
      if (p.type === "kill_spawners" && (state.spawnersKilled || 0) < (p.count || 3)) {
        return `산란충 ${p.count || 3}마리를 놓쳤다. 큰 개체를 먼저 쏴라.`;
      }
    }
    return "";
  }


  function drawSpr(name, x, y, w, h, rot) {
    if (!hasSpr(name)) return false;
    const nw = w * SPR_SCALE, nh = h * SPR_SCALE;
    ctx.save();
    ctx.translate(x + w / 2, y + h / 2);
    if (rot) ctx.rotate(rot);
    ctx.drawImage(SPR[name], -nw / 2, -nh / 2, nw, nh);
    ctx.restore();
    return true;
  }

  const canvas = document.getElementById("c");
  const ctx = canvas.getContext("2d");
  const statsEl = document.getElementById("stats");
  const hotbarEl = document.getElementById("hotbar");
  const toastEl = document.getElementById("toast");
  const overlay = document.getElementById("overlay");
  const card = document.getElementById("card");
  const startBtn = document.getElementById("startBtn");
  const coachEl = document.getElementById("coach");
  const ammoWarn = document.getElementById("ammoWarn");

  let W = 0, H = 0;
  let last = 0;
  let toastT = 0;
  const keys = new Set();
  const mouse = { x: 0, y: 0, gx: 0, gy: 0, down: false };
  const stick = { x: 0, y: 0, id: null };
  let paintPtr = null;
  let paint = { x: -1, y: -1 };
  let helpOpen = false;
  let holdAct = null;
  let holdPtr = null;
  let holdAcc = 0;
  let actx = null;
  let lastEmptySfx = 0;

  function audioCtx() {
    if (!actx) actx = new (window.AudioContext || window.webkitAudioContext)();
    if (actx.state === "suspended") actx.resume();
    return actx;
  }

  function beep(freq, dur, type, vol, slide) {
    try {
      const a = audioCtx();
      const o = a.createOscillator();
      const g = a.createGain();
      o.type = type || "square";
      o.frequency.setValueAtTime(freq, a.currentTime);
      if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(40, slide), a.currentTime + dur);
      g.gain.setValueAtTime(vol || 0.06, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
      o.connect(g);
      g.connect(a.destination);
      o.start();
      o.stop(a.currentTime + dur);
    } catch (e) { /* ignore */ }
  }

  function noise(dur, vol, hp) {
    try {
      const a = audioCtx();
      const buf = a.createBuffer(1, Math.max(1, a.sampleRate * dur | 0), a.sampleRate);
      const data = buf.getChannelData(0);
      for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
      const src = a.createBufferSource();
      src.buffer = buf;
      const f = a.createBiquadFilter();
      f.type = "highpass";
      f.frequency.value = hp || 700;
      const g = a.createGain();
      g.gain.setValueAtTime(vol || 0.1, a.currentTime);
      g.gain.exponentialRampToValueAtTime(0.001, a.currentTime + dur);
      src.connect(f);
      f.connect(g);
      g.connect(a.destination);
      src.start();
    } catch (e) { /* ignore */ }
  }

  const sfx = {
    shoot() { noise(0.045, 0.09, 900); beep(920, 0.045, "square", 0.035, 240); },
    hit() { beep(170, 0.07, "sawtooth", 0.05, 70); },
    empty() { beep(150, 0.05, "square", 0.03); },
    build() { beep(280, 0.06, "triangle", 0.07); beep(420, 0.09, "square", 0.035, 180); },
    die() { noise(0.1, 0.12, 400); beep(200, 0.14, "sawtooth", 0.05, 50); },
  };

  function burst(x, y, color, n, spd) {
    for (let i = 0; i < n; i++) {
      const a = Math.random() * Math.PI * 2;
      const s = spd * (0.35 + Math.random());
      S.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: 0.18 + Math.random() * 0.22, max: 0.4,
        color, size: 2 + Math.random() * 3,
      });
    }
  }

  function emptyCell() {
    return { kind: "empty", ore: 0, dir: 1, bufIn: 0, bufOut: 0, bufOutType: "ammo", ammo: 0, shell: 0, recipe: "ammo", prog: 0, powered: false, buildAnim: 0, rubble: 0, wreckName: "" };
  }

  function fresh(stageId) {
    const spec = STAGES[stageId] || STAGES.free;
    const grid = [];
    for (let y = 0; y < ROWS; y++) {
      const row = [];
      for (let x = 0; x < COLS; x++) row.push(emptyCell());
      grid.push(row);
    }
    paintOre(grid, spec.ore);
    const state = {
      running: false,
      paused: false,
      over: false,
      won: false,
      extended: false,
      time: 0,
      wave: 0,
      nextWave: spec.firstDelay || 40,
      grid,
      items: [],
      bullets: [],
      enemies: [],
      particles: [],
      player: {
        x: (COLS * TILE) / 2,
        y: (ROWS * TILE) / 2,
        hp: 140,
        vmax: 155,
        cooldown: 0,
        mineT: 0,
        regenT: 0,
        dual: false,
        pierce: 0,
        spread: false,
        facing: 0,
        walk: 0,
        moving: false,
        repairT: 0,
      },
      unlocks: { minerBoost: false, dual: false, pierce: false, shell: false, spread: false, turretFast: false },
      inv: { ...spec.startInv },
      sel: 0,
      dir: 1,
      camX: 0,
      camY: 0,
      shake: 0,
      minedHand: 0,
      spec,
      stageId: spec.id,
      ammoCrafted: 0,
      turretShots: {},
      wrecks: 0,
      dualGenWaves: 0,
      countedWave: -1,
      gateShown: 0,
      gateGain: false,
      gateGainWave: 0,
      packGranted: false,
      spawnersKilled: 0,
      incoming: spec.spawnEdges ? (spec.spawnEdges[1] || ["n"]) : ["n", "s", "w", "e"],
    };
    applySkills(state, spec.id === "free" ? loadSave().freeSkills : loadSave().skills);
    if (spec.id === "free") {
      const cleared = loadSave().cleared;
      if (cleared.includes("s5") || cleared.includes("s8")) {
        state.inv.ammo += 20;
        state.inv.turret += 1;
      }
    }
    return state;
  }

  let S = fresh();

  function cell(x, y) {
    if (x < 0 || y < 0 || x >= COLS || y >= ROWS) return null;
    return S.grid[y][x];
  }

  function toast(msg) {
    toastEl.textContent = msg;
    toastEl.style.opacity = "1";
    toastT = 2.2;
  }

  function resize() {
    const play = document.getElementById("play");
    W = canvas.width = play.clientWidth;
    H = canvas.height = play.clientHeight;
    syncTouchHud();
  }
  window.addEventListener("resize", resize);
  resize();

  BUILD.forEach((b, i) => {
    const d = document.createElement("button");
    d.type = "button";
    d.className = "slot";
    d.id = "slot" + i;
    d.setAttribute("aria-label", b.name);
    d.innerHTML = `<span class="slot-spr-wrap"><img class="slot-spr" src="${SPRITE_BASE}${b.id}.png" alt="" width="40" height="40" /><kbd>${b.key}</kbd></span><span class="slot-body"><span class="name">${b.name} <span class="count">×${S.inv[b.id] || 0}</span></span><span class="sub">C ${b.cost}광석</span></span>`;
    d.addEventListener("pointerdown", (e) => {
      if (e.pointerType === "mouse" && e.button !== 0) return;
      e.preventDefault();
      S.sel = i;
    });
    hotbarEl.appendChild(d);
  });

  window.addEventListener("keydown", (e) => {
    const k = e.key.toLowerCase();
    keys.add(k);
    if ([" ", "p", "arrowup", "arrowdown", "arrowleft", "arrowright"].includes(k)) e.preventDefault();
    if (k === "h") {
      toggleHelp();
      return;
    }
    if (S.over || !S.running) return;
    if (k === "p") { S.paused = !S.paused; syncTouchHud(); }
    const n = parseInt(e.key, 10);
    if (n >= 1 && n <= 6) S.sel = n - 1;
    if (k === "r") S.dir = (S.dir + 1) % 4;
    if (k === "c") craft();
    if (k === "e") {
      if (!repairOnce()) collectAround(true);
    }
    if (k === "t") toggleRecipe(mouse.gx, mouse.gy);
    if (k === "x") demolish(mouse.gx, mouse.gy);
  });
  window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
  window.addEventListener("blur", () => { keys.clear(); resetStick(); clearHold(); });
  document.addEventListener("visibilitychange", () => {
    if (document.hidden) { keys.clear(); resetStick(); clearHold(); }
  });
  function markTouchUi() {
    const root = document.documentElement;
    if (root.classList.contains("has-touch")) return;
    root.classList.add("has-touch");
    syncTouchHud();
  }
  window.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "touch" || e.pointerType === "pen") markTouchUi();
  }, { passive: true });
  window.addEventListener("touchstart", markTouchUi, { passive: true });

  function setPointer(e) {
    const r = canvas.getBoundingClientRect();
    const sx = r.width > 0 ? canvas.width / r.width : 1;
    const sy = r.height > 0 ? canvas.height / r.height : 1;
    mouse.x = (e.clientX - r.left) * sx;
    mouse.y = (e.clientY - r.top) * sy;
    const wm = worldMouse();
    mouse.gx = Math.floor(wm.x / TILE);
    mouse.gy = Math.floor(wm.y / TILE);
  }

  function onCanvasDown(e) {
    if (e.pointerType === "mouse" && e.button !== 0) return;
    if (e.pointerType === "touch" || e.pointerType === "pen") markTouchUi();
    e.preventDefault();
    try { canvas.setPointerCapture(e.pointerId); } catch {}
    paintPtr = e.pointerId;
    setPointer(e);
    mouse.down = true;
    paint = { x: mouse.gx, y: mouse.gy };
    if (!S.running || S.paused || S.over) return;
    if (BUILD[S.sel].id === "belt") placeBelt(mouse.gx, mouse.gy, S.dir, true);
    else tryPlace();
  }
  function onCanvasMove(e) {
    setPointer(e);
    if (mouse.down && paintPtr === e.pointerId) continuePaint();
  }
  function onCanvasUp(e) {
    if (paintPtr != null && e.pointerId !== paintPtr) return;
    mouse.down = false;
    paintPtr = null;
    paint = { x: -1, y: -1 };
  }
  canvas.addEventListener("pointerdown", onCanvasDown);
  canvas.addEventListener("pointermove", onCanvasMove);
  canvas.addEventListener("pointerup", onCanvasUp);
  canvas.addEventListener("pointercancel", onCanvasUp);
  canvas.addEventListener("contextmenu", (e) => e.preventDefault());

  const helpBtn = document.getElementById("helpBtn");
  if (helpBtn) helpBtn.addEventListener("click", toggleHelp);
  if (startBtn) startBtn.addEventListener("click", () => showHub());

  function isCoarsePointer() {
    try {
      if (window.matchMedia("(any-pointer: coarse)").matches) return true;
      if (window.matchMedia("(pointer: coarse)").matches) return true;
    } catch {}
    return false;
  }

  function wantsTouchUi() {
    if (window.__forceTouchUi) return true;
    if (document.documentElement.classList.contains("has-touch")) return true;
    if (isCoarsePointer()) return true;
    if ((navigator.maxTouchPoints || 0) > 0) return true;
    try {
      if (window.matchMedia("(max-width: 720px)").matches) return true;
    } catch {}
    return false;
  }

  function resetStick() {
    stick.x = 0;
    stick.y = 0;
    stick.id = null;
    const pad = document.getElementById("stickPad");
    if (pad) pad.classList.remove("live");
    const knob = document.getElementById("stickKnob");
    if (knob) knob.style.transform = "translate(-50%, -50%)";
  }

  function clearHold() {
    holdAct = null;
    holdPtr = null;
    holdAcc = 0;
    document.querySelectorAll("#touchActs .touch-btn.on").forEach((b) => b.classList.remove("on"));
  }

  function fireAct(act) {
    if (!S.running || S.over) return;
    if (act === "e") {
      if (!repairOnce()) collectAround(true);
    } else if (act === "c") {
      craft();
    } else if (act === "r") {
      S.dir = (S.dir + 1) % 4;
    } else if (act === "x") {
      demolish(mouse.gx, mouse.gy);
    } else if (act === "t") {
      toggleRecipe(mouse.gx, mouse.gy);
    } else if (act === "p") {
      S.paused = !S.paused;
      syncTouchHud();
    }
  }

  function syncTouchHud() {
    const el = document.getElementById("touchHud");
    if (!el) return;
    const show = wantsTouchUi() && S.running && !S.over && !helpOpen && overlay.classList.contains("hidden");
    el.classList.toggle("hidden", !show);
    if (!show) {
      resetStick();
      clearHold();
    }
    const pBtn = el.querySelector('[data-act="p"]');
    if (pBtn) pBtn.textContent = S.paused ? "재개" : "정지";
  }

  function applyStick(dx, dy, pad) {
    const r = pad.getBoundingClientRect();
    const cx = r.left + r.width / 2;
    const cy = r.top + r.height / 2;
    const max = Math.max(18, r.width * 0.38);
    let x = dx - cx, y = dy - cy;
    let m = Math.hypot(x, y);
    if (m > max) { x = (x / m) * max; y = (y / m) * max; m = max; }
    const mag = m / max;
    const dz = 0.16;
    if (mag < dz) {
      stick.x = 0;
      stick.y = 0;
    } else {
      const scale = (mag - dz) / (1 - dz);
      stick.x = (x / m) * scale;
      stick.y = (y / m) * scale;
    }
    const knob = document.getElementById("stickKnob");
    if (knob) knob.style.transform = `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`;
  }

  (function bindTouch() {
    const pad = document.getElementById("stickPad");
    if (pad) {
      pad.addEventListener("pointerdown", (e) => {
        if (stick.id != null) return;
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        try { pad.setPointerCapture(e.pointerId); } catch {}
        stick.id = e.pointerId;
        pad.classList.add("live");
        markTouchUi();
        applyStick(e.clientX, e.clientY, pad);
      });
      pad.addEventListener("pointermove", (e) => {
        if (e.pointerId !== stick.id) return;
        e.preventDefault();
        applyStick(e.clientX, e.clientY, pad);
      });
      const end = (e) => {
        if (e.pointerId !== stick.id) return;
        resetStick();
      };
      pad.addEventListener("pointerup", end);
      pad.addEventListener("pointercancel", end);
      pad.addEventListener("lostpointercapture", (e) => {
        if (e.pointerId === stick.id) resetStick();
      });
    }
    document.querySelectorAll("#touchActs [data-act]").forEach((btn) => {
      const act = btn.getAttribute("data-act");
      btn.addEventListener("pointerdown", (e) => {
        if (e.pointerType === "mouse" && e.button !== 0) return;
        e.preventDefault();
        e.stopPropagation();
        try { btn.setPointerCapture(e.pointerId); } catch {}
        markTouchUi();
        btn.classList.add("on");
        fireAct(act);
        if (act === "e") {
          holdAct = "e";
          holdPtr = e.pointerId;
          holdAcc = 0;
        }
      });
      btn.addEventListener("pointerup", (e) => {
        btn.classList.remove("on");
        if (holdPtr === e.pointerId) clearHold();
      });
      btn.addEventListener("pointercancel", (e) => {
        btn.classList.remove("on");
        if (holdPtr === e.pointerId) clearHold();
      });
    });
  })();

  const EDGE_NAME = { n: "북쪽", s: "남쪽", w: "서쪽", e: "동쪽" };

  function showHub() {
    helpOpen = false;
    S.running = false;
    S.paused = false;
    overlay.classList.remove("hidden");
    const save = loadSave();
    const cards = CAMPAIGN.map((id) => {
      const st = STAGES[id];
      const playable = PLAYABLE.includes(id) && save.unlocked.includes(id);
      const locked = !playable;
      const cleared = save.cleared.includes(id);
      let note = st.blurb || "";
      if (!PLAYABLE.includes(id)) note = save.unlocked.includes(id) ? "다음 낙하 준비 중" : (st.lockedNote || "잠김");
      else if (!save.unlocked.includes(id)) note = "이전 거점을 안정시켜라";
      return `<button type="button" class="stage-card${locked ? " locked" : ""}${cleared ? " cleared" : ""}" data-stage="${id}" ${locked ? "disabled" : ""}>
        <span class="k">${st.tag || ""}</span>
        <strong>${st.name}</strong>
        <span class="b">${note}</span>
        ${cleared ? "<span class='done'>거점 안정</span>" : ""}
      </button>`;
    }).join("");
    card.innerHTML = `
      <p class="log-tag">직조함 N-07 · 블랙박스 · 릴리스 ${VERSION} · 포인트 ${pointsTotal(save) - pointsSpent(save.skills)}</p>
      <h1>탄막 조립선</h1>
      <p class="lead">함은 스스로 쏜다. 탄약이 없으면 공장이 죽는다. 광맥을 열고 선을 잇고 거점을 유지하라.</p>
      <p class="dim">거점을 처음 깨면 스킬 포인트 1. 낙하 전에 넣고, 런이 시작되면 고정이다. 자유 포인트는 따로 센다.</p>
      <div class="stage-grid">${cards}</div>
      <button type="button" id="freeBtn" class="ghost">자유 난이도 — 자유 포인트 ${freePointsTotal(save) - pointsSpent(save.freeSkills)}</button>
      <button type="button" id="howBtn" class="ghost">조작 요령</button>
      <a href="${GUIDE_HREF}" id="guideBtn" class="ghost">처음이라면 — 작전 설명</a>`;
    card.querySelectorAll(".stage-card:not(.locked)").forEach((el) => {
      el.addEventListener("click", () => beginStage(el.getAttribute("data-stage")));
    });
    document.getElementById("freeBtn").addEventListener("click", () => beginStage("free"));
    document.getElementById("howBtn").addEventListener("click", showHowTo);
    syncTouchHud();
  }

  function showHowTo() {
    const tpl = document.getElementById("helpTpl");
    const body = tpl ? tpl.innerHTML.replace(/href="\/guide"/g, `href="${GUIDE_HREF}"`) : "";
    card.innerHTML = `<h1>조작</h1>${body}<a href="${GUIDE_HREF}" id="guideBtn" class="ghost">전체 작전 설명</a><button id="backHub" type="button">거점 선택으로</button>`;
    document.getElementById("backHub").addEventListener("click", showHub);
  }

  function showSkillLoadout(stageId, mode) {
    const spec = STAGES[stageId];
    if (!spec || !PLAYABLE.includes(stageId)) return;
    const book = stageId === "free" ? "free" : "campaign";
    const resume = mode === "resume";
    helpOpen = false;
    overlay.classList.remove("hidden");
    const render = () => {
      const save = loadSave();
      const skills = book === "free" ? save.freeSkills : save.skills;
      const total = book === "free" ? freePointsTotal(save) : pointsTotal(save);
      const spent = pointsSpent(skills);
      const left = total - spent;
      const cols = ["직조", "탄막", "거점"].map((branch) => {
        const rows = SKILLS.filter((s) => s.branch === branch).map((def) => {
          const rank = skillRank(skills, def.id);
          const canUp = rank < def.max && left >= def.cost;
          const canDown = !resume && rank > 0;
          let pips = "";
          for (let i = 1; i <= def.max; i++) pips += i <= rank ? "●" : "○";
          const cur = rank > 0 ? def.lines[rank - 1] : "미장착";
          const nxt = rank < def.max ? `다음 ${def.lines[rank]}${def.cost > 1 ? ` · ${def.cost}포인트` : ""}` : "최대";
          return `<div class="skill-row">
            <div class="skill-copy">
              <strong>${def.name} <span class="pips">${pips}</span></strong>
              <p class="fx">${cur}</p>
              <p class="fx${def.warn ? " warn" : ""}">${nxt}</p>
            </div>
            <div class="skill-acts">
              <button type="button" class="skill-btn ghost" data-skill="${def.id}" data-dir="-1" ${canDown ? "" : "disabled"} aria-label="${def.name} 내리기">−</button>
              <button type="button" class="skill-btn" data-skill="${def.id}" data-dir="1" ${canUp ? "" : "disabled"} aria-label="${def.name} 올리기">+</button>
            </div>
          </div>`;
        }).join("");
        return `<section class="skill-col"><h2>${branch}</h2>${rows}</section>`;
      }).join("");
      const hint = resume
        ? "올린 랭크는 남은 런에 바로 적용된다. 빼기는 다음 낙하 전."
        : book === "free"
          ? (total ? "자유 포인트는 거점과 따로다. 넣고 빼도 줄지 않는다. 낙하하면 그 판은 고정이다." : "자유 포인트 0. 8웨이브를 넘기면 1, 이후 4웨이브마다 1. 최대 12.")
          : (total ? "넣고 빼도 포인트는 줄지 않는다. 낙하하면 그 판은 고정이다." : "포인트 0. 거점을 처음 깨면 1포인트.");
      card.innerHTML = `
        <p class="log-tag">강화 · ${spec.name}</p>
        <h1>스킬</h1>
        <p class="skill-head">남은 포인트 <b>${left}</b> <span>보유 ${total} · 사용 ${spent}</span></p>
        <p class="dim">${hint}</p>
        <div class="skill-grid">${cols}</div>
        <button type="button" id="dropBtn">${resume ? "이 세팅으로 계속" : "이 세팅으로 낙하"}</button>
        <button type="button" id="backSkill" class="ghost">${resume ? "관문으로" : "거점으로"}</button>`;
      card.querySelectorAll("[data-skill]").forEach((btn) => {
        btn.addEventListener("click", () => {
          const id = btn.getAttribute("data-skill");
          const dir = +btn.getAttribute("data-dir");
          const cur = loadSave();
          const slot = book === "free" ? cur.freeSkills : cur.skills;
          const def = SKILLS.find((s) => s.id === id);
          const rank = skillRank(slot, id);
          if (!def) return;
          if (dir > 0) {
            if (rank >= def.max) return;
            const pool = book === "free" ? freePointsTotal(cur) : pointsTotal(cur);
            if (pool - pointsSpent(slot) < def.cost) return;
            slot[id] = rank + 1;
          } else if (!resume && rank > 0) {
            slot[id] = rank - 1;
          } else return;
          if (book === "free") {
            writeSave({ freeSkills: slot });
            if (resume && S && S.spec && S.spec.id === "free") applySkills(S, loadSave().freeSkills);
          } else writeSave({ skills: slot });
          render();
        });
      });
      document.getElementById("dropBtn").addEventListener("click", () => {
        if (resume) resumeFreeRun("연장 — 강화가 남은 런에 적용된다");
        else startRun(stageId);
      });
      document.getElementById("backSkill").addEventListener("click", () => {
        if (!resume) showHub();
        else if ((S.wave || 0) <= 8 && !S.extended) showClearChoice();
        else showFreeGate();
      });
    };
    render();
    syncTouchHud();
  }

  function beginStage(id) {
    const spec = STAGES[id];
    if (!spec || !PLAYABLE.includes(id)) return;
    const panels = spec.logs || [];
    if (!panels.length) {
      showSkillLoadout(id);
      return;
    }
    let i = 0;
    const render = () => {
      const p = panels[i];
      card.innerHTML = `
        <p class="log-tag">${p.tag}</p>
        <h1>${spec.name}</h1>
        <p class="lead">${p.nar}</p>
        <p class="rec">${p.line}</p>
        <p class="dim">${i + 1} / ${panels.length}</p>
        <button type="button" id="nextLog">${i < panels.length - 1 ? "다음" : "강화"}</button>
        <button type="button" id="skipLog" class="ghost">건너뛰기</button>`;
      document.getElementById("nextLog").addEventListener("click", () => {
        if (i < panels.length - 1) { i += 1; render(); }
        else showSkillLoadout(id);
      });
      document.getElementById("skipLog").addEventListener("click", () => showSkillLoadout(id));
    };
    overlay.classList.remove("hidden");
    render();
    syncTouchHud();
  }

  function startRun(stageId) {
    helpOpen = false;
    S = fresh(stageId || "free");
    S.running = true;
    overlay.classList.add("hidden");
    audioCtx();
    const spec = S.spec;
    if (spec.id === "s1") toast("북쪽만 본다. 발전기(6)부터. 탄약은 줍는다");
    else if (spec.id === "s2") toast("광맥이 좌우로 갈라졌다. 벨트로 건너라");
    else if (spec.id === "s3") toast("고리 안쪽이 공장. 바깥 벨트는 포식충 밥이다");
    else if (spec.id === "s4") toast("귀퉁이 네 광맥. 발전기 두 대가 필요하다");
    else if (spec.id === "s5") toast("잔맥은 빨리 빈다. 산란충 3마리를 쏴라");
    else if (spec.id === "s6") toast("대각 광맥. 포탑은 3기. 세 번째는 직접 지어라");
    else if (spec.id === "s7") toast("발전기 하나로는 7파도를 못 센다. 두 대를 켜라");
    else if (spec.id === "s8") toast("종점. 산란충 4, 잔해 3. 광맥을 옮겨라");
    else toast("발전기(6)부터. 장전 키는 없고 탄약은 줍는다");
    syncTouchHud();
  }

  function toggleHelp() {
    if (!S.running || S.over) return;
    if (helpOpen) {
      closeHelp();
      return;
    }
    helpOpen = true;
    if (S.running) S.paused = true;
    overlay.classList.remove("hidden");
    syncTouchHud();
    const tpl = document.getElementById("helpTpl");
    card.innerHTML = `<h1>도움말</h1>${tpl ? tpl.innerHTML : ""}<button id="closeHelp" type="button">닫고 계속</button><button id="abortRun" type="button" class="ghost">거점 포기</button>`;
    document.getElementById("closeHelp").addEventListener("click", closeHelp);
    document.getElementById("abortRun").addEventListener("click", () => {
      helpOpen = false;
      S.running = false;
      S.paused = false;
      showHub();
    });
  }

  function closeHelp() {
    helpOpen = false;
    overlay.classList.add("hidden");
    if (S.running && !S.over) S.paused = false;
    syncTouchHud();
  }

  function worldMouse() {
    return { x: mouse.x + S.camX, y: mouse.y + S.camY };
  }

  function craft() {
    const b = BUILD[S.sel];
    if (S.inv.ore < b.cost) return toast("광석이 부족하다");
    S.inv.ore -= b.cost;
    S.inv[b.id] += 1;
    toast(`${b.name} 제작`);
  }

  function toggleRecipe(x, y) {
    const c = cell(x, y);
    if (!c || c.kind !== "assembler") return toast("커서를 조립기 위에 두고 T");
    if (!S.unlocks.shell) return toast("이 거점에서는 포탄 레시피가 없다");
    if (c.bufOut > 0) {
      S.inv[c.bufOutType || "ammo"] += c.bufOut;
      c.bufOut = 0;
    }
    c.recipe = c.recipe === "ammo" ? "shell" : "ammo";
    toast(c.recipe === "shell" ? "레시피: 광석 2 = 포탄 1 (포탑용)" : "레시피: 광석 1 = 탄약 1");
  }

  function dirFromDelta(dx, dy) {
    if (dx === 0 && dy === 0) return S.dir;
    if (Math.abs(dx) >= Math.abs(dy)) return dx > 0 ? 1 : 3;
    return dy > 0 ? 2 : 0;
  }

  function placeBelt(gx, gy, dir, playSfx) {
    if (!S.running || S.paused || S.over) return false;
    const c = cell(gx, gy);
    if (!c) return false;
    if (c.kind === "belt") {
      c.dir = dir;
      return true;
    }
    if (c.kind !== "empty") return false;
    if (S.inv.belt <= 0) {
      toast("벨트 없음 — C로 제작");
      return false;
    }
    const built = emptyCell();
    built.kind = "belt";
    built.dir = dir;
    built.hp = BUILD_HP.belt;
    built.maxHp = built.hp;
    built.buildAnim = playSfx ? 1 : 0.4;
    S.grid[gy][gx] = built;
    S.inv.belt -= 1;
    if (playSfx) sfx.build();
    return true;
  }

  function continuePaint() {
    if (!S.running || BUILD[S.sel].id !== "belt") return;
    if (paint.x < 0) {
      paint = { x: mouse.gx, y: mouse.gy };
      placeBelt(mouse.gx, mouse.gy, S.dir, true);
      return;
    }
    let x = paint.x, y = paint.y;
    let guard = 0;
    while ((x !== mouse.gx || y !== mouse.gy) && guard++ < 80) {
      const nx = x === mouse.gx ? x : x + Math.sign(mouse.gx - x);
      const ny = x === mouse.gx ? y + Math.sign(mouse.gy - y) : y;
      const dir = dirFromDelta(nx - x, ny - y);
      const prev = cell(x, y);
      if (prev && prev.kind === "belt") prev.dir = dir;
      if (!placeBelt(nx, ny, dir, false)) break;
      S.dir = dir;
      x = nx;
      y = ny;
    }
    paint = { x, y };
  }

  function tryPlace() {
    if (!S.running || S.paused || S.over) return;
    const b = BUILD[S.sel];
    const { gx, gy } = mouse;
    const c = cell(gx, gy);
    if (!c) return;
    if (S.inv[b.id] <= 0) return toast(`${b.name} 없음 — C로 제작`);
    if (b.id === "miner") {
      if (c.kind !== "ore") return toast("채굴기는 광맥 위에만");
    } else if (c.kind !== "empty") {
      return;
    }
    const built = emptyCell();
    built.kind = b.id;
    built.dir = S.dir;
    if (c.kind === "ore") built.ore = c.ore;
    if (b.id === "turret") built.ammo = 16;
    built.hp = BUILD_HP[b.id] || 12;
    built.maxHp = built.hp;
    built.buildAnim = 1;
    S.grid[gy][gx] = built;
    S.inv[b.id] -= 1;
    sfx.build();
    burst((gx + 0.5) * TILE, (gy + 0.5) * TILE, "#c8ffe4", 8, 70);
  }

  function demolish(x, y) {
    const c = cell(x, y);
    if (!c || c.kind === "empty" || c.kind === "ore") return;
    const id = c.kind;
    const leftoverOre = c.kind === "miner" ? c.ore : 0;
    if (c.bufIn) S.inv.ore += c.bufIn;
    if (c.bufOut) S.inv[c.bufOutType || "ammo"] += c.bufOut;
    if (c.ammo) S.inv.ammo += c.ammo;
    if (c.shell) S.inv.shell += c.shell;
    S.grid[y][x] = emptyCell();
    if (leftoverOre > 0) {
      S.grid[y][x].kind = "ore";
      S.grid[y][x].ore = leftoverOre;
    }
    S.inv[id] += 1;
    toast("철거");
  }

  function poweredAt(tx, ty) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (S.grid[y][x].kind !== "generator") continue;
        const dx = x - tx, dy = y - ty;
        if (dx * dx + dy * dy <= POWER_R * POWER_R + 0.25) return true;
      }
    }
    return false;
  }

  function refreshPower() {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = S.grid[y][x];
        if (["miner", "inserter", "assembler", "turret"].includes(c.kind)) {
          c.powered = poweredAt(x, y);
        } else c.powered = true;
      }
    }
  }

  function freeRoster(w) {
    return {
      grub: w <= 5 ? [0, 10, 13, 16, 18, 20][w] : 20 + (w - 5) * 3,
      runner: w < 3 ? 0 : 4 + (w - 3) * 2,
      chewer: w < 5 ? 0 : (w === 5 ? 5 : 3 + (w - 5)),
      wire: w < 7 ? 0 : 1 + (w - 7),
      spawner: w < 8 ? 0 : 1 + Math.floor((w - 8) / 4),
    };
  }

  function spawnWave() {
    if (S.wave > 0 && countGenerators() >= 2) {
      S.dualGenWaves = (S.dualGenWaves || 0) + 1;
    }
    S.wave += 1;
    const w = S.wave;
    const spec = S.spec || STAGES.free;
    const edges = spec.spawnEdges ? (spec.spawnEdges[w] || spec.spawnEdges[spec.waves] || ["n", "s", "w", "e"]) : null;
    function edge() {
      return edgePoint(edges);
    }
    let grubs, runners, chewers, wires, spawners;
    if (spec.roster && spec.roster[w]) {
      const r = spec.roster[w];
      grubs = r.grub || 0;
      runners = r.runner || 0;
      chewers = r.chewer || 0;
      wires = r.wire || 0;
      spawners = r.spawner || 0;
    } else if (spec.id === "free") {
      const r = freeRoster(w);
      grubs = r.grub;
      runners = r.runner;
      chewers = r.chewer;
      wires = r.wire;
      spawners = r.spawner;
    } else {
      grubs = 0;
      runners = 0;
      chewers = 0;
      wires = 0;
      spawners = 0;
    }
    for (let i = 0; i < grubs; i++) {
      const p = edge();
      S.enemies.push({ x: p.x, y: p.y, hp: 10 + w, max: 10 + w, spd: 44, dmg: 5.6, kind: "grub", r: 11 });
    }
    for (let i = 0; i < runners; i++) {
      const p = edge();
      S.enemies.push({ x: p.x, y: p.y, hp: 6 + w, max: 6 + w, spd: 74, dmg: 4.4, kind: "runner", r: 8 });
    }
    for (let i = 0; i < chewers; i++) {
      const p = edge();
      S.enemies.push({ x: p.x, y: p.y, hp: 22 + w * 2, max: 22 + w * 2, spd: 30, dmg: 5.0, kind: "chewer", r: 13, walk: 0, flash: 0 });
    }
    for (let i = 0; i < wires; i++) {
      const p = edge();
      S.enemies.push({ x: p.x, y: p.y, hp: 22 + w * 2, max: 22 + w * 2, spd: 36, dmg: 6.8, kind: "wire", r: 12, walk: 0, flash: 0 });
    }
    for (let i = 0; i < spawners; i++) {
      const p = edge();
      S.enemies.push({ x: p.x, y: p.y, hp: 46 + w * 3, max: 46 + w * 3, spd: 22, dmg: 5.4, kind: "spawner", r: 16, walk: 0, flash: 0 });
    }
    const from = (edges || ["n", "s", "w", "e"]).map((e) => EDGE_NAME[e] || e).join("·");
    toast(`웨이브 ${w} — ${from}`);
    S.incoming = spec.spawnEdges
      ? (spec.spawnEdges[w + 1] || spec.spawnEdges[w] || [])
      : ["n", "s", "w", "e"];
    if (spec.id === "free") {
      if (w === 5) toast("5웨이브 — 포식충이 건물을 물어뜯는다");
      if (w === 7) toast("7웨이브 — 전선충이 발전기만 쫓는다");
      if (w === 8) toast("8웨이브 — 산란충이 핵으로 온다. 죽으면 잡식 둘");
    } else {
      if (spec.id === "s3" && w === 4) toast("포식충 — 벨트를 문다. 라인을 안으로, 포탑은 바깥에");
      if (spec.id === "s4" && w === 3) toast("전선충 — 발전기만 추적한다");
      if (spec.id === "s5" && w === 6) toast("산란충 — 죽으면 잡식 둘을 남긴다. 핵으로 온다");
      if (spec.id === "s6" && w === 3) toast("회랑 — 포식충이 대각 벨트를 문다. 포탑 3기");
      if (spec.id === "s7" && w === 3) toast("전선충 — 발전기 두 대를 꺼뜨리지 마라");
      if (spec.id === "s7" && w === 5) toast("산란충 — 심연에서도 핵으로 온다");
      if (spec.id === "s8" && w === 3) toast("종점 산란 — 넷을 놓치면 궤도에 못 오른다");
      if (w === spec.waves) toast(`${w}웨이브 — 목표를 닫아라`);
    }
  }

  function nearestEnemy(x, y, range, prefer) {
    const kinds = !prefer ? [] : (Array.isArray(prefer) ? prefer : [prefer]);
    let best = null, bd = range * range;
    for (const kind of kinds) {
      best = null;
      bd = range * range;
      for (const e of S.enemies) {
        if (e.kind !== kind) continue;
        const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
        if (d < bd) { bd = d; best = e; }
      }
      if (best) return best;
    }
    best = null;
    bd = range * range;
    for (const e of S.enemies) {
      const d = (e.x - x) * (e.x - x) + (e.y - y) * (e.y - y);
      if (d < bd) { bd = d; best = e; }
    }
    return best;
  }

  function shoot(fromX, fromY, target, dmg, speed, friendly, pierce, turret) {
    const dx = target.x - fromX, dy = target.y - fromY;
    const len = Math.hypot(dx, dy) || 1;
    S.bullets.push({
      x: fromX, y: fromY, vx: (dx / len) * speed, vy: (dy / len) * speed,
      dmg, life: 0.7, friendly, pierce: pierce || 0, hit: [],
      px: fromX, py: fromY, turret: !!turret,
    });
    S.particles.push({
      x: fromX + (dx / len) * 10, y: fromY + (dy / len) * 10,
      vx: 0, vy: 0, life: 0.08, max: 0.08, color: "#fff4c0", size: 10, kind: "flash",
    });
  }

  function shootOffset(fromX, fromY, target, dmg, speed, ang) {
    const dx = target.x - fromX, dy = target.y - fromY;
    const base = Math.atan2(dy, dx);
    for (const a of [-ang, ang]) {
      S.bullets.push({
        x: fromX, y: fromY,
        vx: Math.cos(base + a) * speed, vy: Math.sin(base + a) * speed,
        dmg, life: 0.55, friendly: true, pierce: 0, hit: [],
      });
    }
  }

  function nearestBuilding(x, y, kinds) {
    let best = null, bd = 1e12;
    const allow = kinds && kinds.length ? kinds : null;
    for (let ty = 0; ty < ROWS; ty++) {
      for (let tx = 0; tx < COLS; tx++) {
        const c = S.grid[ty][tx];
        if (!BUILD_HP[c.kind]) continue;
        if (allow && !allow.includes(c.kind)) continue;
        const cx = (tx + 0.5) * TILE, cy = (ty + 0.5) * TILE;
        const d = (cx - x) * (cx - x) + (cy - y) * (cy - y);
        if (d < bd) { bd = d; best = { tx, ty, c, x: cx, y: cy }; }
      }
    }
    return best;
  }

  function wreckBuilding(tx, ty) {
    const c = cell(tx, ty);
    if (!c || !BUILD_HP[c.kind]) return;
    const kind = c.kind;
    const leftover = kind === "miner" ? c.ore : 0;
    if (c.bufOut) dropItem((tx + 0.5) * TILE, (ty + 0.5) * TILE, c.bufOutType || "ammo", c.bufOut);
    const names = { miner: "채굴기", belt: "벨트", inserter: "투입기", assembler: "조립기", turret: "포탑", generator: "발전기" };
    S.grid[ty][tx] = emptyCell();
    if (leftover > 0) {
      S.grid[ty][tx].kind = "ore";
      S.grid[ty][tx].ore = leftover;
    }
    S.grid[ty][tx].rubble = 2.2;
    S.grid[ty][tx].wreckName = names[kind] || kind;
    S.wrecks = (S.wrecks || 0) + 1;
    burst((tx + 0.5) * TILE, (ty + 0.5) * TILE, "#c45a3a", 10, 90);
    const cap = destroyCap(S.spec);
    if (cap) toast(`${names[kind] || kind} 파괴 — ${S.wrecks}/${cap}`);
    else toast(`${names[kind] || kind} 파괴 — 잔해`);
  }

  function damagedNearPlayer() {
    const { tx, ty } = tileOf(S.player.x, S.player.y);
    const hits = [];
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const c = cell(tx + dx, ty + dy);
        if (!c || !BUILD_HP[c.kind]) continue;
        if (!c.maxHp) { c.maxHp = BUILD_HP[c.kind]; c.hp = c.maxHp; }
        if (c.hp < c.maxHp) hits.push({ c, x: tx + dx, y: ty + dy });
      }
    }
    return hits;
  }

  function repairOnce() {
    const hits = damagedNearPlayer();
    if (!hits.length) return false;
    if (S.inv.ore <= 0) {
      toast("수리하려면 광석이 필요하다");
      return true;
    }
    const { c, x, y } = hits[0];
    S.inv.ore -= 1;
    c.hp = Math.min(c.maxHp, c.hp + ((S.skills && S.skills.repair) || 8));
    burst((x + 0.5) * TILE, (y + 0.5) * TILE, "#7ee0b0", 5, 40);
    toast(c.hp >= c.maxHp ? "수리 완료" : `수리 ${Math.ceil(c.hp)}/${c.maxHp}`);
    return true;
  }

  function dropItem(x, y, type, n) {
    for (let i = 0; i < n; i++) {
      S.items.push({
        x: x + (Math.random() - 0.5) * 18,
        y: y + (Math.random() - 0.5) * 18,
        type, onBelt: false, tx: -1, ty: -1, t: 0,
      });
    }
  }

  function beltPush(tx, ty, type) {
    const c = cell(tx, ty);
    if (!c || c.kind !== "belt") return false;
    const busy = S.items.some((it) => it.onBelt && it.tx === tx && it.ty === ty && it.t < 0.55);
    if (busy) return false;
    S.items.push({ x: (tx + 0.5) * TILE, y: (ty + 0.5) * TILE, type, onBelt: true, tx, ty, t: 0 });
    return true;
  }

  function tileOf(x, y) {
    return { tx: Math.floor(x / TILE), ty: Math.floor(y / TILE) };
  }

  function collectAround(manual) {
    const p = S.player;
    let n = 0;
    for (let i = S.items.length - 1; i >= 0; i--) {
      const it = S.items[i];
      if (it.onBelt && !manual) continue;
      const reach = it.onBelt ? 36 : 32;
      if (Math.hypot(it.x - p.x, it.y - p.y) < reach) {
        S.inv[it.type] += 1;
        S.items.splice(i, 1);
        n++;
      }
    }
    const { tx, ty } = tileOf(p.x, p.y);
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const c = cell(tx + dx, ty + dy);
        if (!c) continue;
        if (c.kind === "assembler" && c.bufOut > 0) {
          const t = c.bufOutType || "ammo";
          S.inv[t] = (S.inv[t] || 0) + c.bufOut;
          n += c.bufOut;
          c.bufOut = 0;
        }
        if (c.kind === "turret") {
          while (S.inv.shell > 0 && c.shell < 16) {
            S.inv.shell -= 1; c.shell += 1; n++;
          }
          while (S.inv.ammo > 0 && c.ammo < 24) {
            S.inv.ammo -= 1; c.ammo += 1; n++;
          }
        }
      }
    }
    if (manual && n === 0) toast("주변에 주울 탄약/광석이 없다");
    else if (manual && n) toast(`${n}개 수거`);
    return n;
  }

  function updateCoach() {
    if (!coachEl) return;
    let gens = 0, miners = 0, belts = 0, assemblers = 0, inserters = 0;
    for (const row of S.grid) {
      for (const c of row) {
        if (c.kind === "generator") gens++;
        if (c.kind === "miner") miners++;
        if (c.kind === "belt") belts++;
        if (c.kind === "assembler") assemblers++;
        if (c.kind === "inserter") inserters++;
      }
    }
    let msg = "라인 유지. 탄약이 줄면 조립기 옆에 서서 E.";
    if (S.spec && S.spec.id === "s8") {
      msg = "종점. 광맥을 옮기고 산란충 4마리를 쏴라. 잔해 3을 넘기면 추락한다.";
    } else if (S.spec && S.spec.id === "s7") {
      msg = gens < 2
        ? "심연은 한 발전기로 안 덮인다. 두 번째를 지어 7파도를 세어라. 전선충은 발전기를 문다."
        : "발전기 두 대. 전선충과 산란충이 같이 온다. 포탑은 발전기 옆.";
    } else if (S.spec && S.spec.id === "s6") {
      msg = "광맥이 대각이다. 벨트는 전장을 가로지른다. 포탑 3기(하나는 제작)와 잔해 2 이하.";
    } else if (S.spec && S.spec.id === "s5") {
      msg = "중앙 광맥은 빨리 빈다. 채굴기를 옮기고, 산란충(큰 보라)을 먼저 쏴라.";
    } else if (S.spec && S.spec.id === "s4") {
      msg = gens < 2
        ? "귀퉁이 광맥은 한 발전기로 안 덮인다. 두 번째 발전기를 지어라. 청록 전선충은 발전기를 문다."
        : "발전기 두 대 가동. 전선충이 오면 발전기 옆에 포탑.";
    } else if (S.spec && S.spec.id === "s3") {
      msg = "공장은 고리 안쪽. 포탑은 바깥. 포식충이 벨트를 문다. E로 수리.";
    } else if (S.spec && S.spec.id === "s2" && gens && miners && belts < 4) {
      msg = "광맥이 서쪽과 동쪽이다. 중앙 공허를 벨트로 건너 포탑 두 기를 켜라.";
    } else if (S.spec && S.spec.id === "s1" && !gens) {
      msg = "북쪽만 침입한다. 6번 발전기를 광맥 옆에 놓아라.";
    } else if (!gens) msg = "6번 발전기를 설치하라. 반경 안만 기계가 돈다.";
    else if (!miners) msg = "주황 광맥 위에 1번 채굴기. R로 화살표를 벨트 쪽으로.";
    else if (belts < 1) msg = "2번 벨트를 채굴기 화살표 앞에 놓는다. 벨트는 방향이 없다.";
    else if (!assemblers) msg = "4번 조립기를 전력 안에 놓는다. 광석 1 = 탄약 1.";
    else if (!inserters) msg = "3번 투입기 뒤를 벨트에, 앞을 조립기에. 중간 투입기는 지나가는 광석을 집고 남는 건 끝으로 간다.";
    else if (S.inv.ammo <= 8) msg = "탄약 부족. 노란 아이템을 걷거나 조립기 옆에서 E. 장전 키는 없다.";
    let dry = 0, jammed = 0, full = 0, hurt = 0;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = S.grid[y][x];
        if (c.kind === "miner" && patchOre(x, y) <= 0) dry++;
        if (c.kind === "miner" && c.jam === "out") jammed++;
        if (c.kind === "assembler" && c.bufOut >= 6) full++;
        if (c.kind === "turret" && (c.ammo || 0) + (c.shell || 0) <= 0) dry++;
        if (BUILD_HP[c.kind] && c.maxHp && c.hp < c.maxHp) hurt++;
      }
    }
    if (hurt) msg = "건물이 손상됐다. 옆에 서서 E로 수리. 포탑은 포식충을 먼저 쏜다.";
    else if (dry) msg = "채굴 고갈이거나 포탑 탄약이 없다. 포탑 옆에 서서 E로 탄약을 넣어라.";
    else if (jammed) msg = "채굴기 앞이 막혔다. 화살표 앞 칸에 벨트를 두어라.";
    else if (full) msg = "조립기 출력이 가득하다. 옆에 벨트를 붙이거나 E로 빼라.";
    else if (S.unlocks.shell && assemblers) msg = "조립기 위 T: 탄약/포탄. 포탄은 포탑에만 넣는다.";
    coachEl.textContent = msg;
    const tech = document.getElementById("tech");
    if (tech) {
      const spec = S.spec || {};
      const rows = skillHudLines().concat([
        spec.id === "s3" ? `포식충 ${S.wave >= 4 ? "출현" : "W4"}` : "",
        spec.id === "s4" ? `전선충 ${S.wave >= 3 ? "출현" : "W3"}` : "",
        spec.id === "s5" ? `산란충 ${S.wave >= 6 ? "출현" : "W6"}` : "",
        spec.id === "s6" ? "목표 포탑 3 · 잔해 2" : "",
        spec.id === "s7" ? "목표 발전기2기 7파도" : "",
        spec.id === "s8" ? "목표 산란 4 · 잔해 3" : "",
        spec.id === "free" ? `포식충 ${S.wave >= 5 ? "출현" : "W5"}` : "",
        spec.id === "free" ? `전선충 ${S.wave >= 7 ? "출현" : "W7"}` : "",
        spec.id === "free" ? `산란충 ${S.wave >= 8 ? "출현" : "W8"}` : "",
      ].filter(Boolean));
      tech.innerHTML = rows.map((t) => `<li>${t}</li>`).join("");
    }
    if (ammoWarn) {
      let text = "";
      let cls = "";
      if (S.running && !S.over) {
        if (S.inv.ammo <= 0) {
          text = "탄약 없음 — 노란 탄피를 줍거나 조립기 옆에서 E";
        } else if (countUnpowered() > 0) {
          text = "정전 — 발전기 범위 안으로 건물을 옮겨라";
          cls = "power";
        } else {
          let emptyTurret = 0, dry = 0;
          for (let y = 0; y < ROWS; y++) {
            for (let x = 0; x < COLS; x++) {
              const c = S.grid[y][x];
              if (c.kind === "miner" && patchOre(x, y) <= 0) dry++;
              if (c.kind === "turret" && (c.ammo || 0) + (c.shell || 0) <= 0) emptyTurret++;
            }
          }
          if (emptyTurret) {
            text = "포탑 탄약없음 — 옆에 서서 E로 넣어라";
          } else if (dry) {
            text = "광맥 고갈 — 채굴기를 다른 주황 칸으로";
            cls = "dry";
          }
        }
      }
      ammoWarn.textContent = text;
      ammoWarn.className = text ? cls : "hidden";
    }
  }

  function updatePlayer(dt) {
    const p = S.player;
    let mx = 0, my = 0;
    if (keys.has("w") || keys.has("arrowup")) my -= 1;
    if (keys.has("s") || keys.has("arrowdown")) my += 1;
    if (keys.has("a") || keys.has("arrowleft")) mx -= 1;
    if (keys.has("d") || keys.has("arrowright")) mx += 1;
    mx += stick.x;
    my += stick.y;
    const mlen = Math.hypot(mx, my) || 1;
    p.moving = Math.abs(mx) > 0.02 || Math.abs(my) > 0.02;
    if (p.moving) {
      p.facing = Math.atan2(my, mx) + Math.PI / 2;
      p.walk += dt * 11;
      p.x += (mx / mlen) * p.vmax * dt;
      p.y += (my / mlen) * p.vmax * dt;
      if ((p.walk * 2 | 0) !== ((p.walk - dt * 11) * 2 | 0)) {
        const back = p.facing - Math.PI / 2;
        burst(p.x - Math.cos(back) * 10, p.y - Math.sin(back) * 10, "#7ee0ff", 2, 36);
      }
    } else {
      p.walk *= Math.max(0, 1 - dt * 8);
    }
    p.x = Math.max(16, Math.min(COLS * TILE - 16, p.x));
    p.y = Math.max(16, Math.min(ROWS * TILE - 16, p.y));

    const { tx, ty } = tileOf(p.x, p.y);
    const c = cell(tx, ty);
    if (c && (c.kind === "ore" || (c.kind === "miner" && c.ore > 0))) {
      p.mineT += dt;
      if (p.mineT >= 0.4) {
        p.mineT = 0;
        if (c.kind === "ore") {
          c.ore -= 1;
          S.inv.ore += 1;
          S.minedHand += 1;
          if (c.ore <= 0) c.kind = "empty";
        }
      }
    } else p.mineT = 0;

    collectAround(false);

    const touching = S.enemies.some((e) => Math.hypot(e.x - p.x, e.y - p.y) < 22 + e.r);
    if (!touching && p.hp < 140) p.hp = Math.min(140, p.hp + 4 * dt);

    p.cooldown -= dt;
    const wm = worldMouse();
    let target = nearestEnemy(p.x, p.y, 220);
    if (target) {
      const md = Math.hypot(wm.x - p.x, wm.y - p.y);
      const dummy = { x: wm.x, y: wm.y };
      if (md < Math.hypot(target.x - p.x, target.y - p.y) * 0.35) target = dummy;
    } else {
      target = { x: wm.x, y: wm.y };
    }
    if (p.cooldown <= 0) {
      p.cooldown = (S.skills && S.skills.fireCd) || 0.22;
      const foe = nearestEnemy(p.x, p.y, 240);
      if (S.inv.ammo > 0 && foe) {
        S.inv.ammo -= 1;
        shoot(p.x, p.y, foe, 5, 560, true, p.pierce || 0);
        if (p.spread && S.inv.ammo > 0) {
          S.inv.ammo -= 1;
          shootOffset(p.x, p.y, foe, 4, 540, 0.28);
        }
        sfx.shoot();
        burst(p.x, p.y - 6, "#fff4c8", 5, 55);
        S.particles.push({
          x: p.x + 8, y: p.y + 4,
          vx: 40 + Math.random() * 30, vy: -50 - Math.random() * 20,
          life: 0.35, max: 0.35, color: "#d4b44a", size: 3, kind: "spark",
        });
        if (p.dual && S.inv.ammo > 0) {
          S.inv.ammo -= 1;
          shoot(p.x + 6, p.y, foe, 5, 560, true, p.pierce || 0);
        }
      } else if (foe) {
        S.particles.push({ x: p.x, y: p.y - 10, vx: 0, vy: -20, life: 0.2, max: 0.2, color: "#889", size: 3 });
        if (S.time - lastEmptySfx > 0.25) { sfx.empty(); lastEmptySfx = S.time; }
      }
    }
  }

  function listBeltSinks() {
    const seen = new Set();
    const sinks = [];
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = S.grid[y][x];
        if (c.kind !== "inserter") continue;
        const bx = x - DIRS[c.dir].x, by = y - DIRS[c.dir].y;
        const back = cell(bx, by);
        if (!back || back.kind !== "belt") continue;
        const k = bx + "," + by;
        if (seen.has(k)) continue;
        seen.add(k);
        sinks.push({ x: bx, y: by });
      }
    }
    return sinks;
  }

  function bfsBelt(sx, sy) {
    const INF = 9999;
    const dist = [];
    for (let y = 0; y < ROWS; y++) {
      dist[y] = [];
      for (let x = 0; x < COLS; x++) dist[y][x] = INF;
    }
    if (!cell(sx, sy) || cell(sx, sy).kind !== "belt") return dist;
    dist[sy][sx] = 0;
    const q = [{ x: sx, y: sy }];
    for (let i = 0; i < q.length; i++) {
      const { x, y } = q[i];
      for (const d of DIRS) {
        const nx = x + d.x, ny = y + d.y;
        const n = cell(nx, ny);
        if (!n || n.kind !== "belt") continue;
        if (dist[ny][nx] <= dist[y][x] + 1) continue;
        dist[ny][nx] = dist[y][x] + 1;
        q.push({ x: nx, y: ny });
      }
    }
    return dist;
  }

  function pickBeltSink(it, fields) {
    const reach = fields.filter((f) => f.dist[it.ty][it.tx] < 9999);
    if (!reach.length) {
      it.sx = -1;
      it.sy = -1;
      return null;
    }
    const cur = reach.find((f) => f.x === it.sx && f.y === it.sy);
    if (cur) return cur;
    const tile = cell(it.tx, it.ty);
    tile.rr = (tile.rr || 0) + 1;
    const s = reach[tile.rr % reach.length];
    it.sx = s.x;
    it.sy = s.y;
    it.dwell = 0;
    return s;
  }

  function stepTowardSink(tx, ty, dist) {
    const here = dist[ty][tx];
    if (here >= 9999 || here === 0) return null;
    const opts = [];
    for (const d of DIRS) {
      const nx = tx + d.x, ny = ty + d.y;
      const n = cell(nx, ny);
      if (!n || n.kind !== "belt") continue;
      if (dist[ny][nx] < here) opts.push({ x: nx, y: ny, d: dist[ny][nx] });
    }
    if (!opts.length) return null;
    opts.sort((a, b) => a.d - b.d);
    const best = opts[0].d;
    const top = opts.filter((o) => o.d === best);
    const c = cell(tx, ty);
    c.rr = (c.rr || 0) + 1;
    return top[c.rr % top.length];
  }

  function updateBelts(dt) {
    const speed = 2.2;
    const fields = listBeltSinks().map((s) => ({ x: s.x, y: s.y, dist: bfsBelt(s.x, s.y) }));
    for (const it of S.items) {
      if (!it.onBelt) continue;
      const c = cell(it.tx, it.ty);
      if (!c || c.kind !== "belt") {
        it.onBelt = false;
        continue;
      }
      const field = pickBeltSink(it, fields);
      if (!field) {
        it.t = 0;
        it.x = (it.tx + 0.5) * TILE;
        it.y = (it.ty + 0.5) * TILE;
        continue;
      }
      const here = field.dist[it.ty][it.tx];
      if (here === 0) {
        it.dwell = (it.dwell || 0) + dt;
        it.t = 0;
        it.x = (it.tx + 0.5) * TILE;
        it.y = (it.ty + 0.5) * TILE;
        if (it.dwell > 0.45) {
          const px = it.sx, py = it.sy;
          it.sx = -1;
          it.sy = -1;
          it.dwell = 0;
          const rest = fields.filter((f) => f.dist[it.ty][it.tx] < 9999 && (f.x !== px || f.y !== py));
          if (rest.length) {
            c.rr = (c.rr || 0) + 1;
            const s = rest[c.rr % rest.length];
            it.sx = s.x;
            it.sy = s.y;
          }
        }
        continue;
      }
      const step = stepTowardSink(it.tx, it.ty, field.dist);
      if (!step) {
        it.t = 0;
        it.x = (it.tx + 0.5) * TILE;
        it.y = (it.ty + 0.5) * TILE;
        continue;
      }
      it.t += dt * speed;
      it.x = (it.tx + 0.5 + (step.x - it.tx) * Math.min(it.t, 1)) * TILE;
      it.y = (it.ty + 0.5 + (step.y - it.ty) * Math.min(it.t, 1)) * TILE;
      if (it.t >= 1) {
        const blocked = S.items.some((o) => o !== it && o.onBelt && o.tx === step.x && o.ty === step.y && o.t < 0.25);
        if (!blocked) {
          it.tx = step.x;
          it.ty = step.y;
          it.t = 0;
        } else it.t = 0.99;
      }
    }
  }

  function takeFromTile(tx, ty, want) {
    const c = cell(tx, ty);
    if (!c) return null;
    if (c.kind === "assembler" && c.bufOut > 0 && (!want || want === (c.bufOutType || "ammo"))) {
      c.bufOut -= 1;
      return c.bufOutType || "ammo";
    }
    if (c.kind === "miner") return null;
    const idx = S.items.findIndex((it) => {
      if (it.type !== (want || it.type)) return false;
      if (it.onBelt) return it.tx === tx && it.ty === ty;
      const p = tileOf(it.x, it.y);
      return p.tx === tx && p.ty === ty;
    });
    if (idx >= 0) {
      const type = S.items[idx].type;
      S.items.splice(idx, 1);
      return type;
    }
    return null;
  }

  function giveToTile(tx, ty, type) {
    const c = cell(tx, ty);
    if (!c) return false;
    if (c.kind === "assembler" && type === "ore" && c.bufIn < 8) {
      c.bufIn += 1;
      return true;
    }
    if (c.kind === "turret" && type === "ammo" && c.ammo < 24) {
      c.ammo += 1;
      return true;
    }
    if (c.kind === "turret" && type === "shell" && c.shell < 16) {
      c.shell += 1;
      return true;
    }
    if (c.kind === "belt") return beltPush(tx, ty, type);
    return false;
  }

  function patchOre(x, y) {
    let n = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const c = cell(x + dx, y + dy);
        if (c && c.ore > 0 && (c.kind === "ore" || c.kind === "miner")) n += c.ore;
      }
    }
    return n;
  }

  function takePatchOre(x, y) {
    const self = cell(x, y);
    if (self && self.ore > 0) { self.ore -= 1; return true; }
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const c = cell(x + dx, y + dy);
        if (c && c.kind === "ore" && c.ore > 0) {
          c.ore -= 1;
          if (c.ore <= 0) c.kind = "empty";
          return true;
        }
      }
    }
    return false;
  }

  function ejectAssembler(x, y, c) {
    if (c.bufOut <= 0) return;
    const type = c.bufOutType || "ammo";
    for (const d of DIRS) {
      if (beltPush(x + d.x, y + d.y, type)) {
        c.bufOut -= 1;
        return;
      }
    }
    if (c.bufOut >= 8) {
      dropItem((x + 0.5) * TILE, (y + 0.5) * TILE, type, 1);
      c.bufOut -= 1;
    }
  }

  function updateMachines(dt) {
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const c = S.grid[y][x];
        if (c.rubble > 0) c.rubble = Math.max(0, c.rubble - dt);
        if (c.buildAnim > 0) c.buildAnim = Math.max(0, c.buildAnim - dt * 2.6);
        if (c.kind === "miner" && c.powered) {
          c.prog += dt;
          const mineT = (S.skills && S.skills.mineT) || 0.7;
          if (c.prog >= mineT) {
            const d = DIRS[c.dir];
            if (patchOre(x, y) > 0) {
              if (beltPush(x + d.x, y + d.y, "ore") || giveGround(x + d.x, y + d.y, "ore")) {
                takePatchOre(x, y);
                c.prog = 0;
                c.jam = "";
              } else {
                c.jam = "out";
              }
            } else {
              c.jam = "empty";
              if (!c.dryTold) { c.dryTold = true; toast("채굴기 광맥 고갈 — 다른 주황 칸에 채굴기를 옮겨라"); }
            }
          }
        }
        if (c.kind === "assembler" && c.powered) {
          ejectAssembler(x, y, c);
          const need = c.recipe === "shell" ? 2 : 1;
          const out = c.recipe === "shell" ? "shell" : "ammo";
          if (c.bufIn >= need && c.bufOut < 8) {
            c.prog += dt;
            const ammoT = (S.skills && S.skills.assembleT) || 1.1;
            const shellT = (S.skills && S.skills.shellT) || 1.4;
            if (c.prog >= (c.recipe === "shell" ? shellT : ammoT)) {
              c.bufIn -= need;
              if (c.bufOut > 0 && c.bufOutType !== out) {
                S.inv[c.bufOutType] = (S.inv[c.bufOutType] || 0) + c.bufOut;
                c.bufOut = 0;
              }
              c.bufOutType = out;
              c.bufOut += 1;
              if (out === "ammo") S.ammoCrafted = (S.ammoCrafted || 0) + 1;
              c.prog = 0;
            }
          }
        }
        if (c.kind === "inserter" && c.powered) {
          c.prog += dt;
          if (c.prog >= 0.45) {
            const back = { x: x - DIRS[c.dir].x, y: y - DIRS[c.dir].y };
            const front = { x: x + DIRS[c.dir].x, y: y + DIRS[c.dir].y };
            const got = takeFromTile(back.x, back.y, null);
            if (got) {
              if (!giveToTile(front.x, front.y, got)) {
                dropItem((x + 0.5) * TILE, (y + 0.5) * TILE, got, 1);
              }
              c.prog = 0;
            } else c.prog = 0.45;
          }
        }
        if (c.kind === "turret") {
          const cx = (x + 0.5) * TILE, cy = (y + 0.5) * TILE;
          const range = (S.skills && S.skills.turretRange) || 280;
          const t = nearestEnemy(cx, cy, range, ["wire", "chewer", "spawner"]);
          if (t) c.aim = Math.atan2(t.y - cy, t.x - cx) + Math.PI / 2;
          if (c.powered && (c.ammo > 0 || c.shell > 0)) {
            c.prog += dt;
            if (c.prog >= ((S.skills && S.skills.turretCd) || 0.4) && t) {
              const heavy = c.shell > 0;
              if (heavy) c.shell -= 1;
              else c.ammo -= 1;
              c.prog = 0;
              S.turretShots[x + "," + y] = true;
              shoot(cx, cy, t, heavy ? 14 : 8, heavy ? 600 : 520, true, heavy ? 2 : 0, true);
              burst(cx, cy, heavy ? "#9ad4ff" : "#fff4c8", 3, 40);
            }
          }
        }
      }
    }
  }

  function giveGround(tx, ty, type) {
    const c = cell(tx, ty);
    if (!c) return false;
    if (c.kind !== "empty" && c.kind !== "ore" && c.kind !== "belt") return false;
    if (c.kind === "belt") return beltPush(tx, ty, type);
    dropItem((tx + 0.5) * TILE, (ty + 0.5) * TILE, type, 1);
    return true;
  }

  function updateCombat(dt) {
    const p = S.player;
    for (const e of S.enemies) {
      let tx = p.x, ty = p.y;
      if (e.kind === "chewer") {
        const b = nearestBuilding(e.x, e.y, ["belt", "inserter"]) || nearestBuilding(e.x, e.y);
        if (b) { tx = b.x; ty = b.y; }
      } else if (e.kind === "wire") {
        const b = nearestBuilding(e.x, e.y, ["generator"]);
        if (b) { tx = b.x; ty = b.y; }
        else { tx = p.x; ty = p.y; }
      } else if (e.kind === "spawner") {
        tx = (COLS * TILE) / 2;
        ty = (ROWS * TILE) / 2;
      }
      const dx = tx - e.x, dy = ty - e.y;
      const len = Math.hypot(dx, dy) || 1;
      e.x += (dx / len) * e.spd * dt;
      e.y += (dy / len) * e.spd * dt;
      e.walk = (e.walk || 0) + dt * (e.kind === "runner" ? 14 : 8);
      if (e.flash > 0) e.flash -= dt;
      if (e.kind === "chewer") {
        const tile = tileOf(e.x, e.y);
        const c = cell(tile.tx, tile.ty);
        if (c && BUILD_HP[c.kind]) {
          if (!c.maxHp) { c.maxHp = BUILD_HP[c.kind]; c.hp = c.maxHp; }
          c.hp -= e.dmg * dt;
          S.shake = Math.max(S.shake, 3);
          if (c.hp <= 0) wreckBuilding(tile.tx, tile.ty);
        }
      } else if (e.kind === "wire") {
        const tile = tileOf(e.x, e.y);
        const c = cell(tile.tx, tile.ty);
        if (c && c.kind === "generator") {
          if (!c.maxHp) { c.maxHp = BUILD_HP.generator; c.hp = c.maxHp; }
          c.hp -= e.dmg * dt;
          S.shake = Math.max(S.shake, 4);
          if (c.hp <= 0) wreckBuilding(tile.tx, tile.ty);
        }
      } else if (len < 18 + e.r) {
        p.hp -= e.dmg * dt;
        S.shake = Math.max(S.shake, 6);
      }
    }
    for (let i = S.bullets.length - 1; i >= 0; i--) {
      const b = S.bullets[i];
      b.px = b.x; b.py = b.y;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.life -= dt;
      let dead = b.life <= 0;
      for (const e of S.enemies) {
        if (b.hit.includes(e)) continue;
        if (Math.hypot(e.x - b.x, e.y - b.y) < e.r + 4) {
          e.hp -= b.dmg;
          e.flash = 0.12;
          b.hit.push(e);
          sfx.hit();
          burst(e.x, e.y, "#ffe08a", 8, 110);
          S.particles.push({ x: e.x, y: e.y, vx: 0, vy: 0, life: 0.12, max: 0.12, color: "#fff", size: 16, kind: "ring" });
          if (b.pierce > 0) b.pierce -= 1;
          else { dead = true; break; }
        }
      }
      if (dead) S.bullets.splice(i, 1);
    }
    for (let i = S.enemies.length - 1; i >= 0; i--) {
      const e = S.enemies[i];
      if (e.hp <= 0) {
        dropItem(e.x, e.y, "ore", 1);
        if (Math.random() < 0.4) dropItem(e.x, e.y, "ammo", 1);
        if (e.kind === "spawner") {
          S.spawnersKilled = (S.spawnersKilled || 0) + 1;
          for (let k = 0; k < 2; k++) {
            S.enemies.push({
              x: e.x + (k ? 10 : -10), y: e.y + (k ? -6 : 6),
              hp: 10, max: 10, spd: 44, dmg: 5.6, kind: "grub", r: 11,
            });
          }
          const need = goalParts(S.spec && S.spec.goal).find((p) => p.type === "kill_spawners");
          toast(need ? `산란충 ${S.spawnersKilled}/${need.count || 3} — 잡식 2 분열` : "산란충 — 잡식 2 분열");
        }
        S.enemies.splice(i, 1);
        sfx.die();
        burst(e.x, e.y, e.kind === "wire" ? "#5ee0ff" : "#e85d5d", 12, 110);
      }
    }
    for (let i = S.particles.length - 1; i >= 0; i--) {
      const q = S.particles[i];
      q.x += q.vx * dt; q.y += q.vy * dt; q.life -= dt;
      if (q.life <= 0) S.particles.splice(i, 1);
    }
    if (p.hp <= 0) {
      p.hp = 0;
      S.over = true;
      S.running = false;
      showEnd(false);
    }
  }

  function resumeFreeRun(msg) {
    if (S && S.spec && S.spec.id === "free") applySkills(S, loadSave().freeSkills);
    S.extended = true;
    S.gateShown = S.wave;
    S.paused = false;
    S.running = true;
    S.over = false;
    S.nextWave = (S.spec && S.spec.waveGap) || 32;
    overlay.classList.add("hidden");
    toast(msg || "연장 — 다음 웨이브가 더 커진다");
    syncTouchHud();
  }

  function endFreeRun() {
    S.over = true;
    S.running = false;
    S.paused = false;
    showEnd(true);
  }

  function showFreeGate() {
    S.paused = true;
    overlay.classList.remove("hidden");
    syncTouchHud();
    const save = loadSave();
    const left = freePointsTotal(save) - pointsSpent(save.freeSkills);
    card.innerHTML = `
      <p class="log-tag">자유 난이도</p>
      <h1>${S.wave}웨이브 관문</h1>
      <p>${S.gateGain ? "자유 포인트 +1." : "쌓아 둔 자유 포인트가 있다."} 여기에 넣으면 남은 런에 바로 적용된다. 빼기는 다음 낙하 전.</p>
      <p>남은 포인트 <b>${left}</b> · 웨이브 ${S.wave}</p>
      <button id="spendBtn" type="button">포인트 배분</button>
      <button id="contBtn" type="button" class="ghost">그대로 연장</button>
      <button id="endBtn" type="button" class="ghost">런 종료</button>`;
    document.getElementById("spendBtn").addEventListener("click", () => showSkillLoadout("free", "resume"));
    document.getElementById("contBtn").addEventListener("click", () => resumeFreeRun("연장 — 다음 웨이브가 더 커진다"));
    document.getElementById("endBtn").addEventListener("click", endFreeRun);
  }

  function showClearChoice() {
    S.paused = true;
    overlay.classList.remove("hidden");
    syncTouchHud();
    const spec = S.spec || STAGES.free;
    if (spec.id !== "free") {
      const firstClear = CAMPAIGN.includes(spec.id) && !loadSave().cleared.includes(spec.id);
      markCleared(spec.id);
      const pointLine = firstClear ? `<p class="rec">스킬 포인트 +1. 다음 낙하 전에 배분하라.</p>` : "";
      if (spec.ending && spec.ending.length) {
        let i = 0;
        const panels = spec.ending;
        const render = () => {
          const p = panels[i];
          card.innerHTML = `
            <p class="log-tag">${p.tag}</p>
            <h1>대기 궤도</h1>
            <p class="lead">${p.nar}</p>
            <p class="rec">${p.line}</p>
            ${i === 0 ? pointLine : ""}
            <p class="dim">${i + 1} / ${panels.length}</p>
            <button type="button" id="nextLog">${i < panels.length - 1 ? "다음" : "거점 선택"}</button>`;
          document.getElementById("nextLog").addEventListener("click", () => {
            if (i < panels.length - 1) { i += 1; render(); }
            else showHub();
          });
        };
        render();
        return;
      }
      const next = spec.next && STAGES[spec.next] ? STAGES[spec.next].name : "";
      card.innerHTML = `
        <p class="log-tag">N-07</p>
        <h1>거점 안정</h1>
        <p class="lead">${spec.name} 목표 달성.</p>
        <p>웨이브 ${S.wave} · ${S.time | 0}초 · 파괴 ${S.wrecks || 0}</p>
        ${pointLine}
        ${next ? `<p class="rec">다음 좌표: ${next}</p>` : ""}
        <p class="dim">N-07: 목표 달성. 회수 대기.</p>
        <button id="hubBtn" type="button">거점 선택</button>
        <button id="againBtn" type="button" class="ghost">이 좌표 다시</button>`;
      document.getElementById("hubBtn").addEventListener("click", showHub);
      document.getElementById("againBtn").addEventListener("click", () => showSkillLoadout(spec.id));
      return;
    }
    if (claimFreeWave(S.wave)) S.gateGainWave = S.wave;
    S.gateGain = S.gateGainWave === S.wave;
    S.gateShown = S.wave;
    const save = loadSave();
    const left = freePointsTotal(save) - pointsSpent(save.freeSkills);
    card.innerHTML = `
      <h1>8웨이브 생존</h1>
      <p>공장이 한 사이클을 버텼다. 여기서 끝내거나, 더 큰 웨이브로 라인을 시험할 수 있다.</p>
      <p>웨이브 ${S.wave} · ${S.time | 0}초</p>
      <p class="${S.gateGain ? "rec" : "dim"}">${S.gateGain ? "자유 포인트 +1. " : ""}남은 자유 포인트 ${left}. 거점 포인트와 따로다.</p>
      ${left > 0 ? `<button id="spendBtn" type="button">포인트 배분</button>` : ""}
      <button id="contBtn" type="button">계속 돌린다</button>
      <button id="startBtn" type="button" class="ghost">런 종료</button>`;
    const spend = document.getElementById("spendBtn");
    if (spend) spend.addEventListener("click", () => showSkillLoadout("free", "resume"));
    document.getElementById("contBtn").addEventListener("click", () => resumeFreeRun("연장 — 다음 웨이브가 더 커진다"));
    document.getElementById("startBtn").addEventListener("click", endFreeRun);
  }

  function showEnd(win) {
    overlay.classList.remove("hidden");
    syncTouchHud();
    const spec = S.spec || STAGES.free;
    const failGoal = goalFailReason(S);
    const reason = failGoal
      || (S.inv.ammo <= 0
        ? "탄약이 끊겼다. 조립 라인을 먼저 닫아라."
        : "라인이 웨이브를 못 받쳐 줬다.");
    if (win && spec.id !== "free") {
      showClearChoice();
      return;
    }
    card.innerHTML = win
      ? `<h1>공장 생존</h1><p>8웨이브를 넘겼다. 학살과 병목이 한 화면에 겹쳤다.</p><p>웨이브 ${S.wave} · ${S.time | 0}초</p><button id="startBtn" type="button">거점 선택</button>`
      : `<h1>거점 상실</h1><p>${reason}</p><p class="dim">N-07: 거점 상실. 블랙박스 보존.</p><p>웨이브 ${S.wave} · 생존 ${S.time | 0}초${S.won ? " · 목표 파도는 통과" : ""}</p><button id="startBtn" type="button">거점 선택</button><button id="againBtn" type="button" class="ghost">이 좌표 다시</button>`;
    document.getElementById("startBtn").addEventListener("click", showHub);
    const again = document.getElementById("againBtn");
    if (again) again.addEventListener("click", () => showSkillLoadout(spec.id));
  }

  function update(dt) {
    if (!S.running || S.paused) return;
    S.time += dt;
    S.nextWave -= dt;
    if (S.nextWave <= 0) {
      const cap = (S.spec && S.spec.goal && S.spec.goal.waves) || 8;
      const canExtend = !!(S.spec && S.spec.extend && S.extended);
      const holdGate = S.spec && S.spec.id === "free" && S.extended && isFreeGate(S.wave) && S.gateShown !== S.wave;
      if (holdGate) {
        S.nextWave = 0.05;
      } else if (S.wave < cap || canExtend) {
        spawnWave();
        S.nextWave = (S.spec && S.spec.waveGap) || 50;
        if (S.wave >= cap && !S.won) S.won = true;
      } else {
        S.nextWave = 99;
        if (!S.won) S.won = true;
      }
    }
    if (S.won && S.enemies.length === 0 && S.countedWave !== S.wave) {
      S.countedWave = S.wave;
      if (countGenerators() >= 2) S.dualGenWaves = (S.dualGenWaves || 0) + 1;
    }
    if (S.won && S.enemies.length === 0 && !S.over && !S.extended) {
      if (goalMet(S)) {
        showClearChoice();
        return;
      }
      const fail = goalFailReason(S);
      if (fail) {
        S.over = true;
        S.running = false;
        showEnd(false);
        return;
      }
    }
    if (S.spec && S.spec.id === "free" && S.extended && !S.over && S.enemies.length === 0 && isFreeGate(S.wave) && S.gateShown !== S.wave) {
      if (claimFreeWave(S.wave)) S.gateGainWave = S.wave;
      S.gateGain = S.gateGainWave === S.wave;
      S.gateShown = S.wave;
      const save = loadSave();
      const left = freePointsTotal(save) - pointsSpent(save.freeSkills);
      if (left > 0) {
        showFreeGate();
        return;
      }
      if (S.nextWave < 1) S.nextWave = (S.spec && S.spec.waveGap) || 32;
    }
    refreshPower();
    updatePlayer(dt);
    updateBelts(dt);
    updateMachines(dt);
    updateCombat(dt);
    if (!S.over) {
      const g = S.spec && S.spec.goal;
      const cap = destroyCap(S.spec);
      if (g && cap && (S.wrecks || 0) > cap) {
        S.over = true;
        S.running = false;
        showEnd(false);
        return;
      }
    }
    updateCoach();
    S.shake = Math.max(0, S.shake - dt * 18);
    const p = S.player;
    S.camX = p.x - W / 2;
    S.camY = p.y - H / 2;
    const wm = worldMouse();
    mouse.gx = Math.floor(wm.x / TILE);
    mouse.gy = Math.floor(wm.y / TILE);
    if (toastT > 0) {
      toastT -= dt;
      if (toastT <= 0) toastEl.style.opacity = "0";
    }
  }

  function drawGrid() {
    ctx.fillStyle = "#0d1210";
    ctx.fillRect(0, 0, W, H);
    ctx.save();
    ctx.translate(-S.camX + (Math.random() - 0.5) * S.shake, -S.camY + (Math.random() - 0.5) * S.shake);

    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        const px = x * TILE, py = y * TILE;
        ctx.fillStyle = ((x + y) & 1) ? "#121816" : "#0e1412";
        ctx.fillRect(px, py, TILE, TILE);
        ctx.strokeStyle = "#1a2420";
        ctx.strokeRect(px, py, TILE, TILE);
        const c = S.grid[y][x];
        if (c.rubble > 0) {
          const a = Math.min(1, c.rubble / 2.2);
          ctx.fillStyle = `rgba(90,40,28,${0.35 + 0.4 * a})`;
          ctx.fillRect(px + 6, py + 8, 10, 8);
          ctx.fillRect(px + 20, py + 18, 12, 7);
          ctx.fillRect(px + 12, py + 24, 8, 6);
          ctx.fillStyle = `rgba(255,180,140,${0.55 * a})`;
          ctx.font = "bold 9px sans-serif";
          ctx.fillText("잔해", px + 8, py + 16);
        }
        if (((x * 13 + y * 7) % 7) === 0) {
          ctx.fillStyle = "rgba(70,90,80,0.35)";
          ctx.fillRect(px + 6, py + 6, 4, 4);
        }
        if (c.kind === "ore" || (c.kind === "miner" && patchOre(x, y) > 0)) {
          ctx.fillStyle = "rgba(62, 40, 24, 0.55)";
          ctx.fillRect(px + 2, py + 2, TILE - 4, TILE - 4);
          ctx.globalAlpha = 0.9;
          if (!drawSpr("ore", px + 3, py + 3, TILE - 6, TILE - 6, 0)) {
            ctx.fillStyle = "#7a4a22";
            ctx.fillRect(px + 6, py + 6, TILE - 12, TILE - 12);
          }
          ctx.globalAlpha = 1;
        }
        if (c.kind === "empty" || c.kind === "ore") continue;
        drawBuilding(px, py, c, x, y);
      }
    }

    drawPowerRanges();
    drawIncoming();

    for (const it of S.items) {
      const nm = it.type === "ore" ? "item_ore" : it.type === "shell" ? "item_shell" : "item_ammo";
      const fill = it.type === "ore" ? "#b56a32" : it.type === "shell" ? "#4eb6d4" : "#d4b44a";
      ctx.fillStyle = "rgba(6,10,8,0.7)";
      ctx.beginPath();
      ctx.arc(it.x, it.y, 11, 0, Math.PI * 2);
      ctx.fill();
      if (!drawSpr(nm, it.x - 11, it.y - 11, 22, 22, 0)) {
        ctx.fillStyle = fill;
        ctx.beginPath();
        ctx.arc(it.x, it.y, 7, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.strokeStyle = fill;
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(it.x, it.y, 11, 0, Math.PI * 2);
      ctx.stroke();
    }
    for (const b of S.bullets) {
      const col = b.turret ? (b.pierce > 0 ? "#9ad4ff" : "#ffb060") : (b.pierce > 0 ? "#9ad4ff" : "#e8ffe8");
      ctx.strokeStyle = col;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(b.x - b.vx * 0.05, b.y - b.vy * 0.05);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(b.x, b.y, 2.6, 0, Math.PI * 2);
      ctx.fill();
    }
    for (const e of S.enemies) {
      const nm = e.kind === "runner" ? "runner"
        : e.kind === "chewer" ? "chewer"
        : e.kind === "wire" ? "wire"
        : e.kind === "spawner" ? "spawner"
        : "grub";
      let aimX = S.player.x, aimY = S.player.y;
      if (e.kind === "chewer" || e.kind === "wire") { aimX = e.x; aimY = e.y; }
      if (e.kind === "spawner") { aimX = (COLS * TILE) / 2; aimY = (ROWS * TILE) / 2; }
      const ang = Math.atan2(aimY - e.y, aimX - e.x) + Math.PI / 2;
      const bob = Math.sin((e.walk || 0) * 2) * 2;
      const flash = e.flash > 0;
      if (flash) ctx.globalAlpha = 0.55 + Math.sin(S.time * 40) * 0.25;
      if (!drawSpr(nm, e.x - e.r - 4, e.y - e.r - 4 + bob, e.r * 2 + 8, e.r * 2 + 8, ang + Math.sin(e.walk || 0) * 0.12)) {
        ctx.fillStyle = e.kind === "runner" ? "#ff8a5b"
          : e.kind === "wire" ? "#5ee0ff"
          : e.kind === "spawner" ? "#9a5ad4"
          : "#e85d5d";
        ctx.beginPath();
        ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;
      ctx.fillStyle = "#3a1010";
      ctx.fillRect(e.x - e.r, e.y - e.r - 6, e.r * 2, 3);
      ctx.fillStyle = e.kind === "wire" ? "#5ee0ff" : "#e85d5d";
      ctx.fillRect(e.x - e.r, e.y - e.r - 6, e.r * 2 * (e.hp / e.max), 3);
    }
    const p = S.player;
    const bob = p.moving ? Math.sin(p.walk * 2) * 3 : 0;
    const tilt = p.moving ? Math.sin(p.walk * 2) * 0.12 : 0;
    if (!drawSpr("player", p.x - 16, p.y - 16 + bob, 32, 32, (p.facing || 0) + tilt)) {
      ctx.fillStyle = "#7ee0b0";
      ctx.beginPath();
      ctx.arc(p.x, p.y, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    if (S.running && !S.over) {
      const b = BUILD[S.sel];
      const gx = mouse.gx, gy = mouse.gy;
      if (cell(gx, gy)) {
        ctx.globalAlpha = 0.35;
        ctx.fillStyle = "#7ee0b0";
        ctx.fillRect(gx * TILE, gy * TILE, TILE, TILE);
        ctx.globalAlpha = 1;
        ctx.strokeStyle = "#7ee0b0";
        ctx.strokeRect(gx * TILE + 2, gy * TILE + 2, TILE - 4, TILE - 4);
        const d = DIRS[S.dir];
        if (b.rot) {
          ctx.strokeStyle = "#5ee0ff";
          ctx.beginPath();
          ctx.moveTo((gx + 0.5) * TILE, (gy + 0.5) * TILE);
          ctx.lineTo((gx + 0.5 + d.x * 0.45) * TILE, (gy + 0.5 + d.y * 0.45) * TILE);
          ctx.stroke();
        }
      }
    }
    for (const q of S.particles) {
      const a = Math.max(0, q.life / (q.max || 0.35));
      ctx.globalAlpha = a;
      ctx.fillStyle = q.color || "#fff";
      ctx.strokeStyle = q.color || "#fff";
      const sz = q.size || 3;
      if (q.kind === "ring") {
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(q.x, q.y, 6 + (1 - a) * 14, 0, Math.PI * 2);
        ctx.stroke();
      } else if (q.kind === "flash") {
        ctx.beginPath();
        ctx.arc(q.x, q.y, sz * a, 0, Math.PI * 2);
        ctx.fill();
      } else {
        ctx.fillRect(q.x - sz / 2, q.y - sz / 2, sz, sz);
      }
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function drawIncoming() {
    if (!S.running || S.over) return;
    const edges = S.incoming || [];
    if (!edges.length) return;
    const warn = S.nextWave <= 10 && S.nextWave > 0;
    const a = warn ? 0.22 + 0.12 * Math.abs(Math.sin(S.time * 6)) : 0.08;
    ctx.fillStyle = `rgba(232,93,93,${a})`;
    const t = 14;
    for (const e of edges) {
      if (e === "n") ctx.fillRect(0, 0, COLS * TILE, t);
      if (e === "s") ctx.fillRect(0, ROWS * TILE - t, COLS * TILE, t);
      if (e === "w") ctx.fillRect(0, 0, t, ROWS * TILE);
      if (e === "e") ctx.fillRect(COLS * TILE - t, 0, t, ROWS * TILE);
    }
    if (warn) {
      const names = edges.map((e) => EDGE_NAME[e] || e).join(" · ");
      ctx.fillStyle = "rgba(10,14,12,0.82)";
      ctx.fillRect(S.camX + W / 2 - 130, S.camY + 18, 260, 28);
      ctx.fillStyle = "#ffd0d0";
      ctx.font = "bold 13px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText(`다음 파도 ${names}  ${Math.ceil(S.nextWave)}s`, S.camX + W / 2, S.camY + 38);
      ctx.textAlign = "left";
    }
  }

  function drawPowerRanges() {
    const hover = cell(mouse.gx, mouse.gy);
    const genTool = S.sel === 5;
    const hoverGen = hover && hover.kind === "generator";
    const strong = genTool || hoverGen;
    for (let y = 0; y < ROWS; y++) {
      for (let x = 0; x < COLS; x++) {
        if (S.grid[y][x].kind !== "generator") continue;
        const focused = genTool || (hoverGen && hover === S.grid[y][x]);
        const cx = (x + 0.5) * TILE, cy = (y + 0.5) * TILE;
        const r = POWER_R * TILE;
        ctx.beginPath();
        ctx.arc(cx, cy, r, 0, Math.PI * 2);
        if (focused) {
          ctx.fillStyle = "rgba(94,224,255,0.16)";
          ctx.fill();
          ctx.strokeStyle = "rgba(94,224,255,0.95)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.stroke();
          ctx.setLineDash([]);
        } else {
          ctx.fillStyle = "rgba(94,224,255,0.03)";
          ctx.fill();
          ctx.strokeStyle = "rgba(94,224,255,0.14)";
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }
    if (genTool && cell(mouse.gx, mouse.gy)) {
      const cx = (mouse.gx + 0.5) * TILE, cy = (mouse.gy + 0.5) * TILE;
      ctx.beginPath();
      ctx.arc(cx, cy, POWER_R * TILE, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(94,224,255,0.12)";
      ctx.fill();
      ctx.strokeStyle = "rgba(180,255,255,0.9)";
      ctx.lineWidth = 2;
      ctx.setLineDash([5, 4]);
      ctx.stroke();
      ctx.setLineDash([]);
    }
  }

  function drawBuilding(px, py, c, gx, gy) {
    const rot = (c.kind === "inserter" || c.kind === "miner")
      ? c.dir * Math.PI / 2
      : 0;
    let sprite = c.kind;
    if (c.kind === "miner" && patchOre(gx, gy) <= 0) sprite = "miner_empty";
    ctx.save();
    if (c.buildAnim > 0) {
      const t = 1 - c.buildAnim;
      const sc = 0.4 + 0.7 * t + Math.sin(Math.min(1, t * 1.4) * Math.PI) * 0.1;
      ctx.translate(px + TILE / 2, py + TILE / 2);
      ctx.scale(sc, sc);
      ctx.translate(-(px + TILE / 2), -(py + TILE / 2));
    }
    ctx.fillStyle = "rgba(28, 38, 34, 0.35)";
    ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    if (!drawSpr(sprite, px + 1, py + 1, TILE - 2, TILE - 2, rot)) {
      const colors = {
        miner: "#6b8f4e", belt: "#3d4a42", inserter: "#c4a35a",
        assembler: "#4a6d8a", turret: "#e23b3b", generator: "#2f6f78",
      };
      ctx.fillStyle = colors[c.kind] || "#444";
      ctx.fillRect(px + 4, py + 4, TILE - 8, TILE - 8);
    }
    if (!c.powered && ["miner", "inserter", "assembler", "turret"].includes(c.kind)) {
      ctx.strokeStyle = (S.time * 6 | 0) % 2 ? "#ff4d4d" : "#5a2020";
      ctx.lineWidth = 2;
      ctx.strokeRect(px + 2, py + 2, TILE - 4, TILE - 4);
    }
    if (c.kind === "assembler") {
      ctx.fillStyle = c.recipe === "shell" ? "#9ad4ff" : "#f3d36a";
      ctx.fillRect(px + 8, py + TILE - 10, Math.min(24, c.bufOut * 4), 4);
      ctx.fillStyle = "#d4842e";
      ctx.fillRect(px + 8, py + 8, Math.min(24, c.bufIn * 3), 4);
      ctx.fillStyle = "#e7fff4";
      ctx.font = "10px sans-serif";
      ctx.fillText(c.recipe === "shell" ? "포" : "탄", px + 8, py + 22);
    }
    if (c.kind === "miner") {
      const left = patchOre(gx, gy);
      if (left <= 0) {
        const pulse = 0.45 + 0.35 * Math.abs(Math.sin(S.time * 4));
        ctx.strokeStyle = `rgba(255,70,70,${pulse})`;
        ctx.lineWidth = 3;
        ctx.strokeRect(px + 1, py + 1, TILE - 2, TILE - 2);
        ctx.fillStyle = "rgba(80,10,10,0.82)";
        ctx.fillRect(px + 4, py + TILE / 2 - 8, TILE - 8, 16);
        ctx.fillStyle = "#ffd0d0";
        ctx.font = "bold 11px sans-serif";
        ctx.fillText("고갈", px + 8, py + TILE / 2 + 4);
      } else {
        ctx.fillStyle = "rgba(8,12,10,0.65)";
        ctx.fillRect(px + 3, py + 3, 22, 11);
        ctx.fillStyle = "#e7fff4";
        ctx.font = "9px sans-serif";
        ctx.fillText(String(left), px + 5, py + 12);
      }
    }
    if (c.kind === "turret") {
      if ((c.ammo || 0) + (c.shell || 0) <= 0) {
        ctx.fillStyle = "rgba(80,10,10,0.82)";
        ctx.fillRect(px + 3, py + TILE / 2 - 8, TILE - 6, 16);
        ctx.fillStyle = "#ffd0d0";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("탄약없음", px + 4, py + TILE / 2 + 4);
      } else {
        ctx.fillStyle = "#f3d36a";
        ctx.fillRect(px + 8, py + TILE - 10, Math.min(12, c.ammo * 0.6), 4);
        ctx.fillStyle = "#9ad4ff";
        ctx.fillRect(px + 20, py + TILE - 10, Math.min(12, c.shell * 0.8), 4);
      }
    }
    if (c.maxHp && c.hp < c.maxHp) {
      ctx.fillStyle = "#3a1010";
      ctx.fillRect(px + 4, py + 2, TILE - 8, 3);
      ctx.fillStyle = "#7ee0b0";
      ctx.fillRect(px + 4, py + 2, (TILE - 8) * Math.max(0, c.hp / c.maxHp), 3);
      const pt = tileOf(S.player.x, S.player.y);
      if (Math.abs(pt.tx - gx) <= 1 && Math.abs(pt.ty - gy) <= 1) {
        ctx.fillStyle = "rgba(10,20,16,0.8)";
        ctx.fillRect(px + 4, py + TILE / 2 - 7, TILE - 8, 14);
        ctx.fillStyle = "#7ee0b0";
        ctx.font = "bold 10px sans-serif";
        ctx.fillText("E 수리", px + 6, py + TILE / 2 + 3);
      }
    }
    ctx.restore();
  }

  function drawHud() {
    const p = S.player;
    const unpowered = countUnpowered();
    const ammoEmpty = S.inv.ammo <= 0 ? " empty" : "";
    const pwrAlert = unpowered > 0 ? " alert" : "";
    statsEl.innerHTML = `
      <span class="hp">HP <b>${Math.ceil(p.hp)}</b></span>
      <span class="ore">광석 <b>${S.inv.ore}</b></span>
      <span class="ammo${ammoEmpty}">탄약 <b>${S.inv.ammo}</b></span>
      <span class="pwr">포탄 <b>${S.inv.shell || 0}</b></span>
      <span>웨이브 <b>${S.wave}</b></span>
      <span>다음 <b>${Math.max(0, S.nextWave) | 0}s</b></span>
      <span class="goal">${goalLabel(S)}</span>
      <span class="pwr${pwrAlert}">정전 <b>${unpowered}</b></span>
      <span>적 <b>${S.enemies.length}</b></span>
    `;
    BUILD.forEach((b, i) => {
      const el = document.getElementById("slot" + i);
      el.classList.toggle("on", i === S.sel);
      const count = el.querySelector(".count");
      if (count) count.textContent = "×" + S.inv[b.id];
    });
  }

  function countUnpowered() {
    let n = 0;
    for (const row of S.grid) {
      for (const c of row) {
        if (["miner", "inserter", "assembler", "turret"].includes(c.kind) && !c.powered) n++;
      }
    }
    return n;
  }

  function loop(ts) {
    const dt = Math.min(0.033, (ts - last) / 1000 || 0.016);
    last = ts;
    if (holdAct === "e") {
      holdAcc += dt;
      while (holdAcc >= 0.18) {
        holdAcc -= 0.18;
        fireAct("e");
      }
    }
    update(dt);
    drawGrid();
    if (S.running || S.over) drawHud();
    requestAnimationFrame(loop);
  }
  window.startRun = startRun;
  window.__WEAVER_VERSION = VERSION;
  window.__weaverQa = {
    startRun,
    showHub,
    getState: () => S,
    stages: STAGES,
    playable: PLAYABLE,
    loadSave,
    writeSave,
    freePointsFromWave,
    isFreeGate,
    freeRoster,
  };
  window.__controlsTest = {
    getYaw: () => 0,
    getSpeed: () => (S.player && S.player.moving ? S.player.vmax : 0),
    getPos: () => (S.player ? { x: S.player.x, y: S.player.y } : { x: 0, y: 0 }),
    getRunning: () => !!(S && S.running && !S.paused),
    getKeys: () => [...keys],
    setKeys(codes) {
      keys.clear();
      const map = { KeyW: "w", KeyA: "a", KeyS: "s", KeyD: "d", ArrowUp: "arrowup", ArrowLeft: "arrowleft", ArrowDown: "arrowdown", ArrowRight: "arrowright" };
      for (const c of codes || []) keys.add(map[c] || String(c).toLowerCase());
    },
    setStick(x, y) {
      stick.x = Math.max(-1, Math.min(1, +x || 0));
      stick.y = Math.max(-1, Math.min(1, +y || 0));
    },
    getStick: () => ({ x: stick.x, y: stick.y }),
    setTouchUi(on) {
      window.__forceTouchUi = !!on;
      if (on) document.documentElement.classList.add("has-touch");
      else if (!isCoarsePointer() && !(navigator.maxTouchPoints > 0)) {
        document.documentElement.classList.remove("has-touch");
      }
      syncTouchHud();
    },
    isTouchHudShown() {
      const el = document.getElementById("touchHud");
      if (!el || el.classList.contains("hidden")) return false;
      return getComputedStyle(el).display !== "none";
    },
    tapAct(act) { fireAct(act); },
    getSel: () => S.sel,
    getDir: () => S.dir,
    getPaused: () => !!S.paused,
  };
  if (wantsTouchUi()) document.documentElement.classList.add("has-touch");
  showHub();
  requestAnimationFrame(loop);
})();
