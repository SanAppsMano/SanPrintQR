const redis = require('./redis');
const { parseBody, ok, bad } = require('./utils');

exports.handler = async function(event){
  const body = await parseBody(event);
  const jstr = await redis.get(`job:${body.jobId}`);
  if(!jstr) return bad(404, 'job not found');
  const job = JSON.parse(jstr);
  job.status = body.status;
  if(body.detail) job.detail = body.detail;
  await redis.set(`job:${body.jobId}`, JSON.stringify(job));
  return ok({ok:true});
};
