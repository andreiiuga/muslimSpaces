import 'dotenv/config';
import messenger from './messenger/index.js';
import interpreter from './interpreter/index.js';
import dispatcher from './dispatcher/index.js';
import presenter from './presenter/index.js';

const GROUP_ID = process.env.GROUP_ID || null; // e.g. "1234567890-1234567890@g.us"
const SEND_DELAY_MS = parseInt(process.env.SEND_DELAY_MS || '1500', 10);

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

async function start() {
  await messenger.connect(GROUP_ID);
  messenger.addMessageHandler(async (incoming) => {
    const { text, chatId, sender } = incoming;
    
    const command = await interpreter.processMessage(text);
    if (!command) return;
    const response = await dispatcher.processCommand(command, sender);
    const reply = await presenter.processResponse(response);

    // /me is personal submission history - send it to the sender privately
    // instead of posting it in the group.
    const target = response.type === 'me' ? sender.id : chatId;

    messenger.sendMessage({
      text: reply,
      chatId: target
    })
  })

  // Greet each new member with a personal welcome (name + current progress),
  // then send the /help message once for the whole batch of joiners.
  messenger.addGroupJoinHandler(async (groupId, participantIds) => {
    if (participantIds.length === 0) return;

    for (const participantId of participantIds) {
      const sender = { id: participantId, name: null, phoneNumber: participantId.split('@')[0] ?? participantId };

      const welcomeResponse = await dispatcher.handleGroupJoin(sender);
      const welcomeText = await presenter.processResponse(welcomeResponse);
      await messenger.sendMessage({ text: welcomeText, chatId: groupId });

      await sleep(SEND_DELAY_MS);
    }

    // handleHelp() ignores the sender entirely, so any placeholder works here.
    const helpResponse = await dispatcher.processCommand({ type: 'help' }, { id: groupId, name: null, phoneNumber: null });
    const helpText = await presenter.processResponse(helpResponse);
    await messenger.sendMessage({ text: helpText, chatId: groupId });
  })
}


start().catch((err) => {
  console.error('Fatal error starting bot:', err);
  process.exit(1);
});
