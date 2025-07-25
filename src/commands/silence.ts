import { submitEnqueuedJob } from '../job'

export async function handleSilence(
  jid: string,
  message: string,
  pic: string = '',
) {
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
