import { connect, JSONCodec } from 'nats'
import { sock, sockReady } from './socket.service'
import {
  NATS_SERVERS,
  NATS_TOKEN,
  MIN_BACKOFF_DELAY_SECONDS,
  MAX_BACKOFF_DELAY_SECONDS,
  SESSION,
  NATS_STREAM,
  NATS_CONSUMER,
} from './config'

export async function consumeMessages() {
  let backoffDelay = Number(MIN_BACKOFF_DELAY_SECONDS) * 1000

  const nc = await connect({
    servers: NATS_SERVERS,
    token: NATS_TOKEN,
  })

  process.on('SIGINT', async () => {
    await nc.drain()
    process.exit()
  })

  const jc = JSONCodec()
  const js = nc.jetstream()
  const c = await js.consumers.get(NATS_STREAM, NATS_CONSUMER)

  try {
    while (true) {
      const messages = await c.fetch({ max_messages: 8, expires: 1000 })
      let hasMessages = false
      for await (const message of messages) {
        hasMessages = true
        if (!sockReady[SESSION]) {
          message.nak()
          continue
        }
        let to = ''
        let body = ''
        let option: any = {}
        for (const header of message.headers!.keys()) {
          if (header == 'to') {
            to = atob(message.headers!.get(header))
            continue
          }
          if (header == 'body') {
            body = atob(message.headers!.get(header))
            continue
          }
          option[header] = atob(message.headers!.get(header))
        }

        switch (body) {
          case 'text':
            sock[SESSION].sendMessage(to, {
              text: jc.decode(message.data),
            })
            break
          case 'image':
            sock[SESSION].sendMessage(to, {
              image: Buffer.from(message.data),
              ...option,
            })
            break
          case 'video':
            sock[SESSION].sendMessage(to, {
              video: Buffer.from(message.data),
              ...option,
            })
            break
          case 'document':
            sock[SESSION].sendMessage(to, {
              document: Buffer.from(message.data),
              ...option,
            })
            break
          default:
        }

        message.ack()
        backoffDelay = 1000
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
      }
      if (!hasMessages) {
        await new Promise((resolve) => setTimeout(resolve, backoffDelay))
        backoffDelay = Math.min(
          backoffDelay * 2,
          Number(MAX_BACKOFF_DELAY_SECONDS) * 1000,
        )
      }
    }
  } catch (error) {
    console.error('Error during message consumtion: ', error)
  }
}
