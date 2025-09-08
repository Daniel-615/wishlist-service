const crypto = require("crypto");
function genShareId() {
  return crypto.randomBytes(16).toString("hex"); // 32 chars hex
}
module.exports={
    genShareId
}