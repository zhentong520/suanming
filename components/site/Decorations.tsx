export function InkWashBg() {
  return (
    <div className="ink-wash-bg" aria-hidden>
      <svg className="ink-blob ink-blob-1" viewBox="0 0 400 400" fill="none">
        <ellipse cx="200" cy="200" rx="180" ry="160" fill="url(#inkGrad1)" />
        <defs>
          <radialGradient id="inkGrad1">
            <stop offset="0%" stopColor="#2c2416" stopOpacity="0.12" />
            <stop offset="70%" stopColor="#2c2416" stopOpacity="0.04" />
            <stop offset="100%" stopColor="#2c2416" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <svg className="ink-blob ink-blob-2" viewBox="0 0 300 300" fill="none">
        <ellipse cx="150" cy="150" rx="140" ry="120" fill="url(#inkGrad2)" />
        <defs>
          <radialGradient id="inkGrad2">
            <stop offset="0%" stopColor="#8b2500" stopOpacity="0.08" />
            <stop offset="100%" stopColor="#8b2500" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
      <svg className="ink-blob ink-blob-3" viewBox="0 0 250 250" fill="none">
        <ellipse cx="125" cy="125" rx="110" ry="100" fill="url(#inkGrad3)" />
        <defs>
          <radialGradient id="inkGrad3">
            <stop offset="0%" stopColor="#3d5a4c" stopOpacity="0.1" />
            <stop offset="100%" stopColor="#3d5a4c" stopOpacity="0" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  );
}

export function CloudPattern({ className = "" }: { className?: string }) {
  return (
    <svg className={`cloud-pattern ${className}`} viewBox="0 0 120 24" preserveAspectRatio="none" aria-hidden>
      <path
        d="M0 12c8-6 16-6 24 0s16 6 24 0 16-6 24 0 16 6 24 0 16-6 24 0 16 6 24 0"
        fill="none"
        stroke="currentColor"
        strokeWidth="0.5"
        opacity="0.35"
      />
    </svg>
  );
}

export function SealStamp({ text = "道" }: { text?: string }) {
  return (
    <div className="seal-stamp" aria-hidden>
      <span>{text}</span>
    </div>
  );
}

export function BambooDivider() {
  return (
    <div className="bamboo-divider" aria-hidden>
      <span />
      <span />
      <span />
    </div>
  );
}
