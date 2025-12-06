import { config } from 'dotenv'

config()

export const SESSION = process.env.SESSION || 'main'
export const LOG_DIR = process.env.LOG_DIR || '/tmp'
export const SESSION_DIR = process.env.SESSION_DIR || '/tmp'
export const NATS_SERVERS = process.env.NATS_SERVERS || 'nats://localhost:4222'
export const NATS_TOKEN = process.env.NATS_TOKEN || ''
export const NATS_STREAM = process.env.NATS_STREAM || 'JOBS'
export const NATS_CONSUMER = process.env.NATS_CONSUMER || 'wa_delivery'
export const MIN_BACKOFF_DELAY_MS = Number(
  process.env.MIN_BACKOFF_DELAY_MS || 1000,
)
export const MAX_BACKOFF_DELAY_MS = Number(
  process.env.MAX_BACKOFF_DELAY_MS || 32000,
)
export const JOB_ENQUEUE_API_URL = process.env.JOB_ENQUEUE_API_URL || ''
export const JOB_ENQUEUE_API_KEY =
  process.env.JOB_ENQUEUE_API_KEY || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
export const JOB_BROKER_API_URL = process.env.JOB_BROKER_API_URL || ''
export const JOB_BROKER_API_KEY =
  process.env.JOB_BROKER_API_KEY || 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
export const NATS_PULL_DELAY_MS = Number(
  process.env.NATS_PULL_DELAY_MS || 16000,
)
