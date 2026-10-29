// ConvertPathSlashes.js
//
// Version: 0.1
// Author: Vitaliy Dovgan aka DV
//
// *** ConvertPathSlashes: converts '/' to '\', or vice versa ***
//
// Note: This functionality is already integrated into Converter.js by Infocatcher:
// https://github.com/Infocatcher/AkelPad_scripts/blob/master/converter.js
// so prefer Converter.js to ConvertPathSlashes.js.
//

var s = AkelPad.GetSelText();
var i1 = s.indexOf("\\");
var i2 = s.indexOf("/");
var from = "";
var to = "";

if (i1 >= 0 && (i2 < 0 || i1 < i2))
{
  from = /\\/g;
  to = "/";
}
else if (i2 >= 0 && (i1 < 0 || i2 < i1))
{
  from = /\//g;
  to = "\\";
}

if (from != "")
{
  s = s.replace(from, to);
  AkelPad.ReplaceSel(s, -1 /*RST_SELECT*/);
}
