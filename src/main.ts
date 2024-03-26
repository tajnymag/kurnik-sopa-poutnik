import * as cheerio from 'cheerio';
import { CHECK_INTERVAL, KURNIK_SOPA_URL, NTFY_TOPIC } from "./env.js";
import { fetchHTML } from "./request.js";
import { ntfy } from "./ntfy.js";

let lastDate = '';

async function checkForPoutnik() {
	try {
		console.log(`Stahuji čerstvou verzi webu`);
		const html = await fetchHTML(KURNIK_SOPA_URL);
		const $ = cheerio.load(html);

		console.log(`Parsuji html`);
		const onTapEl = $('#naCepu');
		const onTapDateEl = onTapEl.find('.date').first();
		const onTapListEl = onTapEl.find('#naCepu-list');

		const onTapDate = onTapDateEl.text().trim();
		if (onTapDate === lastDate) {
			console.info(`Dnes už bylo upozornění odesláno, přeskakuji kontrolu`);
			return;
		}

		console.info(`Ukládám datum poslední kontroly`);
		lastDate = onTapDate;

		const isPoutnikOnTap = onTapListEl.text().includes('Poutník');
		if (!isPoutnikOnTap) {
			console.log(`Poutník dnes není na čepu :(`);
			return;
		}

		console.log(`Odesílám upozornění`);
		await ntfy({topic: NTFY_TOPIC, message: `Poutník je v Kurnik Šopě!`, title: 'Poutník Hlídka'});
	} catch (err) {
		console.error(err);
	}
}

checkForPoutnik();
setInterval(checkForPoutnik, CHECK_INTERVAL * 1000);
