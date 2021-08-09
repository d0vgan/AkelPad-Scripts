//
// *** Selects the current line ***
//

/*
  Script arguments:
    "W" - select the whole word-wrapped line
    "L" - select the trailing new line character (suppressed by "T")
    "S" - trim the leading whitespaces
    "T" - trim the trailing whitespaces (overrides "L")
  Any combinations are allowed. For example:
    "WL"   - select the whole word-wrapped line + new line character
    "WST"  - whole word-wrapped line + trim whitespaces
    "WSTL" - whole word-wrapped line + trim whitespaces ("T" overrides "L")
    "SL"   - trim leading whitespaces + select new line character
    ...

  Examples:
    AkelPad.Call("Scripts::Main", 1, "LineSelect.js");
    AkelPad.Call("Scripts::Main", 1, "LineSelect.js", "W");
    AkelPad.Call("Scripts::Main", 1, "LineSelect.js", "WST");

*/

// Script arguments:
var sArguments = GetArguments("W");
var bSelectWholeWordWrappedLine = (sArguments.indexOf("W") != -1);
var bSelectNewLineCharacter = (sArguments.indexOf("L") != -1);
var bTrimLeadingWhitespaces = (sArguments.indexOf("S") != -1);
var bTrimTrailingWhitespaces = (sArguments.indexOf("T") != -1);

// AkelPad messages:
var WM_USER           = 0x0400;
var AEM_EXSETSEL      = (WM_USER + 2100);
var AEM_GETINDEX      = (WM_USER + 2106);
var AEM_INDEXCOMPARE  = (WM_USER + 2109);
var AEM_GETWORDWRAP   = (WM_USER + 2217);
var AEM_GETUNWRAPLINE = (WM_USER + 2119);

// AkelPad consts:
var DT_UNICODE = 1; // Unicode string
var DT_QWORD   = 2; // QWORD number on x64 or DWORD number on x86
var DT_DWORD   = 3; // DWORD number
var DT_BYTE    = 5; // BYTE number
var AEGI_FIRSTSELCHAR = 3; // First character of the selection
var AEGI_LASTSELCHAR  = 4; // Last character of the selection
var AELB_WRAP = 9; // No new line, this line is wrapped

SelectCurrentLine();

function SelectCurrentLine()
{
  var hEditWnd = AkelPad.GetEditWnd();
  var lpIndex1 = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var lpIndex2 = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  if (lpIndex1 && lpIndex2)
  {
    AkelPad.SendMessage(hEditWnd, AEM_GETINDEX, AEGI_FIRSTSELCHAR, lpIndex1);
    AkelPad.SendMessage(hEditWnd, AEM_GETINDEX, AEGI_LASTSELCHAR, lpIndex2);
    if (IsSameLine(hEditWnd, lpIndex1, lpIndex2))
    {
      var lpIndex = lpIndex1;
      if (AkelPad.SendMessage(hEditWnd, AEM_INDEXCOMPARE, lpIndex1, lpIndex2) > 0)
      {
        lpIndex = lpIndex2;
      }
      SelectLine(hEditWnd, lpIndex);
    }
  }
  if (lpIndex1)
  {
    AkelPad.MemFree(lpIndex1);
  }
  if (lpIndex2)
  {
    AkelPad.MemFree(lpIndex2);
  }
}

function IsSameLine(hEditWnd, lpIndex1, lpIndex2)
{
  var nLine1 = AkelPad.MemRead(lpIndex1, DT_DWORD);
  var nLine2 = AkelPad.MemRead(lpIndex2, DT_DWORD);
  if (nLine1 == nLine2)
    return true;

  if (bSelectWholeWordWrappedLine && AkelPad.SendMessage(hEditWnd, AEM_GETWORDWRAP, 0, 0))
  {
    nLine1 = AkelPad.SendMessage(hEditWnd, AEM_GETUNWRAPLINE, nLine1, 0);
    nLine2 = AkelPad.SendMessage(hEditWnd, AEM_GETUNWRAPLINE, nLine2, 0);
    if (nLine1 == nLine2)
      return true;
  }

  return false;
}

function SelectLine(hEditWnd, lpIndex)
{
  var nTotalLen = 0;
  var lpStartIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  var lpEndIndex = AkelPad.MemAlloc(_X64 ? 24 : 12 /*sizeof(AECHARINDEX)*/);
  if (lpStartIndex && lpEndIndex)
  {
    /*
    typedef struct _AECHARINDEX {
      int nLine;          // Zero based line number in document
      AELINEDATA *lpLine; // Pointer to the AELINEDATA structure
      int nCharInLine;    // Character position in line
    } AECHARINDEX;
    */
    var lpIndex_nLine = AkelPad.MemRead(_PtrAdd(lpIndex, 0), DT_DWORD);
    var lpIndex_lpLine = AkelPad.MemRead(_PtrAdd(lpIndex, _X64 ? 8 : 4), DT_QWORD);
    var nStartLine = lpIndex_nLine;
    var lpStartLine = lpIndex_lpLine;
    var nStartLinePos = 0;
    var nEndLine = lpIndex_nLine;
    var lpEndLine = lpIndex_lpLine;
    var nEndLinePos = 0;
    var lpLine;
    var nLineLen;
    var nLineBreak;
    var sLine;
    var c;

    /*
    typedef struct _AELINEDATA {
      struct _AELINEDATA *next; // Pointer to the next AELINEDATA structure
      struct _AELINEDATA *prev; // Pointer to the previous AELINEDATA structure
      wchar_t *wpLine;          // Text of the line, terminated with NULL character
      int nLineLen;             // Length of the wpLine, not including the terminating NULL character
      BYTE nLineBreak;          // New line: AELB_EOF, AELB_R, AELB_N, AELB_RN, AELB_RRN or AELB_WRAP.
      BYTE nLineFlags;          // Reserved
      WORD nReserved;           // Reserved
      int nLineWidth;           // Width of the line in pixels
      int nSelStart;            // Selection start character position in line
      int nSelEnd;              // Selection end character position in line
    } AELINEDATA;
    */
    if (bSelectWholeWordWrappedLine && AkelPad.SendMessage(hEditWnd, AEM_GETWORDWRAP, 0, 0))
    {
      lpLine = lpIndex_lpLine;
      for (;;)
      {
        nLineLen = AkelPad.MemRead(_PtrAdd(lpLine, _X64 ? 24 : 12), DT_DWORD);
        nTotalLen += nLineLen;
        if (bTrimTrailingWhitespaces || !bSelectNewLineCharacter)
        {
          nEndLinePos = nLineLen;
        }
        lpEndLine = lpLine;
        nLineBreak = AkelPad.MemRead(_PtrAdd(lpLine, _X64 ? 28 : 16), DT_BYTE);
        if (nLineBreak == AELB_WRAP)
        {
          ++nEndLine;
          lpLine = AkelPad.MemRead(_PtrAdd(lpLine, 0), DT_QWORD); // next
        }
        else
          break;
      }

      lpLine = AkelPad.MemRead(_PtrAdd(lpIndex_lpLine, _X64 ? 8 : 4), DT_QWORD); // previous
      while (lpLine)
      {
        nLineBreak = AkelPad.MemRead(_PtrAdd(lpLine, _X64 ? 28 : 16), DT_BYTE);
        if (nLineBreak == AELB_WRAP)
        {
          --nStartLine;
          lpStartLine = lpLine;
          nLineLen = AkelPad.MemRead(_PtrAdd(lpLine, _X64 ? 24 : 12), DT_DWORD);
          nTotalLen += nLineLen;
          lpLine = AkelPad.MemRead(_PtrAdd(lpLine, _X64 ? 8 : 4), DT_QWORD); // previous
        }
        else
          lpLine = 0;
      }
    }
    else
    {
      lpLine = lpIndex_lpLine;
      nLineLen = AkelPad.MemRead(_PtrAdd(lpLine, _X64 ? 24 : 12), DT_DWORD);
      if (bTrimTrailingWhitespaces || !bSelectNewLineCharacter)
      {
        nEndLinePos = nLineLen;
      }
      nTotalLen = nLineLen;
    }

    if (bTrimLeadingWhitespaces)
    {
      sLine = AkelPad.MemRead(_PtrAdd(lpStartLine, _X64 ? 16 : 8), DT_QWORD);
      sLine = AkelPad.MemRead(sLine, DT_UNICODE);
      for (nStartLinePos = 0; nStartLinePos < sLine.length; nStartLinePos++)
      {
        c = sLine.charAt(nStartLinePos);
        if (c != " " && c != "\t")
          break;
      }
    }
    AkelPad.MemCopy(_PtrAdd(lpStartIndex, 0), nStartLine, DT_QWORD);
    AkelPad.MemCopy(_PtrAdd(lpStartIndex, _X64 ? 8 : 4), lpStartLine, DT_QWORD);
    AkelPad.MemCopy(_PtrAdd(lpStartIndex, _X64 ? 16 : 8), nStartLinePos, DT_QWORD);

    if (bTrimTrailingWhitespaces)
    {
      sLine = AkelPad.MemRead(_PtrAdd(lpEndLine, _X64 ? 16 : 8), DT_QWORD);
      sLine = AkelPad.MemRead(sLine, DT_UNICODE);
      for (; nEndLinePos > 0; nEndLinePos--)
      {
        c = sLine.charAt(nEndLinePos - 1);
        if (c != " " && c != "\t")
          break;
      }
    }
    else if (bSelectNewLineCharacter)
    {
      ++nEndLine;
      lpEndLine = AkelPad.MemRead(_PtrAdd(lpEndLine, 0), DT_QWORD); // next
      nEndLinePos = 0;
    }
    AkelPad.MemCopy(_PtrAdd(lpEndIndex, 0), nEndLine, DT_QWORD);
    AkelPad.MemCopy(_PtrAdd(lpEndIndex, _X64 ? 8 : 4), lpEndLine, DT_QWORD);
    AkelPad.MemCopy(_PtrAdd(lpEndIndex, _X64 ? 16 : 8), nEndLinePos, DT_QWORD);

    AkelPad.SendMessage(hEditWnd, AEM_EXSETSEL, lpStartIndex, lpEndIndex);
  }
  if (lpStartIndex)
  {
    AkelPad.MemFree(lpStartIndex);
  }
  if (lpEndIndex)
  {
    AkelPad.MemFree(lpEndIndex);
  }
  return nTotalLen;
}

function GetArguments(sDefaultArgs)
{
  var sArgs = AkelPad.GetArgLine();
  if (sArgs == "")
  {
    sArgs = sDefaultArgs;
  }
  return sArgs;
}
