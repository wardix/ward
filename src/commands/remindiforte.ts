import { NATS_BRIDGE_API_URL, NATS_BRIDGE_API_KEY } from '../config'

export async function handleRemindIforte(jid: string) {
  await fetch(
    `${NATS_BRIDGE_API_URL}/publish/dbb/NEXUS.notification.reminder.iforte`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': NATS_BRIDGE_API_KEY,
      },
      body: JSON.stringify({ payload: { to: jid } }),
    },
  )
}
