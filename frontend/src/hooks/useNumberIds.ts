import {useParams} from "react-router"

// The URL's ids (from routes like /portals/:portalId/boards/:boardId) as numbers, so pages
// don't each write Number(...). An id that isn't in the URL is undefined, not NaN or 0.
//
//   const {portalId, boardId} = useNumberIds()   // e.g. 3 and 7 on /portals/3/boards/7
export const useNumberIds = (): Partial<Record<string, number>> => {
  const params = useParams()
  return Object.fromEntries(
    Object.entries(params).map(([name, value]) => [
      name,
      value === undefined ? undefined : Number(value),
    ]),
  )
}
