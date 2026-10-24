import { sockReady, sock } from '../socket.service'
import { SESSION, QENTRAL_API_URL, QENTRAL_API_KEY } from '../config'

export async function handleSilence(
  jid: string,
  message: string,
  pic: string = '',
) {
  const lines = message
    .substring(8)
    .trim()
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0)

  if (lines.length === 0) {
    if (sockReady[SESSION]) {
      await sock[SESSION].sendMessage(jid, {
        text: '❌ Format salah. Contoh: !silence instance=server1 duration=1h comment="Maintenance"',
      })
    }
    return
  }

  for (const line of lines) {
    try {
      const response = await fetch(`${QENTRAL_API_URL}/alert-silence-queue`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': QENTRAL_API_KEY,
        },
        body: JSON.stringify({
          jobName: 'silence-alert',
          data: {
            attributes: line,
            contact: pic,
            notify: jid,
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
      console.error('[handleSilence] Error:', error)
      if (sockReady[SESSION]) {
        await sock[SESSION].sendMessage(jid, {
          text: `❌ Gagal memproses silence untuk: ${line}`,
        })
      }
    }
  }
}
