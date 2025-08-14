const { parseBody, ok, bad, reqUid } = require('./utils');
const redis = require('./redis');

function id(){ return Math.random().toString(36).slice(2,10); }

exports.handler = async function(event){
  const uid = reqUid(event);
  if(!uid) return bad(401, 'no uid');
  const body = await parseBody(event);
  const jobId = id();
  const job = {
    ownerUid: uid,
    filename: body.filename,
    filePath: body.filePath,
    pages: body.pages,
    submittedAt: Date.now(),
    status: 'held'
  };
  await redis.set(`job:${jobId}`, JSON.stringify(job));
  await redis.lpush(`user:${uid}:queue`, jobId);
  return ok({jobId});
};
