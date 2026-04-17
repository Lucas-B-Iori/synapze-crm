import type { PipelineWithStages, PipelineCard } from "@/types/pipeline";

export function computeDragResult(
  pipeline: PipelineWithStages,
  activeId: string,
  overId: string
): { pipeline: PipelineWithStages; targetStageId: string; newIndex: number; updates: { id: string; stage_id: string; position: number }[] } | null {
  const activeCard = pipeline.cards.find((c) => c.id === activeId);
  if (!activeCard) return null;

  const overCard = pipeline.cards.find((c) => c.id === overId);

  let targetStageId = activeCard.stage_id;
  let newIndex = 0;

  if (overCard) {
    targetStageId = overCard.stage_id;
    const stageCards = pipeline.cards
      .filter((c) => c.stage_id === targetStageId)
      .sort((a, b) => a.position - b.position);
    const overIndex = stageCards.findIndex((c) => c.id === overId);
    const activeIndex = stageCards.findIndex((c) => c.id === activeId);

    if (targetStageId === activeCard.stage_id) {
      if (activeIndex === overIndex) return null;
      newIndex = overIndex;
    } else {
      newIndex = overIndex;
    }
  } else {
    // Dropped on a column (stage)
    targetStageId = overId;
    const stageCards = pipeline.cards
      .filter((c) => c.stage_id === targetStageId)
      .sort((a, b) => a.position - b.position);
    newIndex = stageCards.length;
  }

  // Build updated cards
  const sourceStageId = activeCard.stage_id;
  const otherCards = pipeline.cards.filter((c) => c.id !== activeId);

  // Reindex source stage if moving across stages
  const sourceStageCards = otherCards
    .filter((c) => c.stage_id === sourceStageId)
    .sort((a, b) => a.position - b.position);
  sourceStageCards.forEach((c, idx) => {
    c.position = idx;
  });

  const targetStageCards = otherCards
    .filter((c) => c.stage_id === targetStageId)
    .sort((a, b) => a.position - b.position);

  // Insert active card at newIndex
  const insertedCard: PipelineCard = { ...activeCard, stage_id: targetStageId };
  targetStageCards.splice(newIndex, 0, insertedCard);

  // Reassign positions for target stage
  const updates: { id: string; stage_id: string; position: number }[] = [];
  targetStageCards.forEach((c, idx) => {
    c.position = idx;
    updates.push({ id: c.id, stage_id: targetStageId, position: idx });
  });

  // Build final card list avoiding duplicates when same stage
  let finalCards: PipelineCard[];
  if (sourceStageId === targetStageId) {
    finalCards = [
      ...otherCards.filter((c) => c.stage_id !== targetStageId),
      ...targetStageCards,
    ];
  } else {
    sourceStageCards.forEach((c) => {
      updates.push({ id: c.id, stage_id: sourceStageId, position: c.position });
    });
    finalCards = [
      ...otherCards.filter((c) => c.stage_id !== targetStageId && c.stage_id !== sourceStageId),
      ...sourceStageCards,
      ...targetStageCards,
    ];
  }

  return {
    pipeline: { ...pipeline, cards: finalCards },
    targetStageId,
    newIndex,
    updates,
  };
}
