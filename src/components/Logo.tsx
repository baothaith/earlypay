/**
 * EarlyPay Logo System
 *
 * Concept: "Window Capture"
 * Two vertical brackets represent the payment window (invoice lifecycle).
 * A forward-pointing chevron/arrow through the centre represents the supplier
 * capturing value early — before the window closes and the discount decays.
 *
 * The mark reads at favicon scale (16px) and scales to full hero lockup.
 * All paths use the existing Arc Dark accent palette: #acc6e9 → #cbd8f0.
 */

interface LogoMarkProps {
  /** px size of the bounding square. Default 28. */
  size?: number
  /** Override stroke/fill color. Defaults to the gradient. */
  color?: string
  className?: string
}

/** Just the icon/mark — bracket + arrow. */
export function LogoMark({ size = 28, color, className }: LogoMarkProps) {
  const gradId = 'ep-mark-g'
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={gradId} x1="2" y1="2" x2="30" y2="30" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor={color ?? '#cbd8f0'} />
          <stop offset="100%" stopColor={color ?? '#acc6e9'} />
        </linearGradient>
      </defs>
      {/* Left bracket */}
      <path
        d="M10 7 L7 7 L7 25 L10 25"
        stroke={color ? color : `url(#${gradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right bracket */}
      <path
        d="M22 7 L25 7 L25 25 L22 25"
        stroke={color ? color : `url(#${gradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow fill — inner chevron ghost */}
      <path
        d="M13 16 L18 11 L18 21 Z"
        fill={color ? color : `url(#${gradId})`}
        opacity="0.35"
      />
      {/* Arrow stroke — the forward-settlement chevron */}
      <path
        d="M18 11 L23 16 L18 21"
        stroke={color ? color : `url(#${gradId})`}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

interface LogoProps {
  /** 'mark' = icon only | 'wordmark' = text only | 'primary' = both (default) */
  variant?: 'primary' | 'mark' | 'wordmark'
  /** Overall height in px. Width auto-scales. Default 28. */
  height?: number
  className?: string
}

/**
 * Full EarlyPay logo — composable SVG lockup.
 * Renders inline — no network request, no flash of missing image.
 */
export function EarlyPayLogo({ variant = 'primary', height = 28, className }: LogoProps) {
  if (variant === 'mark') {
    return <LogoMark size={height} className={className} />
  }

  const fontSize = height * 0.58
  const markSize = height

  if (variant === 'wordmark') {
    return (
      <svg
        height={height}
        viewBox={`0 0 ${fontSize * 5.6} ${height}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className={className}
        aria-label="EarlyPay"
        role="img"
      >
        <defs>
          <linearGradient id="ep-wm-g" x1="0" y1="0" x2="100%" y2="0" gradientUnits="userSpaceOnUse">
            <stop offset="0%" stopColor="#f9faf3" />
            <stop offset="60%" stopColor="#e3ecf9" />
          </linearGradient>
        </defs>
        <text
          y={height * 0.76}
          fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
          fontWeight="700"
          fontSize={fontSize}
          letterSpacing="-0.03em"
          fill="#f9faf3"
        >
          Early
        </text>
        <text
          x={fontSize * 3.05}
          y={height * 0.76}
          fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
          fontWeight="700"
          fontSize={fontSize}
          letterSpacing="-0.03em"
          fill="#acc6e9"
        >
          Pay
        </text>
      </svg>
    )
  }

  // primary: mark + wordmark side-by-side
  const gap = height * 0.32
  const wordW = fontSize * 5.1
  const totalW = markSize + gap + wordW

  return (
    <svg
      width={totalW}
      height={height}
      viewBox={`0 0 ${totalW} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="EarlyPay"
      role="img"
    >
      <defs>
        <linearGradient id="ep-pm-g" x1="0" y1="0" x2={markSize} y2={markSize} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#cbd8f0" />
          <stop offset="100%" stopColor="#acc6e9" />
        </linearGradient>
      </defs>

      {/* ── Mark ── */}
      {/* Scale mark paths (originally drawn on 32×32) to markSize */}
      <g transform={`scale(${markSize / 32})`}>
        {/* Left bracket */}
        <path
          d="M10 7 L7 7 L7 25 L10 25"
          stroke="url(#ep-pm-g)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right bracket */}
        <path
          d="M22 7 L25 7 L25 25 L22 25"
          stroke="url(#ep-pm-g)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow fill */}
        <path d="M13 16 L18 11 L18 21 Z" fill="url(#ep-pm-g)" opacity="0.35" />
        {/* Arrow stroke */}
        <path
          d="M18 11 L23 16 L18 21"
          stroke="url(#ep-pm-g)"
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>

      {/* ── Wordmark ── */}
      <text
        x={markSize + gap}
        y={height * 0.76}
        fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        letterSpacing="-0.03em"
        fill="#f9faf3"
      >
        Early
      </text>
      <text
        x={markSize + gap + fontSize * 3.05}
        y={height * 0.76}
        fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
        fontWeight="700"
        fontSize={fontSize}
        letterSpacing="-0.03em"
        fill="#acc6e9"
      >
        Pay
      </text>
    </svg>
  )
}
