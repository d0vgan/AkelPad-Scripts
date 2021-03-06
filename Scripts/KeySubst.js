/*****************************************************************************
 *  KeySubst.js  v.0.9                                                       *
 *  (C) DV, May-June 2011, Oct 2012                                          *
 *  Thanks to: Instructor, FeyFre                                            *
 *****************************************************************************/
/*  Examples:
     -"En->Ru,Ru->En" Call("Scripts::Main", 1, "KeySubst.js", `-to=rus,eng`)
     -"En->Uk,Uk->En" Call("Scripts::Main", 1, "KeySubst.js", `-to=ukr,eng`)
     -"En->Ru,Uk->Ru" Call("Scripts::Main", 1, "KeySubst.js", `-to=rus,rus`)
     -"En->Uk,Ru->Uk" Call("Scripts::Main", 1, "KeySubst.js", `-to=ukr,ukr`)
     -"En->En,Uk->Ru" Call("Scripts::Main", 1, "KeySubst.js", `-to=eng,rus`)
     -"En->En,Ru->Uk" Call("Scripts::Main", 1, "KeySubst.js", `-to=eng,ukr`)
    To deactivate the script, use Ctrl+~ (VK_CONTROL+VK_OEM_3).
 *****************************************************************************/

var alph = [
 /* eng=0 */ [ "`1234567890-=\\qwertyuiop[]asdfghjkl;\'zxcvbnm,./`",
               "~!@#$%^&*()_+|QWERTYUIOP{}ASDFGHJKL:\"ZXCVBNM<>?~",
               // special key combinations...
               "\u0055",
               "\u0055" ],
 /* rus=1 */ [ "ё1234567890-=\\йцукенгшщзхъфывапролджэячсмитьбю.ё",
               "Ё!\"№;%:?*()_+/ЙЦУКЕНГШЩЗХЪФЫВАПРОЛДЖЭЯЧСМИТЬБЮ,Ё",
               // special key combinations...
               "\u0055",
               "\u0055" ],
 /* ukr=2 */ [ "\'1234567890-=\\йцукенгшщзхїфівапролджєячсмитьбю.ё",
               "\'!\"№;%:?*()_+/ЙЦУКЕНГШЩЗХЇФІВАПРОЛДЖЄЯЧСМИТЬБЮ,Ё",
               // special key combinations...
               "ґ",
               "Ґ" ]
]; // Note: trailing 'ё' is needed for Ukrainian because of ` to ' hack.

var eng = 0;
var rus = 1;
var ukr = 2;

var default_langTo1 = rus; // rus: En->Ru
var default_langTo2 = eng; // eng: Ru->En,Uk->En
var langTo1 = -1;
var langTo2 = -1;
var argLangTo = getScriptArg("-to").toLowerCase().split(",");
if (argLangTo.length > 0)
{
  langTo1 = getLang(argLangTo[0]);
  if (argLangTo.length > 1)
  {
    langTo2 = getLang(argLangTo[1]);
  }
}
var hWndMain = AkelPad.GetMainWnd();
var hWndEdit = AkelPad.GetEditWnd();
var oSys = AkelPad.SystemFunction();

AkelPad.ScriptNoMutex();

var mutexName = "KeySubst_js_" + hWndMain;
var hMutex;
if (hMutex = oSys.Call("kernel32::CreateMutex" + _TCHAR, 0, 1, mutexName))
{
  if (oSys.GetLastError() == 183 /*ERROR_ALREADY_EXISTS*/)
  {
    oSys.Call("kernel32::CloseHandle", hMutex);
    oSys.Call("user32::SendMessage" + _TCHAR, hWndEdit, 0x0100 /*WM_KEYDOWN*/, 0xC0, 0);
    WScript.Quit();
  }
}

var hEditSubClass;
if (hEditSubClass = AkelPad.WindowSubClass(2 /*WSC_EDITPROC*/, EditCallback))
{
  //Message loop
  AkelPad.WindowGetMessage();

  AkelPad.WindowUnsubClass(2 /*WSC_EDITPROC*/);
  oSys.Call("kernel32::CloseHandle", hMutex);
}

function EditCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 0x0102 /*WM_CHAR*/)
  {
    var ch = convertSymbolCode(hWnd, wParam, 0);
    if (ch != 0)
    {
      AkelPad.WindowNextProc(hEditSubClass, hWnd, uMsg, ch, lParam);
      AkelPad.SendMessage(hWnd, 3377 /*AEM_UPDATECARET*/, 0, 0);
      AkelPad.WindowNoNextProc(hEditSubClass);
      return 1; // processed
    }
  }
  else if ( (uMsg == 0x0100 /*WM_KEYDOWN*/) ||
            (uMsg == 0x0104 /*WM_SYSKEYDOWN*/) )
  {
    var nCtrlState = oSys.Call("user32::GetKeyState", 0x11 /*VK_CONTROL: Ctrl*/);
    var nAltState = oSys.Call("user32::GetKeyState", 0x12 /*VK_MENU: Alt*/)
    var nAltGrState = oSys.Call("user32::GetKeyState", 0xA5 /*VK_RMENU: AltGr*/)

    if (wParam == 0xC0 /*VK_OEM_3: (`~)*/)
    {
      if ((lParam == 0) || ((nCtrlState & 0x80) && !(nAltState & 0x80)))
      {
        //Exit message loop
        oSys.Call("user32::PostQuitMessage", 0);
        return 1; // processed
      }
    }

    var nSet = 0;
    if (((nCtrlState & 0x80) && (nAltState & 0x80)) ||
        (nAltGrState & 0x80))
    {
      nSet = 1;
    }
    // check special key combinations...
    if (nSet != 0)
    {
      var ch = convertSymbolCode(hWnd, wParam, nSet);
      if (ch != 0)
      {
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, 0x0102 /*WM_CHAR*/, ch, lParam);
        return 1; // processed
      }
    }
  }
  return 0;
}

function convertSymbolCode(hWnd, wParam, nSet)
{
  var nLangId = getEditLangId(hWnd);
  var nLangFrom = eng;
  var nLangTo = (langTo1 == -1) ? default_langTo1 : langTo1;
  if (nLangId == 1049) /* rus */
  {
    nLangFrom = rus;
    nLangTo = (langTo2 == -1) ? default_langTo2 : langTo2;
  }
  else if (nLangId == 1058) /* ukr */
  {
    nLangFrom = ukr;
    nLangTo = (langTo2 == -1) ? default_langTo2 : langTo2;
  }

  if (nLangTo != nLangFrom)
  {
    if (nSet == 0)
    {
      // characters
      var nCase = 0;
      var ch = String.fromCharCode(wParam);
      var i = alph[nLangFrom][nCase].indexOf(ch);
      if (i < 0)
      {
        nCase = 1;
        i = alph[nLangFrom][nCase].indexOf(ch);
      }
      if (i >= 0)
      {
        if (i < alph[nLangTo][nCase].length)
        {
          ch = alph[nLangTo][nCase].charCodeAt(i);
          return ch;
        }
      }
    }
    else
    {
      // codes
      var nShiftState = oSys.Call("user32::GetKeyState", 0x10 /*VK_SHIFT: Shift*/);
      var nCase = (nShiftState & 0x80) ? (2*nSet + 1) : (2*nSet);
      var i;
      for (i = 0; i < alph[nLangFrom][nCase].length; i++)
      {
        if (alph[nLangFrom][nCase].charCodeAt(i) == wParam)
        {
          var ch = alph[nLangTo][nCase].charCodeAt(i);
          if (ch != wParam)
            return ch;
        }
      }
    }
  }
  return 0;
}

function getEditLangId(hEdit)
{
  var nEditThreadId = oSys.Call("user32::GetWindowThreadProcessId", hEdit, 0);
  var nLang = oSys.Call("user32::GetKeyboardLayout", nEditThreadId);
  return (nLang & 0xFFFF);
}

function getLang(s)
{
  var lang = -1;
  if (s == "eng")
    lang = eng;
  else if (s == "rus")
    lang = rus;
  else if (s == "ukr")
    lang = ukr;
  return lang;
}

function getScriptArg(argName)
{
  var s = "";
  argName = argName.toLowerCase();
  for (var n = 0; n < WScript.Arguments.length; n++)
  {
    var t = WScript.Arguments(n);
    var a = t.split("=");
    if (a[0].toLowerCase() == argName)
    {
      s = a[1];
      break;
    }
  }
  return s;
}
