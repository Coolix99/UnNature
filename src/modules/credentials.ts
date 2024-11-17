import { isFirefox } from './firefoxCheck'

// info: user = username | pass = password
export interface UserData {
    user: string | undefined;
    pass: string | undefined;
}

interface UserDataStore {
    [platform: string]: UserData;
}

// create hash from input-string (can also be json of course)
// output hash is always of same length and is of type buffer
async function hashDigest (str: string) {
  return await crypto.subtle.digest('SHA-256', (new TextEncoder()).encode(str))
}

// get key for encryption
async function getKeyBuffer () {
  // async fetch of system information
  let sysInfo: string = ''

  // key differs between browsers, because different APIs
  if (isFirefox()) {
    sysInfo += window.navigator.hardwareConcurrency
  } else {
    // chrome, edge and everything else
    const info: any = await chrome.system.cpu.getInfo()
    delete info.processors
    if (info.temperatures) delete info.temperatures // Chrome OS only
    sysInfo += JSON.stringify(info)
  }

  // Chrome types seem to be broken, casting so no error is shown, https://developer.chrome.com/docs/extensions/reference/runtime/#method-getPlatformInfo
  const platformInfo = await (chrome.runtime as any).getPlatformInfo()
  sysInfo += JSON.stringify(platformInfo)

  // create key
  return await crypto.subtle.importKey('raw', await hashDigest(sysInfo),
    { name: 'AES-CBC' },
    false,
    ['encrypt', 'decrypt'])
}

export async function setUserData (userData: UserData, platform = 'zih') {
  if (!userData || !userData.user || !userData.pass || !platform) return

  // local function so it's not easily called from elsewhere
  const encode = async (decoded: string) => {
    const dataEncoded = (new TextEncoder()).encode(decoded)
    const keyBuffer = await getKeyBuffer()
    const iv = crypto.getRandomValues(new Uint8Array(16))

    // encrypt
    let dataEnc: any = await crypto.subtle.encrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      keyBuffer,
      dataEncoded
    )

    // adjust format to save encrypted data in local storage
    dataEnc = Array.from(new Uint8Array(dataEnc))
    dataEnc = dataEnc.map(byte => String.fromCharCode(byte)).join('')
    dataEnc = btoa(dataEnc)
    const ivStr = Array.from(iv).map(b => ('00' + b.toString(16)).slice(-2)).join('')
    return ivStr + dataEnc
  }

  const user = await encode(userData.user)
  const pass = await encode(userData.pass)

  let dataObj: UserDataStore
  try {
    const { udata } = await chrome.storage.local.get(['udata'])
    if (typeof udata !== 'string') throw Error()
    dataObj = JSON.parse(udata)
  } catch {
    // data field is undefined or broken -> reset it
    dataObj = {}
  }
  dataObj[platform] = { user, pass }

  await chrome.storage.local.set({ udata: JSON.stringify(dataObj) })
}

// check if username, password exist
export async function userDataExists (platform: string | undefined) {
  if (typeof platform === 'string') {
    // Query for a specific platform
    const { user, pass } = await getUserData(platform)
    return !!(user && pass)
  } else {
    // Query for any platform
    const { udata } = await chrome.storage.local.get(['udata'])
    if (typeof udata !== 'string') return false

    try {
      const dataJson = JSON.parse(udata)
      for (const platform of Object.keys(dataJson)) {
        const { user, pass } = await getUserData(platform)
        if (user && pass) return true
      }
    } catch { }
  }
  return false
}

// Legacy
export const loginDataExists = (platform = 'zih') => userDataExists(platform)

// return {user: string, pass: string}
// decrypt and return user data
// a lot of encoding and transforming needs to be done, in order to provide all values in the right format
export async function getUserData (platform: string = 'zih', providedKeyBuffer?: CryptoKey): Promise<UserData> {
  // get required data for decryption
  const keyBuffer = providedKeyBuffer ?? await getKeyBuffer()
  const { udata } = await chrome.storage.local.get(['udata'])

  // check if data exists, else return
  if (typeof udata !== 'string' || !platform) {
    return ({ user: undefined, pass: undefined })
  }

  // local function so it's not easily called from elsewhere
  const decode = async (encoded: string) => {
    if (!encoded) return undefined
    const ivArr = encoded.slice(0, 32).match(/.{2}/g)?.map(byte => parseInt(byte, 16))
    if (!ivArr) return undefined
    const iv = new Uint8Array(ivArr)
    const dataEncryptedStr = atob(encoded.slice(32))
    const dataEncrypted = new Uint8Array(dataEncryptedStr.match(/[\s\S]/g)?.map(ch => ch.charCodeAt(0)) || [])
    if (dataEncrypted.length === 0) return undefined

    // decrypt
    const decoded = await crypto.subtle.decrypt(
      {
        name: 'AES-CBC',
        iv: iv
      },
      keyBuffer,
      dataEncrypted
    )

    // adjust to useable format
    return new TextDecoder().decode(decoded)
  }

  try {
    const userDataJson = JSON.parse(udata)
    const { user: encUser, pass: encPass } = userDataJson[platform]
    return { user: await decode(encUser), pass: await decode(encPass) }
  } catch {
    return { user: undefined, pass: undefined }
  }
}

export async function deleteUserData (platform: string): Promise<boolean> {
  if (!platform) return false
  const { udata } = await chrome.storage.local.get(['udata'])
  // Field is wrong -> false
  if (typeof udata !== 'string') return false

  try {
    const dataJson = JSON.parse(udata)
    if (!dataJson[platform]) return false // no data available
    delete dataJson[platform]
    await chrome.storage.local.set({ udata: JSON.stringify(dataJson) })
    return true
  } catch {
    // Should happen if the JSON is broken
    return false
  }
}

// return {user: string, pass: string}
// This is the old method to get the user data. It will be preserved until probably every installation uses the new format
export async function getUserDataLagacy (): Promise<UserData> {
  // get required data for decryption
  const keyBuffer = await getKeyBuffer()
  // async fetch of user data
  const { Data: data } = await chrome.storage.local.get(['Data'])

  // check if Data exists, else return
  if (data === undefined || data === 'undefined') {
    return ({ user: undefined, pass: undefined })
  }
  const ivSlice = data.slice(0, 32).match(/.{2}/g)?.map(byte => parseInt(byte, 16))
  if (!ivSlice) return ({ user: undefined, pass: undefined })

  const iv = new Uint8Array(ivSlice)
  const userDataEncryptedStr = atob(data.slice(32))
  const userDataEncrypted = new Uint8Array(userDataEncryptedStr.match(/[\s\S]/g)?.map(ch => ch.charCodeAt(0)) || [])
  if (userDataEncrypted.length === 0) return ({ user: undefined, pass: undefined })

  // decrypt
  let userData: any = await crypto.subtle.decrypt(
    {
      name: 'AES-CBC',
      iv: iv
    },
    keyBuffer,
    userDataEncrypted
  )

  // adjust to useable format
  userData = new TextDecoder().decode(userData)
  userData = userData.split('@@@@@')
  return ({ user: userData[0], pass: userData[1] })
}

export async function upgradeUserData (encryptionLevel: number): Promise<number> {
  const highestEncryptionLevel = 4

  if (encryptionLevel >= highestEncryptionLevel) return highestEncryptionLevel

  const getKeyBufferLvl3 = async () => {
    // Lets build our own old keybuffer
    // It misses the hardware info for chrome
    let sysInfo: string = ''
    if (isFirefox()) sysInfo += window.navigator.hardwareConcurrency
    const platformInfo = await (chrome.runtime as any).getPlatformInfo()
    sysInfo += JSON.stringify(platformInfo)
    return await crypto.subtle.importKey('raw', await hashDigest(sysInfo),
      { name: 'AES-CBC' },
      false,
      ['encrypt', 'decrypt'])
  }

  switch (encryptionLevel) {
    case 1: {
      // This branch probably/hopefully will not be called anymore...
      const userData = await chrome.storage.local.get(['asdf', 'fdsa'])
      await setUserData({ user: atob(userData.asdf), pass: atob(userData.fdsa) }, 'zih')
      await chrome.storage.local.remove(['asdf', 'fdsa'])
      break
    }
    case 2: {
      const { user, pass } = await getUserDataLagacy()
      await setUserData({ user, pass }, 'zih')
      // Delete old user data
      await chrome.storage.local.remove(['Data'])
      break
    }
    case 3: {
      const legacyKeyBuffer = await getKeyBufferLvl3()
      for (const platform of ['zih', 'slub']) {
        const oldData = await getUserData(platform, legacyKeyBuffer)
        if (!oldData.user || !oldData.pass) continue
        await setUserData(oldData, platform)
      }
      break
    }
  }

  return highestEncryptionLevel
}
