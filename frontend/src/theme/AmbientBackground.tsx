import type {CSSProperties, ReactNode} from "react"

import classes from "./ambient.module.css"

type AmbientBackgroundProps = {
  children?: ReactNode
  style?: CSSProperties
}

const AmbientBackground = ({children, style}: AmbientBackgroundProps) => {
  return (
    <div className={classes.ambient} style={style}>
      {children}
    </div>
  )
}

export default AmbientBackground
