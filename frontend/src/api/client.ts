import createClient from "openapi-fetch"

import type {paths} from "./schema"

// Pages anyone can see; a 401 on these is expected (you're just not logged in), not a redirect.
const PUBLIC_PATHS = ["/", "/log-in"]

// Every API call goes through this typed client. `credentials: "include"` sends the
// pb_session cookie. No baseUrl: paths start with /api, which Vite proxies to the backend.
export const api = createClient<paths>({credentials: "include"})

// Logged out (or the session expired) while on a private page: go log in.
api.use({
  onResponse({response}) {
    if (response.status === 401 && !PUBLIC_PATHS.includes(window.location.pathname)) {
      window.location.assign("/log-in")
    }
    return response
  },
})
