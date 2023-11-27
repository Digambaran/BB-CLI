/**
 * Copyright (c) Appblocks. and its affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
const path = require('path')
const chalk = require('chalk')

const { mkdirSync, existsSync, rmSync } = require('fs')
const { getGitConfigNameEmailFromConfigStore } = require('../../../utils/questionPrompts')
const { checkAndSetGitConfigNameEmail } = require('../../../utils/gitCheckUtils')
const {
  buildBlockConfig,
  searchFile,
  addBlockWorkSpaceCommits,
  getAndSetSpace,
  findBlockConfig,
  buildSinglePackageBlockConfig,
  buildApiPayload,
} = require('./util')
const ConfigFactory = require('../../../utils/configManagers/configFactory')
const { headLessConfigStore, configstore } = require('../../../configstore')
const { spinnies } = require('../../../loader')
const { BB_FILES } = require('../../../utils/bbFolders')
const GitConfigFactory = require('../../../utils/gitManagers/gitConfigFactory')
const { axios } = require('../../../utils/axiosInstances')
const { checkBlocksSyncedApi } = require('../../../utils/api')

const createBBModules = async (options) => {
  try {
    const { bbModulesPath, rootConfig, bbModulesExists, defaultBranch, returnOnError, blockName, preview } = options


    const apiPayload = {}
    const blockMetaDataMap = {}
    const blockNameArray = []

    const workspaceDirectoryPath = path.join(bbModulesPath, BB_FILES.WORKSPACE)
    const repoUrl = rootConfig.source.ssh

    const { manager: Git, error: gErr } = await GitConfigFactory.init({
      cwd: workspaceDirectoryPath,
      gitUrl: repoUrl,
    })
    if (gErr) throw gErr

    if (!bbModulesExists) {
      try {
        if (!existsSync(bbModulesPath)) mkdirSync(bbModulesPath, { recursive: true })

        if (!existsSync(workspaceDirectoryPath)) mkdirSync(workspaceDirectoryPath, { recursive: true })

        await Git.clone('.')

        let gitUserName = headLessConfigStore().get('localGitName', '')
        let gitUserEmail = headLessConfigStore().get('localGitEmail', '')

        if (!gitUserName || !gitUserEmail) {
          console.log(chalk.dim(`Please enter git username and email`))
          const gitUser = await getGitConfigNameEmailFromConfigStore(false, configstore)

          gitUserName = gitUser.gitUserName
          gitUserEmail = gitUser.gitUserEmail

          headLessConfigStore().set('localGitName', gitUserName)
          headLessConfigStore().set('localGitEmail', gitUserEmail)
        }

        await checkAndSetGitConfigNameEmail(workspaceDirectoryPath, { gitUserEmail, gitUserName })

        // await Git.addRemote(workSpaceRemoteName, Git.remote)
      } catch (err) {
        if (existsSync(bbModulesPath)) {
          rmSync(bbModulesPath, { recursive: true, force: true })
        }
        throw err
      }
    }

    const currentBranch = (await Git.currentBranch())?.out?.trim()

    if (currentBranch !== defaultBranch) {
      await Git.checkoutBranch(defaultBranch)
    }

    // set the appropriate space for the repository
    const currentSpaceID = await getAndSetSpace(headLessConfigStore())

    spinnies.add('sync', { text: `Fetching latest ${defaultBranch} branch` })

    const pullResult = await Git.pullBranch(defaultBranch)

    // check if there are any changes in pull
    const noPullChanges = pullResult.out.includes('Already up to date')
    if (noPullChanges && returnOnError) {
      spinnies.remove('sync')
      return { noPullChanges }
    }

    spinnies.update('sync', { text: 'Initialising config manager' })
    // building initial package config manager inside bb_modules/workspace directory
    const searchFileData = searchFile(workspaceDirectoryPath, 'block.config.json')
    const { filePath: workSpaceConfigPath, directory: workSpaceConfigDirectoryPath } = searchFileData || {}

    const { manager: workSpaceConfigManager, error } = await ConfigFactory.create(workSpaceConfigPath)

    if (error) throw error
    // const { manager: workSpaceConfigManager } = configFactory

    workSpaceConfigManager.newParentBlockIDs = []

    if (preview) {
      const currentConfig = workSpaceConfigManager.config

      if (!blockMetaDataMap[currentConfig.name]) {
        blockMetaDataMap[currentConfig.name] = { blockManager: workSpaceConfigManager }
        blockNameArray.push(currentConfig.name)
      }
      buildApiPayload(currentConfig, apiPayload)
    } else if (blockName) {
      const blockConfigDetails = {}
      await findBlockConfig({
        workSpaceConfigManager,
        blockMetaDataMap,
        blockNameArray,
        rootPath: workSpaceConfigDirectoryPath,
        apiPayload,
        blockName,
        blockConfigDetails,
      })

      if (Object.keys(blockConfigDetails).length === 0) {
        throw new Error('Invalid block Name')
      }

      let syncedBlockIds = null
      // check if root block is synced
      const blockIds = [workSpaceConfigManager.config.blockId]

      const checkRes = await axios.post(checkBlocksSyncedApi, { block_ids: blockIds })
      syncedBlockIds = checkRes.data?.data?.map((b) => b.id) || []

      if (!syncedBlockIds?.includes(workSpaceConfigManager.config.blockId)) {
        await buildSinglePackageBlockConfig({
          workSpaceConfigManager,
          blockMetaDataMap,
          blockNameArray,
          apiPayload,
        })
      }

      if (blockConfigDetails.configManager.config.type === 'package') {
        await buildBlockConfig({
          workSpaceConfigManager: blockConfigDetails.configManager,
          blockMetaDataMap,
          blockNameArray,
          rootPath: blockConfigDetails.configManager.directory,
          apiPayload,
        })
      }
    } else {
      await buildBlockConfig({
        workSpaceConfigManager,
        blockMetaDataMap,
        blockNameArray,
        rootPath: workSpaceConfigDirectoryPath,
        apiPayload,
      })
    }

    await addBlockWorkSpaceCommits(blockMetaDataMap, Git, workspaceDirectoryPath)

    // await checkAndPushChanges(Git, defaultBranch, workSpaceRemoteName)
    spinnies.succeed('sync', { text: 'Config Manager initialised' })

    return {
      blockMetaDataMap,
      workspaceDirectoryPath: workSpaceConfigDirectoryPath,
      repoUrl,
      blockNameArray,
      apiPayload,
      currentSpaceID,
      rootPackageBlockID: workSpaceConfigManager.config.blockId,
      rootPackageName: workSpaceConfigManager.config.name,
      noPullChanges,
    }
  } catch (err) {
    spinnies.add('Config Manager')
    spinnies.fail('Config Manager', { text: err.toString() })
    throw err
  }
}

module.exports = createBBModules