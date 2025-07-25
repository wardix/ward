import { submitEnqueuedJob } from '../job'

export async function handleAsui(jid: string) {
  await submitEnqueuedJob({
    name: 'fetchEngineerTickets',
    notify: jid,
  })
}
