export default function Logo() {
  return (
    <span className="logo">
      <svg viewBox="0 0 32 24" width="30" height="22" aria-hidden="true" focusable="false">
        <g fill="var(--mark)">
          <rect x="2" y="8" width="4" height="8" rx="2" />
          <rect x="9" y="3" width="4" height="18" rx="2" />
          <rect x="16" y="6" width="4" height="12" rx="2" />
          <rect x="23" y="10" width="4" height="5" rx="2" />
        </g>
      </svg>
      <span>VoiceBooks</span>
    </span>
  );
}
