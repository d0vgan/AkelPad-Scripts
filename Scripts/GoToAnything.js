// https://akelpad.sourceforge.net/forum/viewtopic.php?p=35541#35541
// https://github.com/d0vgan/AkelPad-Scripts/blob/main/Scripts/GoToAnything.js
// Version: 0.7.8
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

  Enter    - close and edit the selected file
  Esc      - close and return to the original file and position in that file
  F1       - help
  F3       - find next (down), works with @text and #text
  Shift+F3 - find previous (up), works with @text and #text
  F4       - preview the selected file (when auto-preview is off)
  Shift+F4 - auto-preview toggle (on/off)
  Ctrl+Q   - preview the selected file (when auto-preview is off)
  Ctrl+Shift+Q - auto-preview toggle (on/off)
  Alt+A    - select window / manage the currently opened files
  Alt+D    - select the start (project) directory
  Alt+F    - edit the Favourites ("GoToAnything.fav")
  Alt+H    - manage the Recent Files History (calling RecentFiles::Manage)

Item prefixes in the list:

  [A] marks currently opened files.
  [D] marks files from the current directory.
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
  ApplyColorTheme : true, // use AkelPad's colors
  IsTransparent : false, // whether the popup dialog is tranparent
  OpaquePercent : 80, // applies when IsTransparent is `true`
  SaveDlgPosSize : true, // whether to save the popup dialog position and size
  SaveLastFilter : false, // experimental: whether to save the last filter
  SaveAutoPreview : true, // whether to save the AutoPreviewSelectedFile value
  SaveStartDir : true, // save the start (project) directory
  VisualPathDepth : 4, // visual path depth of items in the file list
  CheckIfFavouriteFileExist : true, // check if files from Favourites exist
  CheckIfRecentFileExist : true, // check if files from Recent Files exist
  FoldersInFavourites : false, // experimental: folders in Favourites
  StartDir : "", // start (project) directory for [D] files, "" - current directory
  DirFilesStartLevel : 0, // show [D] files from: -1 - none, 0 - current dir, 1 - upper dir, ...
  DirFilesMaxDepth : 4, // max directory depth of [D] files: 0 - only current dir, 1 - inner dir, ...
  MaxDirFiles : 5000, // max number of [D] files, handling 5000 items is already slow...
  DirFilesMaxFileSize : 100*1024*1024, // bigger files will be ignored
  DirFilesExcludeDirs : [
    ".git", ".vs"
  ], // -- these dirs will be ignored
  DirFilesExcludeFileExts : [
    "dll", "exe", "ocx", // executables
    "7z", "bz2", "cab", "gz", "msi", "rar", "tar", "zip", // archives
    "bmp", "gif", "ico", "jpe", "jpeg", "jpg", "png", // pictures
    "avi", "flv", "m2v", "m4v", "mkv", "mp4", "mpeg", "mpg", "mkv", "vob", "wmv", // video
    "ac3", "flac", "m4a", "mp3", "ogg", "wav", "wma", // audio
    "chm", "docx", "djv", "djvu", "odb", "odf", "odp", "ods", "odt", "pdf", "ppsx", "ppt", "pptx", "xls", "xlsx", // documents
    "db", "bin", "iso", "obj", "o" // binaries
  ], // -- these files will be ignored
  ShowItemPrefixes : true, // whether to show the [A], [D], [F] and [H] prefixes
  ShowNumberOfItemsInTitle : true, // whether to add " [filtered/total]" to the title
  IsTextSearchFuzzy : true, // when true, @text also matches "toexact" and "theexit"
  AutoPreviewSelectedFile : true, // when true, the selected file is automatically previewed
  ExcludePreviewedFilesFromRecentFiles : true, // don't update Recent Files while previewing
  TextMatchColor : 0x0040FF, // color of the matching parts of file names: 0xBBGGRR
  TextMatchColor_ThemeVar : "", // when ApplyColorTheme is true, use the given var's color (e.g. "TYPE");
                                // or specify "" to use the TextMatchColor above
  SelTextColor_ThemeVar : "", // when ApplyColorTheme is true, use the given var's color
                              // (e.g. "HighLight_BasicTextColor" or "HighLight_SelTextColor");
                              // or specify "" to use the system's color (COLOR_HIGHLIGHTTEXT)
  SelBkColor_ThemeVar : ""  // when ApplyColorTheme is true, use the given var's color
                            // (e.g. "HighLight_LineBkColor" or "HighLight_SelBkColor");
                            // or specify "" to use the system's color (COLOR_HIGHLIGHT)
};

//Help Text
var sScriptHelp = "Syntax:\n \
\n \
  filename\t- switch to a file containing \"filename\" in its name\n \
  filename" + Options.Char_GoToLine + "123\t- switch to a file containing \"filename\" in its name\n \
  \t\tand go to line 123\n \
  filename" + Options.Char_GoToText1 + "text\t- switch to a file containing \"filename\" in its name\n \
  \t\tand find \"text\" in it, from the beginning\n \
  filename" + Options.Char_GoToText2 + "text\t- switch to a file containing \"filename\" in its name\n \
  \t\tand find \"text\" in it, from the current position\n \
  " + Options.Char_GoToLine + "123\t\t- go to line 123 in the current file\n \
  " + Options.Char_GoToText1 + "text\t\t- find \"text\" in the current file, from the beginning\n \
  " + Options.Char_GoToText2 + "text\t\t- find \"text\" in the current file, from the current\n\
  \t\tposition\n \
\n \
Keys:\n \
\n \
  Enter\t- close and edit the selected file\n \
  Esc\t- close and return to the original file and position in that file\n \
  F1\t- this help\n \
  F3\t- find next (down), works with " + Options.Char_GoToText1 + "text and " + Options.Char_GoToText2 + "text\n \
  Shift+F3 - find previous (up), works with " + Options.Char_GoToText1 + "text and " + Options.Char_GoToText2 + "text\n \
  F4\t- preview the selected file (when auto-preview is off)\n \
  Shift+F4 - auto-preview toggle (on/off)\n \
  Ctrl+Q\t- preview the selected file (when auto-preview is off)\n \
  Ctrl+Shift+Q - auto-preview toggle (on/off)\n \
  Alt+A\t- select window / manage the currently opened files\n \
  Alt+D\t- select the start (project) directory\n \
  Alt+F\t- edit the Favourites (\"GoToAnything.fav\")\n \
  Alt+H\t- manage the Recent Files History (RecentFiles::Manage)";

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
var VK_F1       = 0x70;
var VK_F3       = 0x72;
var VK_F4       = 0x73;
var VK_F6       = 0x75;
var HWND_DESKTOP = 0;
var SW_HIDE    = 0;
var SW_SHOWNA  = 8;
var SW_RESTORE = 9;
var DEFAULT_GUI_FONT = 17;
var COLOR_WINDOW        = 5;
var COLOR_WINDOWTEXT    = 8;
var COLOR_HIGHLIGHT     = 13;
var COLOR_HIGHLIGHTTEXT = 14;
var MB_OK = 0x00000;

//Windows Messages
var WM_CREATE          = 0x0001;
var WM_DESTROY         = 0x0002;
var WM_SIZE            = 0x0005;
var WM_ACTIVATE        = 0x0006;
var WM_SETFOCUS        = 0x0007;
var WM_SETREDRAW       = 0x000B;
var WM_CLOSE           = 0x0010;
var WM_DRAWITEM        = 0x002B;
var WM_MEASUREITEM     = 0x002C;
var WM_SETFONT         = 0x0030;
var WM_GETFONT         = 0x0031;
var WM_NOTIFY          = 0x004E;
var WM_HELP            = 0x0053;
var WM_KEYDOWN         = 0x0100;
var WM_KEYUP           = 0x0101;
var WM_CHAR            = 0x0102;
var WM_SYSKEYDOWN      = 0x0104;
var WM_SYSKEYUP        = 0x0105;
var WM_SYSCHAR         = 0x0106;
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
var LBN_DBLCLK         = 2;
var PM_REMOVE          = 0x0001;

//Windows Styles
var WS_TABSTOP = 0x00010000;
var WS_SIZEBOX = 0x00040000;
var WS_SYSMENU = 0x00080000;
var WS_HSCROLL = 0x00100000;
var WS_VSCROLL = 0x00200000;
var WS_BORDER  = 0x00800000;
var WS_CAPTION = 0x00C00000;
var WS_VISIBLE = 0x10000000;
var WS_CHILD   = 0x40000000;
var WS_POPUP   = 0x80000000;
var WS_EX_CONTEXTHELP  = 0x00000400;
var WS_EX_LAYERED      = 0x00080000;
var ES_AUTOHSCROLL     = 0x0080;
var LBS_NOTIFY         = 0x0001;
var LBS_OWNERDRAWFIXED = 0x0010;
var LBS_USETABSTOPS    = 0x0080;
var LBS_NODATA         = 0x2000;

// Owner draw actions
var ODA_DRAWENTIRE = 0x0001;
var ODA_SELECT     = 0x0002;
var ODA_FOCUS      = 0x0004;

// Owner draw state
var ODS_SELECTED = 0x0001;
var ODS_DEFAULT = 0x0020;

//AkelPad Constants: AkelPad.MemRead
var DT_ANSI = 0;
var DT_UNICODE = 1;
var DT_QWORD = 2;
var DT_DWORD = 3;
var DT_WORD = 4;
var DT_BYTE = 5;

//AkelPad Constants: AKD_FRAMEFIND
var FWF_CURRENT = 1; //Retrieve current frame data pointer. lParam not used.
var FWF_NEXT = 2; //Retrieve next frame data pointer in frame stack. lParam is a frame data pointer.
var FWF_PREV = 3; //Retrieve previous frame data pointer in frame stack. lParam is a frame data pointer.
var FWF_BYFILENAME = 5; //Retrieve frame data by full file name. lParam is full file name string.
var FWF_BYTABINDEX = 8; //Retrieve frame data by tab item zero based index. lParam is tab item index.
var FWF_TABNEXT = 9; //Retrieve next tab item frame data. lParam is a frame data pointer.
var FWF_TABPREV = 10; //Retrieve previous tab item frame data. lParam is a frame data pointer.

//AkelPad Constants: AKD_GETFRAMEINFO
var FI_WNDEDIT = 2;
var FI_DOCEDIT = 3;
var FI_FILEW = 32;

//AkelPad Constants: AKD_GOTO
var GT_LINE = 0x1;

//AkelPad Constants: AkelPad.TextFind
var FRF_DOWN = 0x00000001; //Search down
var FRF_REGEXPNONEWLINEDOT = 0x00040000; //'.' doe not match '\n'
var FRF_REGEXP = 0x00080000; //Use RegExp
var FRF_UP = 0x00100000; //Search up
var FRF_BEGINNING = 0x00200000; //Search from the beginning
var FRF_CYCLESEARCH = 0x08000000; //Cycle search
var FRF_TEST = 0x80000000; //Test only. Without text selection

//AkelPad Constants: AkelPad.WindowSubClass
var WSC_MAINPROC = 1;

//AkelPad Constants: AkelPad.ScriptSettings
var POB_READ = 0x1;
var POB_SAVE = 0x2;
var PO_STRING = 3;

//AkelPad Constants: AKD_RECENTFILES
var RF_GET = 1; //Retrieve current recent files info
var RF_FINDINDEX = 7; //Find item index in recent files stack by file name
var RF_DELETEINDEX = 8; //Delete item from recent files stack by index

//AkelPad Constants: AkelPad.IsMDI
var WMD_SDI = 0; // Single-window (SDI)
var WMD_MDI = 1; // Multi-window (MDI)
var WMD_PMDI = 2; //  Pseudo Multi-window (PMDI)

//AkelPad Messages
var AKD_OPENDOCUMENTW = (WM_USER + 157);
var AKD_GOTOW  = (WM_USER + 182);
var AKD_GETFRAMEINFO = (WM_USER + 199);
var AKD_GETEDITINFO = (WM_USER + 200);
var AKD_RECENTFILES = (WM_USER + 214);
var AKD_FRAMEACTIVATE = (WM_USER + 261);
var AKD_FRAMEDESTROY = (WM_USER + 263);
var AKD_FRAMEFIND = (WM_USER + 264);
var AKD_FRAMEFINDW = (WM_USER + 266);
var AKD_FRAMEISVALID = (WM_USER + 269);
var AKD_FRAMEINDEX = (WM_USER + 270);
var AEM_GETUNWRAPLINE = (WM_USER + 2119);
var AEM_SCROLLTOPOINT = (WM_USER + 2159);

//Program
var oFSO     = new ActiveXObject("Scripting.FileSystemObject");
var oSys     = AkelPad.SystemFunction();
var hInstDLL = AkelPad.GetInstanceDll();
var hWndMain = AkelPad.GetMainWnd();
var sScriptClassName = "AkelPad::Scripts::" + WScript.ScriptName + "::" + hInstDLL;
var sScriptName = "Go To Anything";
var hWndScriptDlg;
var hWndFilterEdit;
var hWndFilesList;
var oFileListItems = [];
var hSubclassFilterEdit;
var hSubclassFilesList;
var nTextColorRGB = -1;
var nBkColorRGB = -1;
var nMatchColorRGB = -1;
var nSelBkColorRGB = -1;
var nSelTextColorRGB = -1;
var hBkColorBrush = 0;
var hSelBkColorBrush = 0;
var hGuiFont;
var Consts = createConsts();
var oState = createState();
var oInitialSettings = undefined;
//var logfile = oFSO.GetFile("D:\\temp\\1.txt");
//var log = logfile.OpenAsTextStream(2);

//open_file flags
var fofApplyActiveFrame = 0x01;
var fofPreviewFile = 0x02;

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

function createConsts()
{
  var c = {
    nOpenedFilesOffset : 2000,
    nDirFilesOffset : 6000,
    nFavouritesOffset : 56000,
    nRecentFilesOffset : 62000,
    nActionSelectWindow : -101,
    nActionEditFavourites : -102,
    nActionManageRecentFiles : -103
  };
  return c;
}

function createState()
{
  var hWndEdit = AkelPad.GetEditWnd();
  var s = new Object();
  s.ActionItem = undefined;
  s.sLastFullFilter = "";
  s.sLastPartialFilter = "";
  s.AkelPadOpenedFiles = [];
  s.DirectoryFiles = [];
  s.LastStartDir = "";
  s.AkelPadFavourites = [];
  s.AkelPadRecentFiles = [];
  s.lpInitialFrame = getCurrentFrame();
  s.sInitialFilePath = s.lpInitialFrame != 0 ? getFrameFileName(s.lpInitialFrame) : "";
  s.nInitialSelStart = AkelPad.GetSelStart();
  s.nInitialSelEnd = AkelPad.GetSelEnd();
  s.nInitialFirstVisibleLine = Edit_GetFirstVisibleLine(hWndEdit);
  s.lpTemporaryFrame = undefined;
  s.sLastActivatedFilePath = undefined;
  s.nActiveFrameSelStart = s.nInitialSelStart;
  s.nActiveFrameSelEnd = s.nInitialSelEnd;
  s.nActiveFirstVisibleLine = s.nInitialFirstVisibleLine;
  s.isDirectoryFilesLoaded = false;
  s.isFavouritesLoaded = false;
  s.isRecentFilesLoaded = false;
  s.isIgnoringEscKeyUp = false;
  return s;
}

function memAlloc(size)
{
  if (size <= 64)
    size = 64;
  else if (size <= 256)
    size = 256;
  else if (size <= 1024)
    size = 1024;
  else if (size <= 4096)
    size = 4096;
  else if (size <= 16384)
    size = 16384;

  return AkelPad.MemAlloc(size);
}

function memFree(lpBuf)
{
  AkelPad.MemFree(lpBuf);
}

if (hWndScriptDlg = oSys.Call("user32::FindWindowEx" + _TCHAR, 0, 0, sScriptClassName, 0))
{
  if (! oSys.Call("user32::IsWindowVisible", hWndScriptDlg))
    oSys.Call("user32::ShowWindow", hWndScriptDlg, SW_SHOWNA);
  if (oSys.Call("user32::IsIconic", hWndScriptDlg))
    oSys.Call("user32::ShowWindow", hWndScriptDlg, SW_RESTORE);

  oSys.Call("user32::SetForegroundWindow", hWndScriptDlg);
}
else
{
  runScript();
}

function runScript()
{
  var hWndEdit = AkelPad.GetEditWnd();
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
      //log.WriteLine("TextColor = " + sTextColor + "\nBkColor = " + sBkColor);
      if (nTextColorRGB !== -1 && nBkColorRGB !== -1)
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
  }

  var nDlgWidth  = 600;
  var nDlgHeight = 530;
  var nEditHeight = 20;
  var dwExStyle = (Options.IsTransparent ? WS_EX_LAYERED : 0) | WS_EX_CONTEXTHELP;
  var nEdStyle = WS_VISIBLE|WS_CHILD|WS_TABSTOP|ES_AUTOHSCROLL;
  //Windows         ID,      CLASS,        HWND,EXSTYLE,   STYLE,   X,    Y,          W,   H
  aWnd.push([IDC_ED_FILTER,  "EDIT",          0,      0, nEdStyle,  2,     4,         -1, nEditHeight]);
  var nLbStyle = WS_VISIBLE|WS_CHILD|WS_VSCROLL|WS_BORDER|WS_TABSTOP|LBS_USETABSTOPS|LBS_NOTIFY|LBS_OWNERDRAWFIXED|LBS_NODATA;
  aWnd.push([IDC_LB_ITEMS, "LISTBOX",       0,      0, nLbStyle,  2, nEditHeight+6, -1, -1]);

  AkelPad.ScriptNoMutex(0x11 /*ULT_LOCKSENDMESSAGE|ULT_UNLOCKSCRIPTSQUEUE*/);
  AkelPad.WindowRegisterClass(sScriptClassName);

  var rectMainWnd = GetWindowRect(hWndMain);
  var rectEditWnd = GetWindowRect(hWndEdit);
  var x = rectMainWnd.X + Math.floor((rectMainWnd.W - nDlgWidth)/2);
  var y = rectEditWnd.Y + 10;
  if (Options.SaveDlgPosSize ||
      Options.SaveLastFilter ||
      Options.SaveAutoPreview ||
      Options.SaveStartDir)
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
      oState.sLastFullFilter = oInitialSettings.Filter;
    else
      oInitialSettings.Filter = oState.sLastFullFilter;

    if (oInitialSettings.AutoPreview != undefined)
      Options.AutoPreviewSelectedFile = oInitialSettings.AutoPreview;
    else
      oInitialSettings.AutoPreview = Options.AutoPreviewSelectedFile;

    if (oInitialSettings.StartDir != undefined)
      Options.StartDir = oInitialSettings.StartDir;
    else
      oInitialSettings.StartDir = Options.StartDir;
  }

  hWndScriptDlg = oSys.Call("user32::CreateWindowEx" + _TCHAR,
                      dwExStyle,        // dwExStyle
                      sScriptClassName, // lpClassName
                      sScriptName,      // lpWindowName
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
    oSys.Call("user32::SetLayeredWindowAttributes", hWndScriptDlg, 0, (255 * Options.OpaquePercent) / 100, 0x02 /*LWA_ALPHA*/);
  }

  AkelPad.WindowGetMessage();
  AkelPad.WindowUnregisterClass(sScriptClassName);

  if (hSelBkColorBrush)
  {
    oSys.Call("gdi32::DeleteObject", hSelBkColorBrush);
  }

  if (hBkColorBrush)
  {
    oSys.Call("gdi32::DeleteObject", hBkColorBrush);
  }

  function restore_initial_tab()
  {
    if (AkelPad.IsMDI() != WMD_SDI)
    {
      if (isFrameValid(oState.lpTemporaryFrame))
      {
        destroyFrame(oState.lpTemporaryFrame);
      }
      oState.lpTemporaryFrame = undefined;
      if (isFrameValid(oState.lpInitialFrame))
      {
        if (oState.lpInitialFrame != getCurrentFrame())
        {
          activateFrame(oState.lpInitialFrame);
        }
        if (oState.nInitialSelStart != AkelPad.GetSelStart() ||
            oState.nInitialSelEnd != AkelPad.GetSelEnd())
        {
          AkelPad.SetSel(oState.nInitialSelStart, oState.nInitialSelEnd);
        }

        var hEd = AkelPad.GetEditWnd();
        var nFirstVisibleLine = Edit_GetFirstVisibleLine(hEd);
        if (oState.nInitialFirstVisibleLine != nFirstVisibleLine)
        {
          AkelPad.SendMessage(hEd, EM_LINESCROLL, 0, (oState.nInitialFirstVisibleLine - nFirstVisibleLine));
        }
      }
    }
    else // SDI
    {
      if (oState.sInitialFilePath != "")
      {
        var lpFrame = getCurrentFrame();
        if (!isFrameValid(lpFrame) ||
            getFrameFileName(lpFrame).toLowerCase() != oState.sInitialFilePath.toLowerCase())
        {
          AkelPad.OpenFile(oState.sInitialFilePath, 0x00F);
        }
      }
    }
  }

  if (oState.ActionItem == undefined)
  {
    restore_initial_tab();
  }
  else if (oState.ActionItem == Consts.nActionSelectWindow)
  {
    restore_initial_tab();
    AkelPad.Command(4327);
  }
  else if (oState.ActionItem == Consts.nActionEditFavourites)
  {
    var sFavFile = getFavFilePath();
    if (!oFSO.FileExists(sFavFile))
    {
      oFSO.CreateTextFile(sFavFile, false, true);
    }
    AkelPad.OpenFile(sFavFile, 0x00F);
  }
  else if (oState.ActionItem == Consts.nActionManageRecentFiles)
  {
    restore_initial_tab();
    AkelPad.Call("RecentFiles::Manage");
  }

  if (AkelPad.IsMDI() != WMD_SDI)
  {
    if (oState.ActionItem >= Consts.nDirFilesOffset)
    {
      // [D] or [F] or [H] item has been selected
      if (isFrameValid(oState.lpTemporaryFrame))
      {
        if (oState.lpTemporaryFrame != getCurrentFrame())
          activateFrame(oState.lpTemporaryFrame);
      }
      else
      {
        var sFullPath = getFullPathByOffset(oState.ActionItem);
        if (sFullPath != "" && oFSO.FileExists(sFullPath))
        {
          var lpExistingFrame = getFrameByFullPath(sFullPath);
          if (lpExistingFrame && lpExistingFrame != getCurrentFrame())
          {
            activateFrame(lpExistingFrame);
            oState.sLastActivatedFilePath = sFullPath;
          }
          else
            open_file(sFullPath, 0);
        }
      }
    }
    else
    {
      // either [A] item has been selected or e.g. Alt+F has been pressed
      if (oState.ActionItem >= Consts.nOpenedFilesOffset)
      {
        activateOpenedFile(oState.ActionItem, 0);
      }
      if (isFrameValid(oState.lpTemporaryFrame) && oState.lpTemporaryFrame != getCurrentFrame())
      {
        destroyFrame(oState.lpTemporaryFrame);
        oState.lpTemporaryFrame = undefined;
      }
    }
  }

  oSys.Call("user32::SetFocus", hWndMain);
}

function DialogCallback(hWnd, uMsg, wParam, lParam)
{
  if (uMsg == WM_CREATE)
  {
    var i;
    var W, H;
    var rectClient, rectWnd, rectLB;

    rectClient = GetClientRect(hWnd);
    rectWnd = GetWindowRect(hWnd);

    for (i = 0; i < aWnd.length; ++i)
    {
      W = (aWnd[i][IDX_W] < 0) ? (rectClient.W - 2*aWnd[i][IDX_X]) : aWnd[i][IDX_W];
      H = (aWnd[i][IDX_H] < 0) ? (rectClient.H - aWnd[i][IDX_Y]) : aWnd[i][IDX_H];
      //log.WriteLine(aWnd[i][IDX_CLASS] + ": " + W + "x" + H);
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
      SetWndText(hWndFilterEdit, oState.sLastFullFilter);
      AkelPad.SendMessage(hWndFilterEdit, EM_SETSEL, 0, -1);
      oState.sLastPartialFilter = undefined;
      ApplyFilter(hWndFilesList, oState.sLastFullFilter, 0)
      if (Options.AutoPreviewSelectedFile)
      {
        FilesList_ActivateSelectedItem(hWndFilesList);
      }
    }
    else
      FilesList_Fill(hWndFilesList, undefined);

    oSys.Call("user32::SetFocus", hWndFilterEdit);

    hSubclassFilterEdit = AkelPad.WindowSubClass(hWndFilterEdit, FilterEditCallback);
    hSubclassFilesList = AkelPad.WindowSubClass(hWndFilesList, FilesListCallback);
  }

  else if (uMsg == WM_KEYDOWN)
  {
    //log.WriteLine("DialogCallback - WM_KEYDOWN - " + wParam.toString(16));
    oState.isIgnoringEscKeyUp = false;
    //log.WriteLine("isIgnoringEscKeyUp = false");
    if (wParam == VK_ESCAPE)
    {
      oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
    }
    else if (wParam == VK_RETURN)
    {
      oState.ActionItem = FilesList_GetCurSelData(hWndFilesList);
      if (!Options.AutoPreviewSelectedFile)
      {
        FilesList_ActivateSelectedItem(hWndFilesList);
      }
      oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
    }
    //else if (wParam == VK_F1)
    //{
    //  showHelp();
    //  return 0;
    //}
  }

  else if (uMsg == WM_KEYUP)
  {
    if (wParam == VK_ESCAPE)
    {
      //log.WriteLine("DialogCallback - WM_KEYUP - VK_ESCAPE");
      if (!oState.isIgnoringEscKeyUp)
      {
        oSys.Call("user32::PostMessage" + _TCHAR, hWnd, WM_CLOSE, 0, 0);
      }
    }
  }

  else if (uMsg == WM_COMMAND)
  {
    if (HIWORD(wParam) == LBN_DBLCLK)
    {
      if (LOWORD(wParam) == IDC_LB_ITEMS)
      {
        oState.ActionItem = FilesList_GetCurSelData(hWndFilesList);
        if (!Options.AutoPreviewSelectedFile)
        {
          FilesList_ActivateSelectedItem(hWndFilesList);
        }
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
      oState.nActiveFrameSelStart = AkelPad.GetSelStart();
      oState.nActiveFrameSelEnd = AkelPad.GetSelEnd();
      oState.nActiveFirstVisibleLine = Edit_GetFirstVisibleLine(AkelPad.GetEditWnd());
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
        var lpTM = memAlloc(64); // sizeof(TEXTMETRIC)
        if (lpTM)
        {
          var hDC = oSys.Call("user32::GetDC", hWnd);
          oSys.Call("gdi32::SelectObject", hDC, hGuiFont);
          oSys.Call("gdi32::GetTextMetrics" + _TCHAR, hDC, lpTM);
          itemHeight = AkelPad.MemRead(_PtrAdd(lpTM, 0), DT_DWORD); // tm.tmHeight
          itemHeight += 2; // Adjust for spacing as needed
          oSys.Call("User32::ReleaseDC", hWnd, hDC);
          memFree(lpTM);
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
        //var itemHeight;
        var nCharWidth = 0;
        //var nCharHeight = 0;
        var x;
        var y;
        var i;
        var c;
        var filter = oState.sLastFullFilter;
        var match = oFileListItems[itemID][0];
        var matchType = 0;
        var matchIdx = 0;
        var text = oFileListItems[itemID][2];
        var itemAction = AkelPad.MemRead(_PtrAdd(lpDIS, 12), DT_DWORD); // lpDIS->itemAction
        var itemState = AkelPad.MemRead(_PtrAdd(lpDIS, 16), DT_DWORD); // lpDIS->itemState
        var hDC = AkelPad.MemRead(_PtrAdd(lpDIS, _X64 ? 32 : 24), DT_QWORD);
        var lpRC = _PtrAdd(lpDIS, _X64 ? 40 : 28);
        var rcItem = RectToArray(lpRC);
        //var lpTM = memAlloc(64); // sizeof(TEXTMETRIC)
        var lpSize = memAlloc(16); // sizeof(SIZE)

        //oSys.Call("gdi32::SelectObject", hDC, hGuiFont);
        //oSys.Call("gdi32::GetTextMetrics" + _TCHAR, hDC, lpTM);
        //itemHeight = AkelPad.MemRead(_PtrAdd(lpTM, 0), DT_DWORD); // tm.tmHeight

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
        x = rcItem.left + 5;
        y = rcItem.top + 2; //(rcItem.bottom + rcItem.top - itemHeight)/2;

        if (filter != undefined && typeof(filter) == "string")
        {
          i = GetSpecialPosInFilter(filter);
          if (i !== -1)
            filter = filter.substr(0, i);
        }

        if (match != undefined && typeof(match) == "string")
        {
          c = match.substr(0, 2);
          if (c === "e1") // exact name match
          {
            matchType = 1;
            matchIdx = text.lastIndexOf("\\");
            matchIdx += parseInt(match.substr(2), 10);
          }
          else if (c === "e2") // exact pathname match
          {
            matchType = 2;
            matchIdx = parseInt(match.substr(2), 10);
          }
          else if (c === "p1") // partial name match
          {
            matchType = 3;
            matchIdx = text.lastIndexOf("\\");
          }
          else if (c === "p2") // partial pathname match
          {
            matchType = 4;
          }
        }

        for (i = 0; i < text.length; ++i)
        {
          crChar = crText;
          switch (matchType)
          {
            case 1: // exact name match
              if (i > matchIdx && i < matchIdx + filter.length + 1)
              {
                crChar = crTextMatch;
              }
              break;
            case 2: // exact pathname match
              if (i >= matchIdx && i < matchIdx + filter.length)
              {
                crChar = crTextMatch;
              }
              break;
            case 3: // partial name match
              if (i > matchIdx && i + 1 - matchIdx < match.length)
              {
                if (match.substr(i + 1 - matchIdx, 1) === "v")
                  crChar = crTextMatch;
              }
              break;
            case 4: // partial pathname match
              if (i + 2 < match.length && match.substr(i + 2, 1) === "v")
              {
                crChar = crTextMatch;
              }
              break;
          }
          oSys.Call("gdi32::SetTextColor", hDC, crChar);
          c = text.substr(i, 1);
          oSys.Call("gdi32::TextOut" + _TCHAR, hDC, x, y, c, 1);
          if (oSys.Call("gdi32::GetTextExtentPoint32" + _TCHAR, hDC, c, 1, lpSize))
          {
            nCharWidth = AkelPad.MemRead(_PtrAdd(lpSize, 0), DT_DWORD);
            //nCharHeight = AkelPad.MemRead(_PtrAdd(lpSize, 4), DT_DWORD);
          }
          x += nCharWidth;
        }
        oSys.Call("gdi32::SetTextColor", hDC, crText);
        oSys.Call("gdi32::SetBkMode", hDC, nModeBkOld);

        memFree(lpSize);
        // memFree(lpTM);
        return 1;
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

  else if (uMsg == WM_HELP)
  {
    showHelp();
  }

  else if (uMsg == WM_CLOSE)
  {
    if (Options.SaveDlgPosSize ||
        Options.SaveLastFilter ||
        Options.SaveAutoPreview ||
        Options.SaveStartDir)
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
        if (oInitialSettings == undefined || oInitialSettings.Filter != oState.sLastFullFilter)
          oNewSettings.Filter = oState.sLastFullFilter;
      }
      if (Options.SaveAutoPreview)
      {
        if (oInitialSettings == undefined ||
            oInitialSettings.AutoPreview != Options.AutoPreviewSelectedFile)
        {
          oNewSettings.AutoPreview = Options.AutoPreviewSelectedFile;
        }
      }
      if (Options.SaveStartDir)
      {
        if (oInitialSettings == undefined || oInitialSettings.StartDir != Options.StartDir)
          oNewSettings.StartDir = Options.StartDir;
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
  //log.WriteLine("Edit: uMsg=" + uMsg + " wParam=" + wParam);
  if (uMsg == WM_KEYDOWN)
  {
    //log.WriteLine("FilterEditCallback - WM_KEYDOWN - " + wParam.toString(16));
    oState.isIgnoringEscKeyUp = false;
    //log.WriteLine("isIgnoringEscKeyUp = false");
    if (wParam == VK_BACK || wParam == VK_DELETE)
    {
      if ((wParam == VK_BACK) && IsCtrlPressed()) // Ctrl+BackSpace
      {
        var n1 = LOWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        var n2 = HIWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        var s = GetWndText(hWnd).substr(0, n1);
        var n = GetSpecialPosInFilter(s);
        if (n !== -1)
        {
          n1 = (n + 1 === n1) ? 0 : (n + 1);
        }
        if (n === -1)
        {
          AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, VK_LEFT, 0);
          n1 = LOWORD(AkelPad.SendMessage(hWnd, EM_GETSEL, 0, 0));
        }
        AkelPad.SendMessage(hWndFilterEdit, EM_SETSEL, n1, n2);
        AkelPad.SendMessage(hWndFilterEdit, EM_REPLACESEL, 1, "");
      }
      else
        AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, wParam, lParam);

      oState.sLastFullFilter = GetWndText(hWnd);
      ApplyFilter(hWndFilesList, oState.sLastFullFilter, 0);

      AkelPad.WindowNoNextProc(hSubclassFilterEdit);
      return 0;
    }
    else if (wParam == VK_DOWN || wParam == VK_UP ||
             wParam == VK_PRIOR || wParam == VK_NEXT)
    {
      AkelPad.SendMessage(hWndFilesList, uMsg, wParam, lParam);

      AkelPad.WindowNoNextProc(hSubclassFilterEdit);
      return 0;
    }
    else if (wParam == VK_F3)
    {
      if (!IsCtrlPressed())
      {
        var nFindNext = 1;
        if (IsShiftPressed())
          nFindNext = -1;
        ApplyFilter(hWndFilesList, oState.sLastFullFilter, nFindNext);

        AkelPad.WindowNoNextProc(hSubclassFilterEdit);
        return 0;
      }
    }
    else if (wParam == VK_F4)
    {
      if (!IsCtrlPressed())
      {
        if (!Options.AutoPreviewSelectedFile)
        {
          FilesList_ActivateSelectedItem(hWndFilesList);
        }
        if (IsShiftPressed())
        {
          Options.AutoPreviewSelectedFile = !Options.AutoPreviewSelectedFile;
        }
      }
      return 0;
    }
    else if (wParam == 0x51) // Q
    {
      if (IsCtrlPressed()) // Ctrl+Q
      {
        if (!Options.AutoPreviewSelectedFile)
        {
          FilesList_ActivateSelectedItem(hWndFilesList);
        }
        if (IsShiftPressed()) // Ctrl+Shift+Q
        {
          Options.AutoPreviewSelectedFile = !Options.AutoPreviewSelectedFile;
        }
        return 0;
      }
    }
  }
  else if (uMsg == WM_KEYUP)
  {
    if (wParam == VK_ESCAPE)
    {
      //log.WriteLine("FilterEditCallback - WM_KEYUP - VK_ESCAPE");
      if (!oState.isIgnoringEscKeyUp)
      {
        oSys.Call("user32::PostMessage" + _TCHAR, hWndScriptDlg, WM_CLOSE, 0, 0);
        return 0;
      }
    }
  }
  else if (uMsg == WM_CHAR)
  {
    if ((wParam == 0x7F || wParam == 0x11) && IsCtrlPressed()) // 0x7F is Ctrl+BackSpace. 0x11 is Ctrl+Q. Why? Ask M$
    {
      // do nothing
    }
    else
    {
      AkelPad.WindowNextProc(hSubclassFilterEdit, hWnd, uMsg, wParam, lParam);

      if (wParam == 0x03 && IsCtrlPressed()) // 0x03 is Ctrl+C. Why? Ask M$
      {
        // do nothing
      }
      else
      {
        oState.sLastFullFilter = GetWndText(hWnd);
        ApplyFilter(hWndFilesList, oState.sLastFullFilter, 0);
      }
    }

    AkelPad.WindowNoNextProc(hSubclassFilterEdit);
    return 0;
  }
  else if (uMsg == WM_SYSKEYDOWN)
  {
    if (!IsCtrlPressed() && !IsShiftPressed())
    {
      function remove_syschar_message_and_close()
      {
        var lpMsg = memAlloc(_X64 ? 48 : 28); // sizeof(MSG)
        if (lpMsg)
        {
          oSys.Call("user32::PeekMessage" + _TCHAR, lpMsg, 0, WM_SYSCHAR, WM_SYSCHAR, PM_REMOVE);
          memFree(lpMsg);
          oSys.Call("user32::PostMessage" + _TCHAR, hWndScriptDlg, WM_CLOSE, 0, 0);
        }
      }

      if (wParam == 0x41) // Alt+A
      {
        oState.ActionItem = Consts.nActionSelectWindow;
        remove_syschar_message_and_close();
        return 0;
      }
      else if (wParam == 0x44) // Alt+D
      {
        var lpMsg = memAlloc(_X64 ? 48 : 28); // sizeof(MSG)
        if (lpMsg)
        {
          oSys.Call("user32::PeekMessage" + _TCHAR, lpMsg, 0, WM_SYSCHAR, WM_SYSCHAR, PM_REMOVE);
          oSys.Call("user32::PeekMessage" + _TCHAR, lpMsg, 0, WM_SYSKEYUP, WM_SYSKEYUP, PM_REMOVE);
          memFree(lpMsg);
        }

        var c;
        var dir;
        var startDirResult = getStartDir();
        var title = "Set the start (project) directory for [D] files:";
        if (!startDirResult.fromCurrDir)
        {
          title += "\n* currently using a directory from the config \
\n* to switch to the directory of the active file, set an empty string";
        }
        else if (startDirResult.dir != "" && startDirResult.dir != oState.LastStartDir)
        {
          if (Options.SaveStartDir)
          {
            title += "\n* to switch to this directory and save it to the config, press OK \
\n* to switch to a directory of the active file, set an empty string";
          }
          else
          {
            title += "\n* to switch to this directory, press OK";
          }
        }

        do
        {
          dir = AkelPad.InputBox(AkelPad.GetMainWnd(), WScript.ScriptName, title, startDirResult.dir);
          if (dir == undefined || dir === "")
            break;

          while (dir.length > 0)
          {
            c = dir.substr(dir.length - 1, 1);
            if (c === "\\" || c === "/")
              dir = dir.substr(0, dir.length - 1);
            else
              break;
          }
        }
        while (!oFSO.FolderExists(dir));

        if (dir != undefined)
        {
          if (dir === "")
          {
            // use the current dir
            if (!startDirResult.fromCurrDir)
            {
              Options.StartDir = dir;
            }
            if (startDirResult.dir != "" && getStartDir().dir != oState.LastStartDir)
            {
              oState.isDirectoryFilesLoaded = false;
              oState.DirectoryFiles = [];
              FilesList_Fill(hWndFilesList, undefined);
              SetWndText(hWndFilterEdit, "");
            }
          }
          else
          {
            Options.StartDir = dir;
            if (dir != oState.LastStartDir)
            {
              Options.StartDir = dir;
              oState.isDirectoryFilesLoaded = false;
              oState.DirectoryFiles = [];
              FilesList_Fill(hWndFilesList, undefined);
              SetWndText(hWndFilterEdit, "");
            }
          }
        }

        if (dir == undefined) // "Cancel" or Esc pressed
        {
          // this helps to ignore the Esc pressed in the InputBox
          oState.isIgnoringEscKeyUp = true;
        }
        oSys.Call("user32::SetFocus", hWndFilterEdit);
        return 0;
      }
      else if (wParam == 0x46) // Alt+F
      {
        oState.ActionItem = Consts.nActionEditFavourites;
        remove_syschar_message_and_close();
        return 0;
      }
      else if (wParam == 0x48) // Alt+H
      {
        oState.ActionItem = Consts.nActionManageRecentFiles;
        remove_syschar_message_and_close();
        return 0;
      }
    }
  }
}

function FilesListCallback(hWnd, uMsg, wParam, lParam)
{
  //log.WriteLine("List: uMsg=" + uMsg + " wParam=" + wParam);
  if (uMsg == WM_KEYDOWN)
  {
    //log.WriteLine("FilesListCallback - WM_KEYDOWN - " + wParam.toString(16));
    oState.isIgnoringEscKeyUp = false;
    //log.WriteLine("isIgnoringEscKeyUp = false");
    if (wParam == VK_DOWN || wParam == VK_UP ||
        wParam == VK_PRIOR || wParam == VK_NEXT ||
        wParam == VK_HOME || wParam == VK_END)
    {
      AkelPad.WindowNextProc(hSubclassFilesList, hWnd, uMsg, wParam, lParam);
      if (Options.AutoPreviewSelectedFile)
      {
        FilesList_ActivateSelectedItem(hWnd);
      }
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
  else if (uMsg == WM_KEYUP)
  {
    if (wParam == VK_ESCAPE)
    {
      //log.WriteLine("FilesListCallback - WM_KEYUP - VK_ESCAPE");
      if (!oState.isIgnoringEscKeyUp)
      {
        oSys.Call("user32::PostMessage" + _TCHAR, hWndScriptDlg, WM_CLOSE, 0, 0);
        return 0;
      }
    }
  }
  else if (uMsg == WM_CHAR)
  {
    AkelPad.SendMessage(hWndFilterEdit, uMsg, wParam, lParam);
    oSys.Call("user32::SetFocus", hWndFilterEdit);
    AkelPad.WindowNoNextProc(hSubclassFilesList);
    return 0;
  }
  else if (uMsg == WM_SYSKEYDOWN)
  {
    AkelPad.SendMessage(hWndFilterEdit, uMsg, wParam, lParam);
    oSys.Call("user32::SetFocus", hWndFilterEdit);
    AkelPad.WindowNoNextProc(hSubclassFilesList);
    return 0;
  }
  else if (uMsg == WM_LBUTTONDOWN)
  {
    AkelPad.WindowNextProc(hSubclassFilesList, hWnd, uMsg, wParam, lParam);
    if (Options.AutoPreviewSelectedFile)
    {
      FilesList_ActivateSelectedItem(hWnd);
    }
    AkelPad.WindowNoNextProc(hSubclassFilesList);
    return 0;
  }
}

function ApplyFilter(hListWnd, sFilter, nFindNext)
{
  var sFindWhat = "";
  var nLine = -1;
  var fromBeginning = false;
  var i;
  var c;

  if (sFilter != undefined && sFilter != "")
  {
    i = GetSpecialPosInFilter(sFilter);
    if (i != -1)
    {
      c = sFilter.substr(i, 1);
      if (c === Options.Char_GoToText1 || c === Options.Char_GoToText2)
      {
        if (c === Options.Char_GoToText1 && nFindNext == 0)
        {
          fromBeginning = true;
        }
        sFindWhat = sFilter.substr(i + 1);
        sFilter = sFilter.substr(0, i);
      }
      else if (c === Options.Char_GoToLine)
      {
        nLine = parseInt(sFilter.substr(i + 1));
        if (isNaN(nLine))
          nLine = -1;
        sFilter = sFilter.substr(0, i);
      }
    }

    sFilter = sFilter.toLowerCase();
  }

  if (sFilter != oState.sLastPartialFilter)
  {
    oState.sLastPartialFilter = sFilter;
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
    var arrFindWhat = [];
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
    if (Options.IsTextSearchFuzzy)
    {
      // The "heavy" fuzzy search:
      //   "abc" matches "abc", "axbzyc", "axyzbzxc" and so on
      // The "lite" fuzzy search:
      //   "abc" matches only "abc"
      //   "a,b,c" matches "a,b,c" and "axy,bzyx,c"
      //   "a b c" matches "a b c", "a   b  c", "aybxzc" and "axyz  bzy   c"
      var t = sFindWhat.replace(/[.*+\-?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
      var sFindWhatLite = ""; // for "lite" fuzzy search
      var sFindWhatHeavy = ""; // for "heavy" fuzzy search
      var reWordSep = /[_\-\(\)\[\]\{\}\\\|\/\.,;:?><"'!=+~`@#$%^&*]/;
      var nFuzzyComplexityLite = 0;
      var nFuzzyComplexityHeavy = 0;
      var nFuzzySpaces = 0;
      var nMaxFuzzyComplexity = 20; // the fuzzy search becomes very slow with higher values
      var nMaxFuzzySpaces = (nFindNext < 0) ? 5 : 10;
      n = t.length;
      for (i = 0; i < n; ++i)
      {
        c = t.charAt(i);
        if (c !== " ")
        {
          if (reWordSep.test(c))
          {
            sFindWhatLite += "\\w*?";
            ++nFuzzyComplexityLite;
          }
          sFindWhatLite += c;
          sFindWhatHeavy += c;
          if (c === "\\")
          {
            ++i;
            c = t.charAt(i);
            sFindWhatLite += c;
            sFindWhatHeavy += c;
          }
          if (i < n - 1)
          {
            sFindWhatHeavy += "\\w*?";
            ++nFuzzyComplexityHeavy;
          }
        }
        else
        {
          // ' ' matches any character or spaces
          sFindWhatLite += "\\w*?([ \t]+?|.)";
          sFindWhatHeavy += "([ \t]+?|.)";
          ++nFuzzySpaces;
          nFuzzyComplexityHeavy += 1;
          nFuzzyComplexityLite += 2;
        }
      }
      nFlags |= FRF_REGEXP|FRF_REGEXPNONEWLINEDOT;
      //WScript.Echo("cp_h = " + nFuzzyComplexityHeavy + ", cp_l = " + nFuzzyComplexityLite + ", sp = " + nFuzzySpaces);
      if (nFuzzyComplexityHeavy <= nMaxFuzzyComplexity &&
          nFuzzySpaces <= nMaxFuzzySpaces - Math.round(nFuzzyComplexityHeavy/10))
      {
        arrFindWhat.push(sFindWhatHeavy);
      }
      if (nFuzzyComplexityLite <= nMaxFuzzyComplexity &&
          nFuzzySpaces <= nMaxFuzzySpaces - Math.round(nFuzzyComplexityLite/10))
      {
        arrFindWhat.push(sFindWhatLite);
      }
      arrFindWhat.push(t);
    }
    else
    {
      arrFindWhat.push(sFindWhat);
    }

    for (i = 0; i < arrFindWhat.length; ++i)
    {
      sFindWhat = arrFindWhat[i]; //WScript.Echo(sFindWhat);
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
      if (n !== -1)
        break;
    }
  }
  else if (nLine != -1)
  {
    AkelPad.SendMessage(hWndMain, AKD_GOTOW, GT_LINE, AkelPad.MemStrPtr(nLine.toString()));
  }
  else
  {
    if (oState.nActiveFrameSelStart != AkelPad.GetSelStart() ||
        oState.nActiveFrameSelEnd != AkelPad.GetSelEnd())
    {
      AkelPad.SetSel(oState.nActiveFrameSelStart, oState.nActiveFrameSelEnd);
    }

    var hEd = AkelPad.GetEditWnd();
    var nFirstVisibleLine = Edit_GetFirstVisibleLine(hEd);
    if (oState.nActiveFirstVisibleLine != nFirstVisibleLine)
    {
      AkelPad.SendMessage(hEd, EM_LINESCROLL, 0, (oState.nActiveFirstVisibleLine - nFirstVisibleLine));
    }
  }
}

function GetSpecialPosInFilter(sFilter)
{
  if (sFilter == undefined || sFilter === "")
    return -1;

  var i1 = sFilter.indexOf(Options.Char_GoToText1);
  var i2 = sFilter.indexOf(Options.Char_GoToText2);
  if (i1 !== -1)
    return (i2 !== -1 && i2 < i1) ? i2 : i1;
  else if (i2 !== -1)
    return i2;

  i1 = sFilter.lastIndexOf(Options.Char_GoToLine);
  if (i1 !== -1)
  {
    var c = sFilter.substr(i1 + 1, 1);
    if (c === "\\" || c === "/")
      i1 = -1;
  }
  return i1;
}

function FilesList_GetCurSelData(hListWnd)
{
  var n = AkelPad.SendMessage(hListWnd, LB_GETCURSEL, 0, 0);
  if (n < 0)
    n = 0;

  return oFileListItems[n][1];
}

function FilesList_SetCurSel(hListWnd, nItem)
{
  AkelPad.SendMessage(hListWnd, LB_SETCURSEL, nItem, 0);
}

function FilesList_Clear(hListWnd)
{
  AkelPad.SendMessage(hListWnd, LB_RESETCONTENT, 0, 0);
}

function FilesList_AddItem(hListWnd, fileName)
{
  var n = AkelPad.SendMessage(hListWnd, LB_ADDSTRING, 0, fileName);
}

function FilesList_Fill(hListWnd, sFilter)
{
  var i;
  var n;
  var fpath;
  var item;
  var totalItems = 0;
  var matches = [];
  var activeFilePaths = [];

  function matches_add_if_match(offset, fname)
  {
    if (sFilter == undefined || sFilter === "")
    {
      var m = [];
      m.push(offset);  // match=offset
      m.push(offset);  // offset
      m.push(fname);   // name
      matches.push(m);
    }
    else
    {
      var mf = MatchFilter(sFilter, fname.toLowerCase());
      if (mf !== "")
      {
        var m = [];
        m.push(mf);      // match
        m.push(offset);  // offset
        m.push(fname);   // name
        matches.push(m);
      }
    }
  }

  // Opened documents (frames + paths)
  oState.AkelPadOpenedFiles = getOpenedFiles();
  n = oState.AkelPadOpenedFiles.length;
  for (i = 0; i < n; ++i)
  {
    if (oState.AkelPadOpenedFiles[i].lpFrame != oState.lpTemporaryFrame)
    {
      fpath = oState.AkelPadOpenedFiles[i].path;
      activeFilePaths.push(fpath);
      item = getNthDepthPath(fpath, Options.VisualPathDepth);
      if (Options.ShowItemPrefixes)
        item = "[A] " + item;
      matches_add_if_match(Consts.nOpenedFilesOffset + i, item);
      ++totalItems;
    }
  }

  // Directory files
  oState.DirectoryFiles = getDirectoryFiles();
  n = oState.DirectoryFiles.length;
  for (i = 0; i < n; ++i)
  {
    fpath = oState.DirectoryFiles[i];
    if (!isStringInArray(fpath, activeFilePaths, true))
    {
      item = getNthDepthPath(fpath, Options.VisualPathDepth);
      if (Options.ShowItemPrefixes)
        item = "[D] " + item;
      matches_add_if_match(Consts.nDirFilesOffset + i, item);
      ++totalItems;
    }
  }

  // Note:
  // isStringInArray() is an expensive operation, especially when the given
  // array contains a lot of items.
  // That's why the code below does not use
  //   !isStringInArray(fpath, oState.DirectoryFiles, true)
  // Otherwise the performance would be degraded.
  // (In case of several thousands of files, there would be a noticeable
  // delay _each_ time the file filter is changed).

  // Favourites
  oState.AkelPadFavourites = getFavourites();
  n = oState.AkelPadFavourites.length;
  for (i = 0; i < n; ++i)
  {
    fpath = oState.AkelPadFavourites[i];
    if (!isStringInArray(fpath, activeFilePaths, true))
    {
      item = getNthDepthPath(fpath, Options.VisualPathDepth);
      if (Options.ShowItemPrefixes)
        item = "[F] " + item;
      matches_add_if_match(Consts.nFavouritesOffset + i, item);
      ++totalItems;
    }
  }

  // Recent files
  oState.AkelPadRecentFiles = getRecentFiles();
  n = oState.AkelPadRecentFiles.length;
  for (i = 0; i < n; ++i)
  {
    fpath = oState.AkelPadRecentFiles[i];
    if (!isStringInArray(fpath, activeFilePaths, true) &&
        !isStringInArray(fpath, oState.AkelPadFavourites, true))
    {
      item = getNthDepthPath(fpath, Options.VisualPathDepth);
      if (Options.ShowItemPrefixes)
        item = "[H] " + item;
      matches_add_if_match(Consts.nRecentFilesOffset + i, item);
      ++totalItems;
    }
  }

  matches.sort(compareByMatch);

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, FALSE, 0);
  FilesList_Clear(hListWnd);

  oFileListItems = matches; // [0] - match, [1] - offset, [2] - name

  n = oFileListItems.length;
  for (i = 0; i < n; ++i)
  {
    FilesList_AddItem(hListWnd, oFileListItems[i][2]);
  }

  AkelPad.SendMessage(hListWnd, WM_SETREDRAW, TRUE, 0);

  if (oFileListItems.length > 0)
  {
    FilesList_SetCurSel(hListWnd, 0);
    if (Options.AutoPreviewSelectedFile)
    {
      FilesList_ActivateSelectedItem(hListWnd);
    }
  }

  if (Options.ShowNumberOfItemsInTitle)
  {
    var title = sScriptName + "  [" + oFileListItems.length + "/" + totalItems + "]";
    var hDlg = oSys.Call("user32::GetParent", hListWnd);
    SetWndText(hDlg, title);
  }
}

function apply_active_frame(lpFrm)
{
  oState.nActiveFrameSelStart = AkelPad.GetSelStart();
  oState.nActiveFrameSelEnd = AkelPad.GetSelEnd();
  oState.nActiveFirstVisibleLine = Edit_GetFirstVisibleLine(AkelPad.GetEditWnd());
  ApplyFilter(undefined, oState.sLastFullFilter, 0);
}

function open_file(filePath, flags)
{
  var result = 0; // success
  var nRecentFileIndex = -1;

  function open_file_in_temp_tab(filePath)
  {
    var res;
    var lpOpenDocW;
    var dwFlags = 0x00F;
    var hDocEd = 0;

    if (filePath == undefined || filePath == "")
      return -1; // error

    if (isFrameValid(oState.lpTemporaryFrame))
    {
      if (oState.lpTemporaryFrame != getCurrentFrame())
        activateFrame(oState.lpTemporaryFrame);
      if (getFrameFileName(oState.lpTemporaryFrame) == filePath)
        return 0; // success

      hDocEd = AkelPad.SendMessage(hWndMain, AKD_GETFRAMEINFO, FI_DOCEDIT, oState.lpTemporaryFrame);
      dwFlags |= 0x100; /* OD_REOPEN */
    }
    else
      oState.lpTemporaryFrame = undefined;

    lpOpenDocW = memAlloc(_X64 ? 40 : 24); // sizeof(OPENDOCUMENTW)
    if (!lpOpenDocW)
      return -1; // error

    // lpOpenDocW.pFile = sFullPath;
    AkelPad.MemCopy(_PtrAdd(lpOpenDocW, 0), filePath, _X64 ? DT_QWORD : DT_DWORD);
    // lpOpenDocW.pWorkDir = NULL;
    AkelPad.MemCopy(_PtrAdd(lpOpenDocW, _X64 ? 8 : 4), 0, _X64 ? DT_QWORD : DT_DWORD);
    // lpOpenDocW.dwFlags = dwFlags;
    AkelPad.MemCopy(_PtrAdd(lpOpenDocW, _X64 ? 16 : 8), dwFlags, DT_DWORD);
    // lpOpenDocW.nCodePage = 0;
    AkelPad.MemCopy(_PtrAdd(lpOpenDocW, _X64 ? 20 : 12), 0, DT_DWORD);
    // lpOpenDocW.bBOM = 0;
    AkelPad.MemCopy(_PtrAdd(lpOpenDocW, _X64 ? 24 : 16), 0, DT_DWORD);
    // lpOpenDocW.hDoc = hDocEd;
    AkelPad.MemCopy(_PtrAdd(lpOpenDocW, _X64 ? 32 : 20), hDocEd, _X64 ? DT_QWORD : DT_DWORD);

    res = AkelPad.SendMessage(hWndMain, AKD_OPENDOCUMENTW, 0, lpOpenDocW);
    if (res == 0) // success
      Edit_ScrollCaret(AkelPad.GetEditWnd());

    memFree(lpOpenDocW);

    return res;
  }

  if (Options.ExcludePreviewedFilesFromRecentFiles) // before opening a file
  {
    nRecentFileIndex = AkelPad.SendMessage(hWndMain, AKD_RECENTFILES, RF_FINDINDEX, filePath);
  }

  if (AkelPad.IsMDI() != WMD_SDI)
    result = open_file_in_temp_tab(filePath);
  else
    result = AkelPad.OpenFile(filePath, 0x00F);

  if (result != 0)
    return;

  if (Options.ExcludePreviewedFilesFromRecentFiles) // after opening a file
  {
    if (nRecentFileIndex == -1) // filePath was not present in the Recent Files
    {
      nRecentFileIndex = AkelPad.SendMessage(hWndMain, AKD_RECENTFILES, RF_FINDINDEX, filePath);
      if (nRecentFileIndex != -1)
        AkelPad.SendMessage(hWndMain, AKD_RECENTFILES, RF_DELETEINDEX, nRecentFileIndex);
    }
  }

  oState.lpTemporaryFrame = getCurrentFrame();
  if (flags & fofApplyActiveFrame)
    apply_active_frame(oState.lpTemporaryFrame);
  oState.sLastActivatedFilePath = filePath;
}

function activateOpenedFile(offset, flags)
{
  var lpExistingFrame = 0;
  var af = oState.AkelPadOpenedFiles[offset - Consts.nOpenedFilesOffset];

  //WScript.Echo(af.lpFrame + ", " + getCurrentFrame() + ", " + isFrameValid(af.lpFrame));
  if (!isFrameValid(af.lpFrame) || getFrameFileName(af.lpFrame) != af.path)
  {
    // The af.lpFrame (AkelPad's tab) had been closed while GoToAnything is visible.
    // Maybe the same file has been opened in another frame (tab)?
    if (flags & fofApplyActiveFrame)
      flags -= fofApplyActiveFrame;
    lpExistingFrame = getFrameByFullPath(af.path);
    if (lpExistingFrame)
      af.lpFrame = lpExistingFrame;
    else
      open_file(af.path, flags);
  }
  else
  {
    lpExistingFrame = af.lpFrame;
  }

  if (lpExistingFrame && af.lpFrame != getCurrentFrame())
  {
    activateFrame(af.lpFrame);
    if (flags & fofApplyActiveFrame)
      apply_active_frame(af.lpFrame);
    oState.sLastActivatedFilePath = af.path;
  }
}

function getFullPathByOffset(offset)
{
  if (offset >= Consts.nRecentFilesOffset)
    return oState.AkelPadRecentFiles[offset - Consts.nRecentFilesOffset];
  if (offset >= Consts.nFavouritesOffset)
    return oState.AkelPadFavourites[offset - Consts.nFavouritesOffset];
  if (offset >= Consts.nDirFilesOffset)
    return oState.DirectoryFiles[offset - Consts.nDirFilesOffset];
  if (offset >= Consts.nOpenedFilesOffset)
    return oState.AkelPadOpenedFiles[offset - Consts.nOpenedFilesOffset].path;
  return "";
}

function FilesList_ActivateSelectedItem(hListWnd)
{
  var offset = FilesList_GetCurSelData(hListWnd);
  if (offset >= Consts.nDirFilesOffset)
  {
    var sFullPath = getFullPathByOffset(offset);
    if (sFullPath != "")
    {
      if (oFSO.FileExists(sFullPath))
      {
        if (oState.sLastActivatedFilePath == undefined || oState.sLastActivatedFilePath != sFullPath)
        {
          open_file(sFullPath, fofApplyActiveFrame | fofPreviewFile);
        }
      }
      else if ((offset >= Consts.nFavouritesOffset && offset < Consts.nRecentFilesOffset) &&
               (Options.FoldersInFavourites && oFSO.FolderExists(sFullPath)))
      {
        AkelPad.Call("Explorer::Main", 1, sFullPath);
        if (oSys.Call("user32::SetForegroundWindow", hWndScriptDlg))
        {
          oSys.Call("user32::SetFocus", hWndFilterEdit);
        }
        oState.sLastActivatedFilePath = sFullPath;
      }
    }
  }
  else if (offset >= Consts.nOpenedFilesOffset)
  {
    activateOpenedFile(offset, fofApplyActiveFrame | fofPreviewFile);
  }

  if (AkelPad.IsMDI() == WMD_PMDI)
  {
    // In case of PMDI, the focus goes to the activated edit window.
    // So we have to return the focus back to this script's window.
    if (oSys.Call("user32::SetForegroundWindow", hWndScriptDlg))
    {
      oSys.Call("user32::SetFocus", hWndFilterEdit);
    }
    //log.WriteLine("hFgWnd=0x" + oSys.Call("user32::GetForegroundWindow").toString(16) + " hFocused=0x" + oSys.Call("user32::GetFocus").toString(16));
  }
}

function compareByMatch(m1, m2)
{
  // first, comparing by match
  if (m1[0] < m2[0])
    return -1;
  if (m1[0] > m2[0])
    return 1;
  // next, comparing by name
  if (m1[2] < m2[2])
    return -1;
  if (m1[2] > m2[2])
    return 1;
  return 0;
}

function MatchFilter(sFilter, sFilePath)
{
  var i;
  var j;
  var c;
  var m;
  var fname = getFileName(sFilePath);

  i = fname.indexOf(sFilter)
  if (i !== -1)
  {
    m = "" + i;
    while (m.length < 3)  m = "0" + m;
    return "e1" + m; // exact name match
  }

  j = 0;
  m = "";
  for (i = 0; i < sFilter.length; ++i)
  {
    c = sFilter.substr(i, 1);
    if (c !== " ") // ' ' matches any character
      j = fname.indexOf(c, j);
    if (j === -1)
    {
      m = ""; // no match
      break;
    }

    while (m.length < j)  m = m + "x";
    m = m + "v";
    ++j;
  }
  if (m !== "")
    return "p1" + m; // partial name match

  if (fname !== sFilePath)
  {
    i = sFilePath.indexOf(sFilter);
    if (i !== -1)
    {
      m = "" + i;
      while (m.length < 3)  m = "0" + m;
      return "e2" + m; // exact pathname match
    }

    j = 0;
    m = "";
    for (i = 0; i < sFilter.length; ++i)
    {
      c = sFilter.substr(i, 1);
      if (c !== " ") // ' ' matches any character
        j = sFilePath.indexOf(c, j);
      if (j === -1)
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
  var lpRect = memAlloc(16); // sizeof(RECT)

  oSys.Call("user32::GetWindowRect", hWnd, lpRect);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  memFree(lpRect);

  return oRect;
}

function GetClientRect(hWnd)
{
  var oRect  = new Object();
  var lpRect = memAlloc(16); // sizeof(RECT)

  oSys.Call("user32::GetClientRect", hWnd, lpRect);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  memFree(lpRect);

  return oRect;
}

function GetChildWindowRect(hWnd)
{
  var oRect  = new Object();
  var lpRect = memAlloc(16); // sizeof(RECT)
  var hParentWnd = oSys.Call("user32::GetParent", hWnd);

  oSys.Call("user32::GetWindowRect", hWnd, lpRect);
  oSys.Call("user32::MapWindowPoints", HWND_DESKTOP, hParentWnd, lpRect, 2);

  oRect.X = AkelPad.MemRead(_PtrAdd(lpRect,  0), DT_DWORD);
  oRect.Y = AkelPad.MemRead(_PtrAdd(lpRect,  4), DT_DWORD);
  oRect.W = AkelPad.MemRead(_PtrAdd(lpRect,  8), DT_DWORD) - oRect.X;
  oRect.H = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD) - oRect.Y;

  memFree(lpRect);

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
  var nMaxTextLen = 4*1024;
  var lpText = memAlloc(nMaxTextLen * 2);
  oSys.Call("user32::GetWindowTextW", hWnd, lpText, nMaxTextLen);
  var S = AkelPad.MemRead(lpText, DT_UNICODE);
  memFree(lpText);
  return S;
}

function SetWndText(hWnd, sText)
{
  oSys.Call("user32::SetWindowTextW", hWnd, sText);
}

function Edit_GetFirstVisibleLine(hEd)
{
  var nLine = AkelPad.SendMessage(hEd, EM_GETFIRSTVISIBLELINE, 0, 0);
  return AkelPad.SendMessage(hEd, AEM_GETUNWRAPLINE, nLine, 0);
}

function Edit_ScrollCaret(hEd)
{
  // AESCROLLTOPOINT stp;
  var lpStp = memAlloc(_X64 ? 32 : 20); // sizeof(AESCROLLTOPOINT)

  //Test scroll to caret
  // stp.dwFlags = AESC_TEST|AESC_POINTCARET|AESC_OFFSETCHARX|AESC_OFFSETCHARY;
  AkelPad.MemCopy(_PtrAdd(lpStp, 0), 0x0C11, DT_DWORD);
  // stp.nOffsetX = 1;
  AkelPad.MemCopy(_PtrAdd(lpStp, _X64 ? 24 : 12), 1, DT_DWORD);
  // stp.nOffsetY = 0;
  AkelPad.MemCopy(_PtrAdd(lpStp, _X64 ? 28 : 16), 0, DT_DWORD);
  var dwScrollResult = AkelPad.SendMessage(hEd, AEM_SCROLLTOPOINT, 0, lpStp);

  //Scroll to caret
  var dwFlags = 0x10; /*AESC_POINTCARET*/
  if (dwScrollResult & 0x01) /*AECSE_SCROLLEDX*/
    dwFlags |= 0x1000; /*AESC_OFFSETRECTDIVX*/
  if (dwScrollResult & 0x02) /*AECSE_SCROLLEDY*/
    dwFlags |= 0x2000; /*AESC_OFFSETRECTDIVY*/
  // stp.dwFlags = dwFlags;
  AkelPad.MemCopy(_PtrAdd(lpStp, 0), dwFlags, DT_DWORD);
  // stp.nOffsetX = 3;
  AkelPad.MemCopy(_PtrAdd(lpStp, _X64 ? 24 : 12), 3, DT_DWORD);
  // stp.nOffsetY = 2;
  AkelPad.MemCopy(_PtrAdd(lpStp, _X64 ? 28 : 16), 2, DT_DWORD);
  AkelPad.SendMessage(hEd, AEM_SCROLLTOPOINT, 0, lpStp);

  memFree(lpStp);
}

function IsCtrlPressed()
{
  return oSys.Call("user32::GetKeyState", VK_CONTROL) & 0x8000;
}

function IsShiftPressed()
{
  return oSys.Call("user32::GetKeyState", VK_SHIFT) & 0x8000;
}

function RectToArray(lpRect)
{
  var rcRect = [];
  rcRect.left = AkelPad.MemRead(_PtrAdd(lpRect, 0), DT_DWORD);
  rcRect.top = AkelPad.MemRead(_PtrAdd(lpRect, 4), DT_DWORD);
  rcRect.right = AkelPad.MemRead(_PtrAdd(lpRect, 8), DT_DWORD);
  rcRect.bottom = AkelPad.MemRead(_PtrAdd(lpRect, 12), DT_DWORD);
  return rcRect;
}

function getEnvVar(varName)
{
  var varValue = "";
  var lpBuffer = memAlloc(8192 * _TSIZE);
  if (lpBuffer)
  {
    oSys.Call("kernel32::GetEnvironmentVariable" + _TCHAR, varName, lpBuffer, 8190);
    varValue = AkelPad.MemRead(lpBuffer, _TSTR);
    memFree(lpBuffer);
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
  var n = arr.length;

  if (ignoreCase)
  {
    str = str.toLowerCase();
  }

  for (i = 0; i < n; ++i)
  {
    if (ignoreCase ? str === arr[i].toLowerCase() : str === arr[i])
        return true;
  }
  return false;
}

function strTrim(s)
{
  return s.replace(/^\s+|\s+$/g, "");
}

function getNthDepthPath(path, depth)
{
  var k1;
  var k2;
  var k = path.length;

  for (;;)
  {
    k1 = path.lastIndexOf("\\", k);
    k2 = path.lastIndexOf("/", k);
    k = (k1 > k2) ? k1 : k2;
    if (k === -1)
      break;

    if (--depth === 0)
      return path.substr(k + 1);

    --k;
  }

  return path;
}

function getFileName(path)
{
  var k1 = path.lastIndexOf("\\");
  var k2 = path.lastIndexOf("/");
  var k = (k1 > k2) ? k1 : k2;

  if (k !== -1)
    path = path.substr(k + 1);

  return path;
}

function getColorThemeVariable(hWndEdit, varName)
{
  var sVarValue = "";
  var lpVarValue = memAlloc(64 * 2);
  if (lpVarValue)
  {
    AkelPad.CallW("Coder::Settings", 22, hWndEdit, 0, varName, lpVarValue);
    sVarValue = AkelPad.MemRead(lpVarValue, DT_UNICODE);
    memFree(lpVarValue);
  }
  return sVarValue;
}

function getRgbIntFromHex(sRgb)
{
  if (sRgb.length != 0)
  {
    var i = 0;
    if (sRgb.substr(0, 1) === "#")
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
  return (Options.ApplyColorTheme && nBkColorRGB !== -1 && nTextColorRGB !== -1);
}

function showHelp()
{
  oState.isIgnoringEscKeyUp = true;
  //log.WriteLine("isIgnoringEscKeyUp = true");
  oSys.Call("user32::MessageBox" + _TCHAR, hWndScriptDlg, sScriptHelp, sScriptName + ": Help", MB_OK);
  oSys.Call("user32::SetFocus", hWndFilterEdit);
}

function getOpenedFiles()
{
  var openedFiles = [];
  var lpStartFrame = getCurrentFrame();
  var lpFrame = lpStartFrame;

  do
  {
    var af = new Object();
    af.lpFrame = lpFrame;
    af.path = getFrameFileName(lpFrame);
    openedFiles.push(af);
    lpFrame = AkelPad.SendMessage(hWndMain, AKD_FRAMEFIND, FWF_PREV, lpFrame);
  }
  while (lpFrame && lpFrame != lpStartFrame);

  return openedFiles;
}

function getCurrentFrame()
{
  return AkelPad.SendMessage(hWndMain, AKD_FRAMEFIND, FWF_CURRENT, 0);
}

function getFrameByFullPath(sFullPath)
{
  return AkelPad.SendMessage(hWndMain, AKD_FRAMEFINDW, FWF_BYFILENAME, sFullPath);
}

function isFrameValid(lpFrame)
{
  if (lpFrame == undefined || lpFrame == 0)
    return 0;
  return AkelPad.SendMessage(hWndMain, AKD_FRAMEISVALID, 0, lpFrame);
}

function getFrameFileName(lpFrame)
{
  return AkelPad.MemRead(AkelPad.SendMessage(hWndMain, AKD_GETFRAMEINFO, FI_FILEW, lpFrame), DT_UNICODE);
}

function activateFrame(lpFrame)
{
  AkelPad.SendMessage(hWndMain, AKD_FRAMEACTIVATE, 0, lpFrame);
}

function destroyFrame(lpFrame)
{
  AkelPad.SendMessage(hWndMain, AKD_FRAMEDESTROY, 0, lpFrame);
}

function getFavFilePath()
{
  var sScriptFullPath = WScript.ScriptFullName;
  return sScriptFullPath.substring(0, sScriptFullPath.lastIndexOf(".")) + ".fav";
}

function getStartDir()
{
  var result = new Object();
  if (Options.StartDir != undefined &&
      Options.StartDir !== "" &&
      oFSO.FolderExists(Options.StartDir))
  {
    result.dir = Options.StartDir;
    result.fromCurrDir = false;
    return result;
  }

  var startDir = AkelPad.GetEditFile(0);
  if (startDir == undefined)
  {
    startDir = "";
  }
  if (startDir !== "")
  {
    var i;
    for (i = Options.DirFilesStartLevel + 1; i > 0 && startDir.length > 3; --i)
    {
      startDir = AkelPad.GetFilePath(startDir, 1 /*CPF_DIR*/);
    }
  }
  result.dir = startDir;
  result.fromCurrDir = true;
  return result;
}

function getDirectoryFiles()
{
  if (Options.DirFilesStartLevel < 0)
    return [];

  if (oState.isDirectoryFilesLoaded)
    return oState.DirectoryFiles;

  var directoryFiles = [];
  var currDir = AkelPad.GetFilePath(AkelPad.GetEditFile(0), 1 /*CPF_DIR*/);
  var startDir = getStartDir().dir;

  if (startDir === "")
  {
    oState.LastStartDir = startDir;
    oState.isDirectoryFilesLoaded = true;
    return directoryFiles;
  }

  var excludeDirs = Options.DirFilesExcludeDirs.slice(0); // a copy
  var excludeFileExts = Options.DirFilesExcludeFileExts;  // a reference
  var result = undefined;
  var isStartDirInCurrDir = false;

  if (currDir.toLowerCase() != startDir.toLowerCase() &&
      currDir.toLowerCase().indexOf(startDir.toLowerCase()) == 0)
  {
    isStartDirInCurrDir = true;
  }

  if (isStartDirInCurrDir)
  {
    // first, process the current directory...
    result = getFilesInDir(currDir, excludeFileExts, excludeDirs, Options.DirFilesMaxDepth, 0);
    directoryFiles = result.files;
  }

  if ((result == undefined) ||
      (result.code == 0 && isStartDirInCurrDir))
  {
    // next, process the start directory...
    if (result != undefined)
    {
      excludeDirs.push(currDir); // except the current dir
    }
    directoryFiles = directoryFiles.concat(
      getFilesInDir(startDir, excludeFileExts, excludeDirs, Options.DirFilesMaxDepth, directoryFiles.length).files);
  }

  //WScript.Echo("Number of files: " + directoryFiles.length);
  oState.LastStartDir = startDir;
  oState.isDirectoryFilesLoaded = true;
  return directoryFiles;
}

function getFileSizeFromFindData(lpFindData)
{
  var nFileSizeHigh = AkelPad.MemRead(_PtrAdd(lpFindData, 28), DT_DWORD);
  var nFileSizeLow = AkelPad.MemRead(_PtrAdd(lpFindData, 32),  DT_DWORD);
  if (nFileSizeLow < 0)
  {
    nFileSizeLow += 0x100000000;
  }
  if (nFileSizeHigh != 0)
  {
    nFileSizeLow += 0x100000000*nFileSizeHigh;
  }
  return nFileSizeLow;
}

function getFilesInDir(dirPath, excludeFileExts, excludeDirs, maxDepth, totalFiles)
{
  var NoError = 0;
  var Error_TooManyFiles = -1;
  var subresult;
  var s;
  var sFullName;
  var nAttr;
  var i;
  var j;
  var nDirs;
  var nSubDirs;
  var result = {
    files : [],
    code : NoError // OK
  };

  var dirs = [];
  var lpFindData = memAlloc(44 + (260 + 14) * _TSIZE); // sizeof(WIN32_FIND_DATAW)
  var hFindFile = oSys.Call("kernel32::FindFirstFileW", dirPath + "\\*.*", lpFindData);

  if (hFindFile != -1) // INVALID_HANDLE_VALUE
  {
    do
    {
      s = AkelPad.MemRead(_PtrAdd(lpFindData, 44), DT_UNICODE); // WIN32_FIND_DATAW.cFileName
      if (s === "." || s === "..")
        continue;

      sFullName = dirPath + "\\" + s;
      nAttr = AkelPad.MemRead(lpFindData, DT_DWORD);
      if (nAttr & 16 /*FILE_ATTRIBUTE_DIRECTORY*/)
      {
        if (maxDepth > 0 &&
            !isStringInArray(s, excludeDirs, true) &&
            !isStringInArray(sFullName, excludeDirs, true))
        {
          dirs.push(sFullName);
        }
        continue;
      }

      if (getFileSizeFromFindData(lpFindData) > Options.DirFilesMaxFileSize)
        continue;

      s = AkelPad.GetFilePath(s, 4 /*CPF_FILEEXT*/);
      if (!isStringInArray(s.toLowerCase(), excludeFileExts, false))
      {
        result.files.push(sFullName);
        if (++totalFiles >= Options.MaxDirFiles)
        {
          result.code = Error_TooManyFiles;
          break;
        }
      }
    }
    while (oSys.Call("kernel32::FindNextFileW", hFindFile, lpFindData));

    oSys.Call("kernel32::FindClose", hFindFile);
  }

  memFree(lpFindData);

  if (result.code != NoError)
    return result;

  nDirs = dirs.length;
  for (i = 0; i < nDirs && result.code == NoError; ++i)
  {
    subresult = getFilesInDir(dirs[i], excludeFileExts, excludeDirs, maxDepth - 1, totalFiles);
    nSubDirs = subresult.files.length;
    for (j = 0; j < nSubDirs && result.code == NoError; ++j)
    {
      result.files.push(subresult.files[j]);
      if (++totalFiles >= Options.MaxDirFiles)
        result.code = Error_TooManyFiles;
    }
    if (subresult.code != NoError)
      result.code = subresult.code;
  }

  return result;
}

function getFavourites()
{
  if (oState.isFavouritesLoaded)
    return oState.AkelPadFavourites;

  var favourites = [];
  var sFavFile = getFavFilePath();
  if (oFSO.FileExists(sFavFile))
  {
    var sFavContent = AkelPad.ReadFile(sFavFile, 0x1C);
    if (sFavContent != "")
    {
      var i, fpath;
      var fpaths = sFavContent.split("\n");
      for (i = 0; i < fpaths.length; ++i)
      {
        fpath = fpaths[i];
        if (fpath.length > 0)
        {
          fpath = strTrim(fpath); //log.WriteLine("'" + fpath + "'");
          if (fpath.length > 0)
          {
            fpath = fpath.replace(/%a/g, AkelPad.GetAkelDir(0));
            fpath = substituteEnvVars(fpath);
            fpath = oFSO.GetAbsolutePathName(fpath);
            if (!Options.CheckIfFavouriteFileExist ||
                oFSO.FileExists(fpath) ||
                (Options.FoldersInFavourites && oFSO.FolderExists(fpath)))
            {
              favourites.push(fpath);
            }
          }
        }
      }
    }
  }

  oState.isFavouritesLoaded = true;
  return favourites;
}

function getRecentFiles()
{
  if (oState.isRecentFilesLoaded)
    return oState.AkelPadRecentFiles;

  var recentFiles = [];

  // STACKRECENTFILE **lplpRfS = (STACKRECENTFILE **) malloc( sizeof(STACKRECENTFILE*) );
  var lplpRfS = memAlloc(_X64 ? 8 : 4); // sizeof(ptr);
  if (lplpRfS)
  {
    var nMaxRecentFiles = AkelPad.SendMessage(hWndMain, AKD_RECENTFILES, RF_GET, lplpRfS);
    if (nMaxRecentFiles > 0)
    {
      // STACKRECENTFILE *rfs = *lplpRfS;
      var lpRfS = AkelPad.MemRead(lplpRfS, _X64 ? DT_QWORD : DT_DWORD);

      // RECENTFILE *rf = rfs->first;
      var lpRf = AkelPad.MemRead(lpRfS, _X64 ? DT_QWORD : DT_DWORD);
      while (lpRf)
      {
        // int nFilePathLen = rf->nFileLen;
        var nFilePathLen = AkelPad.MemRead(_PtrAdd(lpRf, (_X64 ? 16 : 8) + 520), DT_DWORD);
        if (nFilePathLen > 0 && nFilePathLen < 1024)
        {
          // const wchar_t* sFilePath = rf->wszFile;
          var sFilePath = AkelPad.MemRead(_PtrAdd(lpRf, _X64 ? 16 : 8), DT_UNICODE, nFilePathLen);
          if (!Options.CheckIfRecentFileExist || oFSO.FileExists(sFilePath))
          {
            recentFiles.push(sFilePath);
          }
        }
        else
        {
          WScript.Echo("Unexpected: nFilePathLen = " + nFilePathLen);
        }

        // rf = rf->next;
        lpRf = AkelPad.MemRead(lpRf, _X64 ? DT_QWORD : DT_DWORD);
      }
    }
    memFree(lplpRfS);
  }

  oState.isRecentFilesLoaded = true;
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
  oSettings.AutoPreview = undefined;
  oSettings.StartDir = undefined;
  return oSettings;
}

function isSettingsObjectEmpty(oSettings)
{
  if (oSettings != undefined)
  {
    if (oSettings.Filter != undefined ||
        oSettings.AutoPreview != undefined ||
        oSettings.StartDir != undefined)
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

function readBoolSetting(oSet, name)
{
  var s = oSet.Read(name, PO_STRING);
  if (s === "true")
    return true;
  if (s === "false")
    return false;
  return undefined;
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
    if (Options.SaveAutoPreview)
    {
      oSettings.AutoPreview = readBoolSetting(oSet, "AutoPreview");
    }
    if (Options.SaveStartDir)
    {
      oSettings.StartDir = readStrSetting(oSet, "StartDir");
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
    if (oSettings.AutoPreview != undefined)
    {
      oSet.Write("AutoPreview", PO_STRING, oSettings.AutoPreview ? "true" : "false");
    }
    if (oSettings.StartDir != undefined)
    {
      oSet.Write("StartDir", PO_STRING, oSettings.StartDir);
    }
    oSet.End();
  }
}
