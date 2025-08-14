const redis = require('./redis');
const { ok, bad } = require('./utils');

exports.handler = async function(event){
  const aid = event.headers['x-agent-id'];
  const secret = event.headers['x-agent-secret'];
  if(!aid || !secret) return bad(401, 'no creds');
  const astr = await redis.get(`agent:${aid}`);
  if(!astr) return bad(401, 'no agent');
  const agent = JSON.parse(astr);
  if(agent.secret !== secret) return bad(401, 'bad secret');
  agent.lastSeen = Date.now();
  await redis.set(`agent:${aid}`, JSON.stringify(agent));
  const cmdStr = await redis.rpop(`agent:${aid}:cmds`);
  if(!cmdStr) return ok({});
  return ok({cmd: JSON.parse(cmdStr)});
};
