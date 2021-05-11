var pSelText = AkelPad.GetSelText();       // whole selected text
if (pSelText.length > 0)
{
  var arrStr = pSelText.split("\r");       // array of strings
  var numStr = arrStr.length;              // number of strings
  var outText = "";                        // output text
  var i;
  for (i = 0; i < numStr; i++)
  {
    if (!excludeString(arrStr[i]))
    {
      outText += processString(arrStr[i]); // process each string
      if (i < numStr - 1)
        outText += "\r";
    }
  }
  AkelPad.ReplaceSel(outText);             // replace the selected text
}

// user-defined function
function excludeString(s)
{
  // return true to exclude the string s
  return false;
}

// user-defined function
function processString(s)
{
  // modify the string s
  if (s.length > 0)
  {
    //t = s.replace(/ /g, ",");
    //return t;
    return "\"" + s + "\"";
  }

  return "";
}
