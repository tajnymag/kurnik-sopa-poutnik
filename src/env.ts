import env from 'env-var';
import { LevelWithSilent } from 'pino';

export const NTFY_TOPIC = env.get('NTFY_TOPIC').default('kurnik-sopa-poutnik').asString();
export const NTFY_BASE_URL = env.get('NTFY_TOPIC_URL').default(`https://ntfy.sh/`).asUrlString();

export const CHECK_INTERVAL = env.get('CHECK_INTERVAL').default(60 * 60).asIntPositive();
export const KURNIK_SOPA_URL = env.get('KURNIK_SOPA_URL').default('https://www.kurniksopahospoda.cz').asUrlString();

export const BEER_PATTERNS = env.get('BEER_PATTERNS').default('Poutník').asArray();

export const LOG_LEVEL: LevelWithSilent = env.get('LOG_LEVEL').default('info').asEnum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']);
