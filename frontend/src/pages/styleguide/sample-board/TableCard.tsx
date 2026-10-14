import {Center, Table, Badge} from "@mantine/core"
import type {CardSpec} from "./SampleBoard"
import WidgetCard from "./WidgetCard"

const elements = [
  {name: "Logan Vantorr", membership: "Drop-in", status: "Active", joined: "2025-07-31"},
  {
    name: "Jessica Kessarin",
    membership: "Monthly unlimited",
    status: "Active",
    joined: "2026-06-30",
  },
  {name: "Francis Dolvane", membership: "Drop-in", status: "Active", joined: "2025-07-31"},
  {
    name: "Holly Ordo-Rhee",
    membership: "Monthly unlimited",
    status: "Active",
    joined: "2025-08-05",
  },
  {name: "Lyra Starn", membership: "10-class pack", status: "Active", joined: "2025-07-31"},
  {
    name: "Rhea Talvorn",
    membership: "Monthly unlimited",
    status: "Inactive",
    joined: "2025-04-03",
  },
  {name: "Jaxon Merrik", membership: "Drop-in", status: "Active", joined: "2025-02-06"},
  {name: "Lone Draycen", membership: "Drop-in", status: "Active", joined: "2020-12-31"},
  {name: "Bram Orrethi", membership: "10-class pack", status: "Inactive", joined: "2025-07-31"},
  {name: "Celia Vashkar", membership: "10-class pack", status: "Active", joined: "2024-05-23"},
]

// Dates are stored as ISO "YYYY-MM-DD" (the format the API sends) and built from their parts,
// so they're read as local calendar dates: no browser-specific parsing, and no UTC shift that
// would show them a day early in US time zones.
const formatDate = (isoDate: string) => {
  const [year, month, day] = isoDate.split("-").map(Number)
  return new Date(year, month - 1, day).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  })
}

const TableCard = ({title, span, minHeight}: CardSpec) => {
  const rows = elements.map((element) => (
    <Table.Tr key={element.name}>
      <Table.Td>{element.name}</Table.Td>
      <Table.Td>{element.membership}</Table.Td>
      <Table.Td>
        <Badge variant="light" color={element.status === "Active" ? "lime" : "slate"}>
          {element.status}
        </Badge>
      </Table.Td>
      <Table.Td>{formatDate(element.joined)}</Table.Td>
    </Table.Tr>
  ))

  return (
    <WidgetCard title={title} span={span} minHeight={minHeight}>
      <Center flex={1}>
        <Table.ScrollContainer minWidth={600} maxHeight={300}>
          <Table striped stickyHeader highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Name</Table.Th>
                <Table.Th>Membership</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Joined</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>{rows}</Table.Tbody>
          </Table>
        </Table.ScrollContainer>
      </Center>
    </WidgetCard>
  )
}

export default TableCard
