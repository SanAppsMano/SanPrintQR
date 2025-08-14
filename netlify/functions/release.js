const { parseBody, ok, bad, reqUid } = require('./utils');
const redis = require('./redis');

exports.handler = async function(event){
  const uid = reqUid(event);
  if(!uid) return bad(401, 'no uid');
  const b = await parseBody(event);
  const jstr = await redis.get(`job:${b.jobId}`);
  if(!jstr) return bad(404, 'job not found');
  const job = JSON.parse(jstr);
  if(job.ownerUid !== uid || job.status !== 'held') return bad(400, 'invalid');
  const pstr = await redis.get(`printer:${b.pid}`);
  if(!pstr) return bad(404, 'printer not found');
  const printer = JSON.parse(pstr);
  const cmd = {cmd:'PRINT', jobId:b.jobId, filePath:job.filePath, printerName:printer.printerName};
  await redis.lpush(`agent:${printer.agentId}:cmds`, JSON.stringify(cmd));
  job.status = 'printing';
  await redis.set(`job:${b.jobId}`, JSON.stringify(job));
  return ok({ok:true});
};
