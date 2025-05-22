// Import plugins
import dayjs from "dayjs"
import advanced from "dayjs/plugin/advancedFormat"
import customParseFormat from "dayjs/plugin/customParseFormat"
import localizedFormat from "dayjs/plugin/localizedFormat"
import relativeTime from "dayjs/plugin/relativeTime"
import timezone from "dayjs/plugin/timezone"
import utc from "dayjs/plugin/utc"
import weekday from "dayjs/plugin/weekday"

// Configure plugins
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(localizedFormat)
dayjs.extend(advanced)
dayjs.extend(customParseFormat)
dayjs.extend(weekday)
dayjs.extend(relativeTime)

export default dayjs
