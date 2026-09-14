/** Empty SVG in stage pixel coordinates; drawEye() fills in the lids every frame. */
export function EyeIcon({ part }: { part: string }) {
  return (
    <svg
      data-part={part}
      aria-hidden="true"
      focusable="false"
      className="pointer-events-none absolute top-0 left-0 size-full overflow-visible fill-none stroke-current [stroke-linecap:round] [stroke-linejoin:round]"
    >
      <path />
      <path />
    </svg>
  )
}
