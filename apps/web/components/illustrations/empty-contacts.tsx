export function EmptyContactsIllustration({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 120 120"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <circle cx="60" cy="60" r="50" fill="url(#paint0_radial)" />
      <path
        d="M60 38C51.16 38 44 45.16 44 54C44 62.84 51.16 70 60 70C68.84 70 76 62.84 76 54C76 45.16 68.84 38 60 38ZM60 66C53.38 66 48 60.62 48 54C48 47.38 53.38 42 60 42C66.62 42 72 47.38 72 54C72 60.62 66.62 66 60 66Z"
        fill="#6366F1"
      />
      <path
        d="M60 74C47.3 74 36 80.6 36 89V94H84V89C84 80.6 72.7 74 60 74ZM40 90C40.8 84.4 49.4 80 60 80C70.6 80 79.2 84.4 80 90H40Z"
        fill="#6366F1"
      />
      <circle cx="88" cy="38" r="10" stroke="#3F3F46" strokeWidth="2" />
      <path d="M83 38H93M88 33V43" stroke="#3F3F46" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <radialGradient id="paint0_radial" cx="0" cy="0" r="1" gradientUnits="userSpaceOnUse" gradientTransform="translate(60 60) rotate(90) scale(50)">
          <stop stopColor="#6366F1" stopOpacity="0.15" />
          <stop offset="1" stopColor="#6366F1" stopOpacity="0" />
        </radialGradient>
      </defs>
    </svg>
  );
}
