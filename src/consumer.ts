import { AckPolicy, connect } from 'nats'
import { NATS_SERVERS, NATS_TOKEN } from './config'

async function setupConsumer() {
  const nc = await connect({
    servers: NATS_SERVERS,
    token: NATS_TOKEN,
  })
  const js = nc.jetstream()
  const jsm = await js.jetstreamManager()

  await jsm.consumers.add('JOBS', {
    durable_name: 'wa_delivery',
    ack_policy: AckPolicy.Explicit,
    filter_subject: 'jobs.wa_delivery',
  })

  await nc.close()
}

setupConsumer()
