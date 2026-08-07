from datetime import datetime

from backend.services.errors import BusinessRuleError


def month_bounds(month: str):
    try:
        parsed = datetime.strptime(month, "%Y-%m")
    except ValueError as exc:
        raise BusinessRuleError("month must use the YYYY-MM format") from exc

    if parsed.month == 12:
        next_month = datetime(parsed.year + 1, 1, 1)
    else:
        next_month = datetime(parsed.year, parsed.month + 1, 1)

    return datetime(parsed.year, parsed.month, 1), next_month
