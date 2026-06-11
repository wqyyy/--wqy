import { useCallback, useRef, useState, type DragEvent } from "react";

export function reorderOutlineById<T extends { id: string }>(
  items: T[],
  draggedId: string,
  targetId: string,
): T[] {
  if (draggedId === targetId) return items;
  const from = items.findIndex((item) => item.id === draggedId);
  const to = items.findIndex((item) => item.id === targetId);
  if (from < 0 || to < 0) return items;
  const next = [...items];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

export function useOutlineChapterDrag(onReorder: (draggedId: string, targetId: string) => void) {
  const dragIdRef = useRef<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  const bindDropZone = useCallback(
    (sectionId: string) => ({
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
        if (dragIdRef.current && dragIdRef.current !== sectionId) {
          setDropTargetId(sectionId);
        }
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        const dragged = dragIdRef.current || e.dataTransfer.getData("text/plain");
        if (dragged && dragged !== sectionId) onReorder(dragged, sectionId);
        dragIdRef.current = null;
        setDropTargetId(null);
      },
      onDragLeave: () => {
        setDropTargetId((prev) => (prev === sectionId ? null : prev));
      },
    }),
    [onReorder],
  );

  const bindDragHandle = useCallback(
    (sectionId: string) => ({
      draggable: true,
      onDragStart: (e: DragEvent) => {
        dragIdRef.current = sectionId;
        e.dataTransfer.setData("text/plain", sectionId);
        e.dataTransfer.effectAllowed = "move";
      },
      onDragEnd: () => {
        dragIdRef.current = null;
        setDropTargetId(null);
      },
    }),
    [],
  );

  const dropHighlight = useCallback(
    (sectionId: string) =>
      dropTargetId === sectionId ? "ring-2 ring-inset ring-primary/35" : "",
    [dropTargetId],
  );

  return { bindDropZone, bindDragHandle, dropHighlight };
}
