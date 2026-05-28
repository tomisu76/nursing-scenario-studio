export function AudioUploader({ onFile }:{ onFile:(f:File)=>void }){ return <input type='file' accept='audio/*' onChange={(e)=>e.target.files?.[0] && onFile(e.target.files[0])}/>; }
