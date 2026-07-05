import React from 'react'

type P = React.SVGProps<SVGSVGElement>
const base = (props: P) => ({
  width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const, ...props,
})

export const IconTrain = (p: P) => (
  <svg {...base(p)}><rect x="5" y="3" width="14" height="13" rx="3" /><path d="M6.5 11h11" /><path d="M9 16l-2 4M15 16l2 4" /><circle cx="9" cy="13.5" r="0.6" fill="currentColor" /><circle cx="15" cy="13.5" r="0.6" fill="currentColor" /></svg>
)
export const IconSwap = (p: P) => (
  <svg {...base(p)}><path d="M7 4L4 7l3 3" /><path d="M4 7h13" /><path d="M17 20l3-3-3-3" /><path d="M20 17H7" /></svg>
)
export const IconClock = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M12 7.5V12l3 2" /></svg>
)
export const IconPin = (p: P) => (
  <svg {...base(p)}><path d="M12 21s7-6.2 7-11a7 7 0 1 0-14 0c0 4.8 7 11 7 11Z" /><circle cx="12" cy="10" r="2.4" /></svg>
)
export const IconChevron = (p: P) => (
  <svg {...base(p)}><path d="M9 6l6 6-6 6" /></svg>
)
export const IconChevronDown = (p: P) => (
  <svg {...base(p)}><path d="M6 9l6 6 6-6" /></svg>
)
export const IconUser = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="8" r="3.6" /><path d="M5 20c0-3.6 3.1-6 7-6s7 2.4 7 6" /></svg>
)
export const IconTicket = (p: P) => (
  <svg {...base(p)}><path d="M4 8a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2 2 2 0 0 0 0 4 2 2 0 0 1-2 2H6a2 2 0 0 1-2-2 2 2 0 0 0 0-4Z" /><path d="M13 6v12" strokeDasharray="2 2" /></svg>
)
export const IconAlert = (p: P) => (
  <svg {...base(p)}><path d="M12 4l9 16H3l9-16Z" /><path d="M12 10v4M12 17.5v.5" /></svg>
)
export const IconCheck = (p: P) => (
  <svg {...base(p)}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>
)
export const IconLeaf = (p: P) => (
  <svg {...base(p)}><path d="M5 19c8 1 14-4 14-13 0 0-11-2-13 5-1 3.5 1 6 1 6" /><path d="M5 19c2-5 5-7 9-8.5" /></svg>
)
export const IconArrowRight = (p: P) => (
  <svg {...base(p)}><path d="M5 12h14M13 6l6 6-6 6" /></svg>
)
export const IconGlobe = (p: P) => (
  <svg {...base(p)}><circle cx="12" cy="12" r="8.5" /><path d="M3.5 12h17M12 3.5c2.4 2.3 3.6 5.3 3.6 8.5S14.4 18.2 12 20.5C9.6 18.2 8.4 15.2 8.4 12S9.6 5.8 12 3.5Z" /></svg>
)
export const IconMoon = (p: P) => (
  <svg {...base(p)}><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>
)
export const IconBell = (p: P) => (
  <svg {...base(p)}><path d="M6 9a6 6 0 0 1 12 0c0 5 2 6 2 6H4s2-1 2-6Z" /><path d="M10.5 19a1.7 1.7 0 0 0 3 0" /></svg>
)
export const IconCalendar = (p: P) => (
  <svg {...base(p)}><rect x="4" y="5" width="16" height="16" rx="2.5" /><path d="M4 9h16M8 3v4M16 3v4" /></svg>
)
export const IconX = (p: P) => (
  <svg {...base(p)}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const IconLock = (p: P) => (
  <svg {...base(p)}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>
)
export const IconShare = (p: P) => (
  <svg {...base(p)}><circle cx="6" cy="12" r="2.4" /><circle cx="17" cy="6" r="2.4" /><circle cx="17" cy="18" r="2.4" /><path d="M8.1 10.9l6.8-3.8M8.1 13.1l6.8 3.8" /></svg>
)
export const IconMap = (p: P) => (
  <svg {...base(p)}><path d="M9 4L3.5 6v14L9 18l6 2 5.5-2V4L15 6 9 4Z" /><path d="M9 4v14M15 6v14" /></svg>
)
