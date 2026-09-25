import { useEffect, useState, useRef } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";

function DirectoryView() {
  const BASE_URL = 'http://127.0.0.1:4000';
  const [directoryItems, setDirectoryItems] = useState({
    dirs: [],
    files: [],
  });
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [message, setMessage] = useState("");
  const [createDirectory, setCreateDirectory] = useState(false);
  const [fileForRename, setFileForRename] = useState("");
  const [elementType, setElementType] = useState("");
  const [fileIdForRename, setFileIdForRename] = useState("");
  const [newFileName, setNewFileName] = useState(fileForRename);
  const [newDirectory, setNewDirectory] = useState("");
  const [isCreatingDirectory, setIsCreatingDirectory] = useState(false);

  const fileInputRef = useRef(null);
  const {'id':dirId} = useParams();

  async function getDirectoryItems() {
    const response = await fetch(`${BASE_URL}/directory${dirId ? `/${dirId}` : ""}`,{
      credentials:"include"
    });
    const data = await response.json();
    if(response.status === 401){
      navigate("/user")
    }
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
    xhr.withCredentials = true;
    if (dirId) {
      xhr.setRequestHeader("parentdirid", dirId);
    }

    xhr.addEventListener("load",()=>{
      console.log(xhr.response);
    });
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

  async function handleDelete(type,fileId){
    console.log(fileId);
    const res =await fetch(`${BASE_URL}/${type}/${fileId}`,{
      method:"DELETE",
      headers:{
        "parentdirid":dirId,
      },
      credentials:"include",
    });
    const data = await res.text();
    console.log(data);
    await getDirectoryItems();
  }
  async function handleRenameForm(type,oldFileId, newname){
    console.log("rename");
    const res =await fetch(`${BASE_URL}/${type}/${oldFileId}?action=rename`,{
      method:"PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body:JSON.stringify({newname: `${newname}`}),
      credentials:"include",
    });
    const data = await res.text();
    console.log(data);
    setFileForRename("");
    setFileIdForRename("");
    setElementType("");
    await getDirectoryItems();
  }
  async function handleCreateNewDirectory() {
    if (isCreatingDirectory) return;
    setIsCreatingDirectory(true);

    try {
      const response = await fetch(`${BASE_URL}/directory/${newDirectory}`, {
        method: "POST",
        headers:{
          "parentdirid": dirId,
        },
        credentials:"include",
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
    }finally {
      setIsCreatingDirectory(false);
    }
    await getDirectoryItems();
  }

  useEffect(() => {
    getDirectoryItems();
  }, [dirId]);
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
        <button className="button" onClick={()=>{setCreateDirectory(true)}}>New Folder</button>
      </div>
      {createDirectory && (
        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await handleCreateNewDirectory();
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
        elementType && fileForRename && fileIdForRename && (
          <form onSubmit={(e)=>{
            e.preventDefault();

            const oldFileId = `${fileIdForRename}`;
            const newname = `${newFileName}`;
            handleRenameForm(elementType,oldFileId,newname);
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
                to={`/directory/${item.id}`}
                className="button"
              >
                {item.name}
              </Link>
              <button className="button" onClick={()=>{
                handleDelete("directory",item.id);
              }}>Delete</button>
              <button className="button" onClick={()=>{
                setFileForRename(item.name);
                setFileIdForRename(item.id);
                setElementType("directory");
              }}>Rename</button>
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
            <button className="button" onClick={async()=>{
              handleDelete("file",item.id)
            }}>Delete</button>
            <button className="button" onClick={()=>{
              setFileForRename(item.name);
              setFileIdForRename(item.id);
              setElementType("file");
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
