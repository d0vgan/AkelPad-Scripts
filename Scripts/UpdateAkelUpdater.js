var sAkelUpdaterOutputDir = AkelPad.GetAkelDir(1 /*ADTYPE_AKELFILES*/);
var sAkelUpdaterZip = getTempPathToAkelUpdaterZip();

if (!downloadFile("http://akelpad.sourceforge.net/files/tools/AkelUpdater.zip", sAkelUpdaterZip))
{
  WScript.Echo("ERROR: Could not download AkelUpdater.zip");
  WScript.Quit();
}
if (!unpackZip(sAkelUpdaterZip, sAkelUpdaterOutputDir))
{
  deleteFile(sAkelUpdaterZip);
  WScript.Echo("ERROR: Could not unpack AkelUpdater.zip");
  WScript.Quit();
}
deleteFile(sAkelUpdaterZip);
WScript.Echo("Updated successfully!");

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
  var savedOK = false;
  var oXMLHTTP = new ActiveXObject("MSXML2.XMLHTTP");
  oXMLHTTP.onreadystatechange = function() {
    if (oXMLHTTP.readyState === 4)
    {
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

  oXMLHTTP.open("GET", sSourceUrl, false);
  oXMLHTTP.send();
  return savedOK;
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
