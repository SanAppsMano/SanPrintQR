const redis = require('./redis');
const { ok, bad, reqUid } = require('./utils');

exports.handler = async function(event){
  const uid = reqUid(event);
  if(!uid) return bad(401, 'no uid');
  const queueKey = `user:${uid}:queue`;
  const ids = await redis.lrange(queueKey, 0, -1) || [];
  const jobs = [];
  for(const jobId of ids){
    const str = await redis.get(`job:${jobId}`);
    if(!str) continue;
    const job = JSON.parse(str);
    if(job.status === 'held') jobs.push({ jobId, ...job });
  }
  return ok({jobs});
};
