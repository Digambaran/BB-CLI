const convertGitSshUrlToHttps = require('./convertGitUrl')
const { sourceUrlOptions, readInput } = require('./questionPrompts')

/**
 * Prompts user with two options, "cancel" and "let me provide URL"
 * @returns {Promise<import('./jsDoc/types').blockSource>}
 */
async function getRepoUrl() {
  // 0 for cancel
  // 1 for let me provide url
  const o = await sourceUrlOptions()
  if (o === 1) {
    const s = await readInput({ message: 'Enter source ssh url here', name: 'sUrl' })
    return { ssh: s.trim(), https: convertGitSshUrlToHttps(s.trim()) }
  }
  return { ssh: '', https: '' }
}

module.exports = getRepoUrl