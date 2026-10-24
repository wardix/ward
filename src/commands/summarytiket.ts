import { sockReady, sock } from '../socket.service'
import { SESSION, QENTRAL_API_URL, QENTRAL_API_KEY } from '../config'

export async function handleSummaryTiket(jid: string, message: string = '!summarytiket') {
  try {
    const parts = message.trim().split(/\s+/)
    let targetDate: string | undefined = undefined

    if (parts.length > 1) {
      const candidate = parts[1].trim()
      if (/^\d{4}-\d{2}-\d{2}$/.test(candidate)) {
        targetDate = candidate
      }
    }

    const jobData: { to: string; targetDate?: string } = {
      to: jid
    }

    if (targetDate) {
      jobData.targetDate = targetDate
    }

    const response = await fetch(`${QENTRAL_API_URL}/employee-summary-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': QENTRAL_API_KEY
      },
      body: JSON.stringify({
        jobName: 'send-employee-ticket-summary',
        data: jobData
      })
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
      await sock[SESSION].sendMessage(jid, {
        text: `✅ ${data.message} (Job ID: ${data.jobId})`
      })
    }
  } catch (error) {
    console.error('[handleSummaryTiket] Error:', error)
    if (sockReady[SESSION]) {
      await sock[SESSION].sendMessage(jid, {
        text: '❌ Gagal memproses permintaan summary tiket karyawan.'
      })
    }
  }
}
