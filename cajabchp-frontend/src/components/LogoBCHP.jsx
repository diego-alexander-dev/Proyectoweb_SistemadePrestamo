const BchpLogo = ({ size = 34, withText = true, textColor = '#fff' }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
    <svg width={size} height={size} viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <linearGradient id="bchpLogoGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff5a36" />
          <stop offset="1" stopColor="#c026a8" />
        </linearGradient>
      </defs>
      <g fill="none" stroke="url(#bchpLogoGrad)" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round">
        <path d="M34 28L10 60L34 92" />
        <path d="M86 28L110 60L86 92" />
      </g>
      <circle cx="60" cy="60" r="27" fill="url(#bchpLogoGrad)" />
      <text x="60" y="71" textAnchor="middle" fontSize="33" fontWeight="800" fill="#fff" fontFamily="Inter, sans-serif">
        B
      </text>
    </svg>
    {withText && (
      <div>
        <b style={{ fontSize: 19, letterSpacing: 1, color: textColor }}>BCHP</b>
        <div style={{ fontSize: 9, letterSpacing: 2, color: 'var(--bx-mu)', marginTop: 2 }}>
          CAJA · TESORERÍA
        </div>
      </div>
    )}
  </div>
);

export default BchpLogo;