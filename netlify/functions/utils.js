function ok(body){
  return { statusCode: 200, body: JSON.stringify(body) };
}

function bad(status, msg){
  return { statusCode: status, body: JSON.stringify({error: msg}) };
}

async function parseBody(event){
  try { return JSON.parse(event.body || '{}'); } catch(e){ return {}; }
}

function reqUid(event){
  return event.headers['x-uid'];
}

module.exports = { ok, bad, parseBody, reqUid };
