import { Archive, File, FileCode2, FileImage, FileSpreadsheet, FileText, FileVideo, Folder, Music2, Presentation } from "lucide-react";

const extensionFrom = (name = "", extension = "") => (extension || name.slice(name.lastIndexOf("."))).toLowerCase();

export default function FileIcon({ isFolder = false, name, extension }) {
  if (isFolder) return <Folder className="file-icon folder-icon" aria-hidden="true" />;
  const ext = extensionFrom(name, extension);
  if ([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"].includes(ext)) return <FileImage className="file-icon image-icon" aria-hidden="true" />;
  if ([".xls", ".xlsx", ".csv"].includes(ext)) return <FileSpreadsheet className="file-icon sheet-icon" aria-hidden="true" />;
  if ([".ppt", ".pptx"].includes(ext)) return <Presentation className="file-icon presentation-icon" aria-hidden="true" />;
  if ([".zip", ".rar", ".7z", ".tar", ".gz"].includes(ext)) return <Archive className="file-icon archive-icon" aria-hidden="true" />;
  if ([".mp4", ".mov", ".avi", ".mkv", ".webm"].includes(ext)) return <FileVideo className="file-icon video-icon" aria-hidden="true" />;
  if ([".mp3", ".wav", ".ogg", ".m4a"].includes(ext)) return <Music2 className="file-icon audio-icon" aria-hidden="true" />;
  if ([".js", ".jsx", ".ts", ".tsx", ".json", ".html", ".css", ".py", ".java"].includes(ext)) return <FileCode2 className="file-icon code-icon" aria-hidden="true" />;
  if ([".pdf", ".doc", ".docx", ".txt", ".md"].includes(ext)) return <FileText className={`file-icon ${ext === ".pdf" ? "pdf-icon" : "document-icon"}`} aria-hidden="true" />;
  return <File className="file-icon generic-icon" aria-hidden="true" />;
}
