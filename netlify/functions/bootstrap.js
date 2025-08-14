const redis = require('./redis');
const { ok, bad } = require('./utils');

exports.handler = async function(event){
  const parts = event.path.split('/');
  const pid = parts[parts.length - 2];
  const str = await redis.get(`printer:${pid}`);
  if(!str) return bad(404, 'not found');
  const printer = JSON.parse(str);
  return ok({printer});
};
