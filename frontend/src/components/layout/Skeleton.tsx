interface SkeletonProps {
  width: string | number
  height: string | number
}

// Encapsula a classe .skel já existente em styles/components.css (hoje sem
// nenhum uso em .tsx).
export function Skeleton({ width, height }: SkeletonProps) {
  return <span className="skel" style={{ display: 'block', width, height }} aria-hidden="true" />
}
