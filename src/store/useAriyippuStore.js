/**
 * useAriyippuStore.js
 *
 * Single source of truth for the notice being edited. Persisted to
 * localStorage so work in progress survives a refresh.
 */

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { emptyNotice, makeSection, newId, sampleNotice } from "../data/notice.js";

export const INPUT_MODES = ["manglish", "english", "inscript"];
export const THEMES = ["dark", "light"];

/** First visit follows the OS colour scheme; after that the toggle decides. */
const systemTheme = () =>
  typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: light)").matches ? "light" : "dark";

const updateSection = (notice, sectionId, fn) => ({
  ...notice,
  sections: notice.sections.map((s) => (s.id === sectionId ? fn(s) : s)),
});

export const useAriyippuStore = create(
  persist(
    (set) => ({
      notice: emptyNotice(),
      inputMode: "manglish",
      theme: systemTheme(),
      /** Item ids that were too tall for one page in the last generated PDF. */
      oversizedItemIds: [],

      setInputMode: (inputMode) => set({ inputMode }),
      setTheme: (theme) => set({ theme }),
      cycleInputMode: () =>
        set((s) => ({ inputMode: INPUT_MODES[(INPUT_MODES.indexOf(s.inputMode) + 1) % INPUT_MODES.length] })),

      setHeader: (patch) => set((s) => ({ notice: { ...s.notice, header: { ...s.notice.header, ...patch } } })),
      setNoticeDate: (noticeDate) => set((s) => ({ notice: { ...s.notice, noticeDate } })),
      setSignature: (patch) =>
        set((s) => ({ notice: { ...s.notice, signature: { ...s.notice.signature, ...patch } } })),

      addSection: (kind = "numbered") =>
        set((s) => ({ notice: { ...s.notice, sections: [...s.notice.sections, makeSection(kind)] } })),
      updateSection: (sectionId, patch) =>
        set((s) => ({ notice: updateSection(s.notice, sectionId, (sec) => ({ ...sec, ...patch })) })),
      removeSection: (sectionId) =>
        set((s) => ({ notice: { ...s.notice, sections: s.notice.sections.filter((sec) => sec.id !== sectionId) } })),
      moveSection: (sectionId, delta) =>
        set((s) => ({ notice: { ...s.notice, sections: moveById(s.notice.sections, sectionId, delta) } })),

      addItem: (sectionId, content) =>
        set((s) => ({
          notice: updateSection(s.notice, sectionId, (sec) => ({
            ...sec,
            items: [...sec.items, { id: newId(), content }],
          })),
        })),
      updateItem: (sectionId, itemId, content) =>
        set((s) => ({
          notice: updateSection(s.notice, sectionId, (sec) => ({
            ...sec,
            items: sec.items.map((it) => (it.id === itemId ? { ...it, content } : it)),
          })),
        })),
      removeItem: (sectionId, itemId) =>
        set((s) => ({
          notice: updateSection(s.notice, sectionId, (sec) => ({
            ...sec,
            items: sec.items.filter((it) => it.id !== itemId),
          })),
        })),
      moveItem: (sectionId, itemId, delta) =>
        set((s) => ({
          notice: updateSection(s.notice, sectionId, (sec) => ({ ...sec, items: moveById(sec.items, itemId, delta) })),
        })),

      setOversizedItemIds: (oversizedItemIds) => set({ oversizedItemIds }),

      /** Starts a new notice, keeping the church header, logo and signature. */
      newNotice: () =>
        set((s) => ({
          notice: { ...emptyNotice(), header: s.notice.header, signature: s.notice.signature },
          oversizedItemIds: [],
        })),
      loadSample: () =>
        set((s) => ({
          notice: {
            ...sampleNotice(),
            header: {
              ...sampleNotice().header,
              logoMode: s.notice.header.logoMode,
              logoDataUrl: s.notice.header.logoDataUrl,
            },
          },
          oversizedItemIds: [],
        })),
    }),
    {
      name: "ariyippu-notice-v1",
      partialize: (s) => ({ notice: s.notice, inputMode: s.inputMode, theme: s.theme }),
    },
  ),
);

function moveById(list, id, delta) {
  const from = list.findIndex((x) => x.id === id);
  const to = from + delta;
  if (from < 0 || to < 0 || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}
