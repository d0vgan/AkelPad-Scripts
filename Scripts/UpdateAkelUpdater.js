updateAkelUpdater();

function updateAkelUpdater()
{
  var sAkelUpdaterOutputDir = AkelPad.GetAkelDir(1 /*ADTYPE_AKELFILES*/);
  var sAkelUpdaterZip = getTempPathToAkelUpdaterZip();

  var httpResult = downloadFile("https://akelpad.sourceforge.net/files/tools/AkelUpdater.zip", sAkelUpdaterZip);
  if (httpResult.status != 200 || httpResult.errorMessage)
  {
    var message = "ERROR: Could not download AkelUpdater.zip\n\n  ";
    if (httpResult.errorMessage)
    {
      message += "HTTP error: " + httpResult.errorMessage;
    }
    else if (httpResult.status != 200)
    {
      message += "HTTP result: readyState=" + httpResult.readyState + ", status=" + httpResult.status;
    }
    ShowError(message);
    WScript.Quit();
  }

  if (!unpackZip(sAkelUpdaterZip, sAkelUpdaterOutputDir))
  {
    deleteFile(sAkelUpdaterZip);
    ShowError("ERROR: Could not unpack AkelUpdater.zip");
    WScript.Quit();
  }

  deleteFile(sAkelUpdaterZip);
  ShowMessage("Updated successfully!");
}

function getTempPathToAkelUpdaterZip()
{
  var sTempDir = ".\\";
  var pBuf;
  if (pBuf = AkelPad.MemAlloc(256 * _TSIZE))
  {
    var oSys = AkelPad.SystemFunction();
    oSys.Call("kernel32::GetTempPath" + _TCHAR, 256 - 1, pBuf);
    sTempDir = AkelPad.MemRead(pBuf, _TSTR);
    AkelPad.MemFree(pBuf);
  }
  return sTempDir + "AkelUpdater.zip";
}

function downloadFile(sSourceUrl, sDestFile)
{
  var httpResult = {
    readyState: undefined,
    status: undefined,
    errorMessage: undefined
  };

  var oXMLHTTP = new ActiveXObject("MSXML2.XMLHTTP");
  oXMLHTTP.onreadystatechange = function() {
    httpResult.readyState = oXMLHTTP.readyState;
    if (oXMLHTTP.readyState == 4)
    {
      httpResult.status = oXMLHTTP.status;
      if (oXMLHTTP.status == 200)
      {
        var oADOStream = new ActiveXObject("ADODB.Stream");
        oADOStream.open();
        oADOStream.type = 1; // Binary
        oADOStream.write(oXMLHTTP.ResponseBody);
        oADOStream.position = 0;
        oADOStream.saveToFile(sDestFile, 2);
        oADOStream.close();
        savedOK = true;
      }
    }
  };

  try {
    oXMLHTTP.open("GET", sSourceUrl, false);
    // adding "User-Agent" to bypass "403 Forbidden" from the file host
    oXMLHTTP.setRequestHeader("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
    oXMLHTTP.send();
  } catch (e) {
    httpResult.errorMessage = e.message;
  }

  return httpResult;
}

function deleteFile(sFileName)
{
  var oFSO = new ActiveXObject("Scripting.FileSystemObject");
  oFSO.DeleteFile(sFileName, true);
}

function unpackZip(sZipFileName, sOutputDir)
{
  var oFSO = new ActiveXObject("Scripting.FileSystemObject");
  if (!oFSO.FolderExists(sOutputDir))
    oFSO.CreateFolder(sOutputDir);

  var oShell = new ActiveXObject("Shell.Application");
  var filesInZip = oShell.NameSpace(sZipFileName).Items();
  if (filesInZip.Count == 0)
    return false; // no items, maybe it's not an archive

  oShell.NameSpace(sOutputDir).CopyHere(filesInZip, 4 /*No progress dialog*/ + 16 /*Yes to All*/);
  WScript.Sleep(500);
  return true;
}

function ShowMessage(message, type)
{
  if (type == undefined)
  {
    type = 0x0000; // MB_OK
  }
  AkelPad.MessageBox(AkelPad.GetMainWnd(), message, WScript.ScriptName, type);
}

function ShowError(message)
{
  ShowMessage(message, 0x0010 /*MB_OK|MB_ICONERROR*/);
}
