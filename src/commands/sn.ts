import { publishJob } from '../job'

export async function handleSn(jid: string, message: string) {
  const serialNumber = message.trim().substring(4).trim()
  await publishJob({
    name: `romusha.notifySerialTransactions.${serialNumber}.${jid}`,
    data: {},
  })
}
