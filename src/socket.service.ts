import {
  DisconnectReason,
  fetchLatestBaileysVersion,
  makeWASocket,
  proto,
  useMultiFileAuthState,
} from 'baileys'
import P from 'pino'
import { type Boom } from '@hapi/boom'
import QRCode from 'qrcode'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

import { DEFAULT_SESSION, LOG_DIR, SESSION_DIR } from './config'
import { handleAsui, handlePing, handleSilence } from './commands'

export const sock: any = { [DEFAULT_SESSION]: null }
export const sockReady: any = { [DEFAULT_SESSION]: false }

export async function startSock(session: string) {
  const { error, version } = await fetchLatestBaileysVersion()
  if (error) {
    console.log(`session: ${session} | No connection, check your internet`)
    return startSock(session)
  }

  const sessionPath = path.join(SESSION_DIR, session)
  await fs.mkdir(sessionPath, { recursive: true })

  const { state, saveCreds } = await useMultiFileAuthState(sessionPath)

  sock[session] = makeWASocket({
    auth: state,
    version,
    logger: P(),
  })

  sock[session].ev.process(async (events: any) => {
    if (events['connection.update']) {
      const { connection, lastDisconnect, qr } = events['connection.update']
      if (qr) {
        console.log(await QRCode.toString(qr, { type: 'terminal' }))
        return
      }
      if (connection === 'close') {
        sockReady[session] = false
        if (
          (lastDisconnect?.error as Boom)?.output?.statusCode !==
          DisconnectReason.loggedOut
        ) {
          startSock(session)
        } else {
          console.log('Connection closed. You are logged out.')
          await fs.rmdir(sessionPath, { recursive: true })
        }
      } else if (connection == 'open') {
        sockReady[session] = true
      }
      return
    }

    if (events['creds.update']) {
      await saveCreds()
      return
    }

    if (events['labels.association']) {
      console.log(events['labels.association'])
      return
    }

    if (events['labels.edit']) {
      console.log(events['labels.edit'])
      return
    }

    if (events.call) {
      console.log('recv call event', events.call)
      return
    }

    if (events['messaging-history.set']) {
      const { chats, contacts, messages, isLatest, progress, syncType } =
        events['messaging-history.set']
      if (syncType === proto.HistorySync.HistorySyncType.ON_DEMAND) {
        console.log(
          [
            `recv ${chats.length} chats`,
            `${contacts.length} contacts`,
            `${messages.length} msgs (is latest: ${isLatest}`,
            `progress: ${progress}%)`,
            `type: ${syncType}`,
          ].join(', '),
        )
      }
      return
    }

    if (events['messages.upsert']) {
      const m = events['messages.upsert']
      const uuid = uuidv4()
      const timestamp = new Date().getTime()
      const messageFilePath = path.join(
        LOG_DIR,
        `messages-${timestamp}-${uuid}.json`,
      )
      await fs.writeFile(
        messageFilePath,
        Buffer.from(JSON.stringify(m, null, 2)),
      )
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
    }
  })
}

async function handleMessage(message: string, jid: string, contact: string) {
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
