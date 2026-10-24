// BackupOnSave.js
//
// Version: 0.1
// Author: Vitaliy Dovgan aka DV
//
// *** BackupOnSave: create a .bak file on AKDN_SAVEDOCUMENT_START ***
//

var hWndMain = AkelPad.GetMainWnd();
var oSys = AkelPad.SystemFunction();

var AKD_JS_SCRIPT_STOP   = 0x7CDF; // unique message (must not be equal to any existing AKD_* message)
var UNIQUE_SCRIPT_ID     = 0x1A2BC83F; // unique wParam id to identify _this_ script file

AkelPad.ScriptNoMutex();

var mutexName = "BackupOnSave_js_" + hWndMain;
var hMutex;
if (hMutex = oSys.Call("kernel32::CreateMutex" + _TCHAR, 0, 1, mutexName))
{
  if (oSys.GetLastError() == 183 /*ERROR_ALREADY_EXISTS*/)
  {
    oSys.Call("kernel32::CloseHandle", hMutex); // closes the just opened mutex
    oSys.Call("user32::PostMessage" + _TCHAR, hWndMain, AKD_JS_SCRIPT_STOP, UNIQUE_SCRIPT_ID, 0);
    WScript.Quit();
  }
}

var msgtext;
var hMainSubClass;
if (hMainSubClass = AkelPad.WindowSubClass(1 /*WSC_MAINPROC*/, MainCallback))
{
  AkelPad.WindowGetMessage(); //Message loop

  AkelPad.WindowUnsubClass(1 /*WSC_MAINPROC*/);
}

function MainCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == 0x437 /*AKDN_SAVEDOCUMENT_START*/) // a document is about to be saved
  {
    if (lParam) // (NSAVEDOCUMENT *)
    {
      var pFile = AkelPad.MemRead(lParam, 2 /*DT_QWORD*/); // NSAVEDOCUMENT->pFile
      if (pFile)
      {
        var filePath = AkelPad.MemRead(pFile, _TSTR);
        BackupFile(filePath);
      }
    }
  }
  else if ((uMsg == 0x406 /*AKDN_MAIN_ONFINISH*/)
        || (uMsg == AKD_JS_SCRIPT_STOP && wParam == UNIQUE_SCRIPT_ID))
  {
    oSys.Call("kernel32::CloseHandle", hMutex); // closes the previously created mutex
    oSys.Call("user32::PostQuitMessage", 0); // exit the message loop
  }

  return 0;
}

function BackupFile(filePath)
{
  if (oSys.Call("kernel32::GetFileAttributes" + _TCHAR, filePath) == -1)
    return false; // file does not exist: nothing to backup

  var bakfilePath = filePath + ".bak";
  if (!oSys.Call("kernel32::CopyFile" + _TCHAR, filePath, bakfilePath, 0))
  {
    ShowMessage("CopyFile failed. Error: " + oSys.GetLastError() + "\nFile path: " + filePath);
    return false;
  }

  return true;
}

function ShowMessage(text)
{
  AkelPad.MessageBox(hWndMain, text, "BackupOnSave", 0);
}
