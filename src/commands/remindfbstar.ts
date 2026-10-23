import { sockReady, sock } from '../socket.service'
import { SESSION, QENTRAL_API_URL, QENTRAL_API_KEY } from '../config'

export async function handleRemindFbstar(jid: string) {
  try {
    const response = await fetch(`${QENTRAL_API_URL}/fbstar-reminder-queue`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': QENTRAL_API_KEY,
      },
      body: JSON.stringify({
        jobName: 'send-fbstar-reminder',
        data: {
          to: jid,
        },
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
      await sock[SESSION].sendMessage(jid, {
        text: `✅ ${data.message} (Job ID: ${data.jobId})`,
      })
    }
  } catch (error) {
    console.error('[handleRemindFbstar] Error:', error)
    if (sockReady[SESSION]) {
      await sock[SESSION].sendMessage(jid, {
        text: '❌ Gagal memproses permintaan reminder tiket FBStar.',
      })
    }
  }
}
