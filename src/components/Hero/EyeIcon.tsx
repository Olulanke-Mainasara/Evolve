/** Empty SVG in stage pixel coordinates; drawEye() fills in the lids every frame. */
export function EyeIcon({ part }: { part: string }) {
  return (
    <svg className="eye" data-part={part} aria-hidden="true" focusable="false">
      <path />
      <path />
    </svg>
  )
}
