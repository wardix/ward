import { publishJob } from '../job'

export async function handleBorrowed(jid: string, message: string) {
  const customerId = message.trim().substring(9).trim()
  await publishJob({
    name: `romusha.notifyBorrowedDetail.${customerId}.${jid}`,
    data: {},
  })
}
