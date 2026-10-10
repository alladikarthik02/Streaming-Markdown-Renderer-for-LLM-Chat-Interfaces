import { memo } from 'react';
import type { Block, Plan } from '../core/planner.js';
import { renderTokens } from './safe.js';
export const BlockView = memo(function BlockView({ block, final }: { block: Block; final: boolean }) {
  return <>{renderTokens([block.token], final)}</>;
});
export function PlannedMarkdown({ plan }: { plan: Plan }) {
  return <div className="markdown">{plan.blocks.map(block => <BlockView key={block.id} block={block} final={plan.final} />)}</div>;
}
