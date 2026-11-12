import {useMutation, useQueryClient} from "@tanstack/react-query"
import type {User} from "@/hooks/useCurrentUser"
import {api} from "@/api/client"
import {notifications} from "@mantine/notifications"

export const useSetDefaultPortal = () => {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: async ({portalId}: {portalId: number}): Promise<User> => {
      const {data, response} = await api.PUT("/api/users/me/default-portal", {
        body: {default_portal_id: portalId},
      })
      if (!data) throw new Error(`Couldn't update the user home portal (${response.status})`)
      return data
    },
    onSuccess: (user) => queryClient.setQueryData(["me"], user),
    onError: () => {
      notifications.show({
        color: "danger",
        title: "Couldn't set your home portal",
        message: "Please try again.",
      })
    },
  })
}
