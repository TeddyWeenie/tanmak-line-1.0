import { createFileRoute } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  useEffect(() => {
    let cancelled = false;
    const id = window.requestAnimationFrame(() => {
      if (cancelled) return;
      if (document.querySelector("script[data-weaver]")) return;
      const s = document.createElement("script");
      s.src = "/game/game.js";
      s.dataset.weaver = "1";
      s.async = false;
      document.body.appendChild(s);
    });
    return () => {
      cancelled = true;
      window.cancelAnimationFrame(id);
    };
  }, []);

  return (
    <div id="wrap">
      <header>
        <div className="top">
          <strong>
            탄막 조립선 <span className="ver">1.0</span>
          </strong>
          <div className="stat" id="stats" />
          <button id="helpBtn" type="button">
            도움말 (H)
          </button>
        </div>
        <div className="hotbar" id="hotbar" />
        <p id="coach">발전기를 맵에 놓아 전력을 켜라.</p>
      </header>
      <div id="stage">
        <div id="play">
          <canvas id="c" />
          <div id="toast" />
          <div id="ammoWarn" className="hidden">
            탄약 없음 — 장전 키는 없다. 노란 탄약을 줍거나 조립기 옆에 서라
          </div>
          <div id="touchHud" className="hidden">
            <div id="stickPad" aria-label="이동 스틱">
              <div id="stickRing" />
              <div id="stickKnob" />
            </div>
            <div id="touchActs">
              <button type="button" className="touch-btn main" data-act="e">줍기</button>
              <button type="button" className="touch-btn" data-act="c">제작</button>
              <button type="button" className="touch-btn" data-act="r">회전</button>
              <button type="button" className="touch-btn" data-act="x">철거</button>
              <button type="button" className="touch-btn" data-act="t">레시피</button>
              <button type="button" className="touch-btn" data-act="p">정지</button>
            </div>
          </div>
          <div id="overlay">
            <div className="card" id="card">
              <p className="log-tag">직조함 N-07 · 블랙박스 · 릴리스 1.0</p>
              <h1>탄막 조립선</h1>
              <p className="lead">함은 스스로 쏜다. 탄약이 없으면 공장이 죽는다.</p>
              <p>광맥을 열고, 선을 잇고, 거점을 유지하라. 회수 신호는 없다.</p>
              <button id="startBtn" type="button">
                거점 선택
              </button>
              <a href="/guide" id="guideBtn" className="ghost">
                처음이라면 — 작전 설명
              </a>
            </div>
          </div>
        </div>
      </div>
      <div id="helpTpl" className="hidden">
        <h2>조작</h2>
        <p>
          WASD 이동 · 1–6 선택 · R 회전 · 클릭 설치 · 벨트는 드래그로 경로 · X 철거 · C
          제작 · E 줍기/수리 · T 레시피 · H 도움말 · P 일시정지
        </p>
        <p>
          모바일: 왼쪽 스틱으로 이동, 위쪽 칸으로 건물 선택, 맵을 눌러 설치.
          오른쪽은 줍기·제작·회전·철거. 함은 스스로 쏜다.
        </p>
        <h2>장전</h2>
        <p>
          장전 버튼 없음. 시작 탄약은 거점마다 다르다. 노란 탄약 / 조립기 출력 / 벨트 위 탄약을{" "}
          <b>E</b> 또는 근접으로 줍는다.
        </p>
        <h2>생산 라인</h2>
        <p>채굴기 → 벨트 → 투입기 → 조립기 → 투입기 → 벨트 또는 포탑.</p>
        <p>
          벨트는 방향이 없다. 중간 투입기는 지나가는 것을 집고, 못 집으면 끝으로
          흘려보낸다. 갈림길은 번갈아 나눈다.
        </p>
        <p>탄약은 플레이어 총. 포탄은 포탑 전용.</p>
        <h2>캠페인</h2>
        <p>S1~S8 거점. 광맥·침입·목표가 바뀐다. 처음 깨면 스킬 포인트 1. 낙하 전에 넣는다.</p>
        <p>
          <a href="/guide">처음이라면 전체 작전 설명을 본다</a>
        </p>
        <h2>스킬</h2>
        <p>
          처음 깨는 거점마다 포인트 1. 로그 다음 화면에서 넣고, 그 판 전투에만 적용된다.
          런이 시작되면 고정. 다음 낙하 전에 다시 배분할 수 있다. 이중 사격과 확산탄은 탄약을 더 먹는다.
        </p>
        <h2>자유 난이도</h2>
        <p>
          8웨이브 생존이 한 사이클이다. 넘기면 끝내거나 계속 돌린다. 계속하면 끝이 없고, 12·16·20…
          4웨이브마다 관문이 온다. 52웨이브에서 포인트가 12가 되면 그 뒤는 관문 없이 이어진다.
          산란충은 8웨이브에 1마리, 이후 4웨이브마다 1마리씩 늘고, 죽으면 식철충 둘로 갈라진다.
        </p>
        <p>
          자유 포인트는 거점과 따로다. 8웨이브 +1, 이후 4웨이브마다 +1, 최대 12. 같은 관문은 한 번만.
          낙하 전에 넣고 빼고, 관문에서는 올리기만 한다. 올린 것은 그 런에 바로 적용된다.
        </p>
        <ul id="tech">
          <li>장착 스킬 —</li>
        </ul>
      </div>
    </div>
  );
}
