export type DemoUser = {
  fullName: string
  email: string
}

type StoredAccount = DemoUser & {
  salt: string
  passwordHash: string
  createdAt?: string
}

const accountsKey = 'evermine.demo.accounts'
const localSessionKey = 'evermine.demo.session'
const tabSessionKey = 'evermine.demo.tab-session'
const iterations = 120_000

function readAccounts(): StoredAccount[] {
  const raw = localStorage.getItem(accountsKey)
  if (!raw) return []

  const parsed: unknown = JSON.parse(raw)
  if (
    !Array.isArray(parsed) ||
    !parsed.every(
      (account): account is StoredAccount =>
        typeof account === 'object' &&
        account !== null &&
        'fullName' in account &&
        typeof account.fullName === 'string' &&
        'email' in account &&
        typeof account.email === 'string' &&
        'salt' in account &&
        typeof account.salt === 'string' &&
        'passwordHash' in account &&
        typeof account.passwordHash === 'string',
    )
  ) {
    throw new Error('Your local demo account data could not be read.')
  }
  return parsed
}

function toBytes(hex: string): Uint8Array {
  return Uint8Array.from({ length: hex.length / 2 }, (_, index) =>
    Number.parseInt(hex.slice(index * 2, index * 2 + 2), 16),
  )
}

function toHex(bytes: Uint8Array): string {
  return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('')
}

async function hashPassword(password: string, salt: Uint8Array): Promise<string> {
  const key = await crypto.subtle.importKey(
    'raw',
    new TextEncoder().encode(password),
    'PBKDF2',
    false,
    ['deriveBits'],
  )
  const saltBuffer = new ArrayBuffer(salt.byteLength)
  new Uint8Array(saltBuffer).set(salt)
  const bits = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt: new Uint8Array(saltBuffer), iterations, hash: 'SHA-256' },
    key,
    256,
  )
  return toHex(new Uint8Array(bits))
}

function saveSession(user: DemoUser, rememberMe: boolean): void {
  const destination = rememberMe ? localStorage : sessionStorage
  const other = rememberMe ? sessionStorage : localStorage
  other.removeItem(rememberMe ? tabSessionKey : localSessionKey)
  destination.setItem(
    rememberMe ? localSessionKey : tabSessionKey,
    JSON.stringify(user),
  )
}

export function readSession(): DemoUser | null {
  const raw =
    localStorage.getItem(localSessionKey) ??
    sessionStorage.getItem(tabSessionKey)
  if (!raw) return null

  try {
    const parsed: unknown = JSON.parse(raw)
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'fullName' in parsed &&
      typeof parsed.fullName === 'string' &&
      'email' in parsed &&
      typeof parsed.email === 'string'
    ) {
      return { fullName: parsed.fullName, email: parsed.email }
    }
  } catch {
    localStorage.removeItem(localSessionKey)
    sessionStorage.removeItem(tabSessionKey)
  }
  return null
}

export function getDemoAccountCreatedAt(email: string): string | null {
  const account = readAccounts().find((item) => item.email === email.toLowerCase())
  return account?.createdAt ?? null
}

export function updateDemoProfileName(email: string, fullName: string): DemoUser {
  const normalizedEmail = email.trim().toLowerCase()
  const name = fullName.trim()
  if (!name) throw new Error('Enter your full name.')
  const accounts = readAccounts()
  const index = accounts.findIndex((account) => account.email === normalizedEmail)
  if (index < 0) throw new Error('This local demo account could not be updated.')

  accounts[index] = { ...accounts[index], fullName: name }
  localStorage.setItem(accountsKey, JSON.stringify(accounts))
  const updatedUser = { fullName: name, email: normalizedEmail }
  const session = readSession()
  if (session?.email === normalizedEmail) {
    const rememberMe = localStorage.getItem(localSessionKey) !== null
    saveSession(updatedUser, rememberMe)
  }
  return updatedUser
}

export async function registerDemoAccount(
  fullName: string,
  email: string,
  password: string,
): Promise<DemoUser> {
  const accounts = readAccounts()
  const normalizedEmail = email.trim().toLowerCase()
  if (accounts.some((account) => account.email === normalizedEmail)) {
    throw new Error('An account with this email already exists on this device.')
  }

  const salt = crypto.getRandomValues(new Uint8Array(16))
  const account: StoredAccount = {
    fullName: fullName.trim(),
    email: normalizedEmail,
    salt: toHex(salt),
    passwordHash: await hashPassword(password, salt),
    createdAt: new Date().toISOString(),
  }
  localStorage.setItem(accountsKey, JSON.stringify([...accounts, account]))
  const user = { fullName: account.fullName, email: account.email }
  saveSession(user, true)
  return user
}

export async function signInDemo(
  email: string,
  password: string,
  rememberMe: boolean,
): Promise<DemoUser> {
  const normalizedEmail = email.trim().toLowerCase()
  const account = readAccounts().find((item) => item.email === normalizedEmail)
  if (!account) throw new Error('No local demo account was found for this email.')

  const passwordHash = await hashPassword(password, toBytes(account.salt))
  if (passwordHash !== account.passwordHash) {
    throw new Error('That password does not match this local demo account.')
  }

  const user = { fullName: account.fullName, email: account.email }
  saveSession(user, rememberMe)
  return user
}

export async function resetDemoPassword(
  email: string,
  password: string,
): Promise<void> {
  const normalizedEmail = email.trim().toLowerCase()
  const accounts = readAccounts()
  const index = accounts.findIndex((account) => account.email === normalizedEmail)
  if (index < 0) throw new Error('No local demo account was found for this email.')

  const salt = crypto.getRandomValues(new Uint8Array(16))
  accounts[index] = {
    ...accounts[index],
    salt: toHex(salt),
    passwordHash: await hashPassword(password, salt),
  }
  localStorage.setItem(accountsKey, JSON.stringify(accounts))
}

export function clearDemoSession(): void {
  localStorage.removeItem(localSessionKey)
  sessionStorage.removeItem(tabSessionKey)
}
