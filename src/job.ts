import axios from 'axios'
import {
  JOB_BROKER_API_KEY,
  JOB_BROKER_API_URL,
  JOB_ENQUEUE_API_KEY,
  JOB_ENQUEUE_API_URL,
} from './config'

export async function submitEnqueuedJob(job: any) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': JOB_ENQUEUE_API_KEY,
  }
  await axios.post(JOB_ENQUEUE_API_URL, job, { headers })
}

export async function publishJob(job: any) {
  const headers = {
    'Content-Type': 'application/json',
    'X-Api-Key': JOB_BROKER_API_KEY,
  }
  await axios.post(JOB_BROKER_API_URL, job, { headers })
}
