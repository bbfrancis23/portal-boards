import {Text, type TextProps} from "@mantine/core"
import type {ReactNode} from "react"

import classes from "./neon.module.css"

type NeonTextProps = TextProps & {
  children: ReactNode
}

// Neon-tube text for the logo and big metric numbers only (LOOK.md).
const NeonText = ({className, children, ...props}: NeonTextProps) => {
  return (
    <Text {...props} className={className ? `${classes.neon} ${className}` : classes.neon}>
      {children}
    </Text>
  )
}

export default NeonText
