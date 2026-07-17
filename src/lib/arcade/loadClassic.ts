import type { ClassicShellId } from "./catalog";
import type { ClassicController, CreateClassicOpts } from "./shared";

/** Dynamic import map — each game is its own Vite chunk. */
export async function loadClassicGame(
  id: ClassicShellId,
  opts: CreateClassicOpts,
): Promise<ClassicController> {
  switch (id) {
    case "breakout": {
      const m = await import("./games/breakout");
      return m.createGame(opts);
    }
    case "pong": {
      const m = await import("./games/pong");
      return m.createGame(opts);
    }
    case "snake": {
      const m = await import("./games/snake");
      return m.createGame(opts);
    }
    case "asteroids": {
      const m = await import("./games/asteroids");
      return m.createGame(opts);
    }
    case "frogger": {
      const m = await import("./games/frogger");
      return m.createGame(opts);
    }
    case "flappy": {
      const m = await import("./games/flappy");
      return m.createGame(opts);
    }
    case "minesweeper": {
      const m = await import("./games/minesweeper");
      return m.createGame(opts);
    }
    case "memory": {
      const m = await import("./games/memory");
      return m.createGame(opts);
    }
    case "missile": {
      const m = await import("./games/missile");
      return m.createGame(opts);
    }
    case "simon": {
      const m = await import("./games/simon");
      return m.createGame(opts);
    }
    case "tron": {
      const m = await import("./games/tron");
      return m.createGame(opts);
    }
    case "centipede": {
      const m = await import("./games/centipede");
      return m.createGame(opts);
    }
    case "twenty48": {
      const m = await import("./games/twenty48");
      return m.createGame(opts);
    }
    default: {
      const _exhaustive: never = id;
      throw new Error(`Unknown classic: ${_exhaustive}`);
    }
  }
}
