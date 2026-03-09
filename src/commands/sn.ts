import { publishJob } from '../job'
import { downloadMediaMessage } from 'baileys'

export async function handleSn(jid: string, message: string, rawMessage?: any) {
  let serialNumber = message.trim().substring(3).trim()
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

      if (!serialNumber) {
        serialNumber = 'IMAGE'
      }
    } catch (error) {
      console.error('Failed to download image for !sn:', error)
      return
    }
  } else if (!serialNumber) {
     return
  }

  await publishJob({
    name: `romusha.notifySerialTransactions.${serialNumber}.${jid}`,
    data: {
      image: base64Image
    },
  })
}
