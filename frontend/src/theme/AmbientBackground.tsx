import type {CSSProperties, ReactNode} from "react"

import classes from "./ambient.module.css"

type AmbientBackgroundProps = {
  children?: ReactNode
  style?: CSSProperties
  /** Fill the whole screen behind the app (rendered once, in main.tsx). */
  fixed?: boolean
}

const AmbientBackground = ({children, style, fixed = false}: AmbientBackgroundProps) => {
  const className = fixed ? `${classes.ambient} ${classes.fixed}` : classes.ambient
  return (
    <div className={className} style={style} aria-hidden={fixed || undefined}>
      {children}
    </div>
  )
}

export default AmbientBackground
