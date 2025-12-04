import { sockReady, sock } from '../socket.service'
import { SESSION } from '../config'

export async function handlePing(jid: string) {
  if (!sockReady[SESSION]) {
    return
  }
  sock[SESSION].sendMessage(jid, { text: 'pong' })
}
