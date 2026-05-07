const API_HOST = "https://iot-api.heclouds.com";

export default async function handler(req, res) {
  const { key, res: resource, pid, dn } = req.query;

  if (!key || !resource || !pid || !dn) {
    return res.status(400).json({ code: -1, msg: "缺少参数" });
  }

  try {
    // 生成 authorization token
    const version = "2022-05-01";
    const et = Math.floor(Date.now() / 1000) + 3600;
    const method = "sha1";
    const keyBytes = Uint8Array.from(atob(key), c => c.charCodeAt(0));
    const org = et + "\n" + method + "\n" + resource + "\n" + version;
    const signBuf = await crypto.subtle.sign(
      { name: "HMAC", hash: "SHA-1" },
      await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-1" }, false, ["sign"]),
      new TextEncoder().encode(org)
    );
    const sign = btoa(String.fromCharCode(...new Uint8Array(signBuf)));
    const token = `version=${version}&res=${encodeURIComponent(resource)}&et=${et}&method=${method}&sign=${encodeURIComponent(sign)}`;

    // 请求 OneNET API
    const resp = await fetch(
      `${API_HOST}/thingmodel/query-device-property?product_id=${pid}&device_name=${dn}`,
      { headers: { authorization: token } }
    );
    const data = await resp.text();

    res.setHeader("Access-Control-Allow-Origin", "*");
    res.status(resp.status).send(data);
  } catch (e) {
    res.status(500).json({ code: -1, msg: e.message });
  }
}
