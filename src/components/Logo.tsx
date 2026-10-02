/**
 * EarlyPay Logo System
 *
 * Concept: "Window Capture"
 * Two vertical brackets represent the payment window (invoice lifecycle).
 * A forward-pointing chevron/arrow through the centre represents the supplier
 * capturing value early — before the window closes and the discount decays.
 *
 * The mark reads at favicon scale (16px) and scales to full hero lockup.
 * Text colours use CSS custom properties so Dark/Light mode works without
 * any JavaScript — the SVG inherits the live `--ink` and `--accent` values.
 */

interface LogoMarkProps {
  /** px size of the bounding square. Default 28. */
  size?: number
  /** Override stroke/fill color. Defaults to var(--accent). */
  color?: string
  className?: string
}

/** Just the icon/mark — bracket + arrow. */
export function LogoMark({ size = 28, color, className }: LogoMarkProps) {
  const gradId = 'ep-mark-g'
  // When a color override is given use it directly; otherwise reference the
  // CSS token so the mark inherits the theme without any JS state.
  const stroke = color ?? `url(#${gradId})`
  const fill   = color ?? `url(#${gradId})`
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
          {/* Use CSS vars so gradient adapts to dark/light */}
          <stop offset="0%" stopColor="var(--accent-hover)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>
      {/* Left bracket */}
      <path
        d="M10 7 L7 7 L7 25 L10 25"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Right bracket */}
      <path
        d="M22 7 L25 7 L25 25 L22 25"
        stroke={stroke}
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Arrow fill — inner chevron ghost */}
      <path
        d="M13 16 L18 11 L18 21 Z"
        fill={fill}
        opacity="0.35"
      />
      {/* Arrow stroke — the forward-settlement chevron */}
      <path
        d="M18 11 L23 16 L18 21"
        stroke={stroke}
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
 * Text uses `fill="var(--ink)"` and `fill="var(--accent)"` so it adapts
 * to the active theme without JS.
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
        <text
          y={height * 0.76}
          fontFamily="'Space Grotesk', 'DM Sans', sans-serif"
          fontWeight="700"
          fontSize={fontSize}
          letterSpacing="-0.03em"
          fill="var(--ink)"
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
          fill="var(--accent)"
        >
          Pay
        </text>
      </svg>
    )
  }

  // primary: mark + wordmark side-by-side
  const gap   = height * 0.32
  const wordW = fontSize * 5.1
  const totalW = markSize + gap + wordW
  const gradId = 'ep-pm-g'

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
        <linearGradient id={gradId} x1="0" y1="0" x2={markSize} y2={markSize} gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="var(--accent-hover)" />
          <stop offset="100%" stopColor="var(--accent)" />
        </linearGradient>
      </defs>

      {/* ── Mark ── */}
      {/* Scale mark paths (originally drawn on 32×32) to markSize */}
      <g transform={`scale(${markSize / 32})`}>
        {/* Left bracket */}
        <path
          d="M10 7 L7 7 L7 25 L10 25"
          stroke={`url(#${gradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Right bracket */}
        <path
          d="M22 7 L25 7 L25 25 L22 25"
          stroke={`url(#${gradId})`}
          strokeWidth="2.2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* Arrow fill */}
        <path d="M13 16 L18 11 L18 21 Z" fill={`url(#${gradId})`} opacity="0.35" />
        {/* Arrow stroke */}
        <path
          d="M18 11 L23 16 L18 21"
          stroke={`url(#${gradId})`}
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
        fill="var(--ink)"
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
        fill="var(--accent)"
      >
        Pay
      </text>
    </svg>
  )
}
