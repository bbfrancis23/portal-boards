import {Stack, Title} from "@mantine/core"
import type {ReactNode} from "react"

export type SectionProps = {
  label: string
  children: ReactNode
}

const Section = ({label, children}: SectionProps) => {
  return (
    <section>
      <Stack mt="xl">
        <Title order={2} data-toc>
          {label}
        </Title>
        {children}
      </Stack>
    </section>
  )
}

export default Section
