const ICONS = {
  medical: <><path d="M12 4v16M4 12h16" /></>,
  patient: <><circle cx="12" cy="8" r="3.5" /><path d="M5 20v-1a7 7 0 0 1 14 0v1" /></>,
  doctor: <><circle cx="9" cy="7" r="3" /><path d="M3.5 20v-1a5.5 5.5 0 0 1 11 0v1M18 8v6M15 11h6" /></>,
  staff: <><rect x="3" y="5" width="18" height="14" rx="2" /><circle cx="9" cy="11" r="2" /><path d="M6 16c.7-1.3 1.7-2 3-2s2.3.7 3 2m3-5h3m-3 3h3" /></>,
  language: <><circle cx="12" cy="12" r="9" /><path d="M3 12h18M12 3a14 14 0 0 1 0 18m0-18a14 14 0 0 0 0 18" /></>,
  bell: <><path d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4" /></>,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2m0 16v2M4.93 4.93l1.42 1.42m11.3 11.3 1.42 1.42M2 12h2m16 0h2M4.93 19.07l1.42-1.42m11.3-11.3 1.42-1.42" /></>,
  moon: <><path d="M20.5 14A8.5 8.5 0 0 1 10 3.5 8.5 8.5 0 1 0 20.5 14Z" /></>,
  calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18" /></>,
  clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
  users: <><path d="M16 20v-1a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v1M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm6-7a4 4 0 0 1 0 7m2 4a4 4 0 0 1 3 4v1" /></>,
  book: <><path d="M5 4.5A2.5 2.5 0 0 1 7.5 2H20v18H7.5A2.5 2.5 0 0 0 5 22zM5 4.5v15A2.5 2.5 0 0 1 7.5 17H20" /></>,
  chat: <><path d="M20 11.5a7.5 7.5 0 0 1-8 7.5 8 8 0 0 1-3.5-.8L4 20l1.3-3.5A7.1 7.1 0 0 1 4 12c0-4.1 3.6-7.5 8-7.5s8 3.1 8 7Z" /></>,
  mic: <><rect x="9" y="3" width="6" height="12" rx="3" /><path d="M5 11v1a7 7 0 0 0 14 0v-1m-7 8v3m-4 0h8" /></>,
  micOff: <><path d="M9 9v3a3 3 0 0 0 5.1 2.1M15 9V6a3 3 0 0 0-5.8-1M5 11v1a7 7 0 0 0 11.5 5.4M19 11v1a7 7 0 0 1-.4 2.3M12 19v3m-4 0h8M3 3l18 18" /></>,
  camera: <><path d="M14 5h-3l-2 2H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V9a2 2 0 0 0-2-2h-1z" /><circle cx="12" cy="13" r="3" /></>,
  cameraOff: <><path d="m3 3 18 18M10 7l1-2h3l2 2h3a2 2 0 0 1 2 2v8M6 7H5a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h12" /><path d="M9 10a3 3 0 0 0 4 4" /></>,
  volume: <><path d="M4 10v4h4l5 4V6l-5 4zM17 9a5 5 0 0 1 0 6m2-9a9 9 0 0 1 0 12" /></>,
  refresh: <><path d="M20 7v5h-5M4 17v-5h5" /><path d="M5.5 9A7 7 0 0 1 18 6l2 2M4 16l2 2a7 7 0 0 0 12.5-3" /></>,
  video: <><rect x="3" y="6" width="13" height="12" rx="2" /><path d="m16 10 5-3v10l-5-3z" /></>,
  document: <><path d="M6 3h8l4 4v14H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Z" /><path d="M14 3v5h5M8 13h8m-8 4h8" /></>,
};

export default function MedicalIcon({ name, size = 18, className = '' }) {
  return (
    <svg
      className={`medical-icon ${className}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICONS[name] || ICONS.medical}
    </svg>
  );
}
