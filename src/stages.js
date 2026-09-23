import {
  Sprout, Inbox, ClipboardList, Cog, ShieldCheck, Package,
  QrCode, Store, Building2, Warehouse, Truck, User
} from 'lucide-react';

// Mirrors backend/models/stages.js — the canonical 12-stage supply-chain
// journey used across the admin Batch Detail page and the public Trace page.
// `icon` is a lucide-react component (not an emoji) — Windows renders emoji
// in an inconsistent, unprofessional "toy" style, so every stage icon in the
// app is a proper SVG.
export const STAGES = [
  { key: 'INGREDIENT_REGISTERED', label: 'Farm', icon: Sprout },
  { key: 'RECEIVED', label: 'Received', icon: Inbox },
  { key: 'BATCH_STARTED', label: 'Batch Started', icon: ClipboardList },
  { key: 'TRANSFORMED', label: 'Transformed', icon: Cog },
  { key: 'QUALITY_CHECKED', label: 'Quality Check', icon: ShieldCheck },
  { key: 'PACKAGED', label: 'Packaging', icon: Package },
  { key: 'QR_BOUND', label: 'QR Bound', icon: QrCode },
  { key: 'TRANSFERRED_TO_SELLER', label: 'Queen Seller', icon: Store },
  { key: 'RECEIVED_AT_HUB', label: 'Queen Hub', icon: Building2 },
  { key: 'WAREHOUSED', label: 'Warehouse', icon: Warehouse },
  { key: 'DISPATCHED', label: 'Rider', icon: Truck },
  { key: 'DELIVERED', label: 'Customer', icon: User },
];

export function stageIndex(eventType) {
  return STAGES.findIndex(s => s.key === eventType);
}

export function nextStage(currentEventType) {
  const idx = currentEventType ? stageIndex(currentEventType) : -1;
  return STAGES[idx + 1] || null;
}

// Looks up a stage's icon component by key — used where the journey data
// comes from an API response (e.g. the public trace page) rather than
// being iterated directly from STAGES.
export function stageIcon(eventType) {
  return STAGES.find(s => s.key === eventType)?.icon || Package;
}
