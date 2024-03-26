export async function fetchHTML(url: string): Promise<string> {
	const response = await fetch(url);
	const text = await response.text();

	if (!response.ok) {
		throw new Error(`Failed to fetch ${url}: ${response.status} ${response.statusText}\n${text}`);
	}

	return text;
}
