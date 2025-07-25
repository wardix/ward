import { handleAsui, handlePing, handleSilence } from './commands'

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
  if (message.toLowerCase().trim().startsWith('!silence ')) {
    await handleSilence(jid, message, contact)
  }
}
