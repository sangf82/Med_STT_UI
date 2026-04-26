/**
 * AI / STT structured output must match the checklist already drawn in Pencil — not a second list.
 *
 * Source: `medmate-bdd/design/pen-stt-108.pen`
 * - Pilot frame: `e3zO7` ("Pilot 108 · BDD Personal Productivity (100%)")
 * - Draft checklist: `x6ccy` ("04 · Draft To-Do") → `cc4zw` ("list04")
 *   → `it1` (`4BlMt` → `oWBfQ`), `it2` (`lZJxV` → `oWBfQ`) task titles.
 * - Markdown sample: strip 11 → `WmbWp` / `md11` → descendant `S4qWY`.
 *
 * Note: selections that include `MzSDs` hit the shadcn library frame, not this checklist — use `e3zO7` / `x6ccy` above.
 */

export type Pilot108PenChecklistRow = { text: string; assignee_id?: string | null };

/** Same rows as design frame 04 · Draft To-Do (`cc4zw`). */
export const PILOT108_PEN_CHECKLIST_ROWS_STRIP04: readonly Pilot108PenChecklistRow[] = [
  { text: 'Buy milk' },
  { text: 'Call Dr. Smith' },
];

/** BDD one-tap line that produces those two rows. */
export const PILOT108_PEN_CHECKLIST_UTTERANCE_STRIP04 = 'Buy milk and call Dr. Smith';

/** Pen `S4qWY` (Export / Markdown block in strip 11). */
export const PILOT108_PEN_MARKDOWN_EXPORT_BLOCK =
  '- [ ] Buy milk\n- [ ] Call Dr. Smith (@John Doe)\n\n_Shared from MedMate Pilot 108_';

export function pilot108PenChecklistToEditableRows(
  items: readonly Pilot108PenChecklistRow[],
  opts: { newId: () => string; defaultAssigneeId: string },
): Array<{ id: string; text: string; assignee_id: string }> {
  return items.map((it) => ({
    id: opts.newId(),
    text: it.text,
    assignee_id:
      it.assignee_id === null ? '' : it.assignee_id !== undefined ? it.assignee_id : opts.defaultAssigneeId,
  }));
}
