import {Link} from "react-router"

import classes from "./Logo.module.css"

// The "portal boards" wordmark: neon letters, and each "o" is a portal ring. Links home.
const Logo = () => {
  return (
    <Link to="/" className={classes.logo} aria-label="Portal Boards home">
      <span className={classes.letters} aria-hidden>
        p
      </span>
      <span className={classes.ring} aria-hidden />
      <span className={classes.letters} aria-hidden>
        rtal
      </span>
      <span className={`${classes.letters} ${classes.word}`} aria-hidden>
        b
      </span>
      <span className={classes.ring} aria-hidden />
      <span className={classes.letters} aria-hidden>
        ards
      </span>
    </Link>
  )
}

export default Logo
