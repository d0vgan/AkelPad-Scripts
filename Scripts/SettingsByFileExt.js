var hWndMain = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

var AKD_JS_SCRIPT_STOP   = 0x7CDE; // unique message (must not be equal to any existing AKD_* message)
var UNIQUE_SCRIPT_ID     = 0x1A2BC82F; // unique wParam id to identify _this_ script file

AkelPad.ScriptNoMutex();

var mutexName = "SettingsByFileExt_js_" + hWndMain;
var hMutex;
if (hMutex = oSys.Call("kernel32::CreateMutex" + _TCHAR, 0, 1, mutexName))
{
  if (oSys.GetLastError() == 183 /*ERROR_ALREADY_EXISTS*/)
  {
    oSys.Call("kernel32::CloseHandle", hMutex);
    oSys.Call("user32::PostMessage" + _TCHAR, hWndMain, AKD_JS_SCRIPT_STOP, UNIQUE_SCRIPT_ID, 0);
    WScript.Quit();
  }
}

applySettingsForFile();

var hMainSubClass;
if (hMainSubClass = AkelPad.WindowSubClass(1 /*WSC_MAINPROC*/, MainCallback))
{
  AkelPad.WindowGetMessage(); //Message loop

  AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
}

function MainCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 0x416 /*AKDN_FRAME_ACTIVATE*/
   || uMsg == 0x436 /*AKDN_OPENDOCUMENT_FINISH*/
   || uMsg == 0x438 /*AKDN_SAVEDOCUMENT_FINISH*/)
  {
    applySettingsForFile();
  }
  else if ((uMsg == 0x406 /*AKDN_MAIN_ONFINISH*/)
        || (uMsg == AKD_JS_SCRIPT_STOP && wParam == UNIQUE_SCRIPT_ID))
  {
    oSys.Call("user32::PostQuitMessage", 0); // exit the message loop
  }

  return 0;
}

function applySettingsForFile()
{
  var filePath = AkelPad.GetEditFile(0);
  var fileExt = getFileExt(filePath).toLowerCase();

  if (fileExt == "py")
  {
    // Always replacing Tabs with Spaces:
    var bTabStopAsSpaces = AkelPad.SendMessage(hWndMain, 1223 /*AKD_GETFRAMEINFO*/, 53 /*FI_TABSTOPASSPACES*/, 0);
    if (!bTabStopAsSpaces)
    {
      AkelPad.SetFrameInfo(0, 2 /*FIS_TABSTOPASSPACES*/, 1);
    }
  }
}

function getFileExt(filePathName) // file extension w/o leading '.'
{
  var n = filePathName.lastIndexOf(".");
  return (n >= 0) ? filePathName.substr(n + 1) : "";
}
