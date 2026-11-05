const base = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round',
  strokeLinejoin: 'round',
  'aria-hidden': true,
}

export const MenuIcon = (p) => (
  <svg {...base} {...p}><path d="M4 7h16M4 12h16M4 17h10" /></svg>
)
export const CloseIcon = (p) => (
  <svg {...base} {...p}><path d="M6 6l12 12M18 6L6 18" /></svg>
)
export const SearchIcon = (p) => (
  <svg {...base} {...p}><circle cx="11" cy="11" r="6.5" /><path d="M16 16l4 4" /></svg>
)
export const BagIcon = (p) => (
  <svg {...base} {...p}><path d="M5 8h14l-1 12H6L5 8z" /><path d="M9 8V6.5a3 3 0 016 0V8" /></svg>
)
export const HeartIcon = ({ filled, ...p }) => (
  <svg {...base} {...p} fill={filled ? 'currentColor' : 'none'}>
    <path d="M12 20s-7-4.4-7-10a4 4 0 017-2.6A4 4 0 0119 10c0 5.6-7 10-7 10z" />
  </svg>
)
export const UserIcon = (p) => (
  <svg {...base} {...p}><circle cx="12" cy="8.5" r="3.5" /><path d="M5 20c.8-3.6 3.6-5.5 7-5.5s6.2 1.9 7 5.5" /></svg>
)
export const ShopIcon = (p) => (
  <svg {...base} {...p}><path d="M4 10l1.5-5h13L20 10M4 10v9h16v-9M4 10h16M10 19v-5h4v5" /></svg>
)
export const StarIcon = (p) => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" {...p}>
    <path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8L12 3z" />
  </svg>
)
export const StarOutlineIcon = (p) => (
  <svg {...base} {...p}>
    <path d="M12 3l2.7 5.7 6.3.8-4.6 4.3 1.2 6.2L12 17l-5.6 3 1.2-6.2L3 9.5l6.3-.8L12 3z" />
  </svg>
)
export const GlobeIcon = (p) => (
  <svg {...base} {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M3.5 12h17M12 3.5c2.4 2.4 3.6 5.2 3.6 8.5s-1.2 6.1-3.6 8.5c-2.4-2.4-3.6-5.2-3.6-8.5s1.2-6.1 3.6-8.5z" />
  </svg>
)
export const ArrowLeft = (p) => (
  <svg {...base} width={18} height={18} {...p}><path d="M19 12H5M11 6l-6 6 6 6" /></svg>
)
export const ChevronRight = (p) => (
  <svg {...base} width={20} height={20} {...p}><path d="M9 6l6 6-6 6" /></svg>
)
export const ChevronLeft = (p) => (
  <svg {...base} width={20} height={20} {...p}><path d="M15 6l-6 6 6 6" /></svg>
)
export const InstagramIcon = (p) => (
  <svg {...base} {...p}><rect x="4" y="4" width="16" height="16" rx="4.5" /><circle cx="12" cy="12" r="3.6" /><circle cx="16.8" cy="7.2" r=".6" fill="currentColor" /></svg>
)
export const FacebookIcon = (p) => (
  <svg {...base} {...p}><path d="M14 8h2.5V4.5H14A3.5 3.5 0 0010.5 8v2H8v3.5h2.5V20H14v-6.5h2.5L17 10h-3V8z" /></svg>
)
export const WhatsappIcon = (p) => (
  <svg {...base} {...p}><path d="M4.5 19.5l1.2-4A8 8 0 1112 20a8 8 0 01-3.8-1l-3.7.5z" /><path d="M9.2 8.8c.3 2.2 2.6 4.5 4.8 4.9l1.2-1.1-1.8-1-.8.6a3.4 3.4 0 01-1.9-1.9l.6-.8-1-1.8-1.1 1.1z" /></svg>
)
