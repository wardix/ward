import { publishJob } from '../job'

export async function handleFsticket(jid: string, message: string) {
  const requestId = message.trim().substring(9).trim()
  await publishJob({
    name: `romusha.notifyFbstarTicketDetail.${requestId}.${jid}`,
    data: {},
  })
}
