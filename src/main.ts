import * as cheerio from 'cheerio';
import { BEER_PATTERNS, CHECK_INTERVAL, KURNIK_SOPA_URL, NTFY_TOPIC } from "./env.js";
import { fetchHTML } from "./request.js";
import { ntfy } from "./ntfy.js";
import { logger } from "./logger.js";

let lastDate = '';

async function checkForBeers() {
	try {
		logger.debug(`Stahuji čerstvou verzi webu`);
		const html = await fetchHTML(KURNIK_SOPA_URL);
		const $ = cheerio.load(html);

		logger.debug(`Parsuji html`);
		const onTapEl = $('#naCepu');
		const onTapDateEl = onTapEl.find('.date').first();
		const onTapListEl = onTapEl.find('#naCepu-list');

		const onTapDate = onTapDateEl.text().trim();
		if (onTapDate === lastDate) {
			logger.info(`Dnes už bylo upozornění odesláno, přeskakuji kontrolu`);
			return;
		}

		logger.debug(`Ukládám datum poslední kontroly`);
		lastDate = onTapDate;

		const watchedBeersOnTap = BEER_PATTERNS.filter(beer => onTapListEl.text().includes(beer));
		if (watchedBeersOnTap.length === 0) {
			logger.info(`Nic z hlídaných piv dnes není na čepu :(`);
			return;
		}

		logger.info(`Odesílám upozornění`);
		await ntfy({topic: NTFY_TOPIC, message: `V Kurnik Šopě je ${watchedBeersOnTap.join('a')}!`, title: 'Poutník Hlídka'});
	} catch (err) {
		logger.error(err);
	}
}

checkForBeers();
setInterval(checkForBeers, CHECK_INTERVAL * 1000);
