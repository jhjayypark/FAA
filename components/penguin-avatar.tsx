/**
 * Profile avatar: the FAA penguin mark (white front-facing face on dark
 * navy), matching app/favicon.ico. Same geometry as the favicon source.
 */
export function PenguinAvatar({ className }: { className?: string }) {
  const navy = "#182D4C";
  const white = "#FAFBFD";
  return (
    <svg
      viewBox="0 0 100 100"
      role="img"
      aria-hidden="true"
      className={className}
    >
      <circle cx="50" cy="50" r="50" fill={navy} />
      {/* head + cheeks silhouette */}
      <ellipse cx="50" cy="49.6" rx="30" ry="30" fill={white} />
      <ellipse cx="50" cy="70.8" rx="36" ry="21.4" fill={white} />
      {/* eyes */}
      <circle cx="38.5" cy="46" r="4.5" fill={navy} />
      <circle cx="61.5" cy="46" r="4.5" fill={navy} />
      {/* beak */}
      <ellipse cx="50" cy="55.5" rx="8.5" ry="3" fill={navy} />
      <polygon points="41.5,55.5 58.5,55.5 50,64" fill={navy} />
    </svg>
  );
}
