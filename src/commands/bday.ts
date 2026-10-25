import { sockReady, sock } from '../socket.service'
import { SESSION, QENTRAL_API_URL, QENTRAL_API_KEY } from '../config'

export function parseTargetDate(input?: string): string | undefined {
  if (!input) return undefined
  const trimmed = input.trim().replace(/\//g, '-')
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    return trimmed
  }
  if (/^\d{1,2}-\d{1,2}$/.test(trimmed)) {
    const [m, d] = trimmed.split('-')
    return `${m.padStart(2, '0')}-${d.padStart(2, '0')}`
  }
  return undefined
}

export async function handleBday(jid: string, message: string = '!bday') {
  try {
    const parts = message.trim().split(/\s+/)
    let targetDate: string | undefined = undefined

    if (parts.length > 1) {
      targetDate = parseTargetDate(parts[1])
    }

    const jobData: {
      targetDate?: string
      notify: string
      sendToEmployee: boolean
    } = {
      notify: jid,
      sendToEmployee: false,
    }

    if (targetDate) {
      jobData.targetDate = targetDate
    }

    const response = await fetch(`${QENTRAL_API_URL}/employee-birthday-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': QENTRAL_API_KEY,
      },
      body: JSON.stringify({
        jobName: 'daily-voucher',
        data: jobData,
      }),
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`)
    }

    const data = (await response.json()) as {
      success: boolean
      message: string
      jobId: string
    }

    if (sockReady[SESSION]) {
      const dateDesc = targetDate ? `untuk tanggal ${targetDate}` : 'hari ini'
      await sock[SESSION].sendMessage(jid, {
        text: `🎂 Permintaan voucher ulang tahun ${dateDesc} sedang diproses (Job ID: ${data.jobId})`,
      })
    }
  } catch (error) {
    console.error('[handleBday] Error:', error)
    if (sockReady[SESSION]) {
      await sock[SESSION].sendMessage(jid, {
        text: '❌ Gagal memproses permintaan voucher ulang tahun.',
      })
    }
  }
}
