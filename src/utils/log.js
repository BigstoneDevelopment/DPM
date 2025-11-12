const RESET = '\x1b[0m';
const BOLD = '\x1b[1m';

const hexToRgb = (hex) => {
	const bigint = parseInt(hex.slice(1), 16);
	const r = (bigint >> 16) & 255;
	const g = (bigint >> 8) & 255;
	const b = bigint & 255;
	return [r, g, b];
};

const hexToAnsi = (hex, type = 'fg') => {
	const [r, g, b] = hexToRgb(hex);
	const code = type === 'bg' ? 48 : 38;
	return `\x1b[${code};2;${r};${g};${b}m`;
};

const colors = {
	tagBg: "#45464F",
	tagText: "#DAAA95",
	info: "#58A6FF",
	warn: "#FFD33D",
	error: "#FF6A6A",
	success: "#3FB950",
	debug: "#B392F0",
	gray: "#a7a7a7ff"
};

const TAG_BG = hexToAnsi(colors.tagBg, 'bg');
const TAG_FG = hexToAnsi(colors.tagText, 'fg');
const INFO_FG = hexToAnsi(colors.info, 'fg');
const WARN_FG = hexToAnsi(colors.warn, 'fg');
const ERROR_FG = hexToAnsi(colors.error, 'fg');
const SUCCESS_FG = hexToAnsi(colors.success, 'fg');
const DEBUG_FG = hexToAnsi(colors.debug, 'fg');
const GRAY_FG = hexToAnsi(colors.gray, 'fg');

const tag = `${TAG_BG}${TAG_FG}${BOLD} DPM ${RESET}`;
const pad = `${GRAY_FG}›${RESET}`;

const timers = new Map();

const log = {
	info: (...msg) =>
		console.log(`${tag} ${pad} ${INFO_FG}${msg.join(" ")}${RESET}`),

	warn: (...msg) =>
		console.log(`${tag} ${pad} ${WARN_FG}${msg.join(" ")}${RESET}`),

	error: (...msg) =>
		console.error(`${tag} ${pad} ${ERROR_FG}${msg.join(" ")}${RESET}`),

	success: (...msg) =>
		console.log(`${tag} ${pad} ${SUCCESS_FG}${msg.join(" ")}${RESET}`),

	debug: (...msg) => {
		if (process.env.DEBUG === "true" || process.argv.includes("--debug")) {
			console.log(`${tag} ${pad} ${DEBUG_FG}${msg.join(" ")}${RESET}`);
		}
	},

	timeStart: (label = "default") => {
		timers.set(label, process.hrtime.bigint());
	},

	timeEnd: (label = "default", successMsg) => {
		const start = timers.get(label);
		if (!start) return log.warn(`Timer '${label}' not found.`);

		const end = process.hrtime.bigint();
		const durationMs = Number(end - start) / 1_000_000;
		const durationSec = (durationMs / 1000).toFixed(2);

		const msg = successMsg
			? `${successMsg} in ${durationSec}s`
			: `Finished '${label}' in ${durationSec}s`;

		log.success(msg);
		timers.delete(label);
	},

	line: () => console.log(""),
	divider: () => console.log(`${GRAY_FG}────────────────────────────${RESET}`),
};

export default log;