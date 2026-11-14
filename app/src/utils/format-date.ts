import { differenceInCalendarDays, startOfMonth, startOfWeek } from 'date-fns';
import { formatInTimeZone } from 'date-fns-tz';
import { i18n } from '@/lang';
import { getDateFNSLocale } from '@/utils/get-date-fns-locale';
import { localizedFormat } from '@/utils/localized-format';
import { localizedFormatDistance } from '@/utils/localized-format-distance';
import { localizedFormatDistanceStrict } from '@/utils/localized-format-distance-strict';
import { parseDate } from '@/utils/parse-date';

export interface FormatDateOptions {
	type: 'dateTime' | 'date' | 'time' | 'timestamp';
	/** 'short', 'long' or custom (https://www.unicode.org/reports/tr35/tr35-dates.html#Date_Field_Symbol_Table) */
	format?: string;
	relative?: boolean;
	strict?: boolean;
	round?: 'floor' | 'round' | 'ceil';
	suffix?: boolean;
	includeSeconds?: boolean;
	use24?: boolean;
	/** IANA timezone identifier (e.g., 'America/New_York', 'Europe/London', 'UTC'). If not provided, uses local timezone. */
	tz?: string;
}

/**
 * date-fns does not support the TR35 week-of-month symbol `W`, so it is replaced with the week number of the month before formatting.
 */
function replaceWeekOfMonth(date: Date, format: string): string {
	const locale = getDateFNSLocale();
	const daysFromFirstWeek = differenceInCalendarDays(
		startOfWeek(date, { locale }),
		startOfWeek(startOfMonth(date), { locale }),
	);
	const weekOfMonth = Math.floor(daysFromFirstWeek / 7) + 1;

	let result = '';
	let quoted = false;

	for (const char of format) {
		if (char === "'") quoted = !quoted;
		result += !quoted && char === 'W' ? String(weekOfMonth) : char;
	}

	return result;
}

/**
 * Formats a date string using the provided options
 *
 * @param value - The value to format
 * @param options - Configuration object for datetime formating options
 *
 * @example
 * ```js
 * formatDate({ type: 'dateTime', format: 'short', relative: false, strict: false, round: 'round', suffix: false, includeSeconds: false, use24: false });
 * // => "YYYY-MM-DD HH:mm"
 * ```
 */
export function formatDate(value: string, options: FormatDateOptions) {
	if (options.relative) {
		if (options.strict) {
			return localizedFormatDistanceStrict(parseDate(value, options.type), new Date(), {
				addSuffix: options.suffix,
				roundingMethod: options.round,
			});
		} else {
			return localizedFormatDistance(parseDate(value, options.type), new Date(), {
				addSuffix: options.suffix,
			});
		}
	}

	let timeFormat;

	if (options.use24) {
		timeFormat = options.includeSeconds ? 'date-fns_time_24hour' : 'date-fns_time_no_seconds_24hour';
	} else if (options.format === 'short') {
		timeFormat = options.includeSeconds ? 'date-fns_time_short_seconds' : 'date-fns_time_short';
	} else {
		timeFormat = options.includeSeconds ? 'date-fns_time' : 'date-fns_time_no_seconds';
	}

	let format;

	if (options?.format === undefined || options.format === 'long') {
		format = `${i18n.global.t('date-fns_date')} ${i18n.global.t(timeFormat)}`;
		if (options?.type === 'date') format = String(i18n.global.t('date-fns_date'));
		if (options?.type === 'time') format = String(i18n.global.t(timeFormat));
	} else if (options.format === 'short') {
		format = `${i18n.global.t('date-fns_date_short')} ${i18n.global.t(timeFormat)}`;
		if (options?.type === 'date') format = String(i18n.global.t('date-fns_date_short'));
		if (options?.type === 'time') format = String(i18n.global.t(timeFormat));
	} else {
		format = options.format;
	}

	const date = parseDate(value, options.type);
	const resolvedFormat = replaceWeekOfMonth(date, format);

	if (options.type === 'timestamp' && options.tz?.trim()) {
		return formatInTimeZone(date, options.tz, resolvedFormat, { locale: getDateFNSLocale() });
	}

	return localizedFormat(date, resolvedFormat);
}

/**
 * Returns a human-readable timezone label with its current offset, e.g. "Asia/Tokyo (GMT+9)"
 */
export function formatTimezoneLabel(tz: string, value: string): string {
	const date = parseDate(value, 'timestamp');
	const offset = formatInTimeZone(date, tz, 'O');
	return `${tz} (${offset})`;
}
