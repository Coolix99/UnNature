// Although we can't use the ESM import statements in content scripts we can import types.
import type { CookieSettings, LoginFields, LoginNamespace } from './common'

// "Quicksettings"
const platform = 'zih'
const cookieSettings: CookieSettings = {
  portalName: 'owa',
  domain: 'msx.tu-dresden.de'
};

(async () => {
  const common: LoginNamespace = await import(chrome.runtime.getURL('contentScripts/login/common.js'))

  // For better syntax highlighting import the "Login" type from the common module and change it to "common.Login" when you're done.
  class OWALogin extends common.Login {
    constructor () {
      super(platform, cookieSettings)
    }

    async additionalFunctionsPreCheck (): Promise<void> { }

    async additionalFunctionsPostCheck (): Promise<void> { }

    async findCredentialsError (): Promise<boolean | HTMLElement | Element| null> {
      return document.getElementById('signInErrorDiv')
    }

    async loginFieldsAvailable (): Promise<boolean | LoginFields> {
      const submit = document.querySelector('div.signInEnter div') as HTMLDivElement

      return {
        usernameField: document.getElementById('username') as HTMLInputElement,
        passwordField: document.getElementById('password') as HTMLInputElement,
        submitButton: submit || undefined
      }
    }

    async findLogoutButtons (): Promise<(HTMLElement|Element|null)[] | NodeList | null> {
      // Light Version, we need more advanced stuff for the others
      return [document.getElementById('lo')]
    }
  }

  const login = new OWALogin()
  await login.start()

  // As the logout button is injected dynmically we need to wait for it to be available
  const observer = new MutationObserver((_records, _observer) => {
    // old owa version
    const oldBtn = document.querySelector('[aria-label="Abmelden"]')

    // new owa version
    const allNewBtns = document.querySelectorAll('div[role=menu] button')
    const newBtns = (Array.from(allNewBtns) as HTMLButtonElement[]).filter((btn) => btn.innerText === 'Abmelden' || btn.innerText === 'Logout')

    login.registerLogoutButtonsListener([...newBtns, oldBtn])
  })

  observer.observe(document.body, { subtree: true, childList: true })
})()
