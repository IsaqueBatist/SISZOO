interface SkeletonProps {
  width: string | number
  height: string | number
}

export function Skeleton({ width, height }: SkeletonProps) {
  return <span className="skel" style={{ display: 'block', width, height }} aria-hidden="true" />
}
