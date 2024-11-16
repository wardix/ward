import {
  fetchLatestBaileysVersion,
  makeWASocket,
  useMultiFileAuthState,
} from '@whiskeysockets/baileys'
import * as Boom from '@hapi/boom'
import { v4 as uuidv4 } from 'uuid'
import fs from 'fs/promises'
import path from 'path'

import { DEFAULT_SESSION, LOG_DIR, SESSION_DIR } from './config'

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
    printQRInTerminal: true,
  })

  sock[session].ev.on('creds.update', saveCreds)

  sock[session].ev.on('connection.update', async (update: any) => {
    const { connection, lastDisconnect } = update
    if (connection === 'close') {
      sockReady[session] = false
      if (Boom.boomify(lastDisconnect.error).output.statusCode == 401) {
        await fs.rmdir(sessionPath, { recursive: true })
      }
      const shouldReconnect =
        lastDisconnect && lastDisconnect.error
          ? Boom.boomify(lastDisconnect.error).output.statusCode
          : 500
      console.log(
        'Connection closed due to',
        lastDisconnect?.error,
        ', reconnecting in',
        shouldReconnect,
        'ms',
      )
      if (shouldReconnect) {
        setTimeout(() => startSock(session), shouldReconnect)
      }
    } else if (connection === 'open') {
      sockReady[session] = true
      console.log('Opened connection')
    }
  })

  sock[session].ev.on('messages.upsert', async (m: any) => {
    const uuid = uuidv4()
    const timestamp = new Date().getTime()
    const messageFilePath = path.join(
      LOG_DIR,
      `messages-${timestamp}-${uuid}.json`,
    )
    await fs.writeFile(messageFilePath, Buffer.from(JSON.stringify(m, null, 2)))
  })
}
