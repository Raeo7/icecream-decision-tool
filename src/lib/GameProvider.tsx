"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { defaultState, loadState, saveState, type GameState } from "@/lib/state";

interface Value {
  state: GameState;
  setState: (next: GameState) => void;
  ready: boolean;
}

const GameContext = createContext<Value | null>(null);

export function GameProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<GameState>(defaultState);
  const [ready, setReady] = useState(false);

  // The saved game is read after the first render on purpose. Reading localStorage during
  // render would make the client's first output differ from the server's, which is a
  // hydration mismatch. One extra render is the cost of avoiding that.
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- see above
    setState(loadState());
    setReady(true);
  }, []);

  useEffect(() => {
    if (ready) saveState(state);
  }, [state, ready]);

  return <GameContext.Provider value={{ state, setState, ready }}>{children}</GameContext.Provider>;
}

export function useGame(): Value {
  const value = useContext(GameContext);
  if (value === null) throw new Error("useGame must be used inside GameProvider");
  return value;
}
