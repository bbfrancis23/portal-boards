import {useMutation, useQueryClient} from "@tanstack/react-query"

import {api} from "@/api/client"

// Deletes a portal and everything in it (a real delete for now; see "Open questions" in
// docs/PLAN.md about switching to a soft delete later).
export const useDeletePortal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async (portalId: number): Promise<void> => {
      const {response} = await api.DELETE("/api/portals/{portal_id}", {
        params: {path: {portal_id: portalId}},
      })
      // A successful delete returns no body (204), so check the status instead of the data.
      if (!response.ok) throw new Error(`Couldn't delete the portal (${response.status})`)
    },
    onSuccess: () => {
      queryClient.invalidateQueries({queryKey: ["portals"]})
      // If it was your default portal, the backend cleared that too.
      queryClient.invalidateQueries({queryKey: ["me"]})
    },
  })
}
