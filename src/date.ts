import { parseDate } from 'chrono-node';
import dayjs, { Dayjs } from 'dayjs';

export function parseFacebookDate(dateString: string): Dayjs {
	const extractedNumbers = dateString.match(/\d+/);
	const now = dayjs();

	if (dateString.match(/^\d+h$/)) {
		if (!extractedNumbers || !extractedNumbers[0]) {
			throw new Error('Could not parse time from string: ' + dateString);
		}

		const parsedHours = extractedNumbers[0];

		return now.subtract(Number(parsedHours), 'hour');
	}

	if (dateString.match(/^\d+m$/)) {
		if (!extractedNumbers || !extractedNumbers[0]) {
			throw new Error('Could not parse time from string: ' + dateString);
		}

		const parsedMinutes = extractedNumbers[0];

		return now.subtract(Number(parsedMinutes), 'minute');
	}

	if (dateString.match(/^\d+d$/)) {
		if (!extractedNumbers || !extractedNumbers[0]) {
			throw new Error('Could not parse time from string: ' + dateString);
		}

		const parsedDays = extractedNumbers[0];

		return now.subtract(Number(parsedDays), 'day');
	}

	return dayjs(parseDate(dateString, { timezone: "Europe/Prague" }));
}
