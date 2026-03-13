import { publishJob } from '../job'
import { downloadMediaMessage } from 'baileys'

export async function handleMac(jid: string, message: string, rawMessage?: any) {
  let macAddress = message.trim().substring(4).trim()
  let base64Image: string | undefined = undefined

  const imageMessage = rawMessage?.message?.imageMessage ||
                       rawMessage?.message?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage

  if (imageMessage) {
    try {
      const buffer = await downloadMediaMessage(
        rawMessage,
        'buffer',
        {},
        { logger: console as any, reuploadRequest: async (msg: any) => msg }
      )
      base64Image = buffer.toString('base64')

      if (!macAddress) {
        macAddress = 'IMAGE'
      }
    } catch (error) {
      console.error('Failed to download image for !mac:', error)
      return
    }
  } else if (!macAddress) {
     return
  }

  await publishJob({
    name: `romusha.notifyMacTransactions.${macAddress}.${jid}`,
    data: {
      image: base64Image
    },
  })
}
