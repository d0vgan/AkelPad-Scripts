// http://akelpad.sourceforge.net/forum/viewtopic.php?p=35541#35541
// Version: 0.4.2
// Author: Vitaliy Dovgan aka DV
//
// *** Go To Anything: Switch to file / go to line / find text ***
//
//

/*
Syntax:

  filename      - switch to a file containing "filename" in its name
  filename:123  - switch to a file containing "filename" in its name
                   and go to line 123
  filename@text - switch to a file containing "filename" in its name
                   and find "text" in it, from the beginning
  filename#text - switch to a file containing "filename" in its name
                   and find "text" in it, from the current position
  :123          - go to line 123 in the current file
  @text         - find "text" in the current file, from the beginning
  #text         - find "text" in the current file, from the current position

Keys:

  Enter    - close and stay where we are
  Esc      - close and return to the original file and position in that file
  F3       - find next (down), works with @text and #text
  Shift+F3 - find previous (up), works with @text and #text

Item prefixes in the list:

  [A] marks currently opened files.
  [F] marks files from the Favourites (see below).
  [H] marks files from the Recent Files History.

Favourites:

  1. Create a text file "GoToAnything.fav" near the script "GoToAnything.js".
     It is recommended to use the UTF-16 LE encoding for this text file.
  2. Specify full paths to your "favourite" files inside "GoToAnything.fav",
     one path per line. For example:
       %a\AkelFiles\Docs\ContextMenu-Rus.txt
       %a\AkelFiles\Docs\Scripts-Rus.txt
       %a\AkelFiles\Plugs\Scripts\GoToAnything.fav
       %TEMP%\temporary.txt
       %APPDATA%\SMath\settings.inf
  3. Leading and trailing spaces are ignored.
  4. Special character %a means AkelPad's root directory.
  5. Environment variables %var% are substituted.

*/

//Options (static configuration)
var Options = {
  Char_GoToText1 : "@",
  Char_GoToText2 : "#",
  Char_GoToLine  : ":",
  ApplyColorTheme : true,
  IsTransparent : false, // whether the popup dialog is tranparent
  OpaquePercent : 80, // applies when IsTransparent is `true`
  SaveDlgPosSize : true, // whether to save the popup dialog position and size
  SaveLastFilter : false, // whether to save the last filter
  PathDepth : 4, // path depth of items in the file list
  CheckIfFavouriteFileExist : true, // check if files from Favourites exist
  CheckIfRecentFileExist : true, // check if files from Recent Files exist
  ShowItemPrefixes : true  // whether to show the [A], [F] and [H] prefixes
}

//Windows Constants
var TRUE  = 1;
var FALSE = 0;
var VK_BACK     = 0x08; // BackSpace
var VK_TAB      = 0x09;
var VK_RETURN   = 0x0D; // Enter
var VK_SHIFT    = 0x10; // Shift
var VK_CONTROL  = 0x11; // Ctrl
var VK_ESCAPE   = 0x1B;
var VK_PRIOR    = 0x21; // Page Up
var VK_NEXT     = 0x22; // Page Down
var VK_END      = 0x23;
var VK_HOME     = 0x24;
var VK_LEFT     = 0x25;
var VK_UP       = 0x26;
var VK_RIGHT    = 0x27;
var VK_DOWN     = 0x28;
var VK_DELETE   = 0x2E;
var VK_F3       = 0x72;
var HWND_DESKTOP = 0;
var SW_HIDE    = 0;
var SW_SHOWNA  = 8;
var SW_RESTORE = 9;

//Windows Messages
var WM_CREATE          = 0x0001;
var WM_DESTROY         = 0x0002;
var WM_SIZE            = 0x0005;
var WM_ACTIVATE        = 0x0006;
var WM_SETFOCUS        = 0x0007;
var WM_SETREDRAW       = 0x000B;
var WM_CLOSE           = 0x0010;
var WM_SETFONT         = 0x0030;
var WM_GETFONT         = 0x0031;
var WM_NOTIFY          = 0x004E;
var WM_KEYDOWN         = 0x0100;
var WM_CHAR            = 0x0102;
var WM_SYSKEYDOWN      = 0x0104;
var WM_COMMAND         = 0x0111;
var WM_CTLCOLOREDIT    = 0x0133;
var WM_CTLCOLORLISTBOX = 0x0134;
var WM_LBUTTONDOWN     = 0x0201;
var WM_USER            = 0x0400;
var EM_GETSEL          = 0x00B0;
var EM_SETSEL          = 0x00B1;
var EM_LINESCROLL      = 0x00B6;
var EM_REPLACESEL      = 0x00C2;
var EM_GETFIRSTVISIBLELINE = 0x00CE;
var LB_ADDSTRING       = 0x0180;
var LB_RESETCONTENT    = 0x0184;
var LB_SETCURSEL       = 0x0186;
var LB_GETCURSEL       = 0x0188;
var LB_GETTEXT         = 0x0189;
var LB_GETITEMDATA     = 0x0199;
var LB_SETITEMDATA     = 0x019A;
var LBN_DBLCLK         = 2;

//Windows Styles
var WS_TABSTOP  = 0x00010000;
var WS_SIZEBOX  = 0x00040000;
var WS_SYSMENU  = 0x00080000;
var WS_HSCROLL  = 0x00100000;
var WS_VSCROLL  = 0x00200000;
var WS_BORDER   = 0x00800000;
var WS_CAPTION  = 0x00C00000;
var WS_VISIBLE  = 0x10000000;
var WS_CHILD    = 0x40000000;
var WS_POPUP    = 0x80000000;
var WS_EX_LAYERED = 0x00080000;
var ES_AUTOHSCROLL  = 0x0080;
var LBS_NOTIFY      = 0x0001;
var LBS_SORT        = 0x0002;
var LBS_USETABSTOPS = 0x0080;

//AkelPad Constants
var DT_ANSI = 0;
var DT_UNICODE = 1;
var DT_QWORD = 2;
var DT_DWORD = 3;
var DT_WORD = 4;
var DT_BYTE = 5;

var FWF_CURRENT = 1; //Retrieve current frame data pointer. lParam not used.
var FWF_NEXT = 2; //Retrieve next frame data pointer in frame stack. lParam is a frame data pointer.
var FWF_PREV = 3; //Retrieve previous frame data pointer in frame stack. lParam is a frame data pointer.
var FWF_BYFILENAME = 5; //Retrieve frame data by full file name. lParam is full file name string.
var FWF_BYTABINDEX = 8; //Retrieve frame data by tab item zero based index. lParam is tab item index.
var FWF_TABNEXT = 9; //Retrieve next tab item frame data. lParam is a frame data pointer.
var FWF_TABPREV = 10; //Retrieve previous tab item frame data. lParam is a frame data pointer.

var FI_WNDEDIT = 2;
var FI_FILEW = 32;

var GT_LINE = 0x1;

var FRF_DOWN = 0x00000001; //Search down
var FRF_REGEXPNONEWLINEDOT = 0x00040000; //'.' doe not match '\n'
var FRF_REGEXP = 0x00080000; //Use RegExp
var FRF_UP = 0x00100000; //Search up
var FRF_BEGINNING = 0x00200000; //Search from the beginning
var FRF_CYCLESEARCH = 0x08000000; //Cycle search

var WSC_MAINPROC = 1;

var POB_READ = 0x1;
var POB_SAVE = 0x2;
var PO_STRING = 3;

var RF_GET = 1; //Retrieve current recent files info

//AkelPad Messages
var AKD_GOTOW  = (WM_USER + 182);
var AKD_GETFRAMEINFO = (WM_USER + 199);
var AKD_GETEDITINFO = (WM_USER + 200);
var AKD_RECENTFILES = (WM_USER + 214);
var AKD_FRAMEACTIVATE = (WM_USER + 261);
var AKD_FRAMEDESTROY = (WM_USER + 263);
var AKD_FRAMEFIND = (WM_USER + 264);
var AKD_FRAMEFINDW = (WM_USER + 266);
var AKD_FRAMEINDEX = (WM_USER + 270);
var AKDN_MAIN_ONFINISH = (WM_USER + 6);

//Program
var oFSO = new ActiveXObject("Scripting.FileSystemObject");
var oSys       = AkelPad.SystemFunction();
var hInstDLL   = AkelPad.GetInstanceDll();
var sClassName = "AkelPad::Scripts::" + WScript.ScriptName + "::" + hInstDLL;
var hWndMain   = AkelPad.GetMainWnd();
var hWndEdit   = AkelPad.GetEditWnd();
var hWndDlg;
var hWndFilterEdit;
var hWndFilesList;
var hSubclassMain;
var hSubclassFilterEdit;
var hSubclassFilesList;
var sLastFullFilter = "";
var sLastPartialFilter = "";
var AkelPadFrames = [];
var AkelPadFavourites = [];
var AkelPadRecentFiles = [];
var nFramesOffset = 2000;
var nFavouritesOffset = 4000;
var nRecentFilesOffset = 6000;
var lpInitialFrame = getCurrentFrame();
var nInitialSelStart = AkelPad.GetSelStart();
var nInitialSelEnd = AkelPad.GetSelEnd();
var nInitialFirstVisibleLine = AkelPad.SendMessage(hWndEdit, EM_GETFIRSTVISIBLELINE, 0, 0);
var lpActiveFrame = lpInitialFrame;
var lpTemporaryFrame = undefined;
var nLastOffsetFromFilesList = undefined;
var nActiveFrameSelStart = nInitialSelStart;
var nActiveFrameSelEnd = nInitialSelEnd;
var nActiveFirstVisibleLine = nInitialFirstVisibleLine;
var oInitialSettings = undefined;
var isFavouritesLoaded = false;
var isRecentFilesLoaded = false;

if (hWndDlg = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, sClassName, 0))
{
  if (! oSys.Call("user32::IsWindowVisible", hWndDlg))
    oSys.Call("user32::ShowWindow", hWndDlg, SW_SHOWNA);
  if (oSys.Call("user32::IsIconic", hWndDlg))
    oSys.Call("user32::ShowWindow", hWndDlg, SW_RESTORE);

  oSys.Call("user32::SetForegroundWindow", hWndDlg);
}
else
{
  var sScripName = "Go To Anything";
  var ActionItem = undefined;

  var IDX_ID      = 0;
  var IDX_CLASS   = 1;
  var IDX_HWND    = 2;
  var IDX_EXSTYLE = 3;
  var IDX_STYLE   = 4;
  var IDX_X       = 5;
  var IDX_Y       = 6;
  var IDX_W       = 7;
  var IDX_H       = 8;

  var aWnd          = [];
  var IDC_ED_FILTER = 1011;
  var IDC_LB_ITEMS  = 1021;

  var nTextColorRGB = -1;
  var nBkColorRGB = -1;
  var hBkColorBrush = 0;
  var hGuiFont;
  var hFontEdit = AkelPad.SendMessage(hWndEdit, WM_GETFONT, 0, 0);
  if (hFontEdit)
  {
    hGuiFont = hFontEdit;
    if (Options.ApplyColorTheme && AkelPad.IsPluginRunning("Coder::HighLight"))
    {
      var sTextColor = getColorThemeVariable(hWndEdit, "HighLight_BasicTextColor");
      var sBkColor = getColorThemeVariable(hWndEdit, "HighLight_BasicBkColor");
      nTextColorRGB = getRgbIntFromHex(sTextColor);
      nBkColorRGB = getRgbIntFromHex(sBkColor);
      //WScript.Echo("TextColor = " + sTextColor + "\nBkColor = " + sBkColor);
      if (nTextColorRGB != -1 && nBkColorRGB != -1)
      {
        hBkColorBrush = oSys.Call("gdi32::CreateSolidBrush", nBkColorRGB);
      }
    }
  }
  else
  {
    hGuiFont = oSys.Call("gdi32::GetStockObject", DEFAULT_GUI_FONT);
  }

  var nDlgWidth  = 600;
  var nDlgHeight = 530;
  var nEditHeight = 20;
  var dwExStyle = Options.IsTransparent ? WS_EX_LAYERED : 0;
  var nEdStyle = WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL;
  //Windows         ID,      CLASS,        HWND,EXSTYLE,   STYLE,   X,    Y,          W,   H
  aWnd.push([IDC_ED_FILTER,  "EDIT",          0,      0, nEdStyle,  2,     4,         -1, nEditHeight]);
  var nLbStyle = WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_BORDER|WS_TABSTOP|LBS_USETABSTOPS|LBS_NOTIFY;
  aWnd.push([IDC_LB_ITEMS, "LISTBOX",       0,      0, nLbStyle,  2, nEditHeight+6, -1, -1]);

  AkelPad.ScriptNoMutex(0x11 /*ULT_LOCKSENDMESSAGE|ULT_UNLOCKSCRIPTSQUEUE*/);
  AkelPad.WindowRegisterClass(sClassName);

  var rectMainWnd = GetWindowRect(hWndMain);
  var rectEditWnd = GetWindowRect(hWndEdit);
  var x = rectMainWnd.X + Math.floor((rectMainWnd.W - nDlgWidth)/2);
  var y = rectEditWnd.Y + 10;
  if (Options.SaveDlgPosSize || Options.SaveLastFilter)
  {
    oInitialSettings = loadSettings();

    if (oInitialSettings.Dlg.X != undefined)
      x = oInitialSettings.Dlg.X;
    else
      oInitialSettings.Dlg.X = x;

    if (oInitialSettings.Dlg.Y != undefined)
      y = oInitialSettings.Dlg.Y;
    else
      oInitialSettings.Dlg.Y = y;

    if (oInitialSettings.Dlg.W != undefined)
      nDlgWidth = oInitialSettings.Dlg.W;
    else
      oInitialSettings.Dlg.W = nDlgWidth;

    if (oInitialSettings.Dlg.H != undefined)
      nDlgHeight = oInitialSettings.Dlg.H;
    else
      oInitialSettings.Dlg.H = nDlgHeight;

    if (oInitialSettings.Filter != undefined)
      sLastFullFilter = oInitialSettings.Filter;
    else
      oInitialSettings.Filter = sLastFullFilter;
  }

  hWndDlg = oSys.Call("user32::CreateWindowEx" + _TCHAR,
                      dwExStyle,    // dwExStyle
                      sClassName,       // lpClassName
                      sScripName,       // lpWindowName
                      WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU|WS_BORDER|WS_SIZEBOX,  // style
                      x,                // x
                      y,                // y
                      nDlgWidth,        // nWidth
                      nDlgHeight,       // nHeight
                      hWndMain,         // hWndParent
                      0,                // hMenu
                      hInstDLL,         // hInstance
                      DialogCallback);  // Script function callback. To use it class must be registered by WindowRegisterClass.

  if (Options.IsTransparent)
  {
    oSys.Call("user32::SetLayeredWindowAttributes", hWndDlg, 0, (255 * Options.OpaquePercent) / 100, 0x02 /*LWA_ALPHA*/);
  }

  AkelPad.WindowGetMessage();
  AkelPad.WindowUnregisterClass(sClassName);

  if (hBkColorBrush)
  {
    oSys.Call("gdi32::DeleteObject", hBkColorBrush);
  }

  if (ActionItem == undefined)
  {
    if (AkelPad.IsMDI())
    {
      if (lpTemporaryFrame != undefined)
      {
        AkelPad.SendMessage(hWndMain, AKD_FRAMEDESTROY, 0, lpTemporaryFrame);
        lpTemporaryFrame = undefined;
      }
      if (lpInitialFrame != getCurrentFrame())
      {
        activateFrame(lpInitialFrame);
      }
      if (nInitialSelStart != AkelPad.GetSelStart() ||
          nInitialSelEnd != AkelPad.GetSelEnd())
      {
        AkelPad.SetSel(nInitialSelStart, nInitialSelEnd);
      }

      var hEd = AkelPad.GetEditWnd();
      var nFirstVisibleLine = AkelPad.SendMessage(hEd, EM_GETFIRSTVISIBLELINE, 0, 0);
      if (nInitialFirstVisibleLine != nFirstVisibleLine)
      {
        AkelPad.SendMessage(hEd, EM_LINESCROLL, 0, (nInitialFirstVisibleLine - nFirstVisibleLine));
      }
    }
  }
  else
  {
  }
  oSys.Call("user32::SetFocus", hWndMain);
}

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == WM_CREATE)
  {
    var i;
    var W, H;
    var rectClient, rectWnd, rectLB, rectLV;

    rectClient = GetClientRect(hWnd);
    rectWnd = GetWindowRect(hWnd);

    for (i = 0; i < aWnd.length; ++i)
    {
      W = (aWnd[i][IDX_W] < 0) ? (rectClient.W - 2*aWnd[i][IDX_X]) : aWnd[i][IDX_W];
      H = (aWnd[i][IDX_H] < 0) ? (rectClient.H - aWnd[i][IDX_Y]) : aWnd[i][IDX_H];
      //WScript.Echo(aWnd[i][IDX_CLASS] + ": " + W + "x" + H);
      aWnd[i][IDX_HWND] =
        oSys.Call("user32::CreateWindowEx" + _TCHAR,
                  aWnd[i][IDX_EXSTYLE], //dwExStyle
                  aWnd[i][IDX_CLASS],   //lpClassName
                  0,                    //lpWindowName
                  aWnd[i][IDX_STYLE],   //dwStyle
                  aWnd[i][IDX_X],       //x
                  aWnd[i][IDX_Y],       //y
                  W,                    //nWidth
                  H,                    //nHeight
                  hWnd,                 //hWndParent
                  aWnd[i][IDX_ID],      //ID
                  hInstDLL,             //hInstance
                  0);                   //lpParam

      if (aWnd[i][IDX_HWND] == 0)
      {
        WScript.Echo("CreateWindowEx() failed for ID = " + aWnd[i][IDX_ID] + ", GetLastError = " + oSys.GetLastError());
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_DESTROY, 0, 0);
        return 0;
      }

      SetWndFont(aWnd[i][IDX_HWND], hGuiFont);
    }

    hWndFilterEdit = oSys.Call("user32::GetDlgItem", hWnd, IDC_ED_FILTER);
    hWndFilesList = oSys.Call("user32::GetDlgItem", hWnd, IDC_LB_ITEMS);

    rectLB = GetChildWindowRect(hWndFilesList);
    H = rectWnd.H - rectClient.H + rectLB.Y + rectLB.H + 3;
    ResizeWindow(hWnd, rectWnd.W, H);

    if (Options.SaveLastFilter)
    {
      SetWndText(hWndFilterEdit, sLastFullFilter);
      AkelPad.SendMessage(hWndFilterEdit, EM_SETSEL, 0, -1);
      sLastPartialFilter = undefined;
      ApplyFilter(hWndFilesList, sLastFullFilter, 0)
      FilesList_ActivateSelectedItem(hWndFilesList);
    }
    else
      FilesList_Fill(hWndFilesList, undefined);

    oSys.Call("user32::SetFocus", hWndFilterEdit);

    hSubclassFilterEdit = AkelPad.WindowSubClass(hWndFilterEdit, FilterEditCallback);
    hSubclassFilesList = AkelPad.WindowSubClass(hWndFilesList, FilesListCallback);
  }

  else if (uMsg == WM_KEYDOWN)
  {
    if (wParam == VK_ESCAPE)
    {
      oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
    }
    else if (wParam == VK_RETURN)
    {
      ActionItem = FilesList_GetCurSelData(hWndFilesList);
      oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
    }
  }

  else if (uMsg == WM_COMMAND)
  {
    if (HIWORD(wParam) == LBN_DBLCLK)
    {
      if (LOWORD(wParam) == IDC_LB_ITEMS)
      {
        ActionItem = FilesList_GetCurSelData(hWndFilesList);
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
      }
    }
  }

  else if (uMsg == WM_SIZE)
  {
    var rectClient = GetClientRect(hWnd);
    var rectEdit = GetChildWindowRect(hWndFilterEdit);
    var rectLB = GetChildWindowRect(hWndFilesList);
    ResizeWindow(hWndFilterEdit, rectClient.W - 4, rectEdit.H);
    ResizeWindow(hWndFilesList, rectClient.W - 4, rectClient.H - rectLB.Y + 4);
  }

  else if (uMsg == WM_ACTIVATE)
  {
    if (wParam != 0)
    {
      nActiveFrameSelStart = AkelPad.GetSelStart();
      nActiveFrameSelEnd = AkelPad.GetSelEnd();
      var hEd = AkelPad.GetEditWnd();
      nActiveFirstVisibleLine = AkelPad.SendMessage(hEd, EM_GETFIRSTVISIBLELINE, 0, 0);
    }
  }

  else if (uMsg == WM_CTLCOLOREDIT && isApplyingColorTheme())
  {
    if (lParam == hWndFilterEdit)
    {
      oSys.Call("gdi32::SetTextColor", wParam, nTextColorRGB);
      oSys.Call("gdi32::SetBkColor", wParam, nBkColorRGB);
      return hBkColorBrush;
    }
    else
    {
      oSys.Call("gdi32::SetBkColor", wParam, oSys.Call("user32::GetSysColor", COLOR_WINDOW));
      return oSys.Call("user32::GetSysColorBrush", COLOR_WINDOW);
    }
  }

  else if (uMsg == WM_CTLCOLORLISTBOX && isApplyingColorTheme())
  {
    if (lParam == hWndFilesList)
    {
      oSys.Call("gdi32::SetTextColor", wParam, nTextColorRGB);
      oSys.Call("gdi32::SetBkColor", wParam, nBkColorRGB);
      return hBkColorBrush;
    }
    else
    {
      oSys.Call("gdi32::SetBkColor", wParam, oSys.Call("user32::GetSysColor", COLOR_WINDOW));
      return oSys.Call("user32::GetSysColorBrush", COLOR_WINDOW);
    }
  }

  else if (uMsg == WM_CLOSE)
  {
    if (Options.SaveDlgPosSize || Options.SaveLastFilter)
    {
      var oNewSettings = createEmptySettingsObject();
      if (Options.SaveDlgPosSize)
      {
        var r = GetWindowRect(hWnd);
        if (oInitialSettings == undefined || Math.abs(oInitialSettings.Dlg.X - r.X) > 2)
          oNewSettings.Dlg.X = r.X;
        if (oInitialSettings == undefined || Math.abs(oInitialSettings.Dlg.Y - r.Y) > 2)
          oNewSettings.Dlg.Y = r.Y;
        if (oInitialSettings == undefined || Math.abs(oInitialSettings.Dlg.W - r.W) > 2)
          oNewSettings.Dlg.W = r.W;
        if (oInitialSettings == undefined || Math.abs(oInitialSettings.Dlg.H - r.H) > 35)
          oNewSettings.Dlg.H = r.H;
      }
      if (Options.SaveLastFilter)
      {
        if (oInitialSettings == undefined || oInitialSettings.Filter != sLastFullFilter)
          oNewSettings.Filter = sLastFullFilter;
      }
      saveSettings(oNewSettings);
    }

    oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
  }

  else if (uMsg == WM_DESTROY)
  {
    oSys.Call("user32::PostQuitMessage", 0); // Exit message loop
  }

  return 0;
}

function FilterEditCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == WM_KEYDOWN)
  {
    if ((wParam == VK_BACK) || (wParam == VK_DELETE))
    {
      if ((wParam == VK_BACK) && IsCtrlPressed()) // Ctrl+Backspace
      {
        var n1 = LOWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        var n2 = HIWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        var s = GetWndText(hWnd).substr(0, n1);
        var n = GetSpecialPosInFilter(s);
        if (n != -1)
        {
          n1 = (n + 1 == n1) ? 0 : (n + 1);
        }
        if (n == -1)
        {
          AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, VK_LEFT, 0);
          n1 = LOWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        }
        AkelPad.SendMessage(hWndFilterEdit, EM_SETSEL, n1, n2);
        AkelPad.SendMessage(hWndFilterEdit, EM_REPLACESEL, 1, "");
      }
      else
        AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, wParam, lParam);

      sLastFullFilter = GetWndText(hWnd);
      ApplyFilter(hWndFilesList, sLastFullFilter, 0);

      AkelPad.WindowNoNextProc(hSubclassFilterEdit);
      return 0;
    }
    if ((wParam == VK_DOWN) || (wParam == VK_UP) ||
        (wParam == VK_PRIOR) || (wParam == VK_NEXT))
    {
      AkelPad.SendMessage(hWndFilesList, uMsg, wParam, lParam);

      AkelPad.WindowNoNextProc(hSubclassFilterEdit);
      return 0;
    }
    if (wParam == VK_F3)
    {
      if (!IsCtrlPressed())
      {
        var nFindNext = 1;
        if (IsShiftPressed())
          nFindNext = -1;
        ApplyFilter(hWndFilesList, sLastFullFilter, nFindNext);

        AkelPad.WindowNoNextProc(hSubclassFilterEdit);
        return 0;
      }
    }
  }
  else if (uMsg == WM_CHAR)
  {
    if ((wParam == 0x7F) && IsCtrlPressed()) // 0x7F is Ctrl+Backspace. Why? Ask M$
    {
      // do nothing
    }
    else
    {
      AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, wParam, lParam);

      sLastFullFilter = GetWndText(hWnd);
      ApplyFilter(hWndFilesList, sLastFullFilter, 0);
    }

    AkelPad.WindowNoNextProc(hSubclassFilterEdit);
    return 0;
  }
}

function FilesListCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == WM_KEYDOWN)
  {
    if ((wParam == VK_DOWN) || (wParam == VK_UP) ||
        (wParam == VK_PRIOR) || (wParam == VK_NEXT) ||
        (wParam == VK_HOME) || (wParam == VK_END))
    {
      AkelPad.WindowNextProc(hSubclassFilesList, hWnd, uMsg, wParam, lParam);
      FilesList_ActivateSelectedItem(hWnd);
      AkelPad.WindowNoNextProc(hSubclassFilesList);
      return 0;
    }
    else
    {
      AkelPad.SendMessage(hWndFilterEdit, uMsg, wParam, lParam);
      oSys.Call("user32::SetFocus", hWndFilterEdit);
      AkelPad.WindowNoNextProc(hSubclassFilesList);
      return 0;
    }
  }
  else if (uMsg == WM_CHAR)
  {
    AkelPad.SendMessage(hWndFilterEdit, uMsg, wParam, lParam);
    oSys.Call("user32::SetFocus", hWndFilterEdit);
    AkelPad.WindowNoNextProc(hSubclassFilesList);
    return 0;
  }
  else if (uMsg == WM_LBUTTONDOWN)
  {
    AkelPad.WindowNextProc(hSubclassFilesList, hWnd, uMsg, wParam, lParam);
    FilesList_ActivateSelectedItem(hWnd);
    AkelPad.WindowNoNextProc(hSubclassFilesList);
    return 0;
  }
}

function ApplyFilter(hListWnd, sFilter, nFindNext)
{
  var sFindWhat = "";
  var nLine = -1;
  var fromBeginning = false;

  if (sFilter != undefined && sFilter != "")
  {
    var i = GetSpecialPosInFilter(sFilter);
    if (i != -1)
    {
      var c = sFilter.substr(i, 1);
      if (c == Options.Char_GoToText1 || c == Options.Char_GoToText2)
      {
        if (c == Options.Char_GoToText1 && nFindNext == 0)
        {
          fromBeginning = true;
        }
        sFindWhat = sFilter.substr(i + 1);
        sFilter = sFilter.substr(0, i);
      }
      else if (c == Options.Char_GoToLine)
      {
        nLine = parseInt(sFilter.substr(i + 1));
        if (isNaN(nLine))
          nLine = -1;
        sFilter = sFilter.substr(0, i);
      }
    }

    sFilter = sFilter.toUpperCase();
  }

  if (sFilter != sLastPartialFilter)
  {
    sLastPartialFilter = sFilter;
    if (hListWnd != undefined)
    {
      FilesList_Fill(hListWnd, sFilter);
    }
  }

  if (sFindWhat != "")
  {
    var n1 = -1;
    var n2 = -1;
    var n = -1;
    var nFlags = FRF_DOWN|FRF_CYCLESEARCH;
    if (fromBeginning)
    {
      nFlags |= FRF_BEGINNING;
      n1 = AkelPad.GetSelStart();
      n2 = AkelPad.GetSelEnd();
      if (n1 > n2)
      {
        n = n1;
        n1 = n2;
        n2 = n;
      }
    }
    if (nFindNext < 0)
    {
      nFlags = FRF_UP|FRF_CYCLESEARCH;
    }
    if (nFindNext <= 0)
    {
      var nSelStart = AkelPad.GetSelStart();
      AkelPad.SetSel(nSelStart, nSelStart);
    }

    n = AkelPad.TextFind(AkelPad.GetEditWnd(), sFindWhat, nFlags);
    if (fromBeginning && n == n1)
    {
      n = AkelPad.GetSelEnd();
      if (n == n2)
      {
        nFlags -= FRF_BEGINNING;
        AkelPad.TextFind(AkelPad.GetEditWnd(), sFindWhat, nFlags);
      }
    }
  }
  else if (nLine != -1)
  {
    AkelPad.SendMessage(hWndMain, AKD_GOTOW, GT_LINE, AkelPad.MemStrPtr(nLine.toString()));
  }
  else
  {
    if (nActiveFrameSelStart != AkelPad.GetSelStart() ||
        nActiveFrameSelEnd != AkelPad.GetSelEnd())
    {
      AkelPad.SetSel(nActiveFrameSelStart, nActiveFrameSelEnd);
    }

    var hEd = AkelPad.GetEditWnd();
    var nFirstVisibleLine = AkelPad.SendMessage(hEd, EM_GETFIRSTVISIBLELINE, 0, 0);
    if (nActiveFirstVisibleLine != nFirstVisibleLine)
    {
      AkelPad.SendMessage(hEd, EM_LINESCROLL, 0, (nActiveFirstVisibleLine - nFirstVisibleLine));
    }
  }
}

function GetSpecialPosInFilter(sFilter)
{
  if (sFilter == undefined || sFilter == "")
    return -1;

  var i1 = sFilter.indexOf(Options.Char_GoToText1);
  var i2 = sFilter.indexOf(Options.Char_GoToText2);
  if (i1 != -1)
    return (i2 != -1 && i2 < i1) ? i2 : i1;
  else if (i2 != -1)
    return i2;

  i1 = sFilter.lastIndexOf(Options.Char_GoToLine);
  if (i1 != -1)
  {
    var c = sFilter.substr(i1 + 1, 1);
    if (c == "\\" || c == "/")
      i1 = -1;
  }
  return i1;
}

function FilesList_GetCurSelData(hListWnd)
{
  var n = AkelPad.SendMessage(hListWnd, LB_GETCURSEL, 0, 0);
  if (n < 0)
    n = 0;

  return AkelPad.SendMessage(hListWnd, LB_GETITEMDATA, n, 0);
}

function FilesList_SetCurSel(hListWnd, nItem)
{
  AkelPad.SendMessage(hListWnd, LB_SETCURSEL, nItem, 0);
}

function FilesList_Clear(hListWnd)
{
  AkelPad.SendMessage(hListWnd, LB_RESETCONTENT, 0, 0);
}

function FilesList_AddItem(hListWnd, fileName, fileIdx)
{
  var n = AkelPad.SendMessage(hListWnd, LB_ADDSTRING, 0, fileName);
  AkelPad.SendMessage(hListWnd, LB_SETITEMDATA, n, fileIdx);
}

function FilesList_Fill(hListWnd, sFilter)
{
  var i;
  var n;
  var fpath;
  var item;
  var matches = [];
  var activeFilePaths = [];
  var fnames = [];

  function matches_add_if_match(offset, idx, fname)
  {
    if (sFilter == undefined || sFilter == "")
    {
      var m = [];
      m.push(offset);
      m.push(offset);
      m.push(idx);
      matches.push(m);
    }
    else
    {
      var mf = MatchFilter(sFilter, fname.toUpperCase());
      if (mf != "")
      {
        var m = [];
        m.push(mf);
        m.push(offset);
        m.push(idx);
        matches.push(m);
      }
    }
  }

  // Active documents (frames)
  AkelPadFrames = getAllFrames();
  for (i = 0; i < AkelPadFrames.length; i++)
  {
    if (AkelPadFrames[i] != lpTemporaryFrame)
    {
      fpath = getFrameFileName(AkelPadFrames[i]);
      activeFilePaths.push(fpath);
      item = getNthDepthPath(fpath, Options.PathDepth);
      if (Options.ShowItemPrefixes)
        item = "[A] " + item;
      fnames.push(item);
      n = fnames.length - 1;
      matches_add_if_match(nFramesOffset + i, n, item);
    }
  }

  // Favourites
  AkelPadFavourites = getFavourites();
  for (i = 0; i < AkelPadFavourites.length; i++)
  {
    fpath = AkelPadFavourites[i];
    if (!isStringInArray(fpath, activeFilePaths, true))
    {
      item = getNthDepthPath(fpath, Options.PathDepth);
      if (Options.ShowItemPrefixes)
        item = "[F] " + item;
      fnames.push(item);
      n = fnames.length - 1;
      matches_add_if_match(nFavouritesOffset + i, n, item);
    }
  }

  // Recent files
  AkelPadRecentFiles = getRecentFiles();
  for (i = 0; i < AkelPadRecentFiles.length; i++)
  {
    fpath = AkelPadRecentFiles[i];
    if (!isStringInArray(fpath, activeFilePaths, true) &&
        !isStringInArray(fpath, AkelPadFavourites, true))
    {
      item = getNthDepthPath(fpath, Options.PathDepth);
      if (Options.ShowItemPrefixes)
        item = "[H] " + item;
      fnames.push(item);
      n = fnames.length - 1;
      matches_add_if_match(nRecentFilesOffset + i, n, item);
    }
  }

  matches.sort(compareByMatch);

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, FALSE, 0);
  FilesList_Clear(hListWnd);

  for (i = 0; i < matches.length; i++)
  {
    FilesList_AddItem(hListWnd, fnames[matches[i][2]], matches[i][1]);
  }

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, TRUE, 0);

  if (matches.length > 0)
  {
    FilesList_SetCurSel(hListWnd, 0);
    FilesList_ActivateSelectedItem(hListWnd);
  }
}

function FilesList_ActivateSelectedItem(hListWnd)
{
  var offset = FilesList_GetCurSelData(hListWnd);
  if (nLastOffsetFromFilesList == undefined || nLastOffsetFromFilesList != offset)
  {
    if (lpTemporaryFrame != undefined)
    {
      AkelPad.SendMessage(hWndMain, AKD_FRAMEDESTROY, 0, lpTemporaryFrame);
      lpTemporaryFrame = undefined;
    }
    nLastOffsetFromFilesList = offset;
  }

  function apply_active_frame(lpFrm)
  {
    lpActiveFrame = lpFrm;
    nActiveFrameSelStart = AkelPad.GetSelStart();
    nActiveFrameSelEnd = AkelPad.GetSelEnd();
    var hEd = AkelPad.GetEditWnd();
    nActiveFirstVisibleLine = AkelPad.SendMessage(hEd, EM_GETFIRSTVISIBLELINE, 0, 0);
    ApplyFilter(undefined, sLastFullFilter, 0);
  }

  if (offset >= nRecentFilesOffset)
  {
    var sFullPath = AkelPadRecentFiles[offset - nRecentFilesOffset];
    AkelPad.OpenFile(sFullPath, 0x00F);
    var lpFrame = getCurrentFrame();
    lpTemporaryFrame = lpFrame;
    apply_active_frame(lpFrame);
  }
  else if (offset >= nFavouritesOffset)
  {
    var sFullPath = AkelPadFavourites[offset - nFavouritesOffset];
    AkelPad.OpenFile(sFullPath, 0x00F);
    var lpFrame = getCurrentFrame();
    lpTemporaryFrame = lpFrame;
    apply_active_frame(lpFrame);
  }
  else if (offset >= nFramesOffset)
  {
    var lpFrame = AkelPadFrames[offset - nFramesOffset];
    if (lpFrame != lpActiveFrame)
    {
      activateFrame(lpFrame);
      apply_active_frame(lpFrame);
    }
  }
}

function compareByMatch(m1, m2)
{
  if (m1[0] < m2[0])
    return -1;
  if (m1[0] > m2[0])
    return 1;
  return 0;
}

function MatchFilter(sFilter, sFilePath)
{
  var i;
  var j;
  var m;
  var fname = getFileName(sFilePath);

  i = fname.indexOf(sFilter)
  if (i != -1)
  {
    m = "" + i;
    while (m.length < 3)  m = "0" + m;
    return "e1" + m; // exact name match
  }

  j = 0;
  m = "";
  for (i = 0; i < sFilter.length; i++)
  {
    j = fname.indexOf(sFilter.substr(i, 1), j);
    if (j == -1)
    {
      m = ""; // no match
      break;
    }

    while (m.length < j)  m = m + "x";
    m = m + "v";
    ++j;
  }
  if (m != "")
    return "p1" + m; // partial name match

  if (fname != sFilePath)
  {
    i = sFilePath.indexOf(sFilter);
    if (i != -1)
    {
      m = "" + i;
      while (m.length < 3)  m = "0" + m;
      return "e2" + m; // exact pathname match
    }

    j = 0;
    m = "";
    for (i = 0; i < sFilter.length; i++)
    {
      j = sFilePath.indexOf(sFilter.substr(i, 1), j);
      if (j == -1)
        return ""; // no match

      while (m.length < j)  m = m + "x";
      m = m + "v";
      ++j;
    }
    return "p2" + m; // partial pathname match
  }

  return ""; // no match
}

function LOWORD(nParam)
{
  return (nParam & 0xFFFF);
}

function HIWORD(nParam)
{
  return ((nParam >> 16) & 0xFFFF);
}

function GetWindowRect(hWnd)
{
  var oRect  = new Object();
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("user32::GetWindowRect", hWnd, lpRect);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  AkelPad.MemFree(lpRect);
  return oRect;
}

function GetClientRect(hWnd)
{
  var oRect  = new Object();
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("user32::GetClientRect", hWnd, lpRect);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  AkelPad.MemFree(lpRect);
  return oRect;
}

function GetChildWindowRect(hWnd)
{
  var oRect  = new Object();
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
  var hParentWnd = oSys.Call("user32::GetParent", hWnd);

  oSys.Call("user32::GetWindowRect", hWnd, lpRect);
  oSys.Call("user32::MapWindowPoints", HWND_DESKTOP, hParentWnd, lpRect, 2);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  AkelPad.MemFree(lpRect);
  return oRect;
}

function ResizeWindow(hWnd, w, h)
{
  oSys.Call("user32::SetWindowPos", hWnd, 0, 0, 0, w, h, 0x16 /*SWP_NOZORDER|SWP_NOACTIVATE|SWP_NOMOVE*/);
}

function SetWndFont(hWnd, hFont)
{
  AkelPad.SendMessage(hWnd, WM_SETFONT, hFont, TRUE);
}

function GetWndText(hWnd)
{
  var nMaxTextLen = 1024;
  var lpText = AkelPad.MemAlloc(nMaxTextLen * 2);
  oSys.Call("user32::GetWindowTextW", hWnd, lpText, nMaxTextLen);
  var S = AkelPad.MemRead(lpText, DT_UNICODE);
  AkelPad.MemFree(lpText);
  return S;
}

function SetWndText(hWnd, sText)
{
  oSys.Call("user32::SetWindowTextW", hWnd, sText);
}

function IsCtrlPressed()
{
  return oSys.Call("user32::GetKeyState", VK_CONTROL) & 0x8000;
}

function IsShiftPressed()
{
  return oSys.Call("user32::GetKeyState", VK_SHIFT) & 0x8000;
}

function getEnvVar(varName)
{
  var varValue = "";
  var lpBuffer;
  if (lpBuffer = AkelPad.MemAlloc(8192*_TSIZE))
  {
    if (oSys == undefined)
      oSys = AkelPad.SystemFunction();
    oSys.Call("kernel32::GetEnvironmentVariable" + _TCHAR, varName, lpBuffer, 8192);
    varValue = AkelPad.MemRead(lpBuffer, _TSTR);
    AkelPad.MemFree(lpBuffer);
  }
  return varValue;
}

function substituteEnvVars(s)
{
  function replacer(matched_part, p1, offset, full_str)
  {
    // p1 is a substring found by the first parenthesized capture group
    return getEnvVar(p1); // this replaces the matched_part
  }

  return s.replace(/%([^%]*)%/g, replacer);
}

function isStringInArray(str, arr, ignoreCase)
{
  var i;
  for (i = 0; i < arr.length; i++)
  {
    if (ignoreCase)
    {
      if (str.toUpperCase() == arr[i].toUpperCase())
        return true;
    }
    else
    {
      if (str == arr[i])
        return true;
    }
  }
  return false;
}

function strTrim(s)
{
  return s.replace(/^\s+|\s+$/g, "");
}

function getNthDepthPath(path, depth)
{
  var i;
  var k1;
  var k2;

  k = path.length;
  for (;;)
  {
    k1 = path.lastIndexOf("\\", k);
    k2 = path.lastIndexOf("/", k);
    k = (k1 > k2) ? k1 : k2;
    if (k == -1)
      break;

    if (--depth == 0)
      return path.substr(k + 1);

    --k;
  }

  return path;
}

function getFileName(path)
{
  var k = -1;
  var k1 = path.lastIndexOf("\\");
  var k2 = path.lastIndexOf("/");
  if (k1 != -1)
    k = (k2 > k1) ? k2 : k1;
  else if (k2 != -1)
    k = k2;

  if (k != -1)
    path = path.substr(k + 1);

  return path;
}

function getColorThemeVariable(hWndEdit, varName)
{
  var sVarValue = "";
  var lpVarValue = AkelPad.MemAlloc(32 * 2 /*sizeof(wchar_t)*/);
  if (lpVarValue)
  {
    AkelPad.CallW("Coder::Settings", 22, hWndEdit, 0, varName, lpVarValue);
    sVarValue = AkelPad.MemRead(lpVarValue, DT_UNICODE);
    AkelPad.MemFree(lpVarValue);
  }
  return sVarValue;
}

function getRgbIntFromHex(sRgb)
{
  if (sRgb.length != 0)
  {
    var i = 0;
    if (sRgb.substr(0, 1) == "#")
      i = 1;
    if (sRgb.length - i == 6)
    {
      var rgbInt = 0;
      var n = parseInt(sRgb.substr(i + 0, 2), 16);
      if (!isNaN(n))
      {
        rgbInt += n;
        n = parseInt(sRgb.substr(i + 2, 2), 16);
        if (!isNaN(n))
        {
          rgbInt += n * 0x100;
          n = parseInt(sRgb.substr(i + 4, 2), 16);
          if (!isNaN(n))
          {
            rgbInt += n * 0x10000;
            return rgbInt;
          }
        }
      }
    }
  }
  return -1;
}

function isApplyingColorTheme()
{
  return (Options.ApplyColorTheme && nBkColorRGB != -1 && nTextColorRGB != -1);
}

function getAllFrames()
{
  var lpStartFrame = getCurrentFrame();
  var lpFrame = lpStartFrame;
  var frames = [];

  do
  {
    frames.push(lpFrame);
    lpFrame = AkelPad.SendMessage(hWndMain, AKD_FRAMEFIND, FWF_PREV, lpFrame);
  }
  while (lpFrame && lpFrame != lpStartFrame);

  return frames;
}

function getCurrentFrame()
{
  return AkelPad.SendMessage(hWndMain, AKD_FRAMEFIND, FWF_CURRENT, 0);
}

function getFrameByFullPath(sFullPath)
{
  return AkelPad.SendMessage(hWndMain, AKD_FRAMEFINDW, FWF_BYFILENAME, sFullPath);
}

function getFrameFileName(lpFrame)
{
  return AkelPad.MemRead(AkelPad.SendMessage(hWndMain, AKD_GETFRAMEINFO, FI_FILEW, lpFrame), DT_UNICODE);
}

function activateFrame(lpFrame)
{
  AkelPad.SendMessage(hWndMain, AKD_FRAMEACTIVATE, 0, lpFrame);
}

function getFavourites()
{
  if (isFavouritesLoaded)
    return AkelPadFavourites;

  var favourites = [];
  var sFavFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + ".fav";
  if (oFSO.FileExists(sFavFile))
  {
    var sFavContent = AkelPad.ReadFile(sFavFile, 0x1C);
    if (sFavContent != "")
    {
      var i, fpath;
      var fpaths = sFavContent.split("\n");
      for (i = 0; i < fpaths.length; i++)
      {
        fpath = fpaths[i];
        if (fpath.length > 0)
        {
          fpath = strTrim(fpath); //WScript.Echo("'" + fpath + "'");
          if (fpath.length > 0)
          {
            fpath = fpath.replace(/%a/g, AkelPad.GetAkelDir(0));
            fpath = substituteEnvVars(fpath);
            fpath = oFSO.GetAbsolutePathName(fpath);
            if (!Options.CheckIfFavouriteFileExist || oFSO.FileExists(fpath))
            {
              favourites.push(fpath);
            }
          }
        }
      }
    }
  }
  isFavouritesLoaded = true;
  return favourites;
}

function getRecentFiles()
{
  if (isRecentFilesLoaded)
    return AkelPadRecentFiles;

  var recentFiles = [];

  // STACKRECENTFILE *rfs;
  var lpRfS = AkelPad.MemAlloc(_X64 ? 24 : 16); // sizeof(STACKRECENTFILE)
  if (lpRfS)
  {
    var nMaxRecentFiles = AkelPad.SendMessage(hWndMain, AKD_RECENTFILES, RF_GET, lpRfS);
    if (nMaxRecentFiles > 0)
    {
      // RECENTFILE *rf = rfs->first;
      var lpRf = AkelPad.MemRead(lpRfS, _X64 ? DT_QWORD : DT_DWORD);
      while (lpRf)
      {
        // int nFilePathLen = rf->nFileLen;
        var nFilePathLen = AkelPad.MemRead(_PtrAdd(lpRf, (_X64 ? 16 : 8) + 520), DT_DWORD);
        if (nFilePathLen != 0)
        {
          // const wchar_t* sFilePath = rf->wszFile;
          var sFilePath = AkelPad.MemRead(_PtrAdd(lpRf, _X64 ? 16 : 8), DT_UNICODE, nFilePathLen);
          if (!Options.CheckIfRecentFileExist || oFSO.FileExists(sFilePath))
          {
            recentFiles.push(sFilePath);
          }
        }

        // rf = rf->next;
        lpRf = AkelPad.MemRead(lpRf, _X64 ? DT_QWORD : DT_DWORD);
      }
    }

    AkelPad.MemFree(lpRfS);
  }

  return recentFiles;
}

function createEmptySettingsObject()
{
  var oSettings  = new Object();
  oSettings.Dlg = new Object();
  oSettings.Dlg.X = undefined;
  oSettings.Dlg.Y = undefined;
  oSettings.Dlg.W = undefined;
  oSettings.Dlg.H = undefined;
  oSettings.Filter = undefined;
  return oSettings;
}

function isSettingsObjectEmpty(oSettings)
{
  if (oSettings != undefined)
  {
    if (oSettings.Filter != undefined)
      return false;

    if (oSettings.Dlg != undefined)
    {
      if (oSettings.Dlg.X != undefined || oSettings.Dlg.Y != undefined ||
          oSettings.Dlg.W != undefined || oSettings.Dlg.H != undefined)
        return false;
    }
  }
  return true;
}

function readIntSetting(oSet, name)
{
  var s = oSet.Read(name, PO_STRING);
  var n = parseInt(s);
  return isNaN(n) ? undefined : n;
}

function readStrSetting(oSet, name)
{
  return oSet.Read(name, PO_STRING);
}

function loadSettings()
{
  var oSettings = createEmptySettingsObject();
  var oSet = AkelPad.ScriptSettings();
  if (oSet.Begin("", POB_READ))
  {
    if (Options.SaveDlgPosSize)
    {
      oSettings.Dlg.X = readIntSetting(oSet, "Dlg.X");
      oSettings.Dlg.Y = readIntSetting(oSet, "Dlg.Y");
      oSettings.Dlg.W = readIntSetting(oSet, "Dlg.W");
      oSettings.Dlg.H = readIntSetting(oSet, "Dlg.H");
    }
    if (Options.SaveLastFilter)
    {
      oSettings.Filter = readStrSetting(oSet, "Filter");
    }
    oSet.End();
  }

  return oSettings;
}

function saveSettings(oSettings)
{
  if (isSettingsObjectEmpty(oSettings))
    return;

  var oSet = AkelPad.ScriptSettings();
  if (oSet.Begin("", POB_SAVE))
  {
    if (oSettings.Dlg != undefined)
    {
     if (oSettings.Dlg.X != undefined)
       oSet.Write("Dlg.X", PO_STRING, oSettings.Dlg.X.toString());
     if (oSettings.Dlg.Y != undefined)
       oSet.Write("Dlg.Y", PO_STRING, oSettings.Dlg.Y.toString());
     if (oSettings.Dlg.W != undefined)
       oSet.Write("Dlg.W", PO_STRING, oSettings.Dlg.W.toString());
     if (oSettings.Dlg.H != undefined)
       oSet.Write("Dlg.H", PO_STRING, oSettings.Dlg.H.toString());
    }
    if (oSettings.Filter != undefined)
    {
      oSet.Write("Filter", PO_STRING, oSettings.Filter);
    }
    oSet.End();
  }
}
