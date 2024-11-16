import { startSock } from './socket.service'
import { consumeMessages } from './delivery.service'

import { DEFAULT_SESSION } from './config'

startSock(DEFAULT_SESSION).catch((err) => console.log('Unexpected error:', err))
consumeMessages().catch((error) => {
  console.error('Error consuming messages:', error)
})
