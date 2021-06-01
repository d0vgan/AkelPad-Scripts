// http://akelpad.sourceforge.net/forum/viewtopic.php?p=34456#34456
// Version: 0.6.2
// Author: Vitaliy Dovgan aka DV
//
// *** Command Palette: AkelPad's and Plugins' commands ***
//
//

/*
FAQ:

Q: The script shows an error "File not found: CommandPalette.lng".
   The script shows an error "File is empty: CommandPalette.lng".
A: The script _requires_ the file "CommandPalette.lng" because this file
   contains the list of the commands shown by the script.

Q: The CommandPalette's command list contains unreadable symbols.
A: The file "CommandPalette_1049.lng" (or other .lng file that contains
   non-Latin characters) must be saved using the UTF-16 LE (1200) encoding.

Q: I want more commands in the CommandPalette!
A: Edit the file "CommandPalette.lng" manually. This is a text file that
   contains lines in a form of
     command = "caption"
   where 'command' is either an internal command (number) under the [AkelPad]
   section or a plugin/script call (string) under the [Plugins] and [Scripts]
   section. The [Exec] section contains command-line commands.
*/

var ShowCmdIds = true; // true -> "[4153] Edit: Cut", false -> "Edit: Cut"
var ApplyColorTheme = true;
var UseListView = false; // true -> ListView, false -> ListBox
var CmdTextMaxLength = 0; // auto-calculated
var CmdShortcutMaxLength = 0; // auto-calculated
var CmdTotalMaxLength = 0; // auto-calculated
var CmdTextMaxLengthListBox = 74;

// Commands...
var CMDTYPE_AKELPAD = 1;
var CMDTYPE_PLUGIN  = 2;
var CMDTYPE_SCRIPT  = 3;
var CMDTYPE_EXEC    = 4;
var Commands = [];

// Windows Messages...
var WM_CREATE          = 0x0001;
var WM_DESTROY         = 0x0002;
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
var NM_DBLCLK          = -3;
var EM_GETSEL          = 0x00B0;
var EM_SETSEL          = 0x00B1;
var EM_REPLACESEL      = 0x00C2;
var LB_ADDSTRING       = 0x0180;
var LB_RESETCONTENT    = 0x0184;
var LB_SETCURSEL       = 0x0186;
var LB_GETCURSEL       = 0x0188;
var LB_GETTEXT         = 0x0189;
var LB_GETITEMDATA     = 0x0199;
var LB_SETITEMDATA     = 0x019A;
var LBN_DBLCLK         = 2;
var LVM_SETBKCOLOR     = 0x1001;
var LVM_DELETEALLITEMS = 0x1009;
var LVM_GETNEXTITEM    = 0x100C;
var LVM_ENSUREVISIBLE  = 0x1013;
var LVM_SETTEXTCOLOR   = 0x1024;
var LVM_SETTEXTBKCOLOR = 0x1026;
var LVM_SETITEMSTATE   = 0x102B;
var LVM_GETITEMW       = 0x104B;
var LVM_INSERTITEMW    = 0x104D;
var LVM_INSERTCOLUMNW  = 0x1061;
var LVM_SETITEMTEXTW   = 0x1074;
var LVM_SETEXTENDEDLISTVIEWSTYLE = 0x1036;
var LVCF_FMT           = 0x1;
var LVCF_WIDTH         = 0x2;
var LVCF_TEXT          = 0x4;
var LVCFMT_LEFT        = 0x0;
var LVCFMT_RIGHT       = 0x1;
var LVCFMT_CENTER      = 0x2;
var LVIF_TEXT          = 0x1;
var LVIF_PARAM         = 0x4;
var LVIF_STATE         = 0x8;
var LVIS_FOCUSED       = 0x1;
var LVIS_SELECTED      = 0x2;
var LVNI_FOCUSED       = 0x1;
var LVNI_SELECTED      = 0x2;

// Windows Constants...
var TRUE  = 1;
var FALSE = 0;
var VK_BACK     = 0x08; // BackSpace
var VK_TAB      = 0x09;
var VK_RETURN   = 0x0D; // Enter
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
var SW_SHOWNA  = 8;
var SW_RESTORE = 9;
var DEFAULT_GUI_FONT = 17;
var COLOR_WINDOW = 5;
var HWND_DESKTOP = 0;
var MB_OK          = 0x0000;
var MB_ICONERROR   = 0x0010;
var MB_ICONWARNING = 0x0030;

var MF_BYCOMMAND  = 0x00000000;
var MF_BYPOSITION = 0x00000400;
var MF_UNCHECKED  = 0x00000000;
var MF_CHECKED    = 0x00000008;

var WS_TABSTOP  = 0x00010000;
var WS_SYSMENU  = 0x00080000;
var WS_HSCROLL  = 0x00100000;
var WS_VSCROLL  = 0x00200000;
var WS_BORDER   = 0x00800000;
var WS_CAPTION  = 0x00C00000;
var WS_VISIBLE  = 0x10000000;
var WS_CHILD    = 0x40000000;
var WS_POPUP    = 0x80000000;
var ES_AUTOHSCROLL  = 0x0080;
var LBS_NOTIFY      = 0x0001;
var LBS_SORT        = 0x0002;
var LBS_USETABSTOPS = 0x0080;
var LVS_REPORT          = 0x0001;
var LVS_SINGLESEL       = 0x0004;
var LVS_SHOWSELALWAYS   = 0x0008;
var LVS_NOCOLUMNHEADER  = 0x4000;
var LVS_NOSORTHEADER    = 0x8000;
var LVS_EX_FULLROWSELECT = 0x0020;

var CP_ACP   = 0;
var CP_OEMCP = 1;
var CP_UTF8  = 65001;

var LANGID_FULL    = 0;
var LANGID_PRIMARY = 1;
var LANGID_SUB     = 2;

// AkelPad Constants...
var DT_ANSI    = 0;
var DT_UNICODE = 1;
var DT_QWORD   = 2;
var DT_DWORD   = 3;
var DT_WORD    = 4;
var DT_BYTE    = 5;

var IDM_FILE_CREATENEWWINDOW       = 4102;
var IDM_OPTIONS_SINGLEOPEN_PROGRAM = 4256;

var AKD_GETMAININFO = 1222;
var MI_SINGLEOPENPROGRAM = 153;


// The Program...
var oSys       = AkelPad.SystemFunction();
var hInstDLL   = AkelPad.GetInstanceDll();
var sClassName = "AkelPad::Scripts::" + WScript.ScriptName + "::" + hInstDLL;
var hWndDlg;
var hWndFilterEdit;
var hWndCommandsList; // either ListView or ListBox
var hSubclassFilterEdit;
var hSubclassCommandsList;
var sCmdFilter = "";
var sCmdFilter0 = "";
var nCmdIndex = -1;
var nCmdIndex0 = -1;
var bUseFuzzySort = false;

if (AkelPad.Include("fuzzysort.js"))
{
  bUseFuzzySort = true;
}

if (!UseListView)
{
  CmdTextMaxLength = CmdTextMaxLengthListBox;
  CmdTotalMaxLength = CmdTextMaxLength;
}

ReadLngFile();
//WScript.Echo("CmdTotalMaxLength = " + CmdTotalMaxLength);

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
  var sScripName = "Command Palette";
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
  var IDC_LV_ITEMS  = 1021;

  var nDlgWidth  = 600;
  var nDlgHeight = 530;
  var nEditHeight = 20;

  var hMainWnd = AkelPad.GetMainWnd();
  var rectMainWnd = GetWindowRect(hMainWnd);

  var nTextColorRGB = -1;
  var nBkColorRGB = -1;
  var hBkColorBrush = 0;
  var hGuiFont;
  var hWndEdit = AkelPad.GetEditWnd();
  var hFontEdit = AkelPad.SendMessage(hWndEdit, WM_GETFONT, 0, 0);
  if (hFontEdit)
  {
    hGuiFont = hFontEdit;
    var r = getRequiredWidthAndHeight(hWndEdit, hFontEdit);
    // WScript.Echo("r.Width = " + r.Width + "\nr.Height = " + r.Height);
    if (r.Width > 0)
    {
      nDlgWidth = r.Width;
    }
    if (r.Height > 0)
    {
      nEditHeight = r.Height;
    }
    if (ApplyColorTheme && AkelPad.IsPluginRunning("Coder::HighLight"))
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
    // var r = getRequiredWidthAndHeight(hMainWnd, hGuiFont);
    // if (r.Width > 0)
    // {
    //   nDlgWidth = r.Width;
    // }
  }

  var nEdStyle = WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL;
  //Windows         ID,      CLASS,        HWND,EXSTYLE,   STYLE,   X,    Y,          W,   H
  aWnd.push([IDC_ED_FILTER,  "EDIT",          0,      0, nEdStyle,  2,     4,         -1, nEditHeight]);
  if (UseListView)
  {
      var nLvStyle = WS_VISIBLE|WS_CHILD|LVS_NOCOLUMNHEADER|LVS_NOSORTHEADER|LVS_SHOWSELALWAYS|LVS_SINGLESEL|LVS_REPORT;
    aWnd.push([IDC_LV_ITEMS, "SysListView32", 0,      0, nLvStyle,  2, nEditHeight+6, -1, -1]);
  }
  else
  {
      var nLbStyle = WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_BORDER|WS_TABSTOP|LBS_USETABSTOPS|LBS_NOTIFY;
      aWnd.push([IDC_LB_ITEMS, "LISTBOX",       0,      0, nLbStyle,  2, nEditHeight+6, -1, -1]);
  }

  ReadWriteIni(false);
  AkelPad.ScriptNoMutex(0x11 /*ULT_LOCKSENDMESSAGE|ULT_UNLOCKSCRIPTSQUEUE*/);
  AkelPad.WindowRegisterClass(sClassName);

  hWndDlg = oSys.Call("user32::CreateWindowEx" + _TCHAR,
                      0,                // dwExStyle
                      sClassName,       // lpClassName
                      sScripName,       // lpWindowName
                      WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU,  // style
                      rectMainWnd.X + Math.floor((rectMainWnd.W - nDlgWidth)/2),  // x
                      rectMainWnd.Y + 40,   // y
                      nDlgWidth,        // nWidth
                      nDlgHeight,       // nHeight
                      hMainWnd,         // hWndParent
                      0,                // hMenu
                      hInstDLL,         // hInstance
                      DialogCallback);  // Script function callback. To use it class must be registered by WindowRegisterClass.

  AkelPad.WindowGetMessage();
  AkelPad.WindowUnregisterClass(sClassName);

  if (hBkColorBrush)
  {
    oSys.Call("gdi32::DeleteObject", hBkColorBrush);
  }

  if (ActionItem != undefined)
  {
    oSys.Call("user32::SetFocus", hMainWnd);
    if (ActionItem.type == CMDTYPE_AKELPAD)
    {
      if (ActionItem.cmd == IDM_FILE_CREATENEWWINDOW)
      {
        // Allowing "New Window" when "Single open program" is on
        if (AkelPad.SendMessage(hMainWnd, AKD_GETMAININFO, MI_SINGLEOPENPROGRAM, 0))
        {
          AkelPad.Command(IDM_OPTIONS_SINGLEOPEN_PROGRAM);
          var hNewMainWnd = AkelPad.Command(ActionItem.cmd);
          AkelPad.Command(IDM_OPTIONS_SINGLEOPEN_PROGRAM);
          AkelPad.SendMessage(hNewMainWnd, WM_COMMAND, IDM_OPTIONS_SINGLEOPEN_PROGRAM, 0);
        }
        else
          AkelPad.Command(ActionItem.cmd);
      }
      else
        AkelPad.Command(ActionItem.cmd);
    }
    else if (ActionItem.type == CMDTYPE_PLUGIN)
    {
      if (ActionItem.cmd.indexOf(",") == -1)
      {
        // Example: AkelPad.Call("Coder::Settings");
        AkelPad.Call(ActionItem.cmd);
      }
      else
      {
        // Example: AkelPad.Call("Coder::HighLight", 2, "#000000", "#9BFF9B");
        try
        {
          eval("AkelPad.Call(" + ActionItem.cmd + ");");
        }
        catch (oError)
        {
        }
      }
    }
    else if (ActionItem.type == CMDTYPE_SCRIPT)
    {
      if (ActionItem.cmd.indexOf(",") == -1)
      {
        AkelPad.Call("Scripts::Main", 1, ActionItem.cmd);
      }
      else
      {
        // Example: AkelPad.Call("Scripts::Main", 1, "SCRIPT", "ARGUMENTS");
        try
        {
          eval('AkelPad.Call("Scripts::Main", 1, ' + ActionItem.cmd + ');');
        }
        catch (oError)
        {
        }
      }
    }
    else if (ActionItem.type == CMDTYPE_EXEC)
    {
      var cmd = substituteVars(ActionItem.cmd, AkelPad.GetEditFile(0));
      AkelPad.Exec(cmd);
    }
  }
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
  return (ApplyColorTheme && nBkColorRGB != -1 && nTextColorRGB != -1);
}

function getRequiredWidthAndHeight(hWndEdit, hFontEdit)
{
  var nWidth = 0;
  var nHeight = 0;
  var lpSize = AkelPad.MemAlloc(8 /*sizeof(SIZE)*/);
  if (lpSize)
  {
    var hDC = oSys.Call("user32::GetDC", hWndEdit);
    if (hDC)
    {
      var S = "";
      var i = CmdTotalMaxLength;
      while (i != 0)
      {
        S = S + "a";
        i--;
      }
      oSys.Call("gdi32::SelectObject", hDC, hFontEdit);
      if (oSys.Call("gdi32::GetTextExtentPoint32" + _TCHAR, hDC, S, S.length, lpSize))
      {
        nWidth = AkelPad.MemRead(_PtrAdd(lpSize, 0) /*offsetof(SIZE, cx)*/, DT_DWORD);
        nHeight = AkelPad.MemRead(_PtrAdd(lpSize, 4) /*offsetof(SIZE, cy)*/, DT_DWORD);
      }
      oSys.Call("user32::ReleaseDC", hWndEdit, hDC);
    }
    AkelPad.MemFree(lpSize);
  }
  if (nWidth > 0)
  {
    nWidth += 32;
  }
  var r  = new Object();
  r.Width = nWidth;
  r.Height = nHeight;
  return r;
}

function substituteVars(cmd, filePathName)
{
  if (cmd.indexOf("%a") >= 0)
  {
    cmd = cmd.replace(/%a/g, getAkelPadDir(0));
  }
  if (cmd.indexOf("%d") >= 0)
  {
    cmd = cmd.replace(/%d/g, getFileDir(filePathName));
  }
  if (cmd.indexOf("%e") >= 0)
  {
    cmd = cmd.replace(/%e/g, getFileExt(filePathName));
  }
  if (cmd.indexOf("%f") >= 0)
  {
    cmd = cmd.replace(/%f/g, filePathName);
  }
  if (cmd.indexOf("%n") >= 0)
  {
    cmd = cmd.replace(/%n/g, getFileName(filePathName));
  }
  return cmd;
}

function IsCtrlPressed()
{
  return oSys.Call("user32::GetKeyState", VK_CONTROL) & 0x8000;
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
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
        return 0;
      }

      SetWndFont(aWnd[i][IDX_HWND], hGuiFont);
    }

    hWndFilterEdit = oSys.Call("user32::GetDlgItem", hWnd, IDC_ED_FILTER);
    if (UseListView)
    {
      hWndCommandsList = oSys.Call("user32::GetDlgItem", hWnd, IDC_LV_ITEMS);

      rectLV = GetChildWindowRect(hWndCommandsList);
      H = rectWnd.H - rectClient.H + rectLV.Y + rectLV.H + 3;
    }
    else
    {
      hWndCommandsList = oSys.Call("user32::GetDlgItem", hWnd, IDC_LB_ITEMS);

      rectLB = GetChildWindowRect(hWndCommandsList);
      H = rectWnd.H - rectClient.H + rectLB.Y + rectLB.H + 3;
    }
    ResizeWindow(hWnd, rectWnd.W, H);

    if (UseListView)
    {
      InitCommandsListView(hWndCommandsList, rectWnd.W);
      if (isApplyingColorTheme())
      {
        AkelPad.SendMessage(hWndCommandsList, LVM_SETBKCOLOR, 0, nBkColorRGB);
        AkelPad.SendMessage(hWndCommandsList, LVM_SETTEXTBKCOLOR, 0, nBkColorRGB);
        AkelPad.SendMessage(hWndCommandsList, LVM_SETTEXTCOLOR, 0, nTextColorRGB);
      }
    }

    if (sCmdFilter == "")
    {
      CommandsList_Fill(hWndCommandsList, undefined);
    }
    else
    {
      oSys.Call("user32::SetWindowTextW", hWndFilterEdit, sCmdFilter);
      i = sCmdFilter.length;
      AkelPad.SendMessage(hWndFilterEdit, EM_SETSEL, 0, -1);
      CommandsList_Fill(hWndCommandsList, sCmdFilter);
    }
    if (nCmdIndex != -1)
    {
      CommandsList_SetCurSel(hWndCommandsList, nCmdIndex);
    }
    oSys.Call("user32::SetFocus", hWndFilterEdit);

    hSubclassFilterEdit = AkelPad.WindowSubClass(hWndFilterEdit, FilterEditCallback);
    hSubclassCommandsList = AkelPad.WindowSubClass(hWndCommandsList, CommandsListCallback);
  }

  else if (uMsg == WM_KEYDOWN)
  {
    if (wParam == VK_ESCAPE)
    {
      sCmdFilter = "";
      nCmdIndex = -1;
      oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
    }
    else if (wParam == VK_RETURN)
    {
      ActionItem = CommandsList_GetCurSelItem(hWndCommandsList);
      oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
    }
  }

  else if (uMsg == WM_COMMAND)
  {
    if (HIWORD(wParam) == LBN_DBLCLK)
    {
      if (LOWORD(wParam) == IDC_LB_ITEMS)
      {
        ActionItem = CommandsList_GetCurSelItem(hWndCommandsList);
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
      }
    }
  }

  else if (uMsg == WM_NOTIFY)
  {
    if (wParam == IDC_LV_ITEMS)
    {
      var code = AkelPad.MemRead(_PtrAdd(lParam, _X64 ? 16 : 8), DT_DWORD);
      if (code == NM_DBLCLK)
      {
        ActionItem = CommandsList_GetCurSelItem(hWndCommandsList);
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
      }
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
    if (lParam == hWndCommandsList)
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
    ReadWriteIni(true);
    oSys.Call("user32::DestroyWindow", hWnd); // Destroy dialog
  }

  // else if (uMsg == WM_ACTIVATE)
  // {
  //   oSys.Call("user32::SetFocus", hWndFilterEdit);
  // }

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
      if ((wParam == VK_BACK) && IsCtrlPressed())
      {
        var n1, n2;
        n2 = HIWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, VK_LEFT, 0);
        n1 = LOWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        AkelPad.SendMessage(hWndFilterEdit, EM_SETSEL, n1, n2);
        AkelPad.SendMessage(hWndFilterEdit, EM_REPLACESEL, 1, "");
      }
      else
        AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, wParam, lParam);

      sCmdFilter = GetWindowText(hWnd);
      CommandsList_Fill(hWndCommandsList, sCmdFilter);

      AkelPad.WindowNoNextProc(hSubclassFilterEdit);
      return 0;
    }
    if ((wParam == VK_DOWN) || (wParam == VK_UP) ||
        (wParam == VK_PRIOR) || (wParam == VK_NEXT))
    {
      AkelPad.SendMessage(hWndCommandsList, uMsg, wParam, lParam);

      AkelPad.WindowNoNextProc(hSubclassFilterEdit);
      return 0;
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

      sCmdFilter = GetWindowText(hWnd);
      CommandsList_Fill(hWndCommandsList, sCmdFilter);
    }

    AkelPad.WindowNoNextProc(hSubclassFilterEdit);
    return 0;
  }
}

function CommandsListCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == WM_KEYDOWN)
  {
    if ((wParam == VK_DOWN) || (wParam == VK_UP) ||
        (wParam == VK_PRIOR) || (wParam == VK_NEXT) ||
        (wParam == VK_HOME) || (wParam == VK_END))
    {
      // default processing
    }
    else
    {
      AkelPad.SendMessage(hWndFilterEdit, uMsg, wParam, lParam);
      oSys.Call("user32::SetFocus", hWndFilterEdit);
      AkelPad.WindowNoNextProc(hSubclassCommandsList);
      return 0;
    }
  }
  else if (uMsg == WM_CHAR)
  {
    AkelPad.SendMessage(hWndFilterEdit, uMsg, wParam, lParam);
    oSys.Call("user32::SetFocus", hWndFilterEdit);
    AkelPad.WindowNoNextProc(hSubclassCommandsList);
    return 0;
  }
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

function GetWindowText(hWnd)
{
  var nMaxTextLen = 1024;
  var lpText = AkelPad.MemAlloc(nMaxTextLen * 2);
  oSys.Call("user32::GetWindowTextW", hWnd, lpText, nMaxTextLen);
  var S = AkelPad.MemRead(lpText, DT_UNICODE);
  AkelPad.MemFree(lpText);
  return S;
}

function MatchFilter(sFilter, sLine)
{
  var i;
  var j;
  var c;
  var m;

  i = sLine.indexOf(sFilter);
  if (i != -1)
  {
    m = "" + i;
    while (m.length < 3)  m = "0" + m;
    return "e" + m; // exact match
  }

  j = 0;
  m = "";
  for (i = 0; i < sFilter.length; i++)
  {
    c = sFilter.substr(i, 1);
    if (c != " ") // ' ' matches any character
      j = sLine.indexOf(c, j);
    if (j == -1)
      return ""; // no match

    while (m.length < j)  m = m + "x";
    m = m + "v";
    ++j;
  }
  return "p" + m; // partial match
}

function compareByCommand(a, b)
{
  if ((a[2] < b[2]) || (a[2] == b[2] && a[1] < b[1]))
    return -1;
  if ((a[2] > b[2]) || (a[2] == b[2] && a[1] > b[1]))
    return 1;
  return 0;
}

function getFullCmdText(cmdText, cmdIdx)
{
  if (ShowCmdIds)
  {
    var oCmd = Commands[cmdIdx];
    if (oCmd && oCmd.type)
    {
      if (oCmd.type == CMDTYPE_AKELPAD)
      {
        var num = oCmd.cmd.toString();
        while (num.length < 4)  num = "0" + num;
        cmdText = "[" + num + "] " + cmdText;
      }
      else if (oCmd.type == CMDTYPE_PLUGIN)
      {
        cmdText = "[plug] " + cmdText;
      }
      else if (oCmd.type == CMDTYPE_SCRIPT)
      {
        cmdText = "[scrp] " + cmdText;
      }
      else if (oCmd.type == CMDTYPE_EXEC)
      {
        cmdText = "[exec] " + cmdText;
      }
    }
  }
  return cmdText;
}

function getCmdName(cmdText)
{
  var n = cmdText.lastIndexOf("\\t");
  if (n != -1)
    return cmdText.substr(0, n);
  else
    return cmdText;
}

function getCmdShortcutKey(cmdText)
{
  var n = cmdText.lastIndexOf("\\t");
  if (n != -1)
    return cmdText.substr(n+2);
  else
    return "";
}

function InitCommandsListView(hLvWnd, width)
{
  var width0 = Math.floor(width*(CmdTextMaxLength - 1)/CmdTotalMaxLength);
  var width1 = Math.floor(width*(CmdShortcutMaxLength + 1)/CmdTotalMaxLength);
  var lpLvColumn = AkelPad.MemAlloc(_X64 ? 56 : 44); // sizeof(LVCOLUMN)

  AkelPad.SendMessage(hLvWnd, LVM_SETEXTENDEDLISTVIEWSTYLE, LVS_EX_FULLROWSELECT, LVS_EX_FULLROWSELECT);

  // LVCOLUMN.mask:
  AkelPad.MemCopy(_PtrAdd(lpLvColumn, 0), LVCF_FMT|LVCF_WIDTH, DT_DWORD);
  // LVCOLUMN.fmt:
  AkelPad.MemCopy(_PtrAdd(lpLvColumn, 4), LVCFMT_LEFT, DT_DWORD);
  // LVCOLUMN.cx:
  AkelPad.MemCopy(_PtrAdd(lpLvColumn, 8), width0, DT_DWORD);
  // Inserting a column:
  AkelPad.SendMessage(hLvWnd, LVM_INSERTCOLUMNW, 0, lpLvColumn);

  // LVCOLUMN.mask:
  AkelPad.MemCopy(_PtrAdd(lpLvColumn, 0), LVCF_FMT|LVCF_WIDTH, DT_DWORD);
  // LVCOLUMN.fmt:
  AkelPad.MemCopy(_PtrAdd(lpLvColumn, 4), LVCFMT_LEFT, DT_DWORD);
  // LVCOLUMN.cx:
  AkelPad.MemCopy(_PtrAdd(lpLvColumn, 8), width1, DT_DWORD);
  // Inserting a column:
  AkelPad.SendMessage(hLvWnd, LVM_INSERTCOLUMNW, 1, lpLvColumn);

  AkelPad.MemFree(lpLvColumn);
}

function GetLvFocusedIndex(hLvWnd)
{
  return AkelPad.SendMessage(hLvWnd, LVM_GETNEXTITEM, -1, LVNI_FOCUSED);
}

function GetLvSelectedIndex(hLvWnd)
{
  return AkelPad.SendMessage(hLvWnd, LVM_GETNEXTITEM, -1, LVNI_SELECTED);
}

function CommandsList_GetCurSelItem(hListWnd)
{
  var n;
  var cmdIdx;

  if (UseListView)
  {
    n = GetLvFocusedIndex(hListWnd);
    if (n < 0)
      n = 0;

    nCmdIndex = n;

    var lpLvItem = AkelPad.MemAlloc(_X64 ? 72 : 60); // sizeof(LVITEM)

    // LVITEM.mask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 0), LVIF_PARAM, DT_DWORD);
    // LVITEM.iItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 4), n, DT_DWORD);
    // LVITEM.iSubItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 8), 0, DT_DWORD);
    // Get the item:
    AkelPad.SendMessage(hListWnd, LVM_GETITEMW, 0, lpLvItem);

    // Get LVITEM.lParam:
    cmdIdx = AkelPad.MemRead(_PtrAdd(lpLvItem, _X64 ? 40 : 32), DT_DWORD);

    AkelPad.MemFree(lpLvItem);
  }
  else
  {
    n = AkelPad.SendMessage(hListWnd, LB_GETCURSEL, 0, 0);
    if (n < 0)
      n = 0;

    nCmdIndex = n;

    cmdIdx = AkelPad.SendMessage(hListWnd, LB_GETITEMDATA, n, 0);
  }

  return Commands[cmdIdx];
}


function CommandsList_SetCurSel(hListWnd, nItem)
{
  if (UseListView)
  {
    var lpLvItem = AkelPad.MemAlloc(_X64 ? 72 : 60); // sizeof(LVITEM)

    // LVITEM.mask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 0), LVIF_STATE, DT_DWORD);
    // LVITEM.state:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 12), LVIS_SELECTED|LVIS_FOCUSED, DT_DWORD);
    // LVITEM.stateMask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 16), LVIS_SELECTED|LVIS_FOCUSED, DT_DWORD);
    // Set the item state:
    AkelPad.SendMessage(hListWnd, LVM_SETITEMSTATE, nItem, lpLvItem);
    AkelPad.SendMessage(hListWnd, LVM_ENSUREVISIBLE, nItem, FALSE);

    AkelPad.MemFree(lpLvItem);
  }
  else
  {
      AkelPad.SendMessage(hListWnd, LB_SETCURSEL, nCmdIndex, 0);
  }
}

function CommandsList_Clear(hListWnd)
{
  if (UseListView)
    AkelPad.SendMessage(hListWnd, LVM_DELETEALLITEMS, 0, 0);
  else
    AkelPad.SendMessage(hListWnd, LB_RESETCONTENT, 0, 0);
}

function CommandsList_AddItem(hListWnd, cmdName, cmdIdx, i)
{
  var cmdText;
  var cmdShortcut;
  var n;

  if (UseListView)
  {
    var lpLvItem = AkelPad.MemAlloc(_X64 ? 72 : 60); // sizeof(LVITEM)

    cmdText = getCmdName(getFullCmdText(cmdName, cmdIdx));
    cmdShortcut = getCmdShortcutKey(cmdName);

    // LVITEM.mask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 0), LVIF_TEXT|LVIF_PARAM, DT_DWORD);
    // LVITEM.iItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 4), i, DT_DWORD);
    // LVITEM.iSubItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 8), 0, DT_DWORD);
    // LVITEM.pszText:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, _X64 ? 24 : 20), cmdText, DT_QWORD);
    // LVITEM.lParam:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, _X64 ? 40 : 32), cmdIdx, DT_DWORD);
    // Inserting an item:
    AkelPad.SendMessage(hListWnd, LVM_INSERTITEMW, 0, lpLvItem);

    // LVITEM.mask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 0), LVIF_TEXT, DT_DWORD);
    // LVITEM.iItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 4), i, DT_DWORD);
    // LVITEM.iSubItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 8), 1, DT_DWORD);
    // LVITEM.pszText:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, _X64 ? 24 : 20), cmdShortcut, DT_QWORD);
    // Inserting an item:
    AkelPad.SendMessage(hListWnd, LVM_SETITEMTEXTW, i, lpLvItem);

    AkelPad.MemFree(lpLvItem);
  }
  else
  {
    cmdText = getFullCmdText(cmdName, cmdIdx);
    n = AkelPad.SendMessage(hListWnd, LB_ADDSTRING, 0, cmdText);
    AkelPad.SendMessage(hListWnd, LB_SETITEMDATA, n, cmdIdx);
  }
}

function CommandsList_Fill(hListWnd, sFilter)
{
  var i;
  var n;
  var C;
  var cmdText;
  var Matches = [];

  if (sFilter != undefined)
    sFilter = sFilter.toLowerCase();

  if (bUseFuzzySort && sFilter != undefined && sFilter != "")
  {
    var Items = [];
    for (i = 0; i < Commands.length; i++)
    {
      C = {
        idx: i,
        name: Commands[i].name
      };
      Items.push(C);
    }
    var opt = { key: "name", allowTypo : true };
    var Result = fuzzysort.go(sFilter, Items, opt);
    if (Result != undefined && Result != null)
    {
      if (!Result.length)
      {
        if (Result.obj)
        {
          C = [];
          C.push(Result.obj.idx);
          C.push(Result.target);
          C.push(Result.score);
          Matches.push(C);
        }
      }
      else
      {
        for (i = 0; i < Result.length; i++)
        {
          if (Result[i].obj)
          {
            C = [];
            C.push(Result[i].obj.idx);
            C.push(Result[i].target);
            C.push(Result[i].score);
            Matches.push(C);
          }
        }
      }
    }
  }
  else
  {
    for (i = 0; i < Commands.length; i++)
    {
      C = [];
      C.push(i); // [0] = idx
      C.push(Commands[i].name); // [1] = name
      if (sFilter == undefined || sFilter == "")
      {
        C.push(0); // [2] = match result
        Matches.push(C);
      }
      else
      {
        cmdText = C[1].toLowerCase();
        n = cmdText.indexOf("::");
        if (n != -1)
        {
          // allows to type ' ' instead of '::'
          cmdText = cmdText.replace("::", ":: ");
        }
        cmdText = getFullCmdText(cmdText, C[0]);
        n = MatchFilter(sFilter, cmdText);
        if (n != "")
        {
          C.push(n); // [2] = match result
          Matches.push(C);
        }
      }
    }

    Matches.sort(compareByCommand);
  }

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, FALSE, 0);
  CommandsList_Clear(hListWnd);

  for (i = 0; i < Matches.length; i++)
  {
    CommandsList_AddItem(hListWnd, Matches[i][1], Matches[i][0], i);
  }

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, TRUE, 0);
  CommandsList_SetCurSel(hListWnd, 0);
}

function LOWORD(nParam)
{
  return (nParam & 0xFFFF);
}

function HIWORD(nParam)
{
  return ((nParam >> 16) & 0xFFFF);
}

function ReadWriteIni(bWrite)
{
  var oFSO     = new ActiveXObject("Scripting.FileSystemObject");
  var sIniFile = WScript.ScriptFullName.substring(0, WScript.ScriptFullName.lastIndexOf(".")) + ".ini";

  if (bWrite)
  {
    if ((sCmdFilter0 != sCmdFilter) ||
        (nCmdIndex0 != nCmdIndex))
    {
      var sIniTxt = "sCmdFilter=\"" + sCmdFilter + "\";\r\n" +
                    "nCmdIndex=" + nCmdIndex + ";";

      var oFile = oFSO.OpenTextFile(sIniFile, 2, true, -1);
      oFile.Write(sIniTxt);
      oFile.Close();
    }
  }
  else if (oFSO.FileExists(sIniFile))
  {
    var oFile = oFSO.OpenTextFile(sIniFile, 1, false, -1);

    try
    {
      eval(oFile.ReadAll());

      sCmdFilter0 = sCmdFilter;
      nCmdIndex0 = nCmdIndex;
    }
    catch (oError)
    {
    }

    oFile.Close();
  }
}

function alignCmdShortcut(cmdText)
{
  var nMaxLen = CmdTextMaxLength - (ShowCmdIds ? 7 : 0);
  var n = cmdText.lastIndexOf("\\t");
  if (n != -1)
  {
    if (cmdText.length < nMaxLen)
    {
      var t = "";
      var i = cmdText.length;
      while (i < nMaxLen)
      {
        t = t + " ";
        i++;
      }
      cmdText = cmdText.substr(0, n) + t + cmdText.substr(n + 2);
    }
    else
    {
      cmdText = cmdText.substr(0, n) + "  " + cmdText.substr(n + 2);
    }
  }
  return cmdText;
}

function CreateCmdObj(type, cmd, name)
{
  var cmdObj = new Object();
  cmdObj.type = type; // one of CMD_TYPE_*
  cmdObj.cmd  = cmd;  // AkelPad's Command Id or Plugin Call
  cmdObj.name = name; // full Command Name = Command Text + Shortcut key
  return cmdObj;
}

function createCmdObjName(s)
{
  if (UseListView)
  {
    adjustCmdMaxLength(s);
  }
  else
  {
    s = alignCmdShortcut(s);
  }
  return s;
}

function adjustCmdMaxLength(s)
{
  var lenText = getCmdName(s).length;
  var lenShortcut = getCmdShortcutKey(s).length;
  if (ShowCmdIds)
    lenText += 7;
  if (lenText > CmdTextMaxLength)
    CmdTextMaxLength = lenText;
  if (lenShortcut > CmdShortcutMaxLength)
    CmdShortcutMaxLength = lenShortcut;
  CmdTotalMaxLength = CmdTextMaxLength + CmdShortcutMaxLength + 4;
}

function getByteFromWideChar(c)
{
  var n = c.charCodeAt(0);
  if (n > 0xFF)
  {
    var pBufA = AkelPad.MemAlloc(4);
    var pStrW = AkelPad.MemStrPtr(c);
    oSys.Call("kernel32::WideCharToMultiByte", CP_ACP, 0, pStrW, 1, pBufA, 2, 0, 0);
    n = AkelPad.MemRead(pBufA, DT_BYTE);
    AkelPad.MemFree(pBufA);
  }
  return n;
}

function isUnicodeTextFile(oFSO, filePathName)
{
  var oTextStream = oFSO.OpenTextFile(filePathName, 1, false, 0); // read as ASCII
  var n1 = 0;
  var n2 = 0;

  if (!oTextStream.AtEndOfStream)
  {
    n1 = getByteFromWideChar(oTextStream.Read(1));
    if (!oTextStream.AtEndOfStream)
      n2 = getByteFromWideChar(oTextStream.Read(1));
  }
  oTextStream.Close();

  // WScript.Echo(n1 + ", " + n2);
  return (n1 == 0xFF && n2 == 0xFE);
}

function ReadLngFile()
{
  var oFSO     = new ActiveXObject("Scripting.FileSystemObject");
  var sLngFile = WScript.ScriptFullName.replace(/\.js$/i, "_" + AkelPad.GetLangId(LANGID_FULL).toString() + ".lng");
  if (!oFSO.FileExists(sLngFile))
  {
    sLngFile = WScript.ScriptFullName.replace(/\.js$/i, ".lng");
  }
  if (oFSO.FileExists(sLngFile))
  {
    var c;
    var s;
    var m;
    var section = "";
    var oTextStream;

    if (isUnicodeTextFile(oFSO, sLngFile))
      oTextStream = oFSO.OpenTextFile(sLngFile, 1, false, -1); // Unicode
    else
      oTextStream = oFSO.OpenTextFile(sLngFile, 1, false, 0); // ASCII

    if (oTextStream.AtEndOfStream)
    {
      oTextStream.Close();
      FatalErr("File is empty:\n\"" + sLngFile + "\"");
    }

    while (!oTextStream.AtEndOfStream)
    {
      s = oTextStream.ReadLine();
      m = s.match(/^\s*\/\/.*/);
      if (m)
      {
        // Comment
        continue;
      }
      m = s.match(/^\s*\[([^\]]+)\]\s*$/);
      if (m)
      {
        // [Section]
        section = m[1].toLowerCase();
        continue;
      }
      if (section == "akelpad")
      {
        m = s.match(/^\s*(\w+)\s*=\s*"(.+)"\s*$/);
        if (m)
        {
          // AkelPad's Command: id = Text
          c = parseInt(m[1]);
          if (isNaN(c))
          {
            c = oTextStream.Line - 1;
            oTextStream.Close();
            FatalErr("Command Id is not a number: \"" + m[1] + "\"!\nFile: \"" + sLngFile + "\"\nLine: " + c);
          }
          s = createCmdObjName(m[2]);
          Commands.push( CreateCmdObj(CMDTYPE_AKELPAD, c, s) );
          continue;
        }
      }
      else if (section == "plugins")
      {
        m = s.match(/^\s*"(.+)"\s*=\s*"(.+)"\s*$/);
        if (!m)
          m = s.match(/^\s*'(.+)'\s*=\s*"(.+)"\s*$/);
        if (m)
        {
          // Plugin's Command: Plugin::Method = Text
          c = m[1];
          s = createCmdObjName(m[2]);
          Commands.push( CreateCmdObj(CMDTYPE_PLUGIN, c, s) );
          continue;
        }
      }
      else if (section == "scripts")
      {
        m = s.match(/^\s*"(.*)"\s*=\s*"(.+)"\s*$/);
        if (!m)
          m = s.match(/^\s*'(.*)'\s*=\s*"(.+)"\s*$/);
        if (m)
        {
          // Scripts's Command: Script = Text
          c = m[1].replace(/\`/g, "\"");
          s = createCmdObjName(m[2]);
          Commands.push( CreateCmdObj(CMDTYPE_SCRIPT, c, s) );
          continue;
        }
      }
      else if (section == "exec")
      {
        m = s.match(/^\s*"(.+)"\s*=\s*"(.+)"\s*$/);
        if (!m)
          m = s.match(/^\s*'(.+)'\s*=\s*"(.+)"\s*$/);
        if (m)
        {
          // Command Line: Command = Text
          c = m[1];
          s = createCmdObjName(m[2]);
          Commands.push( CreateCmdObj(CMDTYPE_EXEC, c, s) );
          continue;
        }
      }
    }
    oTextStream.Close();
  }
  else
  {
    FatalErr("File not found:\n\"" + sLngFile + "\"");
  }
}

function FatalErr(errMsg)
{
  AkelPad.MessageBox(AkelPad.GetMainWnd(), errMsg, WScript.ScriptName, MB_OK|MB_ICONERROR);
  WScript.Quit();
}
