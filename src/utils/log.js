import chalk from "chalk";

const colors = {
  tagBg: "#45464F",
  tagText: "#DAAA95",
  info: "#58A6FF",
  warn: "#FFD33D",
  error: "#FF6A6A",
  success: "#3FB950",
  debug: "#B392F0",
};

const tag = chalk.bgHex(colors.tagBg).hex(colors.tagText).bold(" DPM ");
const pad = chalk.gray("›");

const timers = new Map();

const log = {
  info: (...msg) =>
    console.log(`${tag} ${pad} ${chalk.hex(colors.info)(msg.join(" "))}`),

  warn: (...msg) =>
    console.log(`${tag} ${pad} ${chalk.hex(colors.warn)(msg.join(" "))}`),

  error: (...msg) =>
    console.error(`${tag} ${pad} ${chalk.hex(colors.error)(msg.join(" "))}`),

  success: (...msg) =>
    console.log(`${tag} ${pad} ${chalk.hex(colors.success)(msg.join(" "))}`),

  debug: (...msg) => {
    if (process.env.DEBUG === "true" || process.argv.includes("--debug")) {
      console.log(`${tag} ${pad} ${chalk.hex(colors.debug)(msg.join(" "))}`);
    }
  },

  debug: (...msg) => {
    if (process.env.DEBUG === "true" || process.argv.includes("--debug")) {
      console.log(`${tag} ${pad} ${chalk.hex(colors.debug)(msg.join(" "))}`);
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
  divider: () => console.log(chalk.gray("────────────────────────────")),
};

export default log;