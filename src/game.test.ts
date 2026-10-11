import { createCanvas } from "@napi-rs/canvas";
import { ConstantClock, createEngine } from "@clockwyrks/simple-2d";
import { describe, expect, it } from "vitest";
import {
  BALL_R,
  FIELD_CX,
  FIELD_CY,
  HOLD_TIME,
  SERVE_SPEED,
} from "./constants";
import { BACKGROUND, game } from "./game";

function setup(stepMs = 8) {
  const canvas = createCanvas(1280, 720) as unknown as HTMLCanvasElement;
  return createEngine({
    canvas,
    width: 1280,
    height: 720,
    game,
    background: BACKGROUND,
    clock: new ConstantClock(stepMs),
    surface: {
      cssWidth: () => 1280,
      cssHeight: () => 720,
      dpr: () => 1,
      events: () => new EventTarget(),
    },
  });
}

describe("Carom", () => {
  it("initializes the complete title world and debug surface", async () => {
    const engine = setup();
    await engine.initialize();
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.screen).toBe("title");
    expect(snap.ball).toMatchObject({
      x: FIELD_CX,
      y: FIELD_CY,
      held: true,
      holdTimer: HOLD_TIME,
    });
    expect(snap.obstacles).toHaveLength(2);
    expect(engine.diagnostics().map((v) => v.name)).toContain("ball spin");
    engine.destroy();
  });
  it("serves toward the receiver after the countdown", async () => {
    const engine = setup(10);
    await engine.initialize();
    engine.apply((s) => engine.debug.setScreen(s, "countdown"));
    engine.apply((s) => engine.debug.setBallServeSign(s, 1));
    await engine.advance(100);
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.screen).toBe("playing");
    expect(snap.ball?.held).toBe(false);
    expect(snap.ball?.speed).toBeCloseTo(SERVE_SPEED, 6);
    expect(snap.ball?.vx).toBeLessThan(0);
    engine.destroy();
  });
  it("scores a posed goal and parks a fresh ball", async () => {
    const engine = setup();
    await engine.initialize();
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) =>
      engine.debug.setBallPosition(s, 1280 + BALL_R + 1, FIELD_CY),
    );
    engine.apply((s) => engine.debug.setBallVelocity(s, 100, 0));
    await engine.advance(1);
    const snap = engine.debug.snapshot(engine.state);
    expect(snap.score.p1).toBe(1);
    expect(snap.screen).toBe("countdown");
    expect(snap.receiver).toBe("right");
    expect(snap.ball).toMatchObject({ x: FIELD_CX, y: FIELD_CY, held: true });
    engine.destroy();
  });
  it("applies paddle spin and keeps debug poses immutable", async () => {
    const engine = setup(4);
    await engine.initialize();
    const before = engine.state;
    engine.apply((s) => engine.debug.setPaddleDriven(s, "left", true));
    engine.apply((s) => engine.debug.setPaddleVy(s, "left", 400));
    engine.apply((s) => engine.debug.setScreen(s, "playing"));
    engine.apply((s) => engine.debug.setBallHeld(s, false));
    engine.apply((s) => engine.debug.setBallPosition(s, 76, FIELD_CY));
    engine.apply((s) => engine.debug.setBallVelocity(s, -520, 0));
    await engine.advance(1);
    expect(before.screen).toBe("title");
    expect(engine.debug.snapshot(engine.state).ball?.spin).toBeGreaterThan(0);
    engine.destroy();
  });
  it("clears, respawns, and rejects invalid world operations", async () => {
    const engine = setup();
    await engine.initialize();
    engine.apply((s) => engine.debug.clearWorld(s));
    expect(engine.debug.snapshot(engine.state).ball).toBeNull();
    expect(() => engine.apply((s) => engine.debug.setBallSpin(s, 20))).toThrow(
      /no ball/,
    );
    expect(() => engine.apply((s) => engine.debug.spawnObstacle(s, 9))).toThrow(
      /does not exist/,
    );
    engine.apply((s) => engine.debug.spawnBall(s));
    engine.apply((s) => engine.debug.spawnObstacle(s, 0));
    expect(engine.debug.snapshot(engine.state).obstacles).toHaveLength(1);
    engine.destroy();
  });
});
