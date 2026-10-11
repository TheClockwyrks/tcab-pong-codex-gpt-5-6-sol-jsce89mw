import type {
  Game,
  InitApi,
  RenderApi,
  UpdateApi,
} from "@clockwyrks/simple-2d";
import type { DeepReadonly } from "ts-essentials";
import * as C from "./constants";

export type Screen =
  "title" | "howto" | "countdown" | "playing" | "paused" | "matchover";
export type Mode = "solo" | "versus";
export type Side = "left" | "right";
export interface PaddleState {
  readonly cy: number;
  readonly vy: number;
  readonly driven: boolean;
  readonly drivenVy: number;
}
export interface AiState {
  readonly tracking: boolean;
  readonly movement: boolean;
}
export interface TrailSample {
  readonly x: number;
  readonly y: number;
  readonly t: number;
}
export interface BallState {
  readonly x: number;
  readonly y: number;
  readonly vx: number;
  readonly vy: number;
  readonly spin: number;
  readonly held: boolean;
  readonly holdTimer: number;
  readonly serveSign: 1 | -1;
  readonly trail: readonly TrailSample[];
}
export interface ObstacleState {
  readonly index: number;
  readonly cx: number;
  readonly cy: number;
}
export interface CaromState {
  readonly screen: Screen;
  readonly mode: Mode;
  readonly menuIndex: number;
  readonly titleIndex: number;
  readonly resumeScreen: "countdown" | "playing";
  readonly score: { readonly p1: number; readonly p2: number };
  readonly winner: Side | null;
  readonly paddles: { readonly left: PaddleState; readonly right: PaddleState };
  readonly ai: AiState;
  readonly receiver: Side;
  readonly ball: BallState | null;
  readonly obstacles: readonly ObstacleState[];
  readonly simTime: number;
  readonly muted: boolean;
}
export interface MenuRect {
  readonly x: number;
  readonly y: number;
  readonly w: number;
  readonly h: number;
}
export interface CaromSnapshot extends Omit<CaromState, "ball"> {
  readonly version: number;
  readonly ball: (BallState & { readonly speed: number }) | null;
}
type Pose = (s: DeepReadonly<CaromState>) => CaromState;
export interface CaromDebugApi {
  readonly version: number;
  clearWorld: Pose;
  spawnBall: Pose;
  spawnObstacle(s: DeepReadonly<CaromState>, index: number): CaromState;
  reset: Pose;
  reconcile: Pose;
  setScreen(s: DeepReadonly<CaromState>, v: Screen): CaromState;
  setMode(s: DeepReadonly<CaromState>, v: Mode): CaromState;
  setMenuIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setTitleIndex(s: DeepReadonly<CaromState>, v: number): CaromState;
  setResumeScreen(
    s: DeepReadonly<CaromState>,
    v: "countdown" | "playing",
  ): CaromState;
  setScore(s: DeepReadonly<CaromState>, p1: number, p2: number): CaromState;
  setWinner(s: DeepReadonly<CaromState>, v: Side | null): CaromState;
  setReceiver(s: DeepReadonly<CaromState>, v: Side): CaromState;
  setPaddleCy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleVy(s: DeepReadonly<CaromState>, side: Side, v: number): CaromState;
  setPaddleDriven(
    s: DeepReadonly<CaromState>,
    side: Side,
    v: boolean,
  ): CaromState;
  setBallPosition(
    s: DeepReadonly<CaromState>,
    x: number,
    y: number,
  ): CaromState;
  setBallVelocity(
    s: DeepReadonly<CaromState>,
    vx: number,
    vy: number,
  ): CaromState;
  setBallSpin(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallHeld(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setBallHoldTimer(s: DeepReadonly<CaromState>, v: number): CaromState;
  setBallServeSign(s: DeepReadonly<CaromState>, v: 1 | -1): CaromState;
  drawBallServeSign: Pose;
  setAiTracking(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setAiMovement(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  setMuted(s: DeepReadonly<CaromState>, v: boolean): CaromState;
  snapshot(s: DeepReadonly<CaromState>): CaromSnapshot;
  menuItemRect(s: DeepReadonly<CaromState>, index: number): MenuRect | null;
}

export const BACKGROUND = "#071018";
const COLOR = {
  left: "#44e5ff",
  right: "#ff4fa3",
  ball: "#fff6c7",
  block: "#a784ff",
  text: "#eef8ff",
  dim: "#7890a0",
  accent: "#ffe66d",
};
const sign = (): 1 | -1 => (Math.random() < 0.5 ? -1 : 1);
const park = (): BallState => ({
  x: C.FIELD_CX,
  y: C.FIELD_CY,
  vx: 0,
  vy: 0,
  spin: 0,
  held: true,
  holdTimer: C.HOLD_TIME,
  serveSign: sign(),
  trail: [],
});
const blocks = (): ObstacleState[] =>
  C.OBSTACLE_CENTERS.map((p, index) => ({ index, cx: p.x, cy: p.y }));
function fresh(muted: boolean): CaromState {
  const p: PaddleState = { cy: C.FIELD_CY, vy: 0, driven: false, drivenVy: 0 };
  return {
    screen: "title",
    mode: "solo",
    menuIndex: 0,
    titleIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    paddles: { left: { ...p }, right: { ...p } },
    ai: { tracking: true, movement: true },
    receiver: "left",
    ball: park(),
    obstacles: blocks(),
    simTime: 0,
    muted,
  };
}
function clone(s: DeepReadonly<CaromState>): CaromState {
  return {
    ...s,
    score: { ...s.score },
    paddles: { left: { ...s.paddles.left }, right: { ...s.paddles.right } },
    ai: { ...s.ai },
    ball: s.ball
      ? { ...s.ball, trail: s.ball.trail.map((v) => ({ ...v })) }
      : null,
    obstacles: s.obstacles.map((v) => ({ ...v })),
  };
}
function requiredBall(s: DeepReadonly<CaromState>): DeepReadonly<BallState> {
  if (!s.ball) throw new Error("Carom: no ball is present");
  return s.ball;
}
function count(screen: Screen): number {
  return screen === "title"
    ? C.TITLE_ITEMS.length
    : screen === "howto"
      ? 1
      : screen === "paused"
        ? C.PAUSE_ITEMS.length
        : screen === "matchover"
          ? C.MATCHOVER_ITEMS.length
          : 0;
}
function menuRect(s: DeepReadonly<CaromState>, i: number): MenuRect | null {
  if (!Number.isInteger(i) || i < 0 || i >= count(s.screen)) return null;
  const w = s.screen === "howto" ? 270 : 350,
    h = 58,
    y = s.screen === "title" ? 355 : s.screen === "howto" ? 584 : 390;
  return { x: C.FIELD_CX - w / 2, y: y + i * 74, w, h };
}
function hit(s: DeepReadonly<CaromState>, x: number, y: number): number | null {
  for (let i = 0; i < count(s.screen); i += 1) {
    const r = menuRect(s, i);
    if (r && x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) return i;
  }
  return null;
}
function title(s: DeepReadonly<CaromState>): CaromState {
  return {
    ...fresh(s.muted),
    titleIndex: s.titleIndex,
    menuIndex: s.titleIndex,
    simTime: s.simTime,
  };
}
function start(s: DeepReadonly<CaromState>, mode: Mode): CaromState {
  return {
    ...clone(s),
    screen: "countdown",
    mode,
    menuIndex: 0,
    resumeScreen: "playing",
    score: { p1: 0, p2: 0 },
    winner: null,
    receiver: "left",
    ball: park(),
    paddles: {
      left: { ...s.paddles.left, cy: C.FIELD_CY, vy: 0 },
      right: { ...s.paddles.right, cy: C.FIELD_CY, vy: 0 },
    },
  };
}
function confirm(s: DeepReadonly<CaromState>): CaromState {
  if (s.screen === "title") {
    const i = Math.max(0, Math.min(2, s.menuIndex));
    const n = { ...clone(s), titleIndex: i };
    return i === 0
      ? start(n, "solo")
      : i === 1
        ? start(n, "versus")
        : { ...n, screen: "howto", menuIndex: 0 };
  }
  if (s.screen === "howto") return title(s);
  if (s.screen === "paused")
    return s.menuIndex === 0
      ? { ...clone(s), screen: s.resumeScreen }
      : s.menuIndex === 1
        ? start(s, s.mode)
        : title(s);
  if (s.screen === "matchover")
    return s.menuIndex === 0 ? start(s, s.mode) : title(s);
  return clone(s);
}
function input(s: DeepReadonly<CaromState>, api: UpdateApi): CaromState {
  let n = clone(s);
  const up = api.input.pressed("p1-up") || api.input.pressed("p2-up");
  const down = api.input.pressed("p1-down") || api.input.pressed("p2-down");
  const ok = api.input.pressed("confirm"),
    back = api.input.pressed("back"),
    pause = api.input.pressed("pause"),
    mute = api.input.pressed("mute");
  if (mute) api.audio.setMuted(!api.audio.muted());
  if ((s.screen === "countdown" || s.screen === "playing") && pause)
    n = { ...n, resumeScreen: s.screen, screen: "paused", menuIndex: 0 };
  else if (s.screen === "paused" && (pause || back))
    n = { ...n, screen: s.resumeScreen };
  else if (s.screen === "howto" && (ok || back)) n = title(n);
  else if (s.screen === "matchover" && back) n = title(n);
  else if (count(s.screen)) {
    const c = count(s.screen);
    if (up) n = { ...n, menuIndex: (s.menuIndex - 1 + c) % c };
    else if (down) n = { ...n, menuIndex: (s.menuIndex + 1) % c };
    else if (ok) n = confirm(n);
  }
  if (count(s.screen)) {
    const p = api.input.pointer();
    const hover = hit(s, p.x, p.y);
    let downAt: number | null = null,
      upAt: number | null = null;
    for (const sample of api.input.pointerSamples()) {
      const at = hit(s, sample.x, sample.y);
      if (at !== null) n = { ...n, menuIndex: at };
      if (sample.type === "down") downAt = at;
      if (sample.type === "up") upAt = at;
    }
    if (hover !== null) n = { ...n, menuIndex: hover };
    if (!ok && downAt !== null && downAt === upAt)
      n = confirm({ ...n, menuIndex: downAt });
  }
  return { ...n, muted: api.audio.muted() };
}

function movePaddle(
  p: DeepReadonly<PaddleState>,
  vy: number,
  dt: number,
): PaddleState {
  const wanted = p.cy + vy * dt,
    cy = Math.max(C.PADDLE_MIN_CY, Math.min(C.PADDLE_MAX_CY, wanted));
  return { ...p, cy, vy: dt > 0 && cy !== wanted ? (cy - p.cy) / dt : vy };
}
function paddles(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  const lv = s.paddles.left.driven
    ? s.paddles.left.drivenVy
    : (s.mode === "solo"
        ? Number(
            api.input.value("p1-down") > 0 || api.input.value("p2-down") > 0,
          ) -
          Number(api.input.value("p1-up") > 0 || api.input.value("p2-up") > 0)
        : api.input.value("p1-down") - api.input.value("p1-up")) *
      C.PADDLE_SPEED;
  let rv: number;
  if (s.paddles.right.driven) rv = s.paddles.right.drivenVy;
  else if (s.mode === "versus")
    rv =
      (api.input.value("p2-down") - api.input.value("p2-up")) * C.PADDLE_SPEED;
  else if (!s.ai.movement) rv = 0;
  else {
    let target = C.AI_HOME_Y,
      zone = C.AI_HOME_DEADZONE;
    if (s.ai.tracking && s.screen === "playing" && s.ball && s.ball.vx > 0) {
      target = s.ball.y - s.ball.vy * C.AI_REACT;
      zone = C.AI_DEADZONE;
    }
    const d = target - s.paddles.right.cy;
    rv =
      Math.abs(d) <= zone || dt <= 0
        ? 0
        : Math.sign(d) * Math.min(C.AI_SPEED, Math.abs(d) / dt);
  }
  return {
    ...clone(s),
    paddles: {
      left: movePaddle(s.paddles.left, lv, dt),
      right: movePaddle(s.paddles.right, rv, dt),
    },
  };
}
type Face = "left" | "right" | "top" | "bottom";
function face(b: BallState, r: C.Rect): Face | null {
  if (!(
    b.x > r.x0 - C.BALL_R &&
    b.x < r.x1 + C.BALL_R &&
    b.y > r.y0 - C.BALL_R &&
    b.y < r.y1 + C.BALL_R
  ))
    return null;
  const v: [Face, number][] = [
    ["left", b.x - r.x0 + C.BALL_R],
    ["right", r.x1 + C.BALL_R - b.x],
    ["top", b.y - r.y0 + C.BALL_R],
    ["bottom", r.y1 + C.BALL_R - b.y],
  ];
  return v.reduce((a, z) => (z[1] < a[1] ? z : a))[0];
}
function rect(
  b: BallState,
  r: C.Rect,
): { ball: BallState; face: Face | null; reflected: boolean } {
  const f = face(b, r);
  if (!f) return { ball: b, face: null, reflected: false };
  let { x, y, vx, vy } = b,
    reflected = false;
  if (f === "left") {
    x = r.x0 - C.BALL_R;
    if (vx > 0) {
      vx = -vx;
      reflected = true;
    }
  } else if (f === "right") {
    x = r.x1 + C.BALL_R;
    if (vx < 0) {
      vx = -vx;
      reflected = true;
    }
  } else if (f === "top") {
    y = r.y0 - C.BALL_R;
    if (vy > 0) {
      vy = -vy;
      reflected = true;
    }
  } else {
    y = r.y1 + C.BALL_R;
    if (vy < 0) {
      vy = -vy;
      reflected = true;
    }
  }
  return { ball: { ...b, x, y, vx, vy }, face: f, reflected };
}
const paddleRect = (side: Side, cy: number): C.Rect => ({
  x0: side === "left" ? C.P1_X0 : C.P2_X0,
  x1: side === "left" ? C.P1_X1 : C.P2_X1,
  y0: cy - C.PADDLE_HALF,
  y1: cy + C.PADDLE_HALF,
});
interface BounceEvents {
  wall: boolean;
  paddle: boolean;
  obstacle: boolean;
}
function fly(
  s: DeepReadonly<CaromState>,
  dt: number,
): { ball: BallState; events: BounceEvents } | null {
  if (!s.ball) return null;
  let b: BallState = { ...s.ball, trail: [...s.ball.trail] };
  const events = { wall: false, paddle: false, obstacle: false };
  const steps = Math.max(
      1,
      Math.ceil((Math.hypot(b.vx, b.vy) * dt) / C.MAX_SUBSTEP),
    ),
    h = dt / steps;
  for (let i = 0; i < steps; i += 1) {
    const speed = Math.hypot(b.vx, b.vy);
    if (speed > 0) {
      const a = (b.spin / speed) * h,
        co = Math.cos(a),
        si = Math.sin(a),
        vx = b.vx * co - b.vy * si,
        vy = b.vx * si + b.vy * co;
      b = { ...b, vx, vy };
    }
    b = {
      ...b,
      spin: b.spin * 0.5 ** (h / C.SPIN_HALFLIFE),
      x: b.x + b.vx * h,
      y: b.y + b.vy * h,
    };
    if (b.y - C.BALL_R < 0 && b.vy < 0) {
      b = { ...b, y: C.BALL_R, vy: -b.vy };
      events.wall = true;
    } else if (b.y + C.BALL_R > C.FIELD_H && b.vy > 0) {
      b = { ...b, y: C.FIELD_H - C.BALL_R, vy: -b.vy };
      events.wall = true;
    }
    for (const side of ["left", "right"] as const) {
      const p = s.paddles[side],
        result = rect(b, paddleRect(side, p.cy));
      if (!result.face) continue;
      b = result.ball;
      if (result.face === "left" || result.face === "right") {
        const theta =
            Math.max(-1, Math.min(1, (b.y - p.cy) / C.PADDLE_HALF)) *
            C.MAX_BOUNCE_ANGLE,
          speed2 = Math.min(Math.hypot(b.vx, b.vy) * C.SPEED_MULT, C.SPEED_CAP),
          direction = side === "left" ? 1 : -1;
        b = {
          ...b,
          x: side === "left" ? C.P1_X1 + C.BALL_R : C.P2_X0 - C.BALL_R,
          vx: direction * speed2 * Math.cos(theta),
          vy: speed2 * Math.sin(theta),
          spin: Math.max(
            -C.SPIN_CLAMP,
            Math.min(C.SPIN_CLAMP, b.spin + p.vy * C.SPIN_FROM_PADDLE),
          ),
        };
        events.paddle = true;
      } else if (result.reflected) events.wall = true;
    }
    for (const o of s.obstacles) {
      const result = rect(b, {
        x0: o.cx - C.OBSTACLE_HW,
        x1: o.cx + C.OBSTACLE_HW,
        y0: o.cy - C.OBSTACLE_HH,
        y1: o.cy + C.OBSTACLE_HH,
      });
      b = result.ball;
      if (result.reflected) events.obstacle = true;
    }
  }
  return { ball: b, events };
}
function winner(score: { p1: number; p2: number }): Side | null {
  return score.p1 >= C.WIN_SCORE && score.p1 - score.p2 >= C.WIN_LEAD
    ? "left"
    : score.p2 >= C.WIN_SCORE && score.p2 - score.p1 >= C.WIN_LEAD
      ? "right"
      : null;
}
function world(
  s: DeepReadonly<CaromState>,
  api: UpdateApi,
  dt: number,
): CaromState {
  let n = paddles(s, api, dt);
  if (!n.ball) return n;
  if (n.screen === "countdown") {
    const t = n.ball.holdTimer - dt;
    if (t <= 0) {
      const d = n.receiver === "left" ? -1 : 1;
      n = {
        ...n,
        screen: "playing",
        ball: {
          ...n.ball,
          held: false,
          holdTimer: 0,
          trail: [],
          vx: d * C.SERVE_SPEED * Math.cos(C.SERVE_ANGLE),
          vy: n.ball.serveSign * C.SERVE_SPEED * Math.sin(C.SERVE_ANGLE),
        },
      };
    } else n = { ...n, ball: { ...n.ball, holdTimer: t } };
  } else if (n.screen === "playing" && !n.ball.held) {
    const result = fly(n, dt);
    if (result) {
      n = { ...n, ball: result.ball };
      if (result.events.wall) api.audio.play(C.CUES.wallBounce);
      if (result.events.paddle) api.audio.play(C.CUES.paddleHit);
      if (result.events.obstacle) api.audio.play(C.CUES.obstacleBounce);
      const scorer =
        result.ball.x - C.BALL_R > C.FIELD_W
          ? "left"
          : result.ball.x + C.BALL_R < 0
            ? "right"
            : null;
      if (scorer) {
        api.audio.play(C.CUES.score);
        const score = {
            p1: n.score.p1 + (scorer === "left" ? 1 : 0),
            p2: n.score.p2 + (scorer === "right" ? 1 : 0),
          },
          won = winner(score);
        n = won
          ? { ...n, score, winner: won, screen: "matchover", menuIndex: 0 }
          : {
              ...n,
              score,
              receiver: scorer === "left" ? "right" : "left",
              screen: "countdown",
              ball: park(),
            };
      }
    }
  }
  if ((n.screen === "countdown" || n.screen === "playing") && n.ball)
    n = {
      ...n,
      ball: {
        ...n.ball,
        trail: [
          ...n.ball.trail,
          { x: n.ball.x, y: n.ball.y, t: n.simTime },
        ].filter((v) => v.t >= n.simTime - C.TRAIL_TIME),
      },
    };
  return n;
}

function debugApi(): CaromDebugApi {
  const ball = (
    s: DeepReadonly<CaromState>,
    change: Partial<BallState>,
  ): CaromState => ({
    ...clone(s),
    ball: {
      ...requiredBall(s),
      trail: s.ball?.trail.map((v) => ({ ...v })) ?? [],
      ...change,
    },
  });
  const paddle = (
    s: DeepReadonly<CaromState>,
    side: Side,
    change: Partial<PaddleState>,
  ): CaromState => {
    const n = clone(s);
    return {
      ...n,
      paddles: { ...n.paddles, [side]: { ...s.paddles[side], ...change } },
    };
  };
  return {
    version: C.CAROM_DEBUG_VERSION,
    clearWorld: (s) => ({ ...clone(s), ball: null, obstacles: [] }),
    spawnBall: (s) => ({ ...clone(s), ball: park() }),
    spawnObstacle: (s, index) => {
      const p = C.OBSTACLE_CENTERS[index];
      if (!p) throw new RangeError(`Carom: obstacle ${index} does not exist`);
      return {
        ...clone(s),
        obstacles: [
          ...s.obstacles
            .filter((v) => v.index !== index)
            .map((v) => ({ ...v })),
          { index, cx: p.x, cy: p.y },
        ].sort((a, b) => a.index - b.index),
      };
    },
    reset: (s) => fresh(s.muted),
    reconcile: clone,
    setScreen: (s, screen) => ({ ...clone(s), screen }),
    setMode: (s, mode) => ({ ...clone(s), mode }),
    setMenuIndex: (s, menuIndex) => ({ ...clone(s), menuIndex }),
    setTitleIndex: (s, titleIndex) => ({ ...clone(s), titleIndex }),
    setResumeScreen: (s, resumeScreen) => ({ ...clone(s), resumeScreen }),
    setScore: (s, p1, p2) => ({ ...clone(s), score: { p1, p2 } }),
    setWinner: (s, winner) => ({ ...clone(s), winner }),
    setReceiver: (s, receiver) => ({ ...clone(s), receiver }),
    setPaddleCy: (s, side, cy) => paddle(s, side, { cy }),
    setPaddleVy: (s, side, drivenVy) => paddle(s, side, { drivenVy }),
    setPaddleDriven: (s, side, driven) => paddle(s, side, { driven }),
    setBallPosition: (s, x, y) => ball(s, { x, y }),
    setBallVelocity: (s, vx, vy) => ball(s, { vx, vy }),
    setBallSpin: (s, spin) => ball(s, { spin }),
    setBallHeld: (s, held) => ball(s, { held }),
    setBallHoldTimer: (s, holdTimer) => ball(s, { holdTimer }),
    setBallServeSign: (s, serveSign) => ball(s, { serveSign }),
    drawBallServeSign: (s) => ball(s, { serveSign: sign() }),
    setAiTracking: (s, tracking) => ({
      ...clone(s),
      ai: { ...s.ai, tracking },
    }),
    setAiMovement: (s, movement) => ({
      ...clone(s),
      ai: { ...s.ai, movement },
    }),
    setMuted: (s, muted) => ({ ...clone(s), muted }),
    snapshot: (s) => ({
      ...clone(s),
      version: C.CAROM_DEBUG_VERSION,
      ball: s.ball
        ? {
            ...s.ball,
            trail: s.ball.trail.map((v) => ({ ...v })),
            speed: Math.hypot(s.ball.vx, s.ball.vy),
          }
        : null,
    }),
    menuItemRect: menuRect,
  };
}

function round(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  r: number,
): void {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
  ctx.fill();
}
function text(
  ctx: CanvasRenderingContext2D,
  value: string,
  x: number,
  y: number,
  size: number,
  color = COLOR.text,
): void {
  ctx.fillStyle = color;
  ctx.font = `700 ${size}px system-ui, sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText(value, x, y);
}
function field(
  s: DeepReadonly<CaromState>,
  ctx: CanvasRenderingContext2D,
  dim: boolean,
): void {
  ctx.save();
  if (dim) ctx.globalAlpha = 0.28;
  ctx.strokeStyle = "#183344";
  ctx.lineWidth = 3;
  ctx.setLineDash([14, 16]);
  ctx.beginPath();
  ctx.moveTo(C.NET_X, 26);
  ctx.lineTo(C.NET_X, C.FIELD_H - 26);
  ctx.stroke();
  ctx.setLineDash([]);
  ctx.fillStyle = "#102430";
  ctx.fillRect(0, 0, C.FIELD_W, 4);
  ctx.fillRect(0, C.FIELD_H - 4, C.FIELD_W, 4);
  for (const o of s.obstacles) {
    ctx.shadowColor = COLOR.block;
    ctx.shadowBlur = 18;
    ctx.fillStyle = COLOR.block;
    round(
      ctx,
      o.cx - C.OBSTACLE_W / 2,
      o.cy - C.OBSTACLE_H / 2,
      C.OBSTACLE_W,
      C.OBSTACLE_H,
      10,
    );
  }
  if (s.ball) {
    ctx.shadowBlur = 0;
    for (let i = 0; i < s.ball.trail.length; i += 1) {
      const v = s.ball.trail[i];
      if (!v) continue;
      ctx.globalAlpha =
        (((dim ? 0.28 : 1) * (i + 1)) / s.ball.trail.length) * 0.5;
      ctx.fillStyle = COLOR.ball;
      ctx.beginPath();
      ctx.arc(
        v.x,
        v.y,
        (C.BALL_R * (i + 1)) / s.ball.trail.length,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    }
    ctx.globalAlpha = dim ? 0.28 : 1;
    ctx.shadowColor = COLOR.ball;
    ctx.shadowBlur = 20;
    ctx.fillStyle = COLOR.ball;
    ctx.beginPath();
    ctx.arc(s.ball.x, s.ball.y, C.BALL_R, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.shadowColor = COLOR.left;
  ctx.shadowBlur = 18;
  ctx.fillStyle = COLOR.left;
  round(
    ctx,
    C.P1_X0,
    s.paddles.left.cy - C.PADDLE_HALF,
    C.PADDLE_W,
    C.PADDLE_H,
    8,
  );
  ctx.shadowColor = COLOR.right;
  ctx.fillStyle = COLOR.right;
  round(
    ctx,
    C.P2_X0,
    s.paddles.right.cy - C.PADDLE_HALF,
    C.PADDLE_W,
    C.PADDLE_H,
    8,
  );
  ctx.restore();
}
function menu(
  s: DeepReadonly<CaromState>,
  ctx: CanvasRenderingContext2D,
  labels: readonly string[],
): void {
  labels.forEach((label, i) => {
    const r = menuRect(s, i);
    if (!r) return;
    const selected = s.menuIndex === i;
    ctx.fillStyle = selected ? "rgba(255,230,109,.16)" : "rgba(10,28,39,.72)";
    ctx.strokeStyle = selected ? COLOR.accent : "#315064";
    ctx.lineWidth = selected ? 3 : 1;
    round(ctx, r.x, r.y, r.w, r.h, 12);
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    text(
      ctx,
      label,
      C.FIELD_CX,
      r.y + r.h / 2,
      22,
      selected ? COLOR.accent : COLOR.text,
    );
  });
}
function draw(s: DeepReadonly<CaromState>, api: RenderApi): void {
  const ctx = api.ctx;
  ctx.fillStyle = BACKGROUND;
  ctx.fillRect(0, 0, C.FIELD_W, C.FIELD_H);
  const overlay =
    s.screen === "title" ||
    s.screen === "howto" ||
    s.screen === "paused" ||
    s.screen === "matchover";
  field(s, ctx, overlay);
  if (
    s.screen === "countdown" ||
    s.screen === "playing" ||
    s.screen === "paused"
  ) {
    text(ctx, String(s.score.p1), C.FIELD_CX - 140, 64, 52, COLOR.left);
    text(ctx, String(s.score.p2), C.FIELD_CX + 140, 64, 52, COLOR.right);
    text(
      ctx,
      s.mode === "solo" ? "SOLO CIRCUIT" : "VERSUS DUEL",
      C.FIELD_CX,
      116,
      15,
      COLOR.dim,
    );
  }
  if (s.screen === "countdown" && s.ball) {
    text(
      ctx,
      String(Math.max(1, Math.ceil(s.ball.holdTimer))),
      C.FIELD_CX,
      C.FIELD_CY - 72,
      62,
      COLOR.accent,
    );
    text(ctx, "GET READY", C.FIELD_CX, C.FIELD_CY + 74, 15, COLOR.dim);
  }
  if (s.screen === "title") {
    text(ctx, C.TITLE_TEXT, C.FIELD_CX, 170, 104);
    text(ctx, "CURVE THE RALLY", C.FIELD_CX, 248, 18, COLOR.accent);
    menu(s, ctx, C.TITLE_ITEMS);
    text(ctx, "W/S  •  ↑/↓  •  ENTER", C.FIELD_CX, 662, 15, COLOR.dim);
  }
  if (s.screen === "howto") {
    text(ctx, "HOW TO PLAY", C.FIELD_CX, 92, 46);
    text(ctx, "W / S", C.FIELD_CX, 188, 25, COLOR.left);
    text(ctx, "Move the left paddle", C.FIELD_CX, 224, 16, COLOR.dim);
    text(ctx, "↑ / ↓", C.FIELD_CX, 282, 25, COLOR.right);
    text(
      ctx,
      "Player two • both sets work in Solo",
      C.FIELD_CX,
      318,
      16,
      COLOR.dim,
    );
    text(
      ctx,
      "Strike while moving to bend the ball with spin.",
      C.FIELD_CX,
      408,
      20,
    );
    text(
      ctx,
      "Use the violet blockers for sharp bank shots.",
      C.FIELD_CX,
      446,
      20,
    );
    text(ctx, "First to 11 • win by 2", C.FIELD_CX, 502, 17, COLOR.accent);
    menu(s, ctx, ["BACK TO MENU"]);
  }
  if (s.screen === "paused") {
    ctx.fillStyle = "rgba(4,10,15,.76)";
    ctx.fillRect(360, 190, 560, 430);
    text(ctx, "PAUSED", C.FIELD_CX, 276, 48);
    menu(s, ctx, C.PAUSE_ITEMS);
  }
  if (s.screen === "matchover") {
    text(
      ctx,
      s.winner === "left" ? "LEFT SIDE WINS" : "RIGHT SIDE WINS",
      C.FIELD_CX,
      190,
      48,
      s.winner === "left" ? COLOR.left : COLOR.right,
    );
    text(ctx, `${s.score.p1}  —  ${s.score.p2}`, C.FIELD_CX, 285, 54);
    menu(s, ctx, C.MATCHOVER_ITEMS);
  }
  ctx.textAlign = "right";
  ctx.font = "600 13px system-ui, sans-serif";
  ctx.fillStyle = s.muted ? "#ff728e" : COLOR.dim;
  ctx.fillText(s.muted ? "MUTED · M" : "SOUND · M", C.FIELD_W - 28, 28);
}

export const game: Game<CaromState, CaromDebugApi> = {
  initialize(api: InitApi<CaromState>): [CaromState, CaromDebugApi] {
    for (const action of C.ACTIONS)
      api.input.register(action, { keys: [...C.BINDINGS[action]] });
    api.audio.define(C.CUES.paddleHit, {
      wave: "square",
      freq: 430,
      freqTo: 660,
      gain: 0.16,
      durationMs: 55,
    });
    api.audio.define(C.CUES.wallBounce, {
      wave: "sine",
      freq: 260,
      freqTo: 180,
      gain: 0.13,
      durationMs: 45,
    });
    api.audio.define(C.CUES.obstacleBounce, {
      wave: "triangle",
      freq: 620,
      freqTo: 360,
      gain: 0.14,
      durationMs: 65,
    });
    api.audio.define(C.CUES.score, {
      wave: "sawtooth",
      freq: 220,
      freqTo: 720,
      gain: 0.12,
      durationMs: 180,
    });
    api.diagnostics.register("screen", (s) => s.screen);
    api.diagnostics.register("mode", (s) => s.mode);
    api.diagnostics.register("score", (s) => `${s.score.p1}:${s.score.p2}`);
    api.diagnostics.register("ball pos", (s) =>
      s.ball ? `${s.ball.x.toFixed(1)}, ${s.ball.y.toFixed(1)}` : "absent",
    );
    api.diagnostics.register("ball velocity", (s) =>
      s.ball ? `${s.ball.vx.toFixed(1)}, ${s.ball.vy.toFixed(1)}` : "absent",
    );
    api.diagnostics.register("ball speed", (s) =>
      s.ball ? Math.hypot(s.ball.vx, s.ball.vy).toFixed(1) : "absent",
    );
    api.diagnostics.register(
      "ball spin",
      (s) => s.ball?.spin.toFixed(1) ?? "absent",
    );
    api.diagnostics.register(
      "left paddle",
      (s) =>
        `${s.paddles.left.cy.toFixed(1)} @ ${s.paddles.left.vy.toFixed(1)}`,
    );
    api.diagnostics.register(
      "right paddle",
      (s) =>
        `${s.paddles.right.cy.toFixed(1)} @ ${s.paddles.right.vy.toFixed(1)}`,
    );
    return [fresh(false), debugApi()];
  },
  update(s, api, dt): CaromState {
    if (s.muted !== api.audio.muted()) api.audio.setMuted(s.muted);
    let n = input(s, api);
    n = { ...n, simTime: s.simTime + dt };
    if (n.screen === "countdown" || n.screen === "playing")
      n = world(n, api, dt);
    return { ...n, muted: api.audio.muted() };
  },
  render: draw,
};
