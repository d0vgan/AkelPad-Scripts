// Usage:
//   Call("Scripts::Main", 1, "ZipCurrentFile.js")
//   Call("Scripts::Main", 1, "ZipCurrentFile.js", "-OutDir=%TEMP%")
//   Call("Scripts::Main", 1, "ZipCurrentFile.js", '-OutDir="C:\\Program Files"');

var sOutDir = AkelPad.GetArgValue("OutDir", "");
var isFileSaved = false;
var sCurrentFilePath = AkelPad.GetEditFile(0);
if (sCurrentFilePath)
{
  if (!AkelPad.GetEditModified(0))
    isFileSaved = true;
}
if (!isFileSaved)
{
  WScript.Echo("File is not saved. Please save the file first!");
  WScript.Quit();
}

var sZipFilePath = getZipFilePath(sCurrentFilePath);
if (!zip_create(sZipFilePath))
{
  WScript.Echo("Failed to create the archive :(");
  WScript.Quit();
}
if (!zip_add_file(sZipFilePath, sCurrentFilePath))
{
  WScript.Echo("Failed to add the file to the archive :(");
  WScript.Quit();
}
WScript.Echo("Archive created!\n" + sZipFilePath);

function getZipFilePath(sCurrentFilePath)
{
  var sZipFileDir;

  if (sOutDir != "")
  {
    var oWScript = new ActiveXObject("WScript.Shell");
    var oFileSystem = new ActiveXObject("Scripting.FileSystemObject");
    sZipFileDir = oWScript.ExpandEnvironmentStrings(sOutDir);
    if (!oFileSystem.FolderExists(sZipFileDir))
    {
      WScript.Echo("Directory does not exist: " + sZipFileDir);
      WScript.Quit();
    }
  }
  else
  {
    sZipFileDir = getFileDir(sCurrentFilePath);
  }

  var sZipFileName = getFileName(sCurrentFilePath);
  var s = sZipFileDir + "\\" + sZipFileName + ".zip";
  return s;
}

function zip_create(sZipFilePath)
{
  var isOK = false;

  // Creating an empty .zip archive
  try
  {
    var oFileSystem = new ActiveXObject("Scripting.FileSystemObject");
    var oZipFile = oFileSystem.OpenTextFile(sZipFilePath, 2, true);
    var data = String.fromCharCode(80,75,5,6,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0,0);
    oZipFile.Write(data);
    oZipFile.Close();
    isOK = true;
  }
  catch (err)
  {
    // ...
  }

  return isOK;
}

function zip_add_file(sZipFilePath, sFilePath)
{
  var isOK = false;

  // Packing the data
  try
  {
    var oShell = new ActiveXObject("Shell.Application");
    var oDstFolder = oShell.NameSpace(sZipFilePath);
    oDstFolder.CopyHere(sFilePath, 16);
    //WScript.Sleep(1000);
    isOK = true;
  }
  catch (err)
  {
    // ...
  }

  return isOK;
}

function zip_add_folder(sZipFilePath, sFolderPath)
{
  var isOK = false;

  // Packing the data
  try
  {
    var oShell = new ActiveXObject("Shell.Application");
    var oDstFolder = oShell.NameSpace(sZipFilePath);
    var oSrcFolder = oShell.NameSpace(sFolderPath);
    var oFolderItems = oSrcFolder.Items();
    oDstFolder.CopyHere(oFolderItems.Item(), 16);
    //WScript.Sleep(1000);
    isOK = true;
  }
  catch (err)
  {
    // ...
  }

  return isOK;
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

function getFileDir(filePathName) // file directory w/o trailing '\'
{
  var n = filePathName.lastIndexOf("\\");
  var nn = filePathName.lastIndexOf("/");
  if (nn > n)  n = nn;
  return (n >= 0) ? filePathName.substr(0, n) : filePathName;
}
