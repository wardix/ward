import axios from 'axios'
import { sockReady, sock } from './socket.service'
import {
  DEFAULT_SESSION,
  JOB_ENQUEUE_API_KEY,
  JOB_ENQUEUE_API_URL,
} from './config'

export async function handlePing(jid: string) {
  if (!sockReady[DEFAULT_SESSION]) {
    return
  }
  sock[DEFAULT_SESSION].sendMessage(jid, { text: 'pong' })
}

export async function handleAsui(jid: string) {
  if (!sockReady[DEFAULT_SESSION]) {
    return
  }
  await submitEnqueuedJob({
    name: 'fetchEngineerTickets',
    notify: jid,
  })
}

export async function handleSilence(
  jid: string,
  message: string,
  pic: string = '',
) {
  if (!sockReady[DEFAULT_SESSION]) {
    return
  }
  message
    .substring(8)
    .trim()
    .split('\n')
    .forEach((line) => {
      submitEnqueuedJob({
        name: 'silenceAlert',
        attributes: line,
        contact: pic,
        notify: jid,
      })
    })
}

async function submitEnqueuedJob(job: any) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': JOB_ENQUEUE_API_KEY,
  }
  await axios.post(JOB_ENQUEUE_API_URL, job, { headers })
}
