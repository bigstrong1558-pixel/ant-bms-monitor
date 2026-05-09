const crypto = require('crypto');

module.exports = async (req, res) => {
  const { key, res: resource, pid, dn } = req.query;

  if (!key || !resource || !pid || !dn) {
    return res.status(400).json({ code: -1, msg: "缺少参数" });
  }

  try {
    // 生成 authorization token
    const version = "2022-05-01";
    const et = Math.floor(Date.now() / 1000) + 3600;
    const method = "sha1";
    const keyBytes = Buffer.from(key, 'base64');
    const org = et + "\n" + method + "\n" + resource + "\n" + version;
    const signBuf = crypto.createHmac('sha1', keyBytes).update(org).digest('base64');
    const token = `version=${version}&res=${encodeURIComponent(resource)}&et=${et}&method=${method}&sign=${encodeURIComponent(signBuf)}`;

    // 请求 OneNET API
    const resp = await fetch(
      `https://iot-api.heclouds.com/thingmodel/query-device-property?product_id=${pid}&device_name=${dn}`,
      { headers: { authorization: token } }
    );
    const data = await resp.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Content-Type", "application/json");
    res.status(resp.status).send(data);
  } catch (e) {
    res.status(500).json({ code: -1, msg: e.message });
  }
};
