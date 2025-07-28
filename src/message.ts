import { handleAsui } from './commands/asui'
import { handlePing } from './commands/ping'
import { handleSilence } from './commands/silence'
import { handleFsticketoverdue } from './commands/fsticketoverdue'
import { handleFsticket } from './commands/fsticket'

export async function handleMessage(
  message: string,
  jid: string,
  contact: string,
) {
  if (message.toLowerCase().trim() === '!ping') {
    await handlePing(jid)
    return
  }
  if (message.toLowerCase().trim() === '!asui') {
    await handleAsui(jid)
    return
  }
  if (message.toLowerCase().trim() === '!fsticketoverdue') {
    await handleFsticketoverdue(jid)
    return
  }
  if (message.toLowerCase().trim().startsWith('!fsticket ')) {
    await handleFsticket(jid, message)
    return
  }
  if (message.toLowerCase().trim().startsWith('!silence ')) {
    await handleSilence(jid, message, contact)
  }
}
