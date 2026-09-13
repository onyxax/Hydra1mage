"use client";

// Legacy barrel — ToolDropZone was a shallow duplicate of DropZone.
// Deepening: single DropZone owns all drag/validation logic; this re-exports it
// so existing tools keep working while new code imports from "@/components/DropZone".
export { default } from "@/components/DropZone";
