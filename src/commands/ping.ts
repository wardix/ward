import { sockReady, sock } from '../socket.service'
import { DEFAULT_SESSION } from '../config'

export async function handlePing(jid: string) {
  if (!sockReady[DEFAULT_SESSION]) {
    return
  }
  sock[DEFAULT_SESSION].sendMessage(jid, { text: 'pong' })
}
