import {
  auth, createAccount, signIn, sendPasswordReset, signOutAccount,
  onAuthStateChanged, syncApiSession
} from './firebase-auth.js';

const $ = selector => document.querySelector(selector);
let mode = 'signin';
let busy = false;

function setStatus(message, state = 'info') {
  const status = $('#accountStatus');
  status.textContent = message;
  status.dataset.state = state;
  status.hidden = !message;
}

function setMode(nextMode) {
  mode = nextMode;
  const registering = mode === 'register';
  $('#nameField').hidden = !registering;
  $('#password').autocomplete = registering ? 'new-password' : 'current-password';
  $('#accountTitle').textContent = registering ? 'Criar conta de cliente' : 'Entrar na sua conta';
  $('#accountIntro').textContent = registering
    ? 'Crie a sua identidade SOURCE AO para usar no website e na aplicação.'
    : 'Aceda à sua área SOURCE AO.';
  $('#submitAccount').textContent = registering ? 'Criar conta' : 'Entrar';
  $('#toggleMode').textContent = registering ? 'Já tenho conta' : 'Criar conta de cliente';
  setStatus('');
}

function friendlyError(error) {
  const code = String(error?.code || '');
  const messages = {
    'auth/email-already-in-use': 'Este e-mail já tem uma conta. Entre com a palavra-passe ou recupere-a.',
    'auth/invalid-email': 'O formato do e-mail não é válido.',
    'auth/weak-password': 'Escolha uma palavra-passe com pelo menos 8 caracteres.',
    'auth/invalid-credential': 'E-mail ou palavra-passe incorrectos.',
    'auth/user-disabled': 'Esta conta está desactivada. Contacte a HMATIAS.',
    'auth/too-many-requests': 'Foram feitas demasiadas tentativas. Aguarde e tente novamente.',
    'auth/network-request-failed': 'Não foi possível ligar ao Firebase. Verifique a ligação à Internet.',
  };
  return messages[code] || error?.message || 'Não foi possível concluir a operação.';
}

function renderSignedIn(user, identity = null) {
  $('#signedOutPanel').hidden = true;
  $('#signedInPanel').hidden = false;
  $('#accountEmail').textContent = user.email || user.displayName || user.uid;
  $('#accountRole').textContent = identity
    ? 'Perfil SOURCE AO: ' + identity.role
    : 'Conta Firebase activa; a sincronização do perfil está pendente.';
  $('#verificationState').textContent = user.emailVerified
    ? 'E-mail verificado.'
    : 'E-mail ainda não verificado. Consulte a mensagem de verificação enviada.';
}

function renderSignedOut() {
  $('#signedOutPanel').hidden = false;
  $('#signedInPanel').hidden = true;
}

$('#toggleMode').addEventListener('click', () => setMode(mode === 'signin' ? 'register' : 'signin'));

$('#accountForm').addEventListener('submit', async event => {
  event.preventDefault();
  if (busy) return;
  const email = $('#email').value.trim();
  const password = $('#password').value;
  const displayName = $('#displayName').value.trim();
  if (!email || !password || (mode === 'register' && displayName.length < 2)) {
    setStatus('Preencha o e-mail, a palavra-passe e o nome para criar a conta.', 'error');
    return;
  }
  busy = true;
  $('#submitAccount').disabled = true;
  setStatus(mode === 'register' ? 'A criar a conta…' : 'A iniciar sessão…');
  try {
    const user = mode === 'register'
      ? await createAccount(email, password, displayName)
      : await signIn(email, password);
    renderSignedIn(user);
    setStatus(
      mode === 'register'
        ? 'Conta criada. Enviámos uma mensagem para verificar o e-mail. A sua identidade foi registada no SOURCE AO.'
        : 'Sessão iniciada e perfil SOURCE AO sincronizado.',
      'success',
    );
  } catch (error) {
    setStatus(friendlyError(error), 'error');
  } finally {
    busy = false;
    $('#submitAccount').disabled = false;
  }
});

$('#resetPassword').addEventListener('click', async () => {
  const email = $('#email').value.trim();
  if (!email) {
    setStatus('Introduza primeiro o seu e-mail para receber a ligação de recuperação.', 'error');
    $('#email').focus();
    return;
  }
  try {
    await sendPasswordReset(email);
    setStatus('Se existir uma conta para este e-mail, o Firebase enviará uma ligação de recuperação.', 'success');
  } catch (error) {
    setStatus(friendlyError(error), 'error');
  }
});

$('#signOut').addEventListener('click', async () => {
  try {
    await signOutAccount();
    setStatus('Sessão terminada.', 'success');
  } catch (error) {
    setStatus(friendlyError(error), 'error');
  }
});

onAuthStateChanged(auth, async user => {
  if (!user) {
    renderSignedOut();
    return;
  }
  renderSignedIn(user);
  try {
    const identity = await syncApiSession(user);
    renderSignedIn(user, identity);
  } catch (error) {
    setStatus(error?.message || 'Conta Firebase activa, mas a sincronização com a API SOURCE AO falhou.', 'error');
  }
});

setMode('signin');
