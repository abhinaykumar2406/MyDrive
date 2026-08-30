import { useEffect, useState, useRef } from "react";
import { Link, useParams } from "react-router-dom";

function DirectoryView() {
  const BASE_URL = 'http://127.0.0.1:4000';
  const [directoryItems, setDirectoryItems] = useState({
    dirs: [],
    files: [],
  });
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [createDirectory, setCreateDirectory] = useState(false);
  const [fileForRename, setFileForRename] = useState("");
  const [fileIdForRename, setFileIdForRename] = useState("");
  const [newFileName, setNewFileName] = useState(fileForRename);
  const [newDirectory, setNewDirectory] = useState(fileForRename);
  const fileInputRef = useRef(null);
  const {'*':dirPath} = useParams();
  console.log(dirPath);

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory/${dirPath}`);
    const data = await response.json();
    setDirectoryItems(data);
  }

  async function uploadFile(e){
    const file = e.target.files[0];
    if(!file)
        return;
    setMessage("");
    setIsUploading(true);
    setProgress(0);
    const xhr = new XMLHttpRequest();
    xhr.open('POST',`${BASE_URL}/file/${file.name}`,true);
    xhr.addEventListener("load",()=>{
      console.log(xhr.response);
    })
    xhr.upload.addEventListener('progress',(e)=>{
      const totalProgress = (e.loaded / e.total)*100;
      // console.log(`${totalProgress.toFixed(2)}%`)
      setProgress(totalProgress);
    });
    xhr.onload = async () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        setProgress(100);
        setMessage("✅ File uploaded successfully");
        await getDirectoryItems();
        setTimeout(() => {
          setMessage("");
        }, 3000);
      } else {
        setMessage("❌ Upload failed");
      }

      setIsUploading(false);
      fileInputRef.current.value="";
    };

    xhr.onerror = () => {
      setMessage("❌ Upload failed");
      setIsUploading(false);
      fileInputRef.current.value="";
    };

    xhr.send(file);
  }

  async function handleDelete(fileId,parentDirId){
    console.log(fileId);
    const res =await fetch(`${BASE_URL}/file/${fileId}`,{
      method:"DELETE",
      headers:{
        "parentdirid":parentDirId,
      },
    });
    const data = await res.text();
    console.log(data);
    await getDirectoryItems();
  }
  async function handleRenameForm(oldFileId, newname){
    console.log("rename");
    const res =await fetch(`${BASE_URL}/file/${oldFileId}?action=rename`,{
      method:"PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body:JSON.stringify({newname: `${newname}`}),
    });
    const data = await res.text();
    console.log(data);
    setFileForRename("");
    setFileIdForRename("");
    await getDirectoryItems();
  }
  async function handleCreateNewDirectory() {
    try {
      const response = await fetch(`${BASE_URL}/directory/${dirPath}/${newDirectory}`, {
        method: "POST",
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create directory");
      }

      console.log("Directory created:", data);

      setNewDirectory("");
      setCreateDirectory(false);
    } catch (error) {
      console.error(error);
    }
    await getDirectoryItems();
  }

  useEffect(() => {
    getDirectoryItems();
  }, [dirPath]);
  useEffect(() => {
    setNewFileName(fileForRename);
  }, [fileForRename]);

  return (
    <>
      <h1>My Files</h1>
      <input className="file-input" ref={fileInputRef} type="file" onChange={uploadFile}/>
      {isUploading && (
        <>
          <div className="progress">
            <div
              className="fill"
              style={{ width: `${progress}%` }}
            />
          </div>

          <p>{progress.toFixed(0)}%</p>
        </>
      )}
      <div>
        <Link className="button" onClick={()=>{setCreateDirectory(true)}}>New Folder</Link>
      </div>
      {createDirectory && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            handleCreateNewDirectory();
          }}
        >
          <label htmlFor="newDirectory">New Folder Name:</label>

          <input
            id="newDirectory"
            type="text"
            value={newDirectory}
            onChange={(e) => setNewDirectory(e.target.value)}
            placeholder="Enter new folder name"
            required
          />

          <button className="button" type="submit">
            Save
          </button>
        </form>
      )}
      {message && <p>{message}</p>}
      {
        fileForRename && fileIdForRename && (
          <form onSubmit={(e)=>{
            e.preventDefault();

            const oldFileId = `${fileIdForRename}`;
            const newname = `${newFileName}`;
            handleRenameForm(oldFileId,newname);
          }}>
            <label htmlFor="filename">New File Name:</label>
            <input
              id="filename"
              type="text"
              value={newFileName}
              onChange={(e) => setNewFileName(e.target.value)}
               placeholder="Enter new file name"
              required
            />
            <button className="button" type="submit">Save</button>
          </form>
        )
      }
      {directoryItems.dirs.map((item) => (
        <div>
        {(
          <>
            <>
            📁{" "}
              <Link
                to={`./${item.name}`}
                className="button"
              >
                {item.name}
              </Link>
            </>
          </>
        )}
        <br />
      </div>
      ))}
      {directoryItems.files.map((item) => (
        <div>
        {(
          <>
            📄 {item.name}{" "}
            <a
              href={`${BASE_URL}/file/${item.id}?action=open`}
            >
              Open
            </a>{" "}
            <a
              href={`${BASE_URL}/file/${item.id}?action=download`}
            >
              Download
            </a>
            <button className="button" onClick={()=>{
              handleDelete(item.id,item.parentDir)
            }}>Delete</button>
            <button className="button" onClick={()=>{
              setFileForRename(item.name);
              setFileIdForRename(item.id);
            }}>Rename</button>
          </>
        )}
        <br />
      </div>
      ))}
    </>
  );
}

export default DirectoryView;
