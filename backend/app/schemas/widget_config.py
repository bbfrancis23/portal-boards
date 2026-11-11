from typing import Any, Literal, Self

from pydantic import BaseModel, ConfigDict, Field, model_validator

from app.schemas.widget import WidgetType


class StrictConfig(BaseModel):
    model_config = ConfigDict(extra="forbid")


class WidgetConfig(StrictConfig):
    title: str


class Column(StrictConfig):
    key: str
    label: str
    type: Literal["text", "number", "currency", "date", "select"]
    options: list[str] | None = None


class Source(StrictConfig):
    """Source for a chart or stat widget's data."""

    widget: int
    aggregate: Literal["count", "sum", "avg"]
    field: str | None = None
    groupBy: str | None = None
    seriesBy: str | None = None
    dateField: str | None = None
    bucket: Literal["week", "month"] | None = None
    period: Literal["this_week", "this_month", "last_8_weeks", "last_6_months"] | None = None
    where: dict[str, Any] | None = None

    @model_validator(mode="after")
    def sum_and_avg_need_a_field(self) -> Self:
        if self.aggregate != "count" and self.field is None:
            raise ValueError(f"field is required when aggregate is {self.aggregate}")
        return self


class StatConfig(WidgetConfig):
    source: Source
    format: Literal["number", "currency"] | None = None
    compare: Literal["previous_period"] | None = None
    sparkline: bool | None = None


class ChartConfig(WidgetConfig):
    source: Source
    chartType: Literal["pie", "bar", "line", "area"]
    stacked: bool | None = None


class TableConfig(WidgetConfig):
    columns: list[Column]


class ScheduleConfig(WidgetConfig):
    dayStartHour: int = Field(ge=0, le=24)
    dayEndHour: int = Field(ge=0, le=24)
    # The entry form's fixed choices, so classes group the same way in charts.
    classTypes: list[str] = Field(min_length=1)

    @model_validator(mode="after")
    def day_starts_before_it_ends(self) -> Self:
        if self.dayStartHour >= self.dayEndHour:
            raise ValueError("dayStartHour must be before dayEndHour")
        return self


class FormConfig(WidgetConfig):
    pass


CONFIG_SCHEMAS: dict[WidgetType, type[WidgetConfig]] = {
    WidgetType.CHART: ChartConfig,
    WidgetType.FORM: FormConfig,
    WidgetType.SCHEDULE: ScheduleConfig,
    WidgetType.STAT: StatConfig,
    WidgetType.TABLE: TableConfig,
}
