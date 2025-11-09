import { Command } from 'commander';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const program = new Command();

const commandsDir = path.join(__dirname, 'commands');
const commandFiles = fs.readdirSync(commandsDir).filter(f => f.endsWith('.js'));

for (const file of commandFiles) {
    const { default: cmd } = await import(`./commands/${file}`);
    if (!cmd) continue;

    const sub = program
        .command(cmd.name)
        .description(cmd.description)
        .action(cmd.run);

    if (cmd.alias) sub.alias(cmd.alias);
}

program.parse(process.argv);