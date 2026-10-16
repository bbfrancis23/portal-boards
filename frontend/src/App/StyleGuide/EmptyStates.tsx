import {Card, SimpleGrid, Text} from "@mantine/core"

import EmptyState from "@/theme/EmptyState"

const EmptyStates = () => {
  return (
    <SimpleGrid cols={{base: 1, sm: 3}} spacing="lg">
      <Card>
        <Text fw={600}>Members</Text>
        <EmptyState message="No members yet" action={{label: "Add member"}} />
      </Card>
      <Card>
        <Text fw={600}>Sales</Text>
        <EmptyState message="No sales this month" />
      </Card>
      <Card>
        <Text fw={600}>Weekly class attendance</Text>
        <EmptyState message="This chart fills in as classes are booked" />
      </Card>
    </SimpleGrid>
  )
}

export default EmptyStates
