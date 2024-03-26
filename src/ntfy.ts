import {NTFY_BASE_URL} from "./env.js";

export enum NtfyPriority {
	MAX = 5,
	HIGH = 4,
	DEFAULT = 3,
	LOW = 2,
	MIN = 1,
}

export interface NtfyOptions {
	topic: string;
	message: string;
	priority?: NtfyPriority;
	title?: string;
	clickURL?: string;
	fileAttachmentURL?: string;
}

function utf8ToAscii(str: string): string {
	const enc = new TextEncoder();
	const u8s = enc.encode(str);

	return Array.from(u8s).map(v => String.fromCharCode(v)).join('');
}

export async function ntfy({ topic, priority, title, message, clickURL, fileAttachmentURL }: NtfyOptions): Promise<void> {
	const headers = new Headers();

	if (title) {
		headers.set('Title', utf8ToAscii(title));
	}

	if (priority) {
		headers.set('Priority', priority.toString());
	}

	if (clickURL) {
		headers.set('Click', clickURL);
	}

	if (fileAttachmentURL) {
		headers.set('Attach', fileAttachmentURL);
	}

	await fetch(`${NTFY_BASE_URL}${topic}`, {
		method: 'POST',
		body: message,
		headers
	});
}
