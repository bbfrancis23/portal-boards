import random
from datetime import date, datetime, time, timedelta
from typing import Any

from app.templates.types import BoardSpec, SampleData, Template, WidgetSpec

MEMBERSHIPS = ["Monthly unlimited", "10-class pack", "Drop-in"]
CLASS_TYPES = ["Yoga", "Pilates", "Upper body toning", "Lower body toning"]
REVENUE_STREAMS = ["Membership", "Class pack", "Drop-in", "Spa"]

FIRST_NAMES = [
    "Ava",
    "Liam",
    "Maya",
    "Noah",
    "Sofia",
    "Ethan",
    "Isla",
    "Lucas",
    "Chloe",
    "Mason",
    "Zoe",
    "Elijah",
    "Nora",
    "Caleb",
    "Lily",
    "Owen",
    "Grace",
    "Leo",
    "Hazel",
    "Jonah",
]
LAST_NAMES = [
    "Bennett",
    "Garcia",
    "Nguyen",
    "Patel",
    "Kim",
    "Brooks",
    "Rivera",
    "Chen",
    "Foster",
    "Reyes",
    "Hughes",
    "Morales",
    "Price",
    "Shah",
    "Ward",
    "Lopez",
    "Ellis",
    "Tanaka",
    "Cole",
    "Silva",
]

# The weekly class timetable: weekday (0 = Monday) -> (start time, class type). 30 classes.
WEEKLY_CLASSES = {
    0: [
        ("06:30", "Yoga"),
        ("09:30", "Pilates"),
        ("12:00", "Upper body toning"),
        ("17:30", "Lower body toning"),
        ("18:45", "Yoga"),
    ],
    1: [
        ("06:30", "Pilates"),
        ("12:00", "Yoga"),
        ("17:30", "Upper body toning"),
        ("18:45", "Pilates"),
    ],
    2: [
        ("06:30", "Yoga"),
        ("09:30", "Lower body toning"),
        ("12:00", "Pilates"),
        ("17:30", "Yoga"),
        ("18:45", "Upper body toning"),
    ],
    3: [
        ("06:30", "Lower body toning"),
        ("09:30", "Upper body toning"),
        ("12:00", "Yoga"),
        ("17:30", "Pilates"),
        ("18:45", "Yoga"),
    ],
    4: [("06:30", "Yoga"), ("09:30", "Pilates"), ("12:00", "Lower body toning"), ("17:30", "Yoga")],
    5: [
        ("08:00", "Yoga"),
        ("09:15", "Pilates"),
        ("10:30", "Upper body toning"),
        ("11:45", "Lower body toning"),
    ],
    6: [("09:00", "Yoga"), ("10:15", "Pilates"), ("16:00", "Yoga")],
}
INSTRUCTORS = {
    "Yoga": ["Priya Desai", "Elena Ruiz"],
    "Pilates": ["Marcus Lee"],
    "Upper body toning": ["Jada Brooks"],
    "Lower body toning": ["Jada Brooks", "Marcus Lee"],
}
CLASS_CAPACITY = {"Yoga": 16, "Pilates": 16, "Upper body toning": 12, "Lower body toning": 12}
CLASS_MINUTES = {"Yoga": 60, "Pilates": 60, "Upper body toning": 45, "Lower body toning": 45}

# Spa services: (name, minutes, price in dollars).
SPA_SERVICES = [
    ("Swedish massage", 60, 110),
    ("Deep tissue massage", 60, 125),
    ("Signature facial", 50, 95),
    ("Hot stone massage", 75, 140),
    ("Body wrap", 60, 120),
]
THERAPISTS = ["Nina Shah", "Sam Ortiz"]

PRICES = {"Monthly unlimited": 149, "10-class pack": 200, "Drop-in": 25}
SPA_MEMBER_DISCOUNT = 0.15


# Input widgets: the only widgets that hold data rows.

MEMBERS = WidgetSpec(
    key="members",
    type="table",
    x=0,
    y=0,
    w=8,
    h=10,
    config={
        "title": "Members",
        "columns": [
            {"key": "name", "label": "Name", "type": "text"},
            {"key": "membership", "label": "Membership", "type": "select", "options": MEMBERSHIPS},
            {
                "key": "status",
                "label": "Status",
                "type": "select",
                "options": ["active", "inactive"],
            },
            {"key": "joined", "label": "Joined", "type": "date"},
        ],
    },
)

SCHEDULE = WidgetSpec(
    key="schedule",
    type="schedule",
    x=0,
    y=0,
    w=12,
    h=12,
    config={"title": "Week schedule", "dayStartHour": 6, "dayEndHour": 21},
)

SALES = WidgetSpec(
    key="sales",
    type="table",
    x=0,
    y=6,
    w=12,
    h=10,
    config={
        "title": "Sales",
        "columns": [
            {"key": "date", "label": "Date", "type": "date"},
            {"key": "member", "label": "Member", "type": "text"},
            {"key": "item", "label": "Item", "type": "text"},
            {
                "key": "stream",
                "label": "Revenue stream",
                "type": "select",
                "options": REVENUE_STREAMS,
            },
            {"key": "amount", "label": "Amount", "type": "currency"},
        ],
    },
)

# Output widgets: charts and stats hold no rows; their "source" is a query over an input widget.

OVERVIEW = BoardSpec(
    label="Overview",
    widgets=[
        WidgetSpec(
            key="active_members",
            type="stat",
            x=0,
            y=0,
            w=3,
            h=2,
            config={
                "title": "Active members",
                "format": "number",
                "source": {
                    "widget": "members",
                    "aggregate": "count",
                    "where": {"status": "active"},
                },
            },
        ),
        WidgetSpec(
            key="revenue_this_month",
            type="stat",
            x=3,
            y=0,
            w=3,
            h=2,
            config={
                "title": "Revenue this month",
                "format": "currency",
                "compare": "previous_period",
                "source": {
                    "widget": "sales",
                    "aggregate": "sum",
                    "field": "amount",
                    "dateField": "date",
                    "period": "this_month",
                },
            },
        ),
        WidgetSpec(
            key="classes_this_week",
            type="stat",
            x=6,
            y=0,
            w=3,
            h=2,
            config={
                "title": "Classes this week",
                "format": "number",
                "source": {
                    "widget": "schedule",
                    "aggregate": "count",
                    "where": {"kind": "class"},
                    "dateField": "start",
                    "period": "this_week",
                },
            },
        ),
        WidgetSpec(
            key="spa_bookings_this_week",
            type="stat",
            x=9,
            y=0,
            w=3,
            h=2,
            config={
                "title": "Spa bookings this week",
                "format": "number",
                "source": {
                    "widget": "schedule",
                    "aggregate": "count",
                    "where": {"kind": "appointment"},
                    "dateField": "start",
                    "period": "this_week",
                },
            },
        ),
        WidgetSpec(
            key="attendance_trend",
            type="chart",
            x=0,
            y=2,
            w=12,
            h=6,
            config={
                "title": "Weekly class attendance",
                "chartType": "line",
                "source": {
                    "widget": "schedule",
                    "aggregate": "sum",
                    "field": "booked",
                    "where": {"kind": "class"},
                    "dateField": "start",
                    "bucket": "week",
                    "period": "last_8_weeks",
                },
            },
        ),
    ],
)

SCHEDULE_BOARD = BoardSpec(
    label="Schedule",
    persona_id="secretary",
    widgets=[
        SCHEDULE,
        WidgetSpec(
            key="attendance_by_class",
            type="chart",
            x=0,
            y=12,
            w=12,
            h=6,
            config={
                "title": "Average attendance by class type",
                "chartType": "bar",
                "source": {
                    "widget": "schedule",
                    "aggregate": "avg",
                    "field": "booked",
                    "where": {"kind": "class"},
                    "groupBy": "classType",
                },
            },
        ),
    ],
)

MEMBERS_BOARD = BoardSpec(
    label="Members",
    persona_id="yoga-instructor",
    widgets=[
        MEMBERS,
        WidgetSpec(
            key="membership_mix",
            type="chart",
            x=8,
            y=0,
            w=4,
            h=10,
            config={
                "title": "Membership mix",
                "chartType": "pie",
                "source": {
                    "widget": "members",
                    "aggregate": "count",
                    "where": {"status": "active"},
                    "groupBy": "membership",
                },
            },
        ),
    ],
)

REVENUE_BOARD = BoardSpec(
    label="Revenue",
    persona_id="accountant",
    widgets=[
        WidgetSpec(
            key="revenue_by_month",
            type="chart",
            x=0,
            y=0,
            w=8,
            h=6,
            config={
                "title": "Revenue by month",
                "chartType": "bar",
                "stacked": True,
                "source": {
                    "widget": "sales",
                    "aggregate": "sum",
                    "field": "amount",
                    "dateField": "date",
                    "bucket": "month",
                    "period": "last_6_months",
                    "seriesBy": "stream",
                },
            },
        ),
        WidgetSpec(
            key="spa_revenue_this_month",
            type="stat",
            x=8,
            y=0,
            w=4,
            h=3,
            config={
                "title": "Spa revenue this month",
                "format": "currency",
                "source": {
                    "widget": "sales",
                    "aggregate": "sum",
                    "field": "amount",
                    "where": {"stream": "Spa"},
                    "dateField": "date",
                    "period": "this_month",
                },
            },
        ),
        SALES,
    ],
)


def _members(rng: random.Random, today: date) -> list[dict[str, Any]]:
    """About 100 members with a realistic mix of memberships."""
    all_names = [f"{first} {last}" for first in FIRST_NAMES for last in LAST_NAMES]
    members = []
    for name in rng.sample(all_names, 100):
        joined = today - timedelta(days=rng.randint(14, 730))
        members.append(
            {
                "name": name,
                "membership": rng.choices(MEMBERSHIPS, weights=[45, 30, 25])[0],
                "status": "active" if rng.random() < 0.85 else "inactive",
                "joined": joined.isoformat(),
            }
        )
    return members


def _schedule(
    rng: random.Random, today: date, members: list[dict[str, Any]]
) -> list[dict[str, Any]]:
    """Classes and spa appointments for the past 8 weeks and this week."""
    clients = [member["name"] for member in members if member["status"] == "active"]
    this_monday = today - timedelta(days=today.weekday())
    rows = []
    for week in range(-8, 1):
        monday = this_monday + timedelta(weeks=week)
        for weekday, classes in WEEKLY_CLASSES.items():
            day = monday + timedelta(days=weekday)
            for start_time, class_type in classes:
                start = datetime.combine(day, time.fromisoformat(start_time))
                capacity = CLASS_CAPACITY[class_type]
                booked = rng.randint(capacity // 2, capacity)
                if day > today:
                    booked = rng.randint(0, booked)  # upcoming classes are still filling up
                instructors = INSTRUCTORS[class_type]
                rows.append(
                    {
                        "title": class_type,
                        "kind": "class",
                        "classType": class_type,
                        "staff": instructors[weekday % len(instructors)],
                        "start": start.isoformat(timespec="minutes"),
                        "end": (start + timedelta(minutes=CLASS_MINUTES[class_type])).isoformat(
                            timespec="minutes"
                        ),
                        "capacity": capacity,
                        "booked": booked,
                    }
                )
            if weekday == 6:
                continue  # the spa is closed on Sundays
            for _ in range(rng.randint(2, 4)):
                service, minutes, _price = rng.choice(SPA_SERVICES)
                start = datetime.combine(day, time(rng.randint(10, 18)))
                rows.append(
                    {
                        "title": service,
                        "kind": "appointment",
                        "service": service,
                        "staff": rng.choice(THERAPISTS),
                        "client": rng.choice(clients),
                        "start": start.isoformat(timespec="minutes"),
                        "end": (start + timedelta(minutes=minutes)).isoformat(timespec="minutes"),
                    }
                )
    return rows


def _month_starts(first: date, today: date) -> list[date]:
    """The first day of each month from `first` up to today."""
    months = []
    month = first
    while month <= today:
        months.append(month)
        month = (month + timedelta(days=32)).replace(day=1)
    return months


def _sales(rng: random.Random, today: date, members: list[dict[str, Any]]) -> list[dict[str, Any]]:
    """Sales for this month and the previous five, across all four revenue streams."""
    first = today.replace(day=1)
    for _ in range(5):
        first = (first - timedelta(days=1)).replace(day=1)

    rows = []

    def sale(day: date, member: str, item: str, stream: str, amount: float) -> None:
        rows.append(
            {
                "date": day.isoformat(),
                "member": member,
                "item": item,
                "stream": stream,
                "amount": amount,
            }
        )

    active = [member for member in members if member["status"] == "active"]

    # Memberships, class packs and drop-ins.
    for member in active:
        name = member["name"]
        membership = member["membership"]
        joined = date.fromisoformat(member["joined"])
        if membership == "Monthly unlimited":
            for month in _month_starts(first, today):
                billed = month.replace(day=min(joined.day, 28))
                if joined <= billed <= today:
                    sale(billed, name, membership, "Membership", PRICES[membership])
        else:
            stream = "Class pack" if membership == "10-class pack" else "Drop-in"
            low, high = (35, 49) if membership == "10-class pack" else (10, 30)
            day = max(first, joined) + timedelta(days=rng.randint(0, low))
            while day <= today:
                sale(day, name, membership, stream, PRICES[membership])
                day += timedelta(days=rng.randint(low, high))

    # Spa services, with the discount for monthly members.
    day = first
    while day <= today:
        if day.weekday() != 6:  # the spa is closed on Sundays
            for _ in range(rng.randint(1, 4)):
                service, _minutes, price = rng.choice(SPA_SERVICES)
                client = rng.choice(active)
                if client["membership"] == "Monthly unlimited":
                    price = round(price * (1 - SPA_MEMBER_DISCOUNT), 2)
                sale(day, client["name"], service, "Spa", price)
        day += timedelta(days=1)

    rows.sort(key=lambda row: row["date"])
    return rows


def generate_sample_data(today: date) -> SampleData:
    """Sample rows for each input widget, generated relative to today."""
    rng = random.Random(42)
    members = _members(rng, today)
    return {
        "members": members,
        "schedule": _schedule(rng, today, members),
        "sales": _sales(rng, today, members),
    }


WELLNESS_STUDIO = Template(
    id="wellness-studio",
    name="Spa & wellness studio",
    description="Classes, memberships and spa services for a spa and wellness studio.",
    default_portal_name="Atrium Spa and Wellness",
    persona_id="studio-manager",
    boards=[OVERVIEW, SCHEDULE_BOARD, MEMBERS_BOARD, REVENUE_BOARD],
    sample_data=generate_sample_data,
)
