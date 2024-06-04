var $ = require('./common');

var jsmd4 = require("js-md4");
var desjs = require("des.js");

/*
 * Generate the LM Hash
 */
function lmhashbuf(inputstr)
{
  /* ASCII --> uppercase */
  var x = inputstr.substring(0, 14).toUpperCase();
  var xl = Buffer.byteLength(x, 'ascii');

  /* null pad to 14 bytes */
  var y = Buffer.alloc(14);
  y.write(x, 0, xl, 'ascii');
  y.fill(0, xl);

  /* insert odd parity bits in key */
  var halves = [
    $.oddpar($.expandkey(y.slice(0, 7))),
    $.oddpar($.expandkey(y.slice(7, 14)))
  ];

  /* DES encrypt magic number "KGS!@#$%" to two
   * 8-byte ciphertexts, (ECB, no padding)
   */
  var buf = Buffer.alloc(16);
  var pos = 0;
  var cts = halves.forEach(function(z) {
    var des = desjs.DES.create({type: 'encrypt', key: z});
    var magicKey = Buffer.from('KGS!@#$%', 'ascii');
    var insertBuff = Buffer.from(des.update(magicKey));
    buf.fill(insertBuff, pos, pos + 8, 'binary');
    pos += 8;
  });

  /* concat the two ciphertexts to form 16byte value,
   * the LM hash */
  return buf;
}

function nthashbuf(str)
{
  /* take MD4 hash of UCS-2 encoded password */
  var ucs2 = Buffer.from(str, 'ucs2');
  var md4 = jsmd4.create();
  md4.update(ucs2);
  return Buffer.from(md4.digest('binary'), 'binary');
}

function lmhash(is)
{
  return $.bintohex(lmhashbuf(is));
}

function nthash(is)
{
  return $.bintohex(nthashbuf(is));
}

module.exports.nthashbuf = nthashbuf;
module.exports.lmhashbuf = lmhashbuf;

module.exports.nthash = nthash;
module.exports.lmhash = lmhash;
