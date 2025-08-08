// SelectionManager implements the 10 requested selection enhancements

export type Modality = 'text' | 'image' | 'video' | 'audio' | 'code' | 'graph' | 'canvas' | 'chart';

export interface SelectableItem {
  id: string;
  parentId?: string;
  modality: Modality;
  contextWeight?: number; // relevance score 0..1
  lastInteractedAt?: number; // epoch ms
  requiresPermission?: string; // permission key
}

export interface SelectionState {
  hardSelectedId?: string;
  softSelectedId?: string;
  pinnedAnchorId?: string;
  lastSelectionByView: Record<string, string | undefined>;
}

export class SelectionManager {
  private items: Map<string, SelectableItem> = new Map();
  private state: SelectionState = { lastSelectionByView: {} };

  register(item: SelectableItem) { this.items.set(item.id, item); }
  unregister(id: string) { this.items.delete(id); }

  pinAnchor(id?: string) { this.state.pinnedAnchorId = id; }

  // 1. Prioritize by context weight; 2. Multi-modal; 3. Proximity
  private scoreItem(item: SelectableItem, opts: { desiredModality?: Modality; anchorId?: string }): number {
    let score = item.contextWeight ?? 0;
    if (opts.desiredModality && item.modality === opts.desiredModality) score += 0.3;
    // Proximity heuristic: sibling of anchor gets bonus
    if (opts.anchorId && item.parentId && this.items.get(opts.anchorId)?.parentId === item.parentId) score += 0.2;
    // Recency heuristic
    if (item.lastInteractedAt) score += Math.min(0.2, (Date.now() - item.lastInteractedAt) < 15000 ? 0.2 : 0);
    return score;
  }

  // 4. User-defined locking (pin)
  getAnchor(): string | undefined { return this.state.pinnedAnchorId; }

  // 5. Adaptive fallback chain
  selectBest(opts: { desiredModality?: Modality; viewId?: string; hasPermission?: (perm: string) => boolean } = {}): string | undefined {
    const anchorId = this.getAnchor();
    const candidates = Array.from(this.items.values())
      .filter(i => !i.requiresPermission || opts.hasPermission?.(i.requiresPermission))
      .sort((a,b) => this.scoreItem(b, { desiredModality: opts.desiredModality, anchorId }) - this.scoreItem(a, { desiredModality: opts.desiredModality, anchorId }));
    const chosen = candidates[0]?.id;
    if (chosen) this.setHard(chosen, opts.viewId);
    return chosen;
  }

  // 6. Predictive pre-selection (soft)
  predictNext(opts: { fromId?: string; desiredModality?: Modality }): string | undefined {
    const anchorId = opts.fromId || this.state.hardSelectedId;
    const next = Array.from(this.items.values())
      .filter(i => i.id !== anchorId)
      .sort((a,b) => this.scoreItem(b, { desiredModality: opts.desiredModality, anchorId }) - this.scoreItem(a, { desiredModality: opts.desiredModality, anchorId }))[0];
    this.state.softSelectedId = next?.id;
    return next?.id;
  }

  // 7. Conflict resolution (simple policy)
  resolveConflict(candidates: string[], lastExplicit?: string): string | undefined {
    if (lastExplicit && candidates.includes(lastExplicit)) return lastExplicit;
    return candidates[0];
  }

  // 8. Soft vs. Hard selection
  setSoft(id?: string) { this.state.softSelectedId = id; }
  setHard(id: string, viewId?: string) { this.state.hardSelectedId = id; if (viewId) this.state.lastSelectionByView[viewId] = id; }

  // 9. Selection memory per view
  getLastForView(viewId: string): string | undefined { return this.state.lastSelectionByView[viewId]; }

  // 10. Permission-aware handled in selectBest filter

  getState() { return { ...this.state }; }
}

export const selectionManager = new SelectionManager();

