// Shared API client for the Studio and Connections screens. Every call checks
// the response status, so a 401/500 shows a message instead of breaking a screen.
import { useSyncExternalStore } from 'react';

export const API_BASE: string = import.meta.env.VITE_API_BASE || 'http://localhost:8787';
const API_KEY: string = import.meta.env.VITE_API_KEY || '';

// Owner PIN lives only in memory for this browser tab; it is never stored or built in.
let ownerPin = '';
const listeners = new Set<() => void>();
export function setOwnerPin(pin: string) {
  ownerPin = pin;
  listeners.forEach((l) => l());
}
export function useOwnerPin(): string {
  return useSyncExternalStore((l) => { listeners.add(l); return () => listeners.delete(l); }, () => ownerPin);
}

export async function api<T>(path: string, init: RequestInit & { owner?: boolean; raw?: boolean } = {}): Promise<T> {
  const headers: Record<string, string> = { 'X-API-Key': API_KEY, ...(init.headers as Record<string, string> | undefined) };
  if (!init.raw && !headers['Content-Type']) headers['Content-Type'] = 'application/json';
  if (ownerPin) headers['X-Owner-PIN'] = ownerPin;
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error((data as { error?: string }).error || `Request failed (${res.status})`);
  return data as T;
}

// Hand-off from Decision Review to Content Studio: "Create content from this decision".
let pendingDecision: { code: string; title: string } | null = null;
export function setPendingDecision(d: { code: string; title: string } | null) { pendingDecision = d; }
export function takePendingDecision() { const d = pendingDecision; pendingDecision = null; return d; }

export const mediaUrl = (key: string) => `${API_BASE}/media/${key}`;

export const LABELS: Record<string, string> = {
  awareness: 'Awareness', qualified_reach: 'Qualified reach', inquiry: 'Enquiries', booking: 'Bookings',
  weekday_fill: 'Weekday fill', stay_extension: 'Longer stays', referral: 'Referrals', learning_engagement: 'Learning engagement',
  qualified_inquiries: 'Qualified enquiries', bookings: 'Bookings', room_nights: 'Room nights', contribution: 'Contribution margin',
  saves_and_shares: 'Saves & shares', link_clicks: 'Link clicks', profile_visits: 'Profile visits', learning_completions: 'Learning completions',
  whatsapp: 'WhatsApp', call: 'Call', booking_form: 'Booking form', website: 'Iddav website', article: 'Article', direct_response: 'Direct reply',
  families: 'Families', couples: 'Couples', photographers: 'Photographers', serious_wildlife_travellers: 'Serious wildlife travellers',
  birders: 'Birders', learners: 'Learners', small_groups: 'Small groups', corporate_retreats: 'Corporate retreats', warm_personal_network: 'Warm personal network',
  instagram: 'Instagram', facebook: 'Facebook', threads: 'Threads', linkedin: 'LinkedIn', google_business: 'Google Business',
  youtube: 'YouTube', telegram: 'Telegram', whatsapp_status: 'WhatsApp Status', google_ads: 'Google Ads',
  original: 'Original photo', documentary_edit: 'Documentary edit', ai_generated: 'AI-generated', mixed: 'Mixed',
};
export const label = (k: string) => LABELS[k] || k;
