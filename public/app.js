function getUser(){
  const raw = localStorage.getItem('user');
  return raw ? JSON.parse(raw) : null;
}

function requireLogin(){
  if(!getUser()){
    localStorage.setItem('afterLogin', location.pathname + location.search);
    location.href = '/login.html';
  }
}

function uid(){
  const u = getUser();
  return u ? u.uid : null;
}

async function api(path, opts={}){
  opts.headers = opts.headers || {};
  const u = getUser();
  if(u) opts.headers['x-uid'] = u.uid;
  if(opts.body && typeof opts.body !== 'string'){
    opts.body = JSON.stringify(opts.body);
    opts.headers['Content-Type'] = 'application/json';
  }
  const res = await fetch(path, opts);
  if(!res.ok) throw new Error('API error');
  if(res.status === 204) return;
  return res.json();
}
