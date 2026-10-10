import { BlockPlanner, type Plan } from '../core/planner.js';
export type StreamStatus = 'pending' | 'streaming' | 'completed' | 'cancelled' | 'error';
export type Snapshot = Readonly<{ plan: Plan; status: StreamStatus; error?: string; generation: number }>;
export interface Scheduler { request(callback: () => void): number; cancel(id: number): void }
export interface StreamOptions { maxCharacters?: number; scheduler?: Scheduler }
const defaultScheduler: Scheduler = {
  request: cb => requestAnimationFrame(cb), cancel: id => cancelAnimationFrame(id),
};
export class MarkdownController {
  private planner = new BlockPlanner();
  private listeners = new Set<() => void>();
  private pending = '';
  private accepted = '';
  private frame: number | undefined;
  private epoch = 0;
  private generation = 0;
  private disposed = false;
  private suspended = false;
  private snapshot: Snapshot = { plan: this.planner.append(''), status: 'pending', generation: 0 };
  private scheduler: Scheduler;
  private limit: number;
  constructor(options: StreamOptions = {}) {
    this.scheduler = options.scheduler ?? defaultScheduler;
    this.limit = options.maxCharacters ?? 1_000_000;
    if (!Number.isSafeInteger(this.limit) || this.limit < 1 || this.limit > 1_000_000) throw new RangeError('maxCharacters must be between 1 and 1,000,000');
  }
  getSnapshot = (): Snapshot => this.snapshot;
  subscribe = (listener: () => void): (() => void) => {
    this.listeners.add(listener);
    return () => { this.listeners.delete(listener); };
  };
  private notify() { for (const listener of this.listeners) listener(); }
  private clearFrame() {
    this.epoch++;
    if (this.frame !== undefined) this.scheduler.cancel(this.frame);
    this.frame = undefined;
  }
  private schedule() {
    if (this.frame !== undefined || this.suspended || !this.pending) return;
    const epoch = this.epoch;
    this.frame = this.scheduler.request(() => {
      if (epoch !== this.epoch || this.disposed || this.suspended) return;
      this.frame = undefined;
      this.flush('streaming');
    });
  }
  private flush(status: StreamStatus, error?: string) {
    const pending = this.pending; this.pending = '';
    try {
      const plan = this.planner.append(pending, status === 'completed' || status === 'cancelled');
      this.snapshot = { plan, status, error, generation: this.generation };
    } catch {
      const token = { type: 'code' as const, raw: this.accepted, text: this.accepted };
      this.snapshot = { plan: { source: this.accepted, blocks: [{ id: `${this.generation}:fallback`, start: 0, end: this.accepted.length, token }], final: true, parsedCharacters: 0, fallback: true }, status: 'error', error: 'Formatting unavailable; showing accepted text.', generation: this.generation };
    }
    this.notify();
  }
  append = (chunk: string): boolean => {
    if (this.disposed || !['pending', 'streaming'].includes(this.snapshot.status)) return false;
    if (typeof chunk !== 'string') throw new TypeError('Chunks must be decoded strings');
    if (this.accepted.length + chunk.length > this.limit) {
      this.clearFrame(); this.flush('error', `Character limit (${this.limit}) reached; incoming chunk rejected.`); return false;
    }
    if (!chunk) return true;
    this.accepted += chunk; this.pending += chunk; this.schedule(); return true;
  };
  finish = () => {
    if (this.disposed || !['pending', 'streaming'].includes(this.snapshot.status)) return;
    this.clearFrame(); this.flush('completed');
  };
  cancel = () => {
    if (this.disposed || !['pending', 'streaming'].includes(this.snapshot.status)) return;
    this.clearFrame(); this.flush('cancelled');
  };
  fail = (message = 'Stream failed; accepted text is preserved.') => {
    if (this.disposed || !['pending', 'streaming'].includes(this.snapshot.status)) return;
    this.clearFrame(); this.flush('error', message);
  };
  reset = () => {
    if (this.disposed) return;
    this.clearFrame(); this.pending = ''; this.accepted = ''; this.generation++;
    this.planner = new BlockPlanner(this.generation);
    this.snapshot = { plan: this.planner.append(''), status: 'pending', generation: this.generation };
    this.notify();
  };
  /** Hook lifecycle suspension is reversible for Strict Mode; dispose is permanent. */
  suspend = () => { this.suspended = true; this.clearFrame(); };
  activate = () => { if (!this.disposed) { this.suspended = false; this.schedule(); } };
  dispose = () => { this.suspend(); this.disposed = true; this.pending = ''; this.listeners.clear(); };
}
