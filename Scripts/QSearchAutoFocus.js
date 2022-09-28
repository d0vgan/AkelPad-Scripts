var hWndMain = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

var AKD_JS_QSEARCH_FOCUS = 0x7ABC; // unique message (must not be equal to any existing AKD_* message)
var AKD_JS_SCRIPT_STOP   = 0x7CCC; // unique message (must not be equal to any existing AKD_* message)
var UNIQUE_QS_ID         = 0x1A2BC71E; // unique wParam id to identify _this_ script file

AkelPad.ScriptNoMutex();

var mutexName = "QSearchAutoFocus_js_" + hWndMain;
var hMutex;
if (hMutex = oSys.Call("kernel32::CreateMutex" + _TCHAR, 0, 1, mutexName))
{
  if (oSys.GetLastError() == 183 /*ERROR_ALREADY_EXISTS*/)
  {
    oSys.Call("kernel32::CloseHandle", hMutex);
    oSys.Call("user32::PostMessage" + _TCHAR, hWndMain, AKD_JS_SCRIPT_STOP, UNIQUE_QS_ID, 0);
    WScript.Quit();
  }
}

var hMainSubClass;
if (hMainSubClass = AkelPad.WindowSubClass(1 /*WSC_MAINPROC*/, MainCallback))
{
  AkelPad.WindowGetMessage(); //Message loop

  AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
}

function MainCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 0x436 /*AKDN_OPENDOCUMENT_FINISH*/
   || uMsg == 0x416 /*AKDN_FRAME_ACTIVATE*/)
  {
    AkelPad.WindowNextProc(hMainSubClass, hWnd, uMsg, wParam, lParam); // default processing
    oSys.Call("user32::PostMessage" + _TCHAR, hWnd, AKD_JS_QSEARCH_FOCUS, UNIQUE_QS_ID, 0);
    AkelPad.WindowNoNextProc(hMainSubClass); // skip it
  }
  else if (uMsg == AKD_JS_QSEARCH_FOCUS && wParam == UNIQUE_QS_ID)
  {
    if (AkelPad.IsPluginRunning("QSearch::QSearch"))
    {
      AkelPad.Call("QSearch::QSearch"); // hides QSearch when "hotkey_hides_panel" is "1"
    }
    AkelPad.Call("QSearch::QSearch");
    AkelPad.SendMessage(hWndMain, 0x0111 /*WM_COMMAND*/, 0, 0); // "empty" command to update the Toolbar
  }
  else if ((uMsg == 0x406 /*AKDN_MAIN_ONFINISH*/)
        || (uMsg == AKD_JS_SCRIPT_STOP && wParam == UNIQUE_QS_ID))
  {
    oSys.Call("user32::PostQuitMessage", 0); // exit the message loop
  }

  return 0;
}
