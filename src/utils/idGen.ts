let nextId = 1;

export function genTempId(): number {
  return nextId++;
}

export function resetTempId(seed = 1): void {
  nextId = seed;
}
