import { useEffect, useState, useSyncExternalStore } from 'react';
import { MarkdownController, type StreamOptions } from './controller.js';
/** Options are read once per mount. Reset starts a new message on the same controller. */
export function useMarkdownStream(options?: StreamOptions): MarkdownController {
  const [controller] = useState(() => new MarkdownController(options));
  useEffect(() => { controller.activate(); return controller.suspend; }, [controller]);
  return controller;
}
export function useStreamSnapshot(controller: MarkdownController) {
  return useSyncExternalStore(controller.subscribe, controller.getSnapshot, controller.getSnapshot);
}
