const $ = s => document.querySelector(s);
const Store = {
  get(k,fb){ try{ const v=localStorage.getItem(k); return v?JSON.parse(v):fb; }catch{ return fb; } }
};

const SESSION_KEY = 'frango_admin_session';
if(localStorage.getItem(SESSION_KEY) === 'ok'){
  window.location.href = 'frangoadm.html';
}
if(!localStorage.getItem('frango_config')){
  localStorage.setItem('frango_config', JSON.stringify(CONFIG));
}

document.addEventListener('DOMContentLoaded', () => {
  const form = $('#loginForm');
  if(!form) return;

  form.addEventListener('submit', e => {
    e.preventDefault();
    const user = $('#loginUser').value.trim();
    const pass = $('#loginPass').value;
    const cfg = Store.get('frango_config', CONFIG);

    const adminUser = cfg.admin?.user || 'frango';
    const adminPass = cfg.admin?.pass || 'dourado2025';

    if(user === adminUser && pass === adminPass){
      localStorage.setItem(SESSION_KEY, 'ok');
      window.location.href = 'frangoadm.html';
    } else {
      $('#loginError').textContent = '❌ Credenciais inválidas.';
      $('#loginPass').value = '';
      $('#loginPass').focus();
    }
  });
});