import {NumberInput, SegmentedControl, Select, TextInput} from "@mantine/core"
import {DateInput} from "@mantine/dates"
import type {GetInputPropsReturnType} from "@mantine/form"

import type {Column} from "./table-types"
import type {ReactElement} from "react"

type ColumnInputProps = {column: Column; inputProps: GetInputPropsReturnType}

const ColumnInput = ({column, inputProps}: ColumnInputProps): ReactElement => {
  switch (column.type) {
    case "text":
      return <TextInput placeholder={column.label} aria-label={column.label} {...inputProps} />
    case "select":
      if (column.options?.length && column.options.length > 2)
        return (
          <Select
            placeholder={column.label}
            aria-label={column.label}
            data={column.options}
            {...inputProps}
          />
        )
      return (
        <SegmentedControl
          aria-label={column.label}
          data={column.options ?? []}
          fullWidth
          {...inputProps}
        />
      )
    case "date":
      return <DateInput {...inputProps} placeholder={column.label} aria-label={column.label} />
    case "currency":
      return (
        <NumberInput
          placeholder={column.label}
          aria-label={column.label}
          prefix="$"
          {...inputProps}
        />
      )
    case "number":
      return <NumberInput placeholder={column.label} aria-label={column.label} {...inputProps} />
  }
}

export default ColumnInput
