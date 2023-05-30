import {Browser, chromium} from 'playwright';
import Tesseract from 'tesseract.js';
import dayjs from 'dayjs';
import {scheduleJob, Job} from 'node-schedule';

import dayjsPluginUTC from 'dayjs/plugin/utc.js';
import dayjsPluginTimezone from 'dayjs/plugin/timezone.js';
import {parseFacebookDate} from "./date.js";
import {ntfy, NtfyPriority} from "./ntfy.js";

dayjs.extend(dayjsPluginUTC);
dayjs.extend(dayjsPluginTimezone);

async function checkForPoutnik(browser: Browser, todaysPosts: Set<string>) {
	const context = await browser.newContext({ viewport: { width: 1080, height: 1920 }, locale: 'en-US' });
	const page = await context.newPage();

	await page.goto('https://www.facebook.com/kurniksopahospoda');

	await page.getByLabel('Decline optional cookies').first().click();
	await page.getByLabel('Close').click();

	await page.waitForSelector('[role="article"]', { state: 'attached' });

	const posts = await page.getByRole('article').all();

	if (posts.length === 0) {
		await ntfy({ topic: 'kurnik-sopa-poutnik', priority: NtfyPriority.MAX, title: `Chyba monitorinug`, message: `Nebyl zaznamenán žádný příspěvěk, to by se nemělo stávat` })
		return page.close();
	}

	for (const post of posts) {
		const rawPostDate = await post.locator('[role=link]:below(h2)').filter({ hasNot: page.getByRole('img') }).innerText();
		const postDate = parseFacebookDate(rawPostDate);

		if (postDate.isBefore(dayjs(), 'day')) {
			continue;
		}

		const rawPostMessage = await post.locator('[data-ad-preview="message"]').first().innerText();

		if (todaysPosts.has(rawPostMessage.trim())) {
			continue;
		} else {
			todaysPosts.add(rawPostMessage.trim());
		}

		const postImage = await post.locator('a:below([data-ad-preview="message"])').first();
		const postImageLink = await postImage.getAttribute('href');
		const postImageUrl = await postImage.getByRole('img').first().getAttribute('src');
		const postImageText = await Tesseract.recognize(postImageUrl!, 'ces');

		if (!postImageText.data.text.toLowerCase().includes(`poutník`)) {
			console.warn(`Found post with no Poutník`);
			continue;
		}

		console.log(`Found Poutník post: ${rawPostMessage}`);
		await ntfy({ topic: 'kurnik-sopa-poutnik', priority: NtfyPriority.HIGH, title: `Poutník je v Kurnik Šopě!`, message: rawPostMessage, clickURL: postImageLink!, fileAttachmentURL: postImageUrl! });
	}

	await page.close();
}

let browser: Browser | undefined;
async function main() {
	const CRON_SCHEDULE = process.env.CRON_SCHEDULE ?? '0 * * * *'
	const todaysPosts = new Set<string>();
	const scheduledJobs: Job[] = [];

	console.log(`Starting Chromium`);
	const browser = await chromium.launch({ headless: true });

	console.log(`Scheduling ${checkForPoutnik.name} with CRON_SCHEDULE=${CRON_SCHEDULE}`);
	let job: Job;
	job = scheduleJob(CRON_SCHEDULE, async () => {
		try {
			console.log(`Running checkForPoutnik`);
			await checkForPoutnik(browser, todaysPosts);
		} catch (err) {
			console.error(err);
		}
	});
	scheduledJobs.push(job);
	console.log(`Next run: ${job.nextInvocation().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })}`);

	console.log(`Scheduling ${todaysPosts.clear.name} with CRON_SCHEDULE=0 0 * * *`);
	job = scheduleJob('0 0 * * *', async () => {
		todaysPosts.clear();
	});
	scheduledJobs.push(job);
	console.log(`Next run: ${job.nextInvocation().toLocaleString('cs-CZ', { timeZone: 'Europe/Prague' })}`);

	while (scheduledJobs.length > 0) {
		await new Promise(resolve => setTimeout(resolve, 1000));
	}
}
main().catch(console.error).finally(() => browser?.close());
