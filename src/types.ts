export type Sub<S, K extends keyof S = keyof S> = (v: S[K]) => void
export type Subs<S> = Map<keyof S, Set<Sub<S>>>