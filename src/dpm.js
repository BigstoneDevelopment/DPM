import { Command } from "commander";

const program = new Command();

const modules = import.meta.glob("./commands/*.js", { eager: true });

for (const path in modules) {
  const mod = modules[path];
  const cmd = mod.default;
  if (!cmd) continue;

  const sub = program
    .command(cmd.name)
    .description(cmd.description)
    .action(cmd.run);

  if (cmd.alias) sub.alias(cmd.alias);
}

program.parse(process.argv);