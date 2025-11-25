export interface LogEntry {
  tick: number;
  message: string;
}

export interface LogState {
  entries: LogEntry[];
}

export function createLogState(): LogState {
  return { entries: [] };
}

export function appendLog(log: LogState, tick: number, message: string) {
  log.entries.push({ tick, message });
}
