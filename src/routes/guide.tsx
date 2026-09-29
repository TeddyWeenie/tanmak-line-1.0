import { createFileRoute, Link } from "@tanstack/react-router";
import {
  ArrowRight,
  ChevronRight,
  Crosshair,
  Factory,
  Keyboard,
  ShieldAlert,
  Smartphone,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/guide")({
  component: GuidePage,
  head: () => ({
    meta: [
      { title: "작전 설명 · 탄막 조립선" },
      {
        name: "description",
        content:
          "탄막 조립선 초심자 가이드. 함은 스스로 쏜다. 장전 키는 없다. 공장으로 탄약을 만든다.",
      },
    ],
  }),
});

const TOC = [
  { href: "#core", label: "한 줄" },
  { href: "#first", label: "첫 낙하" },
  { href: "#line", label: "생산 라인" },
  { href: "#build", label: "건물" },
  { href: "#controls", label: "조작" },
  { href: "#stages", label: "거점" },
  { href: "#free", label: "자유" },
  { href: "#foes", label: "적" },
  { href: "#fail", label: "실패" },
];

const BUILDINGS = [
  {
    id: "miner",
    key: "1",
    name: "채굴기",
    cost: 3,
    text: "주황 광맥 칸 위에 놓는다. 전력이 있으면 광석을 캔다. 고갈되면 다른 광맥으로 옮겨라.",
  },
  {
    id: "belt",
    key: "2",
    name: "벨트",
    cost: 1,
    text: "방향이 없다. 클릭 드래그로 길을 그린다. 갈림길은 번갈아 나눈다.",
  },
  {
    id: "inserter",
    key: "3",
    name: "투입기",
    cost: 1,
    text: "옆 칸의 물건을 집거나 넣는다. 중간 투입기는 지나가는 것을 집고, 못 집으면 끝으로 흘려보낸다.",
  },
  {
    id: "assembler",
    key: "4",
    name: "조립기",
    cost: 5,
    text: "광석 1 = 탄약 1. 나중에 레시피 T로 포탄을 만들 수 있다. 출력은 E로 줍거나 투입기가 뺀다.",
  },
  {
    id: "turret",
    key: "5",
    name: "포탑",
    cost: 6,
    text: "자동 사격. 탄약 또는 포탄이 필요하다. 옆에 서서 E로 넣거나 벨트로 공급한다.",
  },
  {
    id: "generator",
    key: "6",
    name: "발전기",
    cost: 5,
    text: "반경 8칸의 채굴기·투입기·조립기·포탑을 켠다. 낙하하면 이것부터 놓는다.",
  },
];

const STEPS = [
  {
    n: "01",
    title: "발전기를 놓는다",
    body: "위쪽 칸에서 6번 발전기를 고르고, 주황 광맥 근처에 탭한다. 전력이 없으면 공장은 죽은 것과 같다.",
    spr: "generator",
  },
  {
    n: "02",
    title: "채굴기를 광맥 위에",
    body: "1번 채굴기를 주황 칸 위에 놓는다. 시작 인벤에 채굴기 2대가 있다. 새로 만들 필요는 아직 없다.",
    spr: "miner",
  },
  {
    n: "03",
    title: "벨트와 투입기로 잇는다",
    body: "채굴기 → 벨트 → 투입기 → 조립기. 벨트는 드래그로 그린다. 투입기 방향은 R로 돌린다.",
    spr: "belt",
  },
  {
    n: "04",
    title: "탄약을 줍는다",
    body: "조립기 옆에 서서 E(모바일: 줍기). 노란 탄약이 땅에 떨어져도 줍는다. 장전 버튼은 없다.",
    spr: "item_ammo",
  },
  {
    n: "05",
    title: "북쪽이 온다",
    body: "첫 파도는 약 25초. 함은 알아서 쏜다. 네가 할 일은 탄약이 끊기지 않게 라인을 돌리는 것이다.",
    spr: "grub",
  },
];

const KEYS = [
  ["WASD", "이동"],
  ["1–6", "건물 선택"],
  ["클릭 / 드래그", "설치 · 벨트 경로"],
  ["C", "선택 건물 제작"],
  ["E", "줍기 / 수리 / 포탑 보급"],
  ["R", "회전"],
  ["X", "철거"],
  ["T", "조립기 레시피"],
  ["P", "일시정지"],
  ["H", "도움말"],
];

const STAGES = [
  {
    id: "S1",
    name: "낙하 광맥",
    goal: "탄약을 한 줄 만들고 북쪽 4파도를 버틴다.",
    note: "튜토리얼. 발전기부터.",
  },
  {
    id: "S2",
    name: "벨트 협곡",
    goal: "갈라진 좌우 광맥을 잇고, 포탑 두 기가 각각 한 발 이상 쏘게 한다.",
    note: "중앙에 광맥이 없다.",
  },
  {
    id: "S3",
    name: "식철 둥지",
    goal: "7파도. 건물 파괴 3회를 넘기지 말 것.",
    note: "공장은 고리 안, 포탑은 바깥.",
  },
  {
    id: "S4",
    name: "정전 분지",
    goal: "발전기 두 대를 켠 채로 5파도를 유지한다.",
    note: "귀퉁이 네 광맥. 전선충이 전류를 추적한다.",
  },
  {
    id: "S5",
    name: "군체핵",
    goal: "8파도 안에 산란충 3마리를 처치한다.",
    note: "잔맥은 빨리 빈다. 핵은 중간 거점.",
  },
  {
    id: "S6",
    name: "균열 회랑",
    goal: "포탑 3기가 쏘고, 건물 파괴는 2회 이하. 7파도.",
    note: "광맥이 대각선. 세 번째 포탑은 만들어 둔다.",
  },
  {
    id: "S7",
    name: "심연 분지",
    goal: "발전기 두 대를 켠 채로 7파도를 유지한다.",
    note: "귀퉁이 잔맥. 전선충과 산란충.",
  },
  {
    id: "S8",
    name: "종점 궤도",
    goal: "9파도 안에 산란충 4마리. 건물 파괴 3회 이하.",
    note: "잔맥은 거의 없다. 캠페인 클리어.",
  },
];

const FOES = [
  { id: "grub", name: "식철충", text: "느리다. 금속만 먹는다. S1부터." },
  { id: "runner", name: "질주충", text: "빠르다. 라인을 우회한다. S2부터." },
  { id: "chewer", name: "포식충", text: "정지한 건물을 부순다. S3부터." },
  { id: "wire", name: "전선충", text: "전류를 추적한다. S4부터." },
  { id: "spawner", name: "산란충", text: "죽으면 잡식이 분열한다. S5부터. S8에서는 4마리가 목표." },
];

function Spr({ name, large }: { name: string; large?: boolean }) {
  return (
    <img
      src={`/game/sprites/${name}.png`}
      alt=""
      width={large ? 48 : 40}
      height={large ? 48 : 40}
      className={large ? "guide-spr-lg" : "guide-spr"}
      crossOrigin="anonymous"
    />
  );
}

function GuidePage() {
  return (
    <div className="guide-page min-h-dvh bg-bg font-sans text-fg antialiased">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/95">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3 px-4 py-3">
          <Link to="/" className="truncate text-sm font-semibold tracking-tight text-fg">
            탄막 조립선 <span className="ml-2 text-xs font-medium tracking-wide text-muted">1.0</span>
          </Link>
          <Link
            to="/"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-primary px-4 text-sm font-semibold text-ink"
          >
            거점 선택
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-3xl px-4 pb-28 pt-10 sm:pt-14">
        <p className="mb-3 text-xs font-medium tracking-[0.18em] text-power uppercase">
          직조함 N-07 · 블랙박스 · 릴리스 1.0
        </p>
        <h1 className="mb-4 text-balance text-4xl font-semibold tracking-tight text-fg sm:text-5xl">
          함은 스스로 쏜다.
          <br />
          탄약이 없으면 공장이 죽는다.
        </h1>
        <p className="mb-8 max-w-xl text-pretty text-base leading-relaxed text-muted">
          탄막 조립선은 자동 사격 서바이벌과 공장 건설을 겹친 게임이다. 너는 조준하지 않는다.
          광맥을 열고, 벨트를 잇고, 탄약 한 줄을 끊기지 않게 유지한다. 회수 신호는 없다.
        </p>
        <div className="mb-10 flex flex-col gap-3 sm:flex-row">
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-ink"
          >
            S1부터 낙하
            <ArrowRight className="size-4" aria-hidden />
          </Link>
          <a
            href="#first"
            className="inline-flex min-h-11 items-center justify-center rounded-md border border-border px-5 text-sm font-semibold text-fg"
          >
            첫 60초만 보기
          </a>
        </div>

        <nav aria-label="목차" className="mb-14 flex flex-wrap gap-2">
          {TOC.map((item) => (
            <a
              key={item.href}
              href={item.href}
              className="inline-flex min-h-11 items-center rounded-md border border-border bg-surface px-3 text-sm text-muted"
            >
              {item.label}
            </a>
          ))}
        </nav>

        <section id="core" className="mb-16 scroll-mt-20">
          <h2 className="mb-5 text-xl font-semibold tracking-tight text-balance">세 가지만 기억하면 된다</h2>
          <div className="grid gap-3 sm:grid-cols-3">
            <article className="rounded-xl border border-border bg-surface p-5">
              <Crosshair className="mb-3 size-5 text-primary" aria-hidden />
              <h3 className="mb-2 font-semibold">장전 키는 없다</h3>
              <p className="text-sm leading-relaxed text-muted text-pretty">
                시작 탄약은 유한하다. 노란 탄약, 조립기 출력, 벨트 위 탄약을 E로 줍는다. 0이 되면 함이 멈춘다.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-surface p-5">
              <Zap className="mb-3 size-5 text-power" aria-hidden />
              <h3 className="mb-2 font-semibold">전력이 먼저다</h3>
              <p className="text-sm leading-relaxed text-muted text-pretty">
                발전기 반경 8칸 안의 기계만 돈다. 낙하하면 발전기(6)부터 광맥 옆에 놓아라.
              </p>
            </article>
            <article className="rounded-xl border border-border bg-surface p-5">
              <Factory className="mb-3 size-5 text-primary" aria-hidden />
              <h3 className="mb-2 font-semibold">함은 자동이다</h3>
              <p className="text-sm leading-relaxed text-muted text-pretty">
                조준·발사는 함이 한다. 너는 라인과 포탑 보급을 맡는다. 모바일에서도 함은 스스로 쏜다.
              </p>
            </article>
          </div>
        </section>

        <section id="first" className="mb-16 scroll-mt-20">
          <h2 className="mb-2 text-xl font-semibold tracking-tight text-balance">첫 낙하 — S1 낙하 광맥</h2>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            인벤에 발전기 1, 채굴기 2, 벨트 16, 투입기 4, 조립기 1, 포탑 2, 탄약 48이 있다.
            첫 파도까지 약 25초. 그 안에 탄약 한 줄을 닫으면 이긴다.
          </p>
          <ol className="grid gap-3">
            {STEPS.map((step) => (
              <li
                key={step.n}
                className="flex gap-4 rounded-xl border border-border bg-surface p-4 sm:p-5"
              >
                <Spr name={step.spr} large />
                <div className="min-w-0">
                  <p className="mb-1 text-xs font-medium tracking-wider text-primary">{step.n}</p>
                  <h3 className="mb-1 font-semibold">{step.title}</h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">{step.body}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="line" className="mb-16 scroll-mt-20">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">생산 라인</h2>
          <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-border bg-surface p-4">
            {[
              ["miner", "채굴기"],
              ["belt", "벨트"],
              ["inserter", "투입기"],
              ["assembler", "조립기"],
              ["item_ammo", "탄약"],
            ].map(([spr, label], i) => (
              <span key={label} className="flex items-center gap-2">
                {i > 0 ? (
                  <ChevronRight className="size-4 text-muted" aria-hidden />
                ) : null}
                <span className="inline-flex items-center gap-2 rounded-md border border-border bg-elevated px-2 py-1.5 text-sm">
                  <Spr name={spr} />
                  {label}
                </span>
              </span>
            ))}
          </div>
          <ul className="grid gap-2 text-sm leading-relaxed text-muted">
            <li>탄약은 플레이어 총. 포탄은 포탑 전용이다.</li>
            <li>벨트에는 방향이 없다. 중간 투입기가 집지 못한 물건은 끝으로 흐른다.</li>
            <li>C로 건물을 더 만들고, 광석이 모자라며 직접 광맥 위에 서서 캔다.</li>
            <li>포탑은 옆에 서서 E로 탄약을 넣거나, 조립기 출력을 벨트로 보낸다.</li>
          </ul>
        </section>

        <section id="build" className="mb-16 scroll-mt-20">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">건물 여섯</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {BUILDINGS.map((b) => (
              <article key={b.id} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
                <Spr name={b.id} large />
                <div className="min-w-0">
                  <p className="text-xs text-primary">
                    {b.key} · 광석 {b.cost}
                  </p>
                  <h3 className="mb-1 font-semibold">{b.name}</h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">{b.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="controls" className="mb-16 scroll-mt-20">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">조작</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            <article className="rounded-xl border border-border bg-surface p-5">
              <Keyboard className="mb-3 size-5 text-primary" aria-hidden />
              <h3 className="mb-3 font-semibold">키보드</h3>
              <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
                {KEYS.map(([k, v]) => (
                  <span key={k} className="contents">
                    <dt className="font-medium text-fg">{k}</dt>
                    <dd className="text-muted">{v}</dd>
                  </span>
                ))}
              </dl>
            </article>
            <article className="rounded-xl border border-border bg-surface p-5">
              <Smartphone className="mb-3 size-5 text-primary" aria-hidden />
              <h3 className="mb-3 font-semibold">터치</h3>
              <ul className="grid gap-2 text-sm leading-relaxed text-muted">
                <li>왼쪽 스틱으로 이동. 방향은 WASD와 같다.</li>
                <li>위쪽 칸에서 건물을 고르고, 맵을 눌러 설치한다. 벨트는 드래그.</li>
                <li>오른쪽은 줍기 · 제작 · 회전 · 철거 · 레시피 · 정지.</li>
                <li>줍기는 누르고 있으면 반복된다. 함은 스스로 쏜다.</li>
              </ul>
            </article>
          </div>
        </section>

        <section id="skills" className="mb-16 scroll-mt-20">
          <h2 className="mb-2 text-xl font-semibold tracking-tight">스킬 포인트</h2>
          <p className="mb-4 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            거점을 처음 깨면 포인트 1. 최대 8. 로그 다음 화면에서 넣고, 그 판 전투에만 적용된다.
            런이 시작되면 고정이다. 다음 낙하 전에 빼서 다시 넣을 수 있다. 포인트는 줄지 않는다.
            자유 난이도의 진행과 포인트는 다음 절이다.
          </p>
          <ul className="grid gap-2 text-sm leading-relaxed text-muted">
            <li>직조 — 고속 채굴, 조립 가속, 시작 탄약 +12.</li>
            <li>탄막 — 연사, 이중 사격(2), 관통, 확산탄(2). 이중과 확산은 탄약을 더 먹는다.</li>
            <li>거점 — 포탑 연사, 포탑 사거리, 수리량.</li>
          </ul>
        </section>

        <section id="free" className="mb-16 scroll-mt-20">
          <h2 className="mb-2 text-xl font-semibold tracking-tight">자유 난이도</h2>
          <p className="mb-4 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            거점 선택 맨 아래에 처음부터 열려 있다. 8웨이브까지가 한 사이클이고, 그 다음은 끝이 없는 연장이다.
            스킬 포인트는 캠페인과 장부가 따로라, 거점에 찍은 스킬은 여기 쓰이지 않는다.
          </p>
          <h3 className="mb-3 text-base font-semibold">진행</h3>
          <ul className="mb-6 grid gap-2 text-sm leading-relaxed text-muted">
            <li>8웨이브를 넘기면 멈춘다. 런을 끝내거나, 계속 돌릴 수 있다.</li>
            <li>계속하면 파도가 끊기지 않고, 갈수록 적이 많아진다.</li>
            <li>다음 멈춤은 12, 16, 20… 4웨이브마다. 4웨이브에서는 멈추지 않는다.</li>
            <li>52웨이브에서 자유 포인트가 12가 되면, 그 뒤로는 관문 없이 계속 나온다.</li>
          </ul>
          <h3 className="mb-3 text-base font-semibold">적</h3>
          <ul className="mb-6 grid gap-2 text-sm leading-relaxed text-muted">
            <li>사방에서 나온다. 첫 파도까지 24초, 이후 32초마다 다음 파도다.</li>
            <li>식철충은 1웨이브부터, 질주충은 3웨이브부터. 마리 수는 웨이브마다 늘어나고 상한은 없다.</li>
            <li>포식충은 5웨이브에 5마리로 처음 나오고, 그 다음부터 다시 늘어난다.</li>
            <li>전선충은 7웨이브부터 나온다.</li>
            <li>산란충은 8웨이브에 1마리. 이후 4웨이브마다 1마리씩 늘어난다. 죽으면 식철충 둘이 갈라진다.</li>
          </ul>
          <h3 className="mb-3 text-base font-semibold">스킬 포인트</h3>
          <ul className="grid gap-2 text-sm leading-relaxed text-muted">
            <li>8웨이브를 처음 넘기면 +1. 그 다음 12, 16, 20… 마다 +1. 최대 12.</li>
            <li>같은 관문은 한 번만 준다. 다시 깨도 점수는 늘지 않는다.</li>
            <li>낙하 전에 자유 트리에 넣는다. 넣고 빼도 포인트는 줄지 않는다.</li>
            <li>관문에서는 올리기만 된다. 올린 랭크는 그 런 남은 시간에 바로 적용된다.</li>
            <li>빼거나 다시 짜는 것은 다음 자유 낙하 전이다. 안 쓴 포인트는 남아서, 다음 관문이나 다음 낙하에서 넣는다.</li>
          </ul>
        </section>

        <section id="stages" className="mb-16 scroll-mt-20">
          <h2 className="mb-2 text-xl font-semibold tracking-tight">캠페인 거점</h2>
          <p className="mb-5 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            S1부터 순서대로 열린다. 처음 깨면 스킬 포인트 1. 낙하 전에 트리에 넣고, 그 판에만 적용된다.
            건물은 여섯 종이다.
          </p>
          <ol className="grid gap-3">
            {STAGES.map((st) => (
              <li
                key={st.id}
                className="grid gap-1 rounded-xl border border-border bg-surface px-4 py-4 sm:grid-cols-[4.5rem_1fr]"
              >
                <p className="text-sm font-semibold text-primary">{st.id}</p>
                <div>
                  <h3 className="font-semibold">{st.name}</h3>
                  <p className="text-sm leading-relaxed text-fg">{st.goal}</p>
                  <p className="text-sm text-muted">{st.note}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section id="foes" className="mb-16 scroll-mt-20">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">식철 군체</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {FOES.map((f) => (
              <article key={f.id} className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                <Spr name={f.id} large />
                <div>
                  <h3 className="font-semibold">{f.name}</h3>
                  <p className="text-sm leading-relaxed text-muted text-pretty">{f.text}</p>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="fail" className="mb-16 scroll-mt-20">
          <h2 className="mb-5 text-xl font-semibold tracking-tight">거점이 무너질 때</h2>
          <ul className="grid gap-3">
            {[
              "탄약이 0이 됐다. 조립기를 먼저 닫고, 노란 탄약을 줍는다.",
              "발전기를 안 놓았거나 반경 밖으로 기계를 깔았다.",
              "S3에서 건물 잔해가 3을 넘었다. 포탑은 바깥, 라인은 고리 안.",
              "S2 포탑 두 기가 한 발도 못 쐈다. 벨트로 탄약을 넣어라.",
              "S4에서 발전기가 한 대뿐이었다. 귀퉁이 광맥을 나눠 덮는다.",
              "S5에서 산란충 3마리를 놓쳤다. 큰 개체를 먼저 쏜다.",
              "S6은 포탑이 두 기면 실패다. 세 번째를 만들고, 잔해 2를 넘기지 마라.",
              "S7은 발전기 한 대로는 7파도를 못 센다.",
              "S8은 산란충 4마리와 잔해 3 이하를 같이 닫아야 한다.",
            ].map((line) => (
              <li key={line} className="flex gap-3 rounded-xl border border-border bg-surface p-4">
                <ShieldAlert className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden />
                <p className="text-sm leading-relaxed text-muted text-pretty">{line}</p>
              </li>
            ))}
          </ul>
        </section>

        <section className="rounded-xl border border-border bg-surface p-6 sm:p-8">
          <p className="mb-2 text-xs font-medium tracking-[0.18em] text-power uppercase">N-07</p>
          <h2 className="mb-3 text-balance text-2xl font-semibold tracking-tight">
            광맥을 열고, 선을 잇고, 거점을 유지하라.
          </h2>
          <p className="mb-6 max-w-xl text-sm leading-relaxed text-muted text-pretty">
            첫 목표는 단순하다. 발전기, 채굴기, 조립기, 줍기. 탄약 한 줄이 함을 지탱하면 S1은 끝난다.
            릴리스 1.0 — S1~S8, 터치 조작, 작전 설명.
          </p>
          <Link
            to="/"
            className="inline-flex min-h-11 items-center justify-center gap-2 rounded-md bg-primary px-5 text-sm font-semibold text-ink"
          >
            거점 선택으로
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </section>
      </main>
    </div>
  );
}
