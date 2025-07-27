import { publishJob } from '../job'

export async function handleFsticketoverdue(jid: string) {
  await publishJob({
    name: `romusha.notifyAllOverdueFbstarTickets.${jid}`,
    data: {},
  })
}
