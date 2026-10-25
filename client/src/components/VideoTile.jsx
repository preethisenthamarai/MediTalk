import { useEffect, useRef } from 'react';

export default function VideoTile({ stream, label, muted = false, sub }) {
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.srcObject = stream || null; }, [stream]);
  const hasVideo = stream?.getVideoTracks().length > 0;
  return (
    <div className="tile">
      <video ref={ref} autoPlay playsInline muted={muted} style={{ display: hasVideo ? 'block' : 'none' }} />
      {!hasVideo && <div className="avatar">{(label || '?').trim().charAt(0).toUpperCase()}</div>}
      <div className="tile-label">{label}{sub && <small> · {sub}</small>}</div>
    </div>
  );
}
