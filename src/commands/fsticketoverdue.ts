import { publishJob } from '../job'

export async function handleFsticketoverdue(
  jid: string,
  message: string = '!fsticketoverdue 24',
) {
  const threshold = Math.floor(Number(message.trim().substring(16).trim()))
  await publishJob({
    name: `romusha.notifyAllOverdueFbstarTickets.${threshold}.${jid}`,
    data: {},
  })
}
