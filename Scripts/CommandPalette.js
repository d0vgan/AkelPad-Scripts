// http://akelpad.sourceforge.net/forum/viewtopic.php?p=34456#34456
// Version: 0.8.0
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

var Options = {
  ShowWindowTitle : false, // false -> no window title
  ShowCmdIds : true, // true -> "[4153] Edit: Cut", false -> "Edit: Cut"
  ApplyColorTheme : true, // true -> use AkelPad's color theme
  UseListView : false, // true -> ListView, false -> ListBox
  CmdTextMaxLength : 0, // 0 -> auto-calculated
  CmdShortcutMaxLength : 0, // 0 -> auto-calculated
  CmdTotalMaxLength : 0, // 0 -> auto-calculated
  CmdTextMaxLengthListBox : 74, // note: it affects the window width
  WindowWidth  : 600, // width of the popup window
  WindowHeight : 470, // height of the popup window
  TextMatchColor : 0x0040FF, // color of the matching parts of commands: 0xBBGGRR
  TextMatchColor_ThemeVar : "", // when ApplyColorTheme is true, use the given var's color (e.g. "TYPE");
                                // or specify "" to use the TextMatchColor above
  SelTextColor_ThemeVar : "", // when ApplyColorTheme is true, use the given var's color
                              // (e.g. "HighLight_BasicTextColor" or "HighLight_SelTextColor");
                              // or specify "" to use the system's color (COLOR_HIGHLIGHTTEXT)
  SelBkColor_ThemeVar : "", // when ApplyColorTheme is true, use the given var's color
                            // (e.g. "HighLight_LineBkColor" or "HighLight_SelBkColor");
                            // or specify "" to use the system's color (COLOR_HIGHLIGHT)

  apply_match_color : true, // true -> apply TextMatchColor to the matching parts
  apply_64bit_rare_fix : false // true -> fixes a rare problem with 64-bit AkelPad under Windows 11. Not needed since Scripts 19.6.
};

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
var WM_ERASEBKGND      = 0x0014;
var WM_DRAWITEM        = 0x002B;
var WM_MEASUREITEM     = 0x002C;
var WM_SETFONT         = 0x0030;
var WM_GETFONT         = 0x0031;
var WM_NOTIFY          = 0x004E;
var WM_NCHITTEST       = 0x0084;
var WM_NCLBUTTONDOWN   = 0x00A1;
var WM_KEYDOWN         = 0x0100;
var WM_CHAR            = 0x0102;
var WM_SYSKEYDOWN      = 0x0104;
var WM_COMMAND         = 0x0111;
var WM_CTLCOLOREDIT    = 0x0133;
var WM_CTLCOLORLISTBOX = 0x0134;
var WM_LBUTTONDOWN     = 0x0201;
var WM_USER            = 0x0400;
var NM_DBLCLK          = -3;
var EM_GETSEL          = 0x00B0;
var EM_SETSEL          = 0x00B1;
var EM_REPLACESEL      = 0x00C2;
var LB_ADDSTRING       = 0x0180;
var LB_RESETCONTENT    = 0x0184;
var LB_SETCURSEL       = 0x0186;
var LB_GETCURSEL       = 0x0188;
var LB_GETTEXT         = 0x0189;
var LBN_DBLCLK         = 2;
var LVM_SETBKCOLOR     = 0x1001;
var LVM_DELETEALLITEMS = 0x1009;
var LVM_GETNEXTITEM    = 0x100C;
var LVM_ENSUREVISIBLE  = 0x1013;
var LVM_SETTEXTCOLOR   = 0x1024;
var LVM_SETTEXTBKCOLOR = 0x1026;
var LVM_SETITEMSTATE   = 0x102B;
var LVM_GETSUBITEMRECT = 0x1038;
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
var HTCLIENT       = 1;
var HTCAPTION      = 2;
var DWLP_MSGRESULT = 0;

var MF_BYCOMMAND  = 0x00000000;
var MF_BYPOSITION = 0x00000400;
var MF_UNCHECKED  = 0x00000000;
var MF_CHECKED    = 0x00000008;

var COLOR_WINDOW        = 5;
var COLOR_WINDOWTEXT    = 8;
var COLOR_HIGHLIGHT     = 13;
var COLOR_HIGHLIGHTTEXT = 14;

// Windows Styles
var WS_TABSTOP  = 0x00010000;
var WS_SYSMENU  = 0x00080000;
var WS_HSCROLL  = 0x00100000;
var WS_VSCROLL  = 0x00200000;
var WS_BORDER   = 0x00800000;
var WS_CAPTION  = 0x00C00000;
var WS_VISIBLE  = 0x10000000;
var WS_CHILD    = 0x40000000;
var WS_POPUP    = 0x80000000;
var WS_CLIPSIBLINGS = 0x04000000;
var ES_AUTOHSCROLL  = 0x0080;
var LBS_NOTIFY         = 0x0001;
var LBS_OWNERDRAWFIXED = 0x0010;
var LBS_USETABSTOPS    = 0x0080;
var LBS_NODATA         = 0x2000;
var LVS_REPORT          = 0x0001;
var LVS_SINGLESEL       = 0x0004;
var LVS_SHOWSELALWAYS   = 0x0008;
var LVS_OWNERDRAWFIXED  = 0x0400;
var LVS_NOCOLUMNHEADER  = 0x4000;
var LVS_NOSORTHEADER    = 0x8000;
var LVS_EX_FULLROWSELECT = 0x0020;

// Owner draw actions
var ODA_DRAWENTIRE = 0x0001;
var ODA_SELECT     = 0x0002;
var ODA_FOCUS      = 0x0004;

// Owner draw state
var ODS_SELECTED = 0x0001;
var ODS_DEFAULT = 0x0020;

// Codepages
var CP_ACP   = 0;
var CP_OEMCP = 1;
var CP_UTF8  = 65001;

// LangID
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

var WMD_SDI = 0;

var EOD_SUCCESS = 0;
var EOD_WINDOWEXIST = -13;

var IDM_FILE_CREATENEWWINDOW       = 4102;
var IDM_OPTIONS_SINGLEOPEN_PROGRAM = 4256;

var AKD_GOTOW = 1206;
var AKD_GETMAININFO = 1222;
var AKD_FRAMEACTIVATE = (WM_USER + 261);
var AKD_FRAMEFINDW = (WM_USER + 266);
var MI_SINGLEOPENPROGRAM = 153;
var GT_LINE = 0x1;
var FWF_BYFILENAME = 5;

// The Program...
var oSys       = AkelPad.SystemFunction();
var hInstDLL   = AkelPad.GetInstanceDll();
var sClassName = "AkelPad::Scripts::" + WScript.ScriptName + "::" + hInstDLL;
var hWndFilterEdit;
var hWndCommandsList; // either ListView or ListBox
var hSubclassFilterEdit;
var hSubclassCommandsList;
var sCmdFilter = "";
var sCmdFilter0 = "";
var nCmdIndex = -1;
var nCmdIndex0 = -1;
var prevCmdFilter = -1;
var ActionItem = undefined;
var oMatches = []; // [0] = idx, [1] = match result, [2] = name

var sScripName = "Command Palette";
var IDC_ED_FILTER = 1011;
var IDC_LB_ITEMS  = 1021;
var IDC_LV_ITEMS  = 1021;
var IDX_ID      = 0;
var IDX_CLASS   = 1;
var IDX_HWND    = 2;
var IDX_EXSTYLE = 3;
var IDX_STYLE   = 4;
var IDX_X       = 5;
var IDX_Y       = 6;
var IDX_W       = 7;
var IDX_H       = 8;
var aWnd = [];
var hMainWnd = AkelPad.GetMainWnd();
var nTextColorRGB = -1;
var nBkColorRGB = -1;
var nSelTextColorRGB = -1;
var nSelBkColorRGB = -1;
var hBkColorBrush = 0;
var hSelBkColorBrush = 0;
var hGuiFont;

showCommandPalette();

function showCommandPalette()
{
  if (!Options.UseListView)
  {
    Options.CmdTextMaxLength = Options.CmdTextMaxLengthListBox;
    Options.CmdTotalMaxLength = Options.CmdTextMaxLength;
  }

  var hWndDlg = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, sClassName, 0);
  if (hWndDlg)
  {
    if (!oSys.Call("user32::IsWindowVisible", hWndDlg))
      oSys.Call("user32::ShowWindow", hWndDlg, SW_SHOWNA);
    if (oSys.Call("user32::IsIconic", hWndDlg))
      oSys.Call("user32::ShowWindow", hWndDlg, SW_RESTORE);

    oSys.Call("user32::SetForegroundWindow", hWndDlg);
  }
  else
  {
    var nDlgWidth  = Options.WindowWidth;
    var nDlgHeight = Options.WindowHeight;
    var nEditHeight = 20;
    var rectMainWnd = GetWindowRect(hMainWnd);
    var hWndEdit = AkelPad.GetEditWnd();
    var hFontEdit = AkelPad.SendMessage(hWndEdit, WM_GETFONT, 0, 0);

    // Note: ReadLngFile() must be called before getRequiredWidthAndHeight.
    // The value of Options.CmdTotalMaxLength is updated by createCmdObjName()
    // which is called by ReadLngFile().
    ReadLngFile();

    if (hFontEdit)
    {
      hGuiFont = hFontEdit;
      var r = getRequiredWidthAndHeight(hWndEdit, hFontEdit);
      //WScript.Echo("r.Width = " + r.Width + "\nr.Height = " + r.Height);
      if (r.Width > 0)
      {
        nDlgWidth = r.Width;
      }
      if (r.Height > 0)
      {
        nEditHeight = r.Height;
      }
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
        if (Options.TextMatchColor_ThemeVar != undefined && Options.TextMatchColor_ThemeVar != "")
        {
          var sMatchColor = getColorThemeVariable(hWndEdit, Options.TextMatchColor_ThemeVar);
          nMatchColorRGB = getRgbIntFromHex(sMatchColor);
          if (nMatchColorRGB !== -1)
          {
            Options.TextMatchColor = nMatchColorRGB;
          }
        }
        if (Options.SelBkColor_ThemeVar != undefined && Options.SelBkColor_ThemeVar != "")
        {
          var sSelBkColor = getColorThemeVariable(hWndEdit, Options.SelBkColor_ThemeVar);
          nSelBkColorRGB = getRgbIntFromHex(sSelBkColor);
          if (nSelBkColorRGB !== -1)
          {
            hSelBkColorBrush = oSys.Call("gdi32::CreateSolidBrush", nSelBkColorRGB);
          }
        }
        if (Options.SelTextColor_ThemeVar != undefined && Options.SelTextColor_ThemeVar != "")
        {
          var sSelTextColor = getColorThemeVariable(hWndEdit, Options.SelTextColor_ThemeVar);
          nSelTextColorRGB = getRgbIntFromHex(sSelTextColor);
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
    var nEdY = Options.ShowWindowTitle ? 6 : 10;
    var nEdH = Options.ShowWindowTitle ? 0 : 2;
    //Windows         ID,      CLASS,        HWND,EXSTYLE,   STYLE,   X,    Y,          W,   H
    aWnd.push([IDC_ED_FILTER,  "EDIT",          0,      0, nEdStyle,  2,     4,         -1, nEditHeight+nEdH]);
    if (Options.UseListView)
    {
      var nLvStyle = WS_VISIBLE|WS_CHILD|LVS_NOCOLUMNHEADER|LVS_NOSORTHEADER|LVS_SHOWSELALWAYS|LVS_SINGLESEL|LVS_REPORT;
      if (Options.apply_match_color)
      {
        nLvStyle |= LVS_OWNERDRAWFIXED;
      }
      aWnd.push([IDC_LV_ITEMS, "SysListView32", 0,      0, nLvStyle,  2, nEditHeight+nEdY, -1, -1]);
    }
    else
    {
      var nLbStyle = WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_BORDER|WS_TABSTOP|LBS_USETABSTOPS|LBS_NOTIFY;
      if (Options.apply_match_color)
      {
        nLbStyle |= (LBS_OWNERDRAWFIXED|LBS_NODATA);
      }
      aWnd.push([IDC_LB_ITEMS, "LISTBOX",       0,      0, nLbStyle,  2, nEditHeight+nEdY, -1, -1]);
    }

    var rectEditWnd = GetWindowRect(hWndEdit);
    var nWndStyle = Options.ShowWindowTitle ? (WS_VISIBLE|WS_POPUP|WS_CAPTION|WS_SYSMENU) : (WS_VISIBLE|WS_POPUP|WS_BORDER|WS_CLIPSIBLINGS);
    var nWndY = 0; // relative to the editing window

    if (nDlgHeight > rectEditWnd.H - nWndY)
      nDlgHeight = rectEditWnd.H - nWndY;

    ReadWriteIni(false);
    AkelPad.ScriptNoMutex(0x11 /*ULT_LOCKSENDMESSAGE|ULT_UNLOCKSCRIPTSQUEUE*/);
    AkelPad.WindowRegisterClass(sClassName);

    hWndDlg = oSys.Call("user32::CreateWindowEx" + _TCHAR,
                        0,                // dwExStyle
                        sClassName,       // lpClassName
                        sScripName,       // lpWindowName
                        nWndStyle,        // style
                        rectMainWnd.X + Math.floor((rectMainWnd.W - nDlgWidth)/2),  // x
                        rectEditWnd.Y + nWndY,  // y
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

    executeActionItem();
  }
}

function executeActionItem()
{
  if (ActionItem == undefined)
    return;

  var cmd = ActionItem.cmd;
  //WScript.Echo("type: " + ActionItem.type + ", cmd: " + cmd);

  oSys.Call("user32::SetFocus", hMainWnd);
  if (ActionItem.type == CMDTYPE_AKELPAD)
  {
    if (cmd == IDM_FILE_CREATENEWWINDOW)
    {
      AkelPad_NewInstance(cmd);
    }
    else
      AkelPad.Command(cmd);
  }
  else if (ActionItem.type == CMDTYPE_PLUGIN)
  {
    if (cmd.indexOf(",") == -1)
    {
      // Example: AkelPad.Call("Coder::Settings");
      AkelPad.Call(cmd);
    }
    else
    {
      // Example: AkelPad.Call("Coder::HighLight", 2, "#000000", "#9BFF9B");
      cmd = expandAllVars(cmd).replace(/\\(?=[^\x22]|\x22$)/g, "\\\\");
      evalCmd("AkelPad.Call(" + cmd + ");");
    }
  }
  else if (ActionItem.type == CMDTYPE_SCRIPT)
  {
    cmd = transformQuotes(cmd);
    if (cmd.indexOf(",") == -1)
    {
      // Example: AkelPad.Call("Scripts::Main", 1, "SCRIPT");
      AkelPad.Call("Scripts::Main", 1, cmd);
    }
    else
    {
      // Example: AkelPad.Call("Scripts::Main", 1, "SCRIPT", "ARGUMENTS");
      cmd = expandAllVars(cmd).replace(/\\(?=[^\x22]|\x22$)/g, "\\\\");
      evalCmd('AkelPad.Call("Scripts::Main", 1, ' + cmd + ');');
    }
  }
  else if (ActionItem.type == CMDTYPE_EXEC)
  {
    cmd = substituteVars(cmd, AkelPad.GetEditFile(0));
    if (cmd.substr(0, 1) == ":")
    {
      // executing a script's function
      evalCmd(cmd.substr(1) + ";");
    }
    else
    {
      // executing an external command
      AkelPad.Exec(cmd);
    }
  }
}

function evalCmd(cmd)
{
  //WScript.Echo('About to execute:\n\n' + cmd);
  try {
    eval(cmd);
  }
  catch(e) {
    ShowErr("Failed to execute:\n\n" + cmd + "\n\nError: " + e.message);
  }
}

function transformQuotes(cmd)
{
  // input: `"abc", "123"`
  // output: "\"abc\", \"123\""
  return cmd.replace(
    /`([^`]*)`/g, // `...` or ``
    function(str_match, str_group1, offset, s) {
      // str_match - the entire match: `...`
      // str_group1 - the first matched group: ...
      // offset - the offset of str_match in s
      // s - the original string
      var r = str_group1.replace(/\"/g, "\\\""); // escaping the inner ""
      return '"' + r + '"'; // replacing the outer `` with ""
    }
  );
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
      var S = createString("a", Options.CmdTotalMaxLength);
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

  return {
    Width : nWidth,
    Height : nHeight
  };
}

function substituteVars(cmd, filePathName)
{
  // substitutes AkelPad-specific variables
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

function expandEnvironmentVars(cmd)
{
  // expands environment variables
  var wsh = new ActiveXObject("WScript.Shell");
  return wsh.ExpandEnvironmentStrings(cmd);
}

function expandAllVars(cmd)
{
  // expands environment variables and substitutes AkelPad-specific variables
  return substituteVars(expandEnvironmentVars(cmd), AkelPad.GetEditFile(0));
}

function getAkelPadDir(adtype)
{
  var s = AkelPad.GetAkelDir(adtype);
  return s;
}

function getFileDir(filePathName) // file directory w/o trailing '\'
{
  var n = filePathName.lastIndexOf("\\");
  var nn = filePathName.lastIndexOf("/");
  if (nn > n)  n = nn;
  var s = "";
  if (n >= 0)
    s = filePathName.substr(0, n);
  else if (isFullPath(filePathName))
    s = filePathName;
  return s;
}

function getFileExt(filePathName) // file extension w/o leading '.'
{
  var n = filePathName.lastIndexOf(".");
  return (n >= 0) ? filePathName.substr(n + 1) : "";
}

function getFileName(filePathName) // file name w/o extension
{
  var n2 = filePathName.lastIndexOf(".");
  var n1 = filePathName.lastIndexOf("\\");
  var nn = filePathName.lastIndexOf("/");
  if (nn > n1)  n1 = nn;
  var s = "";
  if (n1 < 0 && n2 < 0)
    s = filePathName;
  else if (n1 < 0)
    s = filePathName.substr(0, n2);
  else if (n2 < 0)
    s = filePathName.substr(n1 + 1);
  else if (n2 > n1)
    s = filePathName.substr(n1 + 1, n2 - n1 - 1);
  return s;
}

function getFileNameExt(path)
{
  var k1 = path.lastIndexOf("\\");
  var k2 = path.lastIndexOf("/");
  var k = (k1 > k2) ? k1 : k2;

  if (k !== -1)
    path = path.substr(k + 1);

  return path;
}

function isFullPath(filePathName)
{
  return /^([A-Za-z]\:)|(\\\\)/.test(filePathName);
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
        ShowErr("CreateWindowEx() failed for ID = " + aWnd[i][IDX_ID] + ", Class = " + aWnd[i][IDX_CLASS] + "\n  GetLastError = " + oSys.GetLastError());
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
        return 0;
      }

      SetWndFont(aWnd[i][IDX_HWND], hGuiFont);
    }

    hWndFilterEdit = oSys.Call("user32::GetDlgItem", hWnd, IDC_ED_FILTER);
    if (Options.UseListView)
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

    if (Options.UseListView)
    {
      InitCommandsListView(hWndCommandsList, rectWnd.W);
      if (isApplyingColorTheme())
      {
        AkelPad.SendMessage(hWndCommandsList, LVM_SETBKCOLOR, 0, nBkColorRGB);
        AkelPad.SendMessage(hWndCommandsList, LVM_SETTEXTBKCOLOR, 0, nBkColorRGB);
        AkelPad.SendMessage(hWndCommandsList, LVM_SETTEXTCOLOR, 0, nTextColorRGB);
      }
    }

    if (!sCmdFilter)
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

  else if (uMsg == WM_SETFOCUS)
  {
    oSys.Call("user32::SetFocus", hWndFilterEdit);
    return 0;
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

  else if (uMsg == WM_LBUTTONDOWN)
  {
    if (!Options.ShowWindowTitle)
    {
      oSys.Call("user32::ReleaseCapture");
      AkelPad.SendMessage(hWnd, WM_NCLBUTTONDOWN, HTCAPTION, 0);
      return TRUE;
    }
  }

  else if (uMsg == WM_CTLCOLOREDIT)
  {
    if (isApplyingColorTheme())
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
  }

  else if (uMsg == WM_CTLCOLORLISTBOX)
  {
    if (isApplyingColorTheme())
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
  }

  else if (uMsg == WM_MEASUREITEM)
  {
    var lpMIS = lParam; // LPMEASUREITEMSTRUCT lpMIS = (LPMEASUREITEMSTRUCT)lParam;
    if (AkelPad.MemRead(_PtrAdd(lpMIS, 4), DT_DWORD) == IDC_LB_ITEMS) // lpMIS->CtlID
    {
      var itemHeight = 20; // default
      if (hGuiFont)
      {
        var lpTM = AkelPad.MemAlloc(64); // sizeof(TEXTMETRIC)
        if (lpTM)
        {
          var hDC = oSys.Call("user32::GetDC", hWnd);
          oSys.Call("gdi32::SelectObject", hDC, hGuiFont);
          oSys.Call("gdi32::GetTextMetrics" + _TCHAR, hDC, lpTM);
          itemHeight = AkelPad.MemRead(_PtrAdd(lpTM, 0), DT_DWORD); // tm.tmHeight
          itemHeight += 2; // Adjust for spacing as needed
          oSys.Call("User32::ReleaseDC", hWnd, hDC);
          AkelPad.MemFree(lpTM);
        }
      }
      AkelPad.MemCopy(_PtrAdd(lpMIS, 16), itemHeight, DT_DWORD); // lpMIS->itemHeight = itemHeight;
      return 1;
    }
  }

  else if (uMsg == WM_DRAWITEM)
  {
    var lpDIS = lParam; // LPDRAWITEMSTRUCT lpdis = (LPDRAWITEMSTRUCT)lParam;
    if (AkelPad.MemRead(_PtrAdd(lpDIS, 4), DT_DWORD) == IDC_LB_ITEMS) // lpDIS->CtlID
    {
      var itemID = AkelPad.MemRead(_PtrAdd(lpDIS, 8), DT_DWORD); // lpDIS->itemID
      if (itemID != -1 && itemID != 0xFFFFFFFF)
      {
        var crTextMatch = Options.TextMatchColor;
        var crText;
        var crBk;
        var crChar;
        var hBrushBk;
        var nModeBkOld;
        var nCharWidth = 0;
        var x;
        var y;
        var i;
        var j;
        var c;
        var filter = sCmdFilter;
        var match = oMatches[itemID][1];
        var matchType = 0;
        var matchIdx = 0;
        var text = oMatches[itemID][2];
        var itemAction = AkelPad.MemRead(_PtrAdd(lpDIS, 12), DT_DWORD); // lpDIS->itemAction
        var itemState = AkelPad.MemRead(_PtrAdd(lpDIS, 16), DT_DWORD); // lpDIS->itemState
        var hDC = AkelPad.MemRead(_PtrAdd(lpDIS, _X64 ? 32 : 24), DT_QWORD);
        var lpRC = _PtrAdd(lpDIS, _X64 ? 40 : 28);
        var oRect = RectToObj(lpRC);
        var lpRect = AkelPad.MemAlloc(16); // sizeof(RECT)

        if (itemState & ODS_SELECTED)
        {
          if (nSelTextColorRGB != -1)
            crText = nSelTextColorRGB;
          else
            crText = oSys.Call("user32::GetSysColor", COLOR_HIGHLIGHTTEXT);
          if (nSelBkColorRGB != -1 && hSelBkColorBrush != 0)
          {
            crBk = nSelBkColorRGB;
            hBrushBk = hSelBkColorBrush;
          }
          else
          {
            crBk = oSys.Call("user32::GetSysColor", COLOR_HIGHLIGHT);
            hBrushBk = oSys.Call("user32::GetSysColorBrush", COLOR_HIGHLIGHT);
          }
        }
        else
        {
          if (isApplyingColorTheme())
          {
            crText = nTextColorRGB;
            crBk = nBkColorRGB;
            hBrushBk = hBkColorBrush;
          }
          else
          {
            crText = oSys.Call("user32::GetSysColor", COLOR_WINDOWTEXT);
            crBk = oSys.Call("user32::GetSysColor", COLOR_WINDOW);
            hBrushBk = oSys.Call("user32::GetSysColorBrush", COLOR_WINDOW);
          }
        }

        oSys.Call("user32::FillRect", hDC, lpRC, hBrushBk);
        nModeBkOld = oSys.Call("gdi32::SetBkMode", hDC, 1 /*TRANSPARENT*/);
        oSys.Call("gdi32::SetBkColor", hDC, crBk);

        if (match != undefined && typeof(match) == "string")
        {
          c = match.substr(0, 1);
          if (c === "e") // exact match, e.g. "e007"
          {
            matchType = 1;
            matchIdx = parseInt(match.substr(1), 10); // extract e.g. 7 from "e007"
          }
          else if (c === "p") // partial match, e.g. "pxxvxvvxxxxv"
          {
            match = match.substr(1); // without the leading "p"
            matchType = 2;
          }
        }

        for (j = 0; j < (Options.UseListView ? 2 : 1); ++j)
        {
          if (Options.UseListView)
          {
            AkelPad.MemCopy(_PtrAdd(lpRect, 0), 0 /*LVIR_BOUNDS*/, DT_DWORD); // left
            AkelPad.MemCopy(_PtrAdd(lpRect, 4), j, DT_DWORD); // top
            AkelPad.MemCopy(_PtrAdd(lpRect, 8), 0, DT_DWORD); // right
            AkelPad.MemCopy(_PtrAdd(lpRect, 12), 0, DT_DWORD); // bottom
            AkelPad.SendMessage(hWndCommandsList, LVM_GETSUBITEMRECT, itemID, lpRect);
            oRect = RectToObj(lpRect);
            c = oMatches[itemID][2].lastIndexOf("\t");
            if (j == 0) // command text
            {
              text = (c == -1) ? oMatches[itemID][2] : oMatches[itemID][2].substr(0, c);
            }
            else // command shortcut
            {
              switch (matchType)
              {
                case 1: // exact match
                  if (matchIdx > text.length)
                  {
                    matchIdx -= (text.length + 1);
                  }
                  else
                  {
                    matchType = 0;
                  }
                  break;
                case 2: // partial match
                  if (match.length > text.length + 1)
                  {
                    match = match.substr(text.length + 1);
                  }
                  else
                  {
                    matchType = 0;
                  }
                  break;
              }
              text = (c == -1) ? "" : oMatches[itemID][2].substr(c + 1);
            }
          }

          x = oRect.X + 5;
          y = oRect.Y + 2;

          for (i = 0; i < text.length; ++i)
          {
            crChar = crText;
            switch (matchType)
            {
              case 1: // exact match
                if (i >= matchIdx && i < matchIdx + filter.length)
                {
                  crChar = crTextMatch;
                }
                break;
              case 2: // partial match, "v" in e.g. "xxvxvvxxxxv"
                if (i >= matchIdx && i - matchIdx < match.length)
                {
                  if (match.substr(i - matchIdx, 1) === "v")
                    crChar = crTextMatch;
                }
                break;
            }
            oSys.Call("gdi32::SetTextColor", hDC, crChar);
            c = text.substr(i, 1);
            oSys.Call("gdi32::TextOut" + _TCHAR, hDC, x, y, c, 1);
            if (oSys.Call("gdi32::GetTextExtentPoint32" + _TCHAR, hDC, c, 1, lpRect)) // using RECT instead of SIZE
            {
              nCharWidth = AkelPad.MemRead(_PtrAdd(lpRect, 0), DT_DWORD);
            }
            x += nCharWidth;
          }
          oSys.Call("gdi32::SetTextColor", hDC, crText);
          oSys.Call("gdi32::SetBkMode", hDC, nModeBkOld);
        }

        AkelPad.MemFree(lpRect);
        return 1;
      }
    }
  }

  else if (uMsg == WM_CLOSE)
  {
    ReadWriteIni(true);
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
  /*
  else if (uMsg == WM_ERASEBKGND)
  {
    var lpRect = AkelPad.MemAlloc(16); // sizeof(RECT)
    var hDC = wParam;
    var hBrushBk = isApplyingColorTheme() ? hBkColorBrush : oSys.Call("user32::GetSysColorBrush", COLOR_WINDOW);
    oSys.Call("user32::GetClientRect", hWnd, lpRect);
    oSys.Call("user32::FillRect", hDC, lpRect, hBrushBk);
    AkelPad.MemFree(lpRect);
    return 1;
  }
  */
}

function RectToObj(lpRect)
{
  var left = AkelPad.MemRead(_PtrAdd(lpRect, 0), DT_DWORD);
  var top = AkelPad.MemRead(_PtrAdd(lpRect, 4), DT_DWORD);

  return {
    X : left,
    Y : top,
    W : (AkelPad.MemRead(_PtrAdd(lpRect, 8), DT_DWORD) - left),
    H : (AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - top)
  };
}

function GetWindowRect(hWnd)
{
  var oRect;
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("user32::GetWindowRect", hWnd, lpRect);
  oRect = RectToObj(lpRect);
  AkelPad.MemFree(lpRect);

  return oRect;
}

function GetClientRect(hWnd)
{
  var oRect;
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)

  oSys.Call("user32::GetClientRect", hWnd, lpRect);
  oRect = RectToObj(lpRect);
  AkelPad.MemFree(lpRect);

  return oRect;
}

function GetChildWindowRect(hWnd)
{
  var oRect;
  var lpRect = AkelPad.MemAlloc(16); //sizeof(RECT)
  var hParentWnd = oSys.Call("user32::GetParent", hWnd);

  oSys.Call("user32::GetWindowRect", hWnd, lpRect);
  oSys.Call("user32::MapWindowPoints", HWND_DESKTOP, hParentWnd, lpRect, 2);
  oRect = RectToObj(lpRect);
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
  for (i = 0; i < sFilter.length; ++i)
  {
    c = sFilter.substr(i, 1);
    if (c != " ") // ' ' matches any character
      j = sLine.indexOf(c, j);
    if (j == -1)
      return ""; // no match

    if (j > m.length)
      m += createString("x", j - m.length);

    m += "v";
    ++j;
  }

  return "p" + m; // partial match
}

function compareByCommand(a, b)
{
  // first, comparing by match: [1]
  if (a[1] < b[1])
    return -1;
  if (a[1] > b[1])
    return 1;
  // next, comparing by name: [2]
  if (a[2] < b[2])
    return -1;
  if (a[2] > b[2])
    return 1;
  return 0;
}

function getFullCmdText(cmdText, cmdIdx)
{
  if (Options.ShowCmdIds)
  {
    var oCmd = Commands[cmdIdx];
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
  return cmdText;
}

function getCmdName(cmdText)
{
  var n = cmdText.lastIndexOf("\t");
  return (n != -1) ? cmdText.substr(0, n) : cmdText;
}

function getCmdShortcutKey(cmdText)
{
  var n = cmdText.lastIndexOf("\t");
  return (n != -1) ? cmdText.substr(n+1) : "";
}

function createString(c, N)
{
  // N times repeats c
  return new Array(N + 1).join(c);
}

function InitCommandsListView(hLvWnd, width)
{
  var width0 = Math.floor(width*(Options.CmdTextMaxLength - 1)/Options.CmdTotalMaxLength);
  var width1 = Math.floor(width*(Options.CmdShortcutMaxLength + 1)/Options.CmdTotalMaxLength);
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
  var n = Options.UseListView ? GetLvFocusedIndex(hListWnd) : AkelPad.SendMessage(hListWnd, LB_GETCURSEL, 0, 0);
  if (n < 0)
    n = 0;

  nCmdIndex = n;

  n = oMatches[n][0]; // [0] = idx
  return Commands[n];
}

function CommandsList_SetCurSel(hListWnd, nItem)
{
  if (Options.UseListView)
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
  if (Options.UseListView)
    AkelPad.SendMessage(hListWnd, LVM_DELETEALLITEMS, 0, 0);
  else
    AkelPad.SendMessage(hListWnd, LB_RESETCONTENT, 0, 0);
}

function CommandsList_AddItem(hListWnd, cmdName, cmdIdx, i)
{
  var cmdText;
  var cmdShortcut;
  var n;

  if (Options.UseListView)
  {
    var lpLvItem = AkelPad.MemAlloc(_X64 ? 72 : 60); // sizeof(LVITEM)

    cmdText = getCmdName(cmdName);
    cmdShortcut = getCmdShortcutKey(cmdName);

    var lpCmdTextW = undefined;
    if (Options.apply_64bit_rare_fix)
    {
      n = (cmdText.length > cmdShortcut.length) ? cmdText.length : cmdShortcut.length;
      lpCmdTextW = AkelPad.MemAlloc(2*(n + 1)); // sizeof(WCHAR)*(len + '\0')
      AkelPad.MemCopy(lpCmdTextW, cmdText, DT_UNICODE);
    }

    // LVITEM.mask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 0), LVIF_TEXT, DT_DWORD);
    // LVITEM.iItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 4), i, DT_DWORD);
    // LVITEM.iSubItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 8), 0, DT_DWORD);
    // LVITEM.pszText:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, _X64 ? 24 : 20), Options.apply_64bit_rare_fix ? lpCmdTextW : cmdText, DT_QWORD);
    // Inserting an item:
    AkelPad.SendMessage(hListWnd, LVM_INSERTITEMW, 0, lpLvItem);

    if (Options.apply_64bit_rare_fix)
    {
      AkelPad.MemCopy(lpCmdTextW, cmdShortcut, DT_UNICODE);
    }

    // LVITEM.mask:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 0), LVIF_TEXT, DT_DWORD);
    // LVITEM.iItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 4), i, DT_DWORD);
    // LVITEM.iSubItem:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, 8), 1, DT_DWORD);
    // LVITEM.pszText:
    AkelPad.MemCopy(_PtrAdd(lpLvItem, _X64 ? 24 : 20), Options.apply_64bit_rare_fix ? lpCmdTextW : cmdShortcut, DT_QWORD);
    // Inserting an item:
    AkelPad.SendMessage(hListWnd, LVM_SETITEMTEXTW, i, lpLvItem);

    AkelPad.MemFree(lpLvItem);
    if (Options.apply_64bit_rare_fix)
    {
      AkelPad.MemFree(lpCmdTextW);
    }
  }
  else
  {
    AkelPad.SendMessage(hListWnd, LB_ADDSTRING, 0, oMatches[i][2]);
  }
}

function CommandsList_Fill(hListWnd, sFilter)
{
  var i;
  var n;
  var C;
  var cmdText;
  var Matches = [];

  if (sFilter === prevCmdFilter)
    return;

  if (sFilter != undefined)
    sFilter = sFilter.toLowerCase();

  prevCmdFilter = sFilter;

  for (i = 0; i < Commands.length; i++)
  {
    C = [];
    C.push(i); // [0] = idx
    if (!sFilter)
    {
      C.push(0); // [1] = match result
      C.push(Commands[i].name); // [2] = name
      Matches.push(C);
    }
    else
    {
      cmdText = getFullCmdText(Commands[i].name, C[0]);
      n = MatchFilter(sFilter, cmdText.toLowerCase());
      if (n != "")
      {
        C.push(n); // [1] = match result
        C.push(cmdText); // [2] = name
        Matches.push(C);
      }
    }
  }

  Matches.sort(compareByCommand);

  oMatches = Matches; // [0] = idx, [1] = match result, [2] = name

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, FALSE, 0);
  CommandsList_Clear(hListWnd);

  for (i = 0; i < Matches.length; i++)
  {
    if (!sFilter)
    {
      Matches[i][2] = getFullCmdText(Matches[i][2], Matches[i][0]);
    }
    CommandsList_AddItem(hListWnd, Matches[i][2], Matches[i][0], i);
  }

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, TRUE, 0);
  CommandsList_SetCurSel(hListWnd, 0);

  /*
  if (sFilter != undefined && sFilter.length > 3)
  {
    var s = "";
    for (i = 0; i < Matches.length && i < 10; i++)
    {
      s += Matches[i][1] + "\n";
    }
    WScript.Echo(s);
  }
  */
}

function LOWORD(nParam)
{
  return (nParam & 0xFFFF);
}

function HIWORD(nParam)
{
  return ((nParam >> 16) & 0xFFFF);
}

function AkelPad_NewInstance(cmd)
{
  var oFSO = new ActiveXObject("Scripting.FileSystemObject");
  var scriptsDir = AkelPad.GetAkelDir(5 /*ADTYPE_SCRIPTS*/);
  var scriptFiles = ["ForceNewInstance.js", "OpenNewInstance.js"];
  var scriptFile = "";
  var i;
  for (i = 0; i < scriptFiles.length; i++)
  {
    if (oFSO.FileExists(scriptsDir + "\\" + scriptFiles[i]))
    {
      scriptFile = scriptFiles[i];
      break;
    }
  }
  if (scriptFile != "")
  {
    AkelPad.Call("Scripts::Main", 1, scriptFile);
  }
  else
  {
    // Allowing "New Window" when "Single open program" is on
    if (AkelPad.SendMessage(hMainWnd, AKD_GETMAININFO, MI_SINGLEOPENPROGRAM, 0))
    {
      AkelPad.Command(IDM_OPTIONS_SINGLEOPEN_PROGRAM);
      var hNewMainWnd = AkelPad.Command(cmd);
      AkelPad.Command(IDM_OPTIONS_SINGLEOPEN_PROGRAM);
      AkelPad.SendMessage(hNewMainWnd, WM_COMMAND, IDM_OPTIONS_SINGLEOPEN_PROGRAM, 0);
    }
    else
      AkelPad.Command(cmd);
  }
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
    catch (e)
    {
    }

    oFile.Close();
  }
}

function alignCmdShortcut(cmdText)
{
  var nMaxLen = Options.CmdTextMaxLength - (Options.ShowCmdIds ? 7 : 0);
  var n = cmdText.lastIndexOf("\t");
  if (n != -1)
  {
    if (cmdText.length < nMaxLen)
    {
      var t = createString(" ", nMaxLen - cmdText.length);
      cmdText = cmdText.substr(0, n) + t + cmdText.substr(n + 1);
    }
    else
    {
      cmdText = cmdText.substr(0, n) + "  " + cmdText.substr(n + 1);
    }
  }
  return cmdText;
}

function CreateCmdObj(type, cmd, name)
{
  return {
    type : type, // one of CMD_TYPE_*
    cmd : cmd,  // AkelPad's Command Id or Plugin Call
    name : name // full Command Name = Command Text + Shortcut key
  };
}

function createCmdObjName(s)
{
  if (Options.UseListView)
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
  if (Options.ShowCmdIds)
    lenText += 7;
  if (lenText > Options.CmdTextMaxLength)
    Options.CmdTextMaxLength = lenText;
  if (lenShortcut > Options.CmdShortcutMaxLength)
    Options.CmdShortcutMaxLength = lenShortcut;
  Options.CmdTotalMaxLength = Options.CmdTextMaxLength + Options.CmdShortcutMaxLength + 4;
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

  //WScript.Echo(n1 + ", " + n2);
  return (n1 == 0xFF && n2 == 0xFE);
}

function getLngFileName(oFSO)
{
  var sLngFile;
  if (oFSO == undefined)
  {
    oFSO = new ActiveXObject("Scripting.FileSystemObject");
  }
  sLngFile = WScript.ScriptFullName.replace(/\.js$/i, "_" + AkelPad.GetLangId(LANGID_FULL).toString() + ".lng");
  if (!oFSO.FileExists(sLngFile))
  {
    sLngFile = WScript.ScriptFullName.replace(/\.js$/i, ".lng");
  }
  return sLngFile;
}

function ReadLngFile()
{
  var oFSO = new ActiveXObject("Scripting.FileSystemObject");
  var sLngFile = getLngFileName(oFSO);

  if (oFSO.FileExists(sLngFile))
  {
    var c;
    var s;
    var m;
    var iFirstErrLine = -1;
    var section = "";
    var oTextStream;
    var isTooManyErrLines = false;
    var errLines = [];

    var addErrLine = function(s, iLine)
    {
      if (!isTooManyErrLines)
      {
        if (errLines.length > 5)
        {
          errLines.push("...");
          isTooManyErrLines = true;
        }
        else
          errLines.push("Line " + iLine + ": " + s);
      }
      if (iFirstErrLine == -1)
        iFirstErrLine = iLine;
    }

    var getStreamLine = function(oStream)
    {
      return oStream.AtEndOfStream ? oStream.Line : (oStream.Line - 1);
    }

    if (isUnicodeTextFile(oFSO, sLngFile))
      oTextStream = oFSO.OpenTextFile(sLngFile, 1, false, -1); // Unicode
    else
      oTextStream = oFSO.OpenTextFile(sLngFile, 1, false, 0); // ASCII

    if (oTextStream.AtEndOfStream)
    {
      oTextStream.Close();
      ShowErr("File is empty:\n\"" + sLngFile + "\"");
      WScript.Quit();
    }

    while (!oTextStream.AtEndOfStream)
    {
      s = oTextStream.ReadLine();
      if (s.length == 0 || /^\s*$/.test(s))
      {
        // empty line
        continue;
      }
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
      s = s.replace("\\t", "\t");
      if (section == "akelpad")
      {
        m = s.match(/^\s*(\d+)\s*=\s*"(.+)"\s*$/);
        if (m)
        {
          // AkelPad's Command: id = Text
          c = parseInt(m[1]);
          s = createCmdObjName(m[2]);
          Commands.push( CreateCmdObj(CMDTYPE_AKELPAD, c, s) );
          continue;
        }
        addErrLine(s, getStreamLine(oTextStream));
      }
      else if (section == "plugins")
      {
        m = s.match(/^\s*(["'\x60])(.+)\1\s*=\s*"(.+)"\s*$/); // \x60 is `
        if (m)
        {
          // Plugin's Command: Plugin::Method = Text
          c = m[2];
          s = createCmdObjName(m[3]);
          Commands.push( CreateCmdObj(CMDTYPE_PLUGIN, c, s) );
          continue;
        }
        addErrLine(s, getStreamLine(oTextStream));
      }
      else if (section == "scripts")
      {
        m = s.match(/^\s*(["'\x60])(.*)\1\s*=\s*"(.+)"\s*$/); // \x60 is `
        if (m)
        {
          // Scripts's Command: Script = Text
          c = m[2];
          s = createCmdObjName(m[3]);
          Commands.push( CreateCmdObj(CMDTYPE_SCRIPT, c, s) );
          continue;
        }
        addErrLine(s, getStreamLine(oTextStream));
      }
      else if (section == "exec")
      {
        m = s.match(/^\s*(["'\x60])(.+)\1\s*=\s*"(.+)"\s*$/); // \x60 is `
        if (m)
        {
          // Command Line: Command = Text
          c = m[2];
          s = createCmdObjName(m[3]);
          Commands.push( CreateCmdObj(CMDTYPE_EXEC, c, s) );
          continue;
        }
        addErrLine(s, getStreamLine(oTextStream));
      }
      else
      {
        iFirstErrLine = getStreamLine(oTextStream);
        oTextStream.Close();
        ShowErr("Unexpected item in \"" + getFileNameExt(sLngFile) + "\":\n\nLine " + iFirstErrLine + ": " + s);
        OpenFileEx(sLngFile, iFirstErrLine);
        WScript.Quit();
      }
    }
    oTextStream.Close();

    if (errLines.length != 0)
    {
      ShowErr("Unrecognized items in \"" + getFileNameExt(sLngFile) + "\":\n\n" + errLines.join("\n"));
      OpenFileEx(sLngFile, iFirstErrLine);
      WScript.Quit();
    }
  }
  else
  {
    ShowErr("File not found:\n\"" + sLngFile + "\"");
    WScript.Quit();
  }
}

function ShowErr(errMsg)
{
  AkelPad.MessageBox(AkelPad.GetMainWnd(), errMsg, WScript.ScriptName, MB_OK|MB_ICONERROR);
}

function OpenFileEx(fileName, lineNumber)
{
  var n = undefined;

  if (AkelPad.IsMDI() != WMD_SDI)
  {
    var hMainWnd = AkelPad.GetMainWnd();
    var lpFrame = AkelPad.SendMessage(hMainWnd, AKD_FRAMEFINDW, FWF_BYFILENAME, fileName);
    if (lpFrame)
    {
      AkelPad.SendMessage(hMainWnd, AKD_FRAMEACTIVATE, 0, lpFrame);
      n = EOD_SUCCESS;
    }
  }

  if (n == undefined)
  {
    n = AkelPad.OpenFile(fileName);
  }

  if ((n == EOD_SUCCESS || n == EOD_WINDOWEXIST) && (lineNumber != undefined))
  {
    var hMainWnd = AkelPad.GetMainWnd();
    AkelPad.SendMessage(hMainWnd, AKD_GOTOW, GT_LINE, AkelPad.MemStrPtr(lineNumber.toString() + ":1"));
  }
}

function OpenLngFile()
{
  OpenFileEx(getLngFileName(undefined), undefined);
}
