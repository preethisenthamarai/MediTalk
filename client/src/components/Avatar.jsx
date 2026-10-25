const COLORS = ['#2563eb', '#3b82f6', '#1d4ed8', '#0e7490', '#4f46e5', '#0284c7', '#1e40af'];

export default function Avatar({ name = '?', size = 40 }) {
  const initials = name.replace(/^(Dr\.?\s+)/i, '').split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();
  const color = COLORS[[...name].reduce((a, c) => a + c.charCodeAt(0), 0) % COLORS.length];
  return <span className="ava" style={{ width: size, height: size, background: color, fontSize: size * 0.4 }}>{initials}</span>;
}
