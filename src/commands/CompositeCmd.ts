import type { Command } from './Command';

export class CompositeCmd implements Command {
  description = 'Composite command';

  private commands: Command[];

  constructor(commands: Command[]) {
    this.commands = commands;
  }

  async execute(): Promise<void> {
    for (const cmd of this.commands) {
      await cmd.execute();
    }
  }

  async undo(): Promise<void> {
    for (let i = this.commands.length - 1; i >= 0; i--) {
      await this.commands[i].undo();
    }
  }
}
