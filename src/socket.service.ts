import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from 'baileys'
import P from 'pino'
import { type Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'
import { SESSION, LOG_DIR, SESSION_DIR } from './config'
import { handleMessage } from './message'

export const sock: any = { [SESSION]: null }
export const sockReady: any = { [SESSION]: false }

export async function startSock(session: string) {
  const { version } = await fetchLatestBaileysVersion()

  const sessionPath = path.join(SESSION_DIR, session)
  await fs.mkdir(sessionPath, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  sock[session] = makeWASocket({
    auth: state,
    version,
    logger: P(),
  })

  sock[session].ev.on('creds.update', saveCreds)
  sock[session].ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect, qr } = update
    if (qr) {
      console.log(await QRCode.toString(qr, { type: 'terminal' }))
    }
    if (connection === 'close') {
      sockReady[session] = false
      if (
        (lastDisconnect?.error as Boom)?.output?.statusCode !==
        DisconnectReason.loggedOut
      ) {
        startSock(session)
      } else {
        console.log('Connection closed, you are logged out')
        await fs.rmdir(sessionPath, { recursive: true })
      }
    }
  })
  sock[session].ev.on('messages.upsert', async (m: any) => {
    sockReady[session] = true
    const uuid = uuidv4()
    const timestamp = new Date().getTime()
    const messageFilePath = path.join(
      LOG_DIR,
      `messages-${timestamp}-${uuid}.json`,
    )
    await fs.writeFile(messageFilePath, Buffer.from(JSON.stringify(m, null, 2)))
    if (m.messages[0].key.fromMe) {
      return
    }
    if (!m.messages[0].message) {
      return
    }
    let textMessage: string =
      m.messages[0].message.extendedTextMessage?.text ||
      m.messages[0].message.conversation ||
      ''
    if (!textMessage) {
      return
    }
    await handleMessage(
      textMessage,
      m.messages[0].key.remoteJid,
      m.messages[0].verifiedBizName || m.messages[0].pushName || '',
    )
  })
}
