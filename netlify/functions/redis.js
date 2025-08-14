const base = process.env.UPSTASH_REDIS_REST_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN;

async function redis(cmd, ...args){
  const url = base + '/' + cmd + '/' + args.map(a => encodeURIComponent(a)).join('/');
  const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
  const data = await res.json();
  if(data.error) throw new Error(data.error);
  return data.result;
}

module.exports = {
  get: key => redis('get', key),
  set: (key, val) => redis('set', key, typeof val === 'string' ? val : JSON.stringify(val)),
  lpush: (key, val) => redis('lpush', key, typeof val === 'string' ? val : JSON.stringify(val)),
  lrange: (key, start, stop) => redis('lrange', key, start, stop),
  rpop: key => redis('rpop', key)
};
