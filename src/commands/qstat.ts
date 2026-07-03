import { sockReady, sock } from '../socket.service'
import {
  SESSION,
  NATS_MONITOR_URL,
  NATS_STREAM,
  NATS_CONSUMER,
} from '../config'

export async function handleQstat(jid: string) {
  if (!sockReady[SESSION]) {
    return
  }

  try {
    const res = await fetch(`${NATS_MONITOR_URL}/jsz?consumers=true`)
    const data = await res.json()

    const consumer = data.account_details
      ?.flatMap((a: any) => a.stream_detail ?? [])
      .filter((s: any) => s.name === NATS_STREAM)
      .flatMap((s: any) => s.consumer_detail ?? [])
      .find((c: any) => c.name === NATS_CONSUMER)

    if (!consumer) {
      await sock[SESSION].sendMessage(jid, {
        text: `Consumer ${NATS_CONSUMER} in stream ${NATS_STREAM} not found`,
      })
      return
    }

    const lastAck = consumer.ack_floor?.last_active
      ? new Date(consumer.ack_floor.last_active)
          .toLocaleString('sv-SE', { timeZone: 'Asia/Jakarta' })
      : 'N/A'

    const text = [
      `*${NATS_STREAM}/${NATS_CONSUMER}*`,
      `pending: ${consumer.num_pending}`,
      `ack_pending: ${consumer.num_ack_pending}`,
      `redelivered: ${consumer.num_redelivered}`,
      `last_ack: ${lastAck}`,
    ].join('\n')

    await sock[SESSION].sendMessage(jid, { text })
  } catch (error) {
    console.error('Failed to fetch qstat:', error)
    await sock[SESSION].sendMessage(jid, { text: 'Failed to fetch stats' })
  }
}
