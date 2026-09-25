import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import {
  Download,
  FolderPlus,
  LogOut,
  MoreVertical,
  Pencil,
  Plus,
  Trash2,
  Upload,
  X,
} from "lucide-react";
import FileIcon from "./FileIcon";
import "./App.css";
const BASE_URL = "http://127.0.0.1:4000";

function Dialog({ title, children, close }) {
  return (
    <div className="modal-backdrop" onMouseDown={close}>
      <section
        className="modal"
        role="dialog"
        aria-modal="true"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="modal-heading">
          <h2>{title}</h2>
          <button
            className="icon-button"
            onClick={close}
            aria-label="Close dialog"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
function Row({ item, folder, active, menu, open, rename, remove }) {
  return (
    <li className="file-row">
      <button className="file-main" onClick={() => open(item)}>
        <FileIcon
          isFolder={folder}
          name={item.name}
          extension={item.extension}
        />
        <span className="file-copy">
          <b className="file-name" title={item.name}>
            {item.name}
          </b>
          <small>
            {folder
              ? "Folder"
              : `${item.extension?.slice(1).toUpperCase() || "Unknown"} file`}
          </small>
        </span>
      </button>
      <div className="row-actions">
        <button
          className="icon-button"
          onClick={() => menu(active ? null : item.id)}
          aria-label={`More actions for ${item.name}`}
        >
          <MoreVertical size={20} />
        </button>
        {active && (
          <div className="context-menu" role="menu">
            <button onClick={() => open(item)}>Open</button>
            {!folder && (
              <button
                onClick={() =>
                  window.location.assign(
                    `${BASE_URL}/file/${item.id}?action=download`
                  )
                }
              >
                <Download size={16} />
                Download
              </button>
            )}
            <button onClick={() => rename(item, folder ? "directory" : "file")}>
              <Pencil size={16} />
              Rename
            </button>
            <button
              className="danger-menu-item"
              onClick={() => remove(item, folder ? "directory" : "file")}
            >
              <Trash2 size={16} />
              Delete
            </button>
          </div>
        )}
      </div>
    </li>
  );
}

export default function DirectoryView() {
  const navigate = useNavigate(),
    { id: dirId } = useParams(),
    location = useLocation(),
    input = useRef(),
    userRef = useRef();
  const [data, setData] = useState({ dirs: [], files: [] }),
    [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [directoryError, setDirectoryError] = useState(
      () => sessionStorage.getItem("directoryRedirectError") || ""
    ),
    [notice, setNotice] = useState(""),
    [progress, setProgress] = useState(null),
    [menu, setMenu] = useState(null),
    [user, setUser] = useState(null),
    [userOpen, setUserOpen] = useState(false),
    [rename, setRename] = useState(null),
    [newName, setNewName] = useState(""),
    [del, setDel] = useState(null),
    [folderOpen, setFolderOpen] = useState(false),
    [folderName, setFolderName] = useState(""),
    [busy, setBusy] = useState(false);
  const unauthorized = (res) => {
    if (res.status === 401) {
      navigate("/user");
      return true;
    }
    return false;
  };
  const msg = (t) => {
    setNotice(t);
    setTimeout(() => setNotice(""), 3500);
  };
  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await fetch(
        `${BASE_URL}/directory${dirId ? `/${dirId}` : ""}`,
        { credentials: "include" }
      );
      if (unauthorized(res)) return;
      if (res.status === 404 || res.status === 403) {
        const message = "That folder no longer exists or you don't have access to it.";
        sessionStorage.setItem("directoryRedirectError", message);
        setDirectoryError(message);
        navigate("/directory/", {
          replace: true,
          state: { directoryError: message },
        });
        return;
      }
      if (!res.ok) throw Error("Unable to load files. Please try again.");
      setData(await res.json());
      sessionStorage.setItem("lastDriveDirectory", location.pathname);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };
  useEffect(() => {
    load();
  }, [dirId]);
  useEffect(() => {
    if (location.state?.directoryError) {
      setDirectoryError(location.state.directoryError);
      sessionStorage.setItem("directoryRedirectError", location.state.directoryError);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [location.key]);
  useEffect(() => {
    (async () => {
      try {
        const res = await fetch(`${BASE_URL}/user`, { credentials: "include" });
        if (res.ok) setUser((await res.json()).user);
      } catch {}
    })();
  }, []);
  useEffect(() => {
    const f = (e) => {
      if (!userRef.current?.contains(e.target)) setUserOpen(false);
      if (!e.target.closest(".row-actions")) setMenu(null);
    };
    document.addEventListener("mousedown", f);
    return () => document.removeEventListener("mousedown", f);
  }, []);
  const upload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setProgress(0);
    const x = new XMLHttpRequest();
    x.open("POST", `${BASE_URL}/file/${encodeURIComponent(file.name)}`);
    x.withCredentials = true;
    if (dirId) x.setRequestHeader("parentdirid", dirId);
    x.upload.onprogress = (p) =>
      p.lengthComputable && setProgress((p.loaded / p.total) * 100);
    x.onload = async () => {
      setProgress(null);
      input.current.value = "";
      if (x.status >= 200 && x.status < 300) {
        msg("File uploaded successfully.");
        await load();
      } else msg("Upload failed. Please try again.");
    };
    x.onerror = () => {
      setProgress(null);
      msg("Upload failed. Please try again.");
    };
    x.send(file);
  };
  const open = (item) =>
    item.extension
      ? window.open(
          `${BASE_URL}/file/${item.id}?action=open`,
          "_blank",
          "noopener"
        )
      : navigate(`/directory/${item.id}`);
  const submitRename = async (e) => {
    e.preventDefault();
    if (!newName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${BASE_URL}/${rename.type}/${rename.id}?action=rename`,
        {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ newname: newName.trim() }),
          credentials: "include",
        }
      );
      if (!res.ok) throw Error("Unable to rename this item.");
      setRename(null);
      msg("Renamed successfully.");
      await load();
    } catch (e) {
      msg(e.message);
    } finally {
      setBusy(false);
    }
  };
  const deleteItem = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/${del.type}/${del.id}`, {
        method: "DELETE",
        headers: { parentdirid: dirId || "" },
        credentials: "include",
      });
      if (!res.ok) throw Error("Unable to delete this item.");
      setDel(null);
      msg("Deleted successfully.");
      await load();
    } catch (e) {
      msg(e.message);
    } finally {
      setBusy(false);
    }
  };
  const createFolder = async (e) => {
    e.preventDefault();
    if (!folderName.trim()) return;
    setBusy(true);
    try {
      const res = await fetch(
        `${BASE_URL}/directory/${encodeURIComponent(folderName.trim())}`,
        {
          method: "POST",
          headers: { parentdirid: dirId || "" },
          credentials: "include",
        }
      );
      if (!res.ok) throw Error("Unable to create folder.");
      setFolderOpen(false);
      setFolderName("");
      msg("Folder created successfully.");
      await load();
    } catch (e) {
      msg(e.message);
    } finally {
      setBusy(false);
    }
  };
  const logout = async () => {
    setBusy(true);
    try {
      const res = await fetch(`${BASE_URL}/user/logout`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) throw Error("Logout failed.");
      navigate("/user");
    } catch (e) {
      msg(e.message);
      setBusy(false);
    }
  };
  const initials = (user?.name || user?.email || "U")
      .split(/\s|@/)
      .filter(Boolean)
      .slice(0, 2)
      .map((x) => x[0])
      .join("")
      .toUpperCase(),
    has = data.dirs.length + data.files.length > 0;
  return (
    <main className="drive-app">
      <header className="app-header">
        <button className="brand" onClick={() => navigate("/directory/")}>
          <span className="brand-mark">
            <FolderPlus size={19} />
          </span>
          My Drive
        </button>
        <div className="header-actions">
          <input
            ref={input}
            className="visually-hidden"
            type="file"
            onChange={upload}
          />
          <button
            className="secondary-button"
            onClick={() => input.current.click()}
            disabled={progress !== null}
          >
            <Upload size={18} />
            <span className="upload-text">
              {progress !== null ? "Uploading" : "Upload"}
            </span>
          </button>
          <button
            className="primary-button"
            onClick={() => setFolderOpen(true)}
          >
            <Plus size={18} />
            <span className="folder-text">New folder</span>
          </button>
          <div className="user-menu-wrap" ref={userRef}>
            <button
              className="avatar"
              onClick={() => setUserOpen(!userOpen)}
              aria-label="Open user menu"
            >
              {initials}
            </button>
            {userOpen && (
              <div className="user-menu">
                <div className="user-summary">
                  <span className="avatar large">{initials}</span>
                  <div>
                    <strong>{user?.name || "Your account"}</strong>
                    {user?.email && <span>{user.email}</span>}
                  </div>
                </div>
                <hr />
                <button onClick={logout} disabled={busy}>
                  <LogOut size={17} />
                  Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </header>
      {progress !== null && (
        <div className="upload-status">
          Uploading file… {Math.round(progress)}%
          <span className="progress-track">
            <i style={{ width: `${progress}%` }} />
          </span>
        </div>
      )}
      {notice && <div className="toast">{notice}</div>}
      <section className="drive-content">
        {directoryError && (
          <div className="directory-alert" role="alert">
            <span>{directoryError}</span>
            <button type="button" onClick={() => {
              setDirectoryError("");
              sessionStorage.removeItem("directoryRedirectError");
            }} aria-label="Dismiss error">
              <X size={17} />
            </button>
          </div>
        )}
        <nav className="breadcrumbs">
          <button onClick={() => navigate("/directory/")}>My Drive</button>
          {dirId && <span>/ {data.name || "Folder"}</span>}
        </nav>
        <div className="content-heading">
          <div>
            <p>Personal workspace</p>
            <h1>{dirId ? data.name || "Folder" : "My Drive"}</h1>
          </div>
          {has && <small>{data.dirs.length + data.files.length} items</small>}
        </div>
        {loading ? (
          <div className="file-list skeleton-list">
            <i />
            <i />
            <i />
          </div>
        ) : error ? (
          <div className="state-card">
            <h2>Unable to load files</h2>
            <p>{error}</p>
            <button className="secondary-button" onClick={load}>
              Try again
            </button>
          </div>
        ) : has ? (
          <ul className="file-list">
            {data.dirs.map((i) => (
              <Row
                key={i.id}
                item={i}
                folder
                active={menu === i.id}
                menu={setMenu}
                open={open}
                rename={(x, type) => {
                  setRename({ ...x, type });
                  setNewName(x.name);
                  setMenu(null);
                }}
                remove={(x, type) => {
                  setDel({ ...x, type });
                  setMenu(null);
                }}
              />
            ))}
            {data.files.map((i) => (
              <Row
                key={i.id}
                item={i}
                active={menu === i.id}
                menu={setMenu}
                open={open}
                rename={(x, type) => {
                  setRename({ ...x, type });
                  setNewName(x.name);
                  setMenu(null);
                }}
                remove={(x, type) => {
                  setDel({ ...x, type });
                  setMenu(null);
                }}
              />
            ))}
          </ul>
        ) : (
          <div className="state-card empty-state">
            <FolderPlus size={36} />
            <h2>No files yet</h2>
            <p>Upload a file or create a new folder to get started.</p>
            <div>
              <button
                className="secondary-button"
                onClick={() => input.current.click()}
              >
                Upload
              </button>
              <button
                className="primary-button"
                onClick={() => setFolderOpen(true)}
              >
                New folder
              </button>
            </div>
          </div>
        )}
      </section>
      {rename && (
        <Dialog title="Rename item" close={() => !busy && setRename(null)}>
          <form onSubmit={submitRename}>
            <label>Name</label>
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              required
            />
            <div className="dialog-actions">
              <button type="button" onClick={() => setRename(null)}>
                Cancel
              </button>
              <button className="primary-button" disabled={busy}>
                Save
              </button>
            </div>
          </form>
        </Dialog>
      )}
      {del && (
        <Dialog title="Delete item" close={() => !busy && setDel(null)}>
          <p>
            Delete <b>“{del.name}”</b>? This action cannot be undone.
          </p>
          <div className="dialog-actions">
            <button onClick={() => setDel(null)}>Cancel</button>
            <button
              className="danger-button"
              onClick={deleteItem}
              disabled={busy}
            >
              Delete
            </button>
          </div>
        </Dialog>
      )}
      {folderOpen && (
        <Dialog
          title="Create new folder"
          close={() => !busy && setFolderOpen(false)}
        >
          <form onSubmit={createFolder}>
            <label>Folder name</label>
            <input
              autoFocus
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              required
            />
            <div className="dialog-actions">
              <button type="button" onClick={() => setFolderOpen(false)}>
                Cancel
              </button>
              <button className="primary-button" disabled={busy}>
                Create
              </button>
            </div>
          </form>
        </Dialog>
      )}
    </main>
  );
}
