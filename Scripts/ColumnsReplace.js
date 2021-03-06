// http://akelpad.sourceforge.net/forum/viewtopic.php?p=9470#9470
// Version: 2015-09-23
// Author: KDJ
//
// *** Replace text in selected column ***
//
// Usage:
//   Call("Scripts::Main", 1, "ColumnsReplace.js")
//
// Can assign shortcut key, eg: Shift+Alt+Insert
//
// Note:
//   This script should be saved in Unicode format

GetLangStrins();

var DT_DWORD          = 3;
var AEGI_FIRSTSELCHAR = 3;
var AEGI_LASTSELCHAR  = 4;
var AEM_GETSEL        = 3125;
var AEM_SETSEL        = 3126;
var AEM_GETCOLUMNSEL  = 3127;
var AEM_GETINDEX      = 3130;
var AEM_INDEXUPDATE   = 3132;
var AEM_INDEXCOMPARE  = 3133;

var hMainWnd = AkelPad.GetMainWnd();
var hEditWnd = AkelPad.GetEditWnd();

if (! hEditWnd)
  WScript.Quit();

if (AkelPad.GetEditReadOnly(hEditWnd))
{
  AkelPad.MessageBox(hEditWnd, sTxtReadOnly, sTxtCaption, 48 /*MB_ICONEXCLAMATION*/);
  WScript.Quit();
}

if (! SendMessage(hEditWnd, AEM_GETCOLUMNSEL, 0, 0))
{
  AkelPad.MessageBox(hEditWnd, sTxtNoColSel, sTxtCaption, 48 /*MB_ICONEXCLAMATION*/);
  WScript.Quit();
}

var lpFirstC = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
var lpCaret  = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
var lpSelect = AkelPad.MemAlloc(_X64 ? 56 : 32 /*sizeof(AESELECTION)*/);
var lpOriginalCaret  = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
var lpOriginalSelect = AkelPad.MemAlloc(_X64 ? 56 : 32 /*sizeof(AESELECTION)*/);
var lpBegSel = lpSelect;
var lpEndSel = _PtrAdd(lpSelect, _X64 ? 24 : 12);
var nCarPos;
var aSelText;
var sText;
var nShiftCol;
var i;
var nSpacesLn;
var nTabsLn;
var nTabSize = undefined;
var sTabString = undefined;
var bTextReplaced = false;

SendMessage(hEditWnd, AEM_GETSEL, lpOriginalCaret, lpOriginalSelect);

aSelText = AkelPad.GetSelText(1 /*\r*/).split("\r");
nSpacesLn = 0;
nTabsLn = 0;
for (i = 0; i < aSelText.length; ++i)
{
  if (aSelText[i].indexOf("\t") >= 0)
    ++nTabsLn;
  if (aSelText[i].indexOf(" ") >= 0)
    ++nSpacesLn;
}
if ((nTabsLn > 0) && (nSpacesLn > 0))
{
  nTabSize = SendMessage(hMainWnd, 1223 /*AKD_GETFRAMEINFO*/, 52 /*FI_TABSTOPSIZE*/, 0);
  sTabString = "";
  for (i = 0; i < nTabSize; ++i)
  {
    sTabString = sTabString + " ";
  }

  SendMessage(hEditWnd, 3080 /*AEM_STOPGROUPTYPING*/, 0, 0);
  SendMessage(hEditWnd, 3081 /*AEM_BEGINUNDOACTION*/, 0, 0);
  AkelPad.TextReplace(hEditWnd, "\t", sTabString, 0x00000001|0x00400000 /*FRF_DOWN|FRF_SELECTION*/, 1 /*RRF_ALL*/);
}

SendMessage(hEditWnd, AEM_GETINDEX, AEGI_FIRSTSELCHAR, lpFirstC);
SendMessage(hEditWnd, AEM_GETSEL, lpCaret, lpSelect);

//nCarPos   0   1
//          3   2
if (SendMessage(hEditWnd, AEM_INDEXCOMPARE, lpBegSel, lpFirstC) == 0)
{
  if (SendMessage(hEditWnd, AEM_INDEXCOMPARE, lpCaret, lpBegSel) == 0)
    nCarPos = 0;
  else
    nCarPos = 2;
}
else
{
  if (SendMessage(hEditWnd, AEM_INDEXCOMPARE, lpCaret, lpEndSel) == 0)
    nCarPos = 3;
  else
    nCarPos = 1;
}

aSelText = AkelPad.GetSelText(1 /*\r*/).split("\r");

if (nCarPos < 2)
  sText = aSelText[0];
else
  sText = aSelText[aSelText.length - 1];

sText = AkelPad.InputBox(hEditWnd, sTxtCaption, sTxtLabel, sText);

if (sText)
{
  nShiftCol = sText.length - aSelText[0].length;

  for (i = 0; i < aSelText.length; ++i)
    aSelText[i] = sText;

  sText = aSelText.join("\r");
  AkelPad.ReplaceSel(sText);

  if (nCarPos == 0)
    ShiftCharIndex(lpEndSel, nShiftCol);
  else if (nCarPos == 1)
  {
    ShiftCharIndex(lpBegSel, nShiftCol);
    ShiftCharIndex(lpCaret, nShiftCol);
  }
  else if (nCarPos == 2)
  {
    ShiftCharIndex(lpEndSel, nShiftCol);
    ShiftCharIndex(lpCaret, nShiftCol);
  }
  else
    ShiftCharIndex(lpBegSel, nShiftCol);

  SendMessage(hEditWnd, AEM_INDEXUPDATE, 0, lpBegSel);
  SendMessage(hEditWnd, AEM_INDEXUPDATE, 0, lpEndSel);
  SendMessage(hEditWnd, AEM_INDEXUPDATE, 0, lpCaret);

  SendMessage(hEditWnd, AEM_SETSEL, lpCaret, lpSelect);
  
  bTextReplaced = true;
}

if (sTabString != undefined)
{
  SendMessage(hEditWnd, 3082 /*AEM_ENDUNDOACTION*/, 0, 0);
  SendMessage(hEditWnd, 3080 /*AEM_STOPGROUPTYPING*/, 0, 0);

  if (!bTextReplaced)
  {
    SendMessage(hEditWnd, 3077 /*AEM_UNDO*/, 0, 0);

    lpBegSel = lpOriginalSelect;
    lpEndSel = _PtrAdd(lpOriginalSelect, _X64 ? 24 : 12);
    SendMessage(hEditWnd, AEM_INDEXUPDATE, 0, lpBegSel);
    SendMessage(hEditWnd, AEM_INDEXUPDATE, 0, lpEndSel);
    SendMessage(hEditWnd, AEM_INDEXUPDATE, 0, lpOriginalCaret);
    SendMessage(hEditWnd, AEM_SETSEL, lpOriginalCaret, lpOriginalSelect);
  }
}

AkelPad.MemFree(lpFirstC);
AkelPad.MemFree(lpCaret);
AkelPad.MemFree(lpSelect);
AkelPad.MemFree(lpOriginalCaret);
AkelPad.MemFree(lpOriginalSelect);

function ShiftCharIndex(lpIndex, nCol)
{
  AkelPad.MemCopy(_PtrAdd(lpIndex, _X64 ? 16 : 8), AkelPad.MemRead(_PtrAdd(lpIndex, _X64 ? 16 : 8), DT_DWORD) + nCol, DT_DWORD);
}

function SendMessage(hWnd, uMsg, wParam, lParam)
{
  return AkelPad.SystemFunction().Call("User32::SendMessage" + _TCHAR, hWnd, uMsg, wParam, lParam);
}

function GetLangStrins()
{
  if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1045 /*Polish*/)
  {
    sTxtCaption  = 'Zamiana tekstu w kolumnie';
    sTxtReadOnly = 'Ustawiony jest tryb "Tylko do odczytu".';
    sTxtNoColSel = 'Brak zaznaczenia kolumnowego.';
    sTxtLabel    = 'Podaj tekst do zamiany:';
  }
  else if (AkelPad.GetLangId(0 /*LANGID_FULL*/) == 1049 /*Russian*/)
  {
    //translated by yozhic
    sTxtCaption  = 'Замена текста в выделенном блоке';
    sTxtReadOnly = 'Включен режим "Только для чтения".';
    sTxtNoColSel = 'Отсутствует блочное выделение.';
    sTxtLabel    = 'Введите текст для замены:';
  }
  else
  {
    sTxtCaption  = 'Replace text in selected column';
    sTxtReadOnly = '"Read only" mode is set.';
    sTxtNoColSel = 'There is no columnar selection.';
    sTxtLabel    = 'Input text to replace:';
  }
}
