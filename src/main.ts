import { startSock } from './socket.service'
import { consumeMessages } from './delivery.service'
import { SESSION } from './config'

startSock(SESSION).catch((err) => console.log('Unexpected error:', err))
consumeMessages().catch((err: any) => {
  console.error('Error consuming messages:', err)
})
